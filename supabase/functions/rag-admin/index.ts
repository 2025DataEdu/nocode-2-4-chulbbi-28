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
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    console.log('RAG Admin request:', requestBody);

    const { action, documentId, userId } = requestBody;

    if (action === 'reembed' && documentId) {
      // 특정 문서의 임베딩 재생성
      return await reembedDocument(documentId);
    } else if (action === 'reprocess_all' && userId) {
      // 사용자의 모든 문서 재처리
      return await reprocessAllDocuments(userId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action or missing parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

// 특정 문서의 임베딩 재생성
async function reembedDocument(documentId: string) {
  try {
    console.log(`Re-embedding document: ${documentId}`);

    // 문서의 모든 청크 가져오기
    const { data: chunks, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('document_id', documentId);

    if (fetchError) throw fetchError;

    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let processedCount = 0;
    
    // 각 청크의 임베딩 재생성
    for (const chunk of chunks) {
      try {
        const newEmbedding = await generateEmbedding(chunk.content);
        
        const { error: updateError } = await supabase
          .from('documents')
          .update({ embedding: `[${newEmbedding.join(',')}]` })
          .eq('id', chunk.id);

        if (updateError) {
          console.error(`Failed to update chunk ${chunk.id}:`, updateError);
        } else {
          processedCount++;
        }
      } catch (chunkError) {
        console.error(`Error processing chunk ${chunk.id}:`, chunkError);
      }
    }

    console.log(`Re-embedded ${processedCount}/${chunks.length} chunks for document ${documentId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Re-embedded ${processedCount}/${chunks.length} chunks`,
        processedCount,
        totalChunks: chunks.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in reembedDocument:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to re-embed document',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// 사용자의 모든 문서 재처리
async function reprocessAllDocuments(userId: string) {
  try {
    console.log(`Re-processing all documents for user: ${userId}`);

    // 사용자의 모든 문서 청크 가져오기
    const { data: chunks, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No documents found for user',
          processedCount: 0,
          totalChunks: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let processedCount = 0;
    let byulpyoCount = 0;
    
    // 각 청크 재처리
    for (const chunk of chunks) {
      try {
        let content = chunk.content;
        
        // "[별표]" 내용 재강화
        if (content.includes('[별표') || content.includes('별표')) {
          if (!content.includes('**[최우선_별표_내용]**')) {
            content = `**[최우선_별표_내용]** ${content}`;
            byulpyoCount++;
          }
        }

        // 새 임베딩 생성
        const newEmbedding = await generateEmbedding(content);
        
        // 업데이트
        const { error: updateError } = await supabase
          .from('documents')
          .update({ 
            content: content,
            embedding: `[${newEmbedding.join(',')}]` 
          })
          .eq('id', chunk.id);

        if (updateError) {
          console.error(`Failed to update chunk ${chunk.id}:`, updateError);
        } else {
          processedCount++;
        }
      } catch (chunkError) {
        console.error(`Error processing chunk ${chunk.id}:`, chunkError);
      }
    }

    console.log(`Re-processed ${processedCount}/${chunks.length} chunks for user ${userId}`);
    console.log(`Enhanced ${byulpyoCount} "[별표]" chunks`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Re-processed ${processedCount}/${chunks.length} chunks`,
        processedCount,
        totalChunks: chunks.length,
        byulpyoEnhanced: byulpyoCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in reprocessAllDocuments:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to re-process documents',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// OpenAI 임베딩 생성
async function generateEmbedding(text: string): Promise<number[]> {
  if (!openAIApiKey) {
    console.warn('OpenAI API key not found, using simple embedding');
    return generateSimpleEmbedding(text);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1536
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return generateSimpleEmbedding(text);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return generateSimpleEmbedding(text);
  }
}

// 간단한 임베딩 생성 (백업용)
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