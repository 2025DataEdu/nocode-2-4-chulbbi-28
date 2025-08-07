import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();

    if (!message) {
      throw new Error('메시지가 필요합니다.');
    }

    console.log('Received message:', message);

    const systemPrompt = `당신은 '출장비서 출삐'라는 AI 출장 관리 서비스의 전문 도우미입니다.

주요 역할:
1. 출장 계획 및 준비 도움
2. 공무원 여비 규정 안내  
3. 출장 관련 질문 답변
4. 출장지 추천 및 정보 제공
5. 예산 계산 및 관리 조언

응답 스타일:
- 친근하고 전문적인 톤
- 한국어로 응답
- 구체적이고 실용적인 조언 제공
- 필요시 단계별 가이드 제공

특별 기능:
- 사용자가 출장 정보(목적지, 일정, 예산 등)를 말하면 새 출장 등록을 도와드릴 수 있습니다.
- 출장비 규정에 대한 질문에 정확한 정보 제공
- 출장지 주변 맛집, 숙소, 볼거리 추천

항상 도움이 되는 정보를 제공하고, 모르는 것은 솔직히 말씀해주세요.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI Response:', data);
    
    const reply = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      reply,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatbot function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});