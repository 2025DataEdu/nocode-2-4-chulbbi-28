import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

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
    console.log('Received OCR request');

    const { imageBase64, receiptId } = requestBody;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing OCR with OpenAI Vision API...');

    // OpenAI Vision API를 사용하여 영수증 텍스트 추출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `이 영수증 이미지에서 다음 정보를 추출해주세요. JSON 형식으로 응답해주세요:
                {
                  "store_name": "상호명",
                  "date": "YYYY-MM-DD 형식의 날짜",
                  "amount": "총 금액 (숫자만)",
                  "items": ["구매 항목들"],
                  "category": "교통비|숙박비|식비|기타 중 하나",
                  "raw_text": "영수증의 모든 텍스트"
                }
                
                날짜는 반드시 YYYY-MM-DD 형식으로 변환해주세요. 금액은 숫자만 추출해주세요.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    console.log('OCR extraction completed');

    let ocrResult;
    try {
      // JSON 응답 파싱 시도
      ocrResult = JSON.parse(extractedText);
    } catch (parseError) {
      console.warn('JSON parsing failed, using raw text');
      ocrResult = {
        raw_text: extractedText,
        store_name: '',
        date: '',
        amount: '',
        items: [],
        category: '기타'
      };
    }

    // 영수증 데이터베이스 업데이트 (receiptId가 제공된 경우)
    if (receiptId) {
      console.log(`Updating receipt ${receiptId} with OCR results`);
      
      const updateData: any = {
        ocr_text: ocrResult.raw_text || extractedText,
        ocr_confidence: 0.85, // OpenAI Vision API는 일반적으로 높은 정확도
      };

      // 추출된 정보가 있으면 해당 필드도 업데이트
      if (ocrResult.date) {
        updateData.receipt_date = ocrResult.date;
      }
      if (ocrResult.amount && !isNaN(parseFloat(ocrResult.amount))) {
        updateData.amount = parseFloat(ocrResult.amount);
      }
      if (ocrResult.category) {
        updateData.category = ocrResult.category;
      }
      if (ocrResult.store_name) {
        updateData.description = ocrResult.store_name;
      }

      const { error: updateError } = await supabase
        .from('receipts')
        .update(updateData)
        .eq('id', receiptId);

      if (updateError) {
        console.error('Error updating receipt:', updateError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update receipt with OCR results',
            details: updateError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ocr_result: ocrResult,
        raw_response: extractedText
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in receipt-ocr function:', error);
    
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