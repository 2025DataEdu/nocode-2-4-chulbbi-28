import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestBody = await req.json();
    console.log('Received rag-admin request:', requestBody);

    const { action, documentId } = requestBody;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 사용자 ID 추출
    let userId = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const parts = token.split('.');
        if (parts.length === 3) {
          let payload = parts[1];
          while (payload.length % 4) {
            payload += '=';
          }
          const decoded = JSON.parse(atob(payload));
          userId = decoded.sub;
          console.log('Successfully extracted user ID:', userId);
        }
      } catch (e) {
        console.error('Failed to extract user ID from token:', e);
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'reembed') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: 'Document ID is required for reembed action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Starting reembed process for document: ${documentId}`);

      // 해당 문서의 모든 청크 조회
      const { data: existingChunks, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', userId);

      if (fetchError) {
        console.error('Error fetching document chunks:', fetchError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch document chunks',
            details: fetchError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!existingChunks || existingChunks.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No document chunks found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Found ${existingChunks.length} chunks to re-embed`);

      // 기존 임베딩 삭제
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('document_id', documentId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing chunks:', deleteError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to delete existing chunks',
            details: deleteError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // 새로운 임베딩으로 재생성
      const reembeddedChunks = existingChunks.map(chunk => {
        const embedding = generateSimpleEmbedding(chunk.content);
        
        return {
          user_id: userId,
          document_id: documentId,
          content: chunk.content,
          doc_title: chunk.doc_title,
          source_path: chunk.source_path,
          chunk_index: chunk.chunk_index,
          embedding: `[${embedding.join(',')}]`
        };
      });

      // 새로운 임베딩으로 재저장
      const { data: insertData, error: insertError } = await supabase
        .from('documents')
        .insert(reembeddedChunks);

      if (insertError) {
        console.error('Error inserting re-embedded chunks:', insertError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to insert re-embedded chunks',
            details: insertError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Successfully re-embedded ${reembeddedChunks.length} chunks`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Successfully re-embedded ${reembeddedChunks.length} chunks`,
          chunks_processed: reembeddedChunks.length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 지원되지 않는 액션
    return new Response(
      JSON.stringify({ error: `Unsupported action: ${action}` }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in rag-admin function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// 간단한 임베딩 생성 함수 (rag-ingest와 동일)
function generateSimpleEmbedding(text: string): number[] {
  const embedding: number[] = new Array(1536).fill(0);
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = charCode % 1536;
    embedding[index] += 1;
  }
  
  // 정규화
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}