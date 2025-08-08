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
    console.log('Received request body:', requestBody);

    const { title, documentId, chunks, documents, userId } = requestBody;

    // 두 가지 요청 형식 지원
    let processedDocuments = [];
    let targetUserId = userId;

    if (title && documentId && chunks) {
      // 새로운 형식: { title, documentId, chunks }
      if (!targetUserId) {
        // Authorization 헤더에서 사용자 ID 추출
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
          try {
            const token = authHeader.replace('Bearer ', '');
            // JWT 토큰을 base64 디코딩할 때 패딩 문제 해결
            const parts = token.split('.');
            if (parts.length === 3) {
              let payload = parts[1];
              // base64 패딩 추가
              while (payload.length % 4) {
                payload += '=';
              }
              const decoded = JSON.parse(atob(payload));
              targetUserId = decoded.sub;
              console.log('Successfully extracted user ID:', targetUserId);
            }
          } catch (e) {
            console.error('Failed to extract user ID from token:', e);
          }
        }
      }

      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: 'User authentication required' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Processing ${chunks.length} chunks for document: ${title}`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // 임베딩 생성
        const embedding = generateSimpleEmbedding(chunk.content);
        
        const documentData = {
          user_id: targetUserId,
          document_id: documentId,
          content: chunk.content,
          doc_title: title,
          source_path: title,
          chunk_index: chunk.chunk_index,
          embedding: `[${embedding.join(',')}]`
        };
        
        processedDocuments.push(documentData);
      }
    } else if (documents && Array.isArray(documents)) {
      // 기존 형식: { documents, userId }
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Processing ${documents.length} documents for user ${targetUserId}`);

      for (const doc of documents) {
        const { content, title: docTitle, source_path, document_id } = doc;
        
        if (!content || !docTitle) {
          console.warn('Skipping document with missing content or title');
          continue;
        }

        const documentChunks = splitIntoChunks(content, 1000);
        
        for (let i = 0; i < documentChunks.length; i++) {
          const chunk = documentChunks[i];
          
          const embedding = generateSimpleEmbedding(chunk);
          
          const documentData = {
            user_id: targetUserId,
            document_id: document_id || crypto.randomUUID(),
            content: chunk,
            doc_title: docTitle,
            source_path: source_path || '',
            chunk_index: i,
            embedding: `[${embedding.join(',')}]`
          };
          
          processedDocuments.push(documentData);
        }
      }
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format. Expected either { title, documentId, chunks } or { documents, userId }' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('documents')
      .insert(processedDocuments);

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save documents to database',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully processed and saved ${processedDocuments.length} document chunks`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully processed ${processedDocuments.length} chunks`,
        chunks_created: processedDocuments.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in rag-ingest function:', error);
    
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

// 텍스트를 청크로 분할하는 함수
function splitIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]\s+/);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // 문장이 너무 긴 경우 강제로 분할
        chunks.push(sentence.substring(0, maxChunkSize));
        currentChunk = sentence.substring(maxChunkSize);
      }
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// 간단한 임베딩 생성 함수 (실제로는 OpenAI 등 사용)
function generateSimpleEmbedding(text: string): number[] {
  // 간단한 해시 기반 임베딩 (실제 사용 시에는 OpenAI API 등 사용)
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