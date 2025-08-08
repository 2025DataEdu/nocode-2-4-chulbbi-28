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

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ ok: true, message: 'chatbot function healthy' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = req.headers.get('content-type') || '';
    let raw = '';
    try {
      raw = await req.text();
    } catch (_) {
      // ignore
    }

    if (!raw || raw.trim() === '') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, context, userId } = payload;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: '메시지가 필요합니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Content-Type:', contentType);
    console.log('Received message:', message);
    console.log('User ID:', userId);

    // 출장 등록 요청 감지 및 파싱
    const tripRegistrationResult = await detectAndParseTripRequest(message);
    
    const systemPrompt = `당신은 '출장비서 출삐'라는 AI 출장 관리 서비스의 전문 도우미입니다.

주요 역할:
1. 출장 계획 및 준비 도움
2. 공무원 여비 규정 확인 및 안내  
3. 출장 등록 자동 처리
4. 출장지 추천 및 정보 제공
5. 예산 계산 및 관리 조언

출장 등록 가이드:
사용자가 다음과 같이 출장 정보를 제공하면 자동으로 등록 처리합니다:
- 목적지: "서울 출장" 또는 "부산으로 출장"
- 일정: "2025년 8월 6일부터 8일까지" 또는 "8월 6일부터 3박 4일"
- 시간: "매일 9:00~18:00" (선택사항)
- 목적: "회의", "교육", "현장점검" 등 (선택사항)

규정 확인사항:
- 관내/관외 출장 구분에 따른 여비 지급 기준
- 숙박비 및 교통비 한도
- 일비 및 식비 기준
- 사전 승인 및 결재 절차

응답 스타일:
- 친근하고 전문적인 톤
- 한국어로 응답
- 구체적이고 실용적인 조언 제공
- 필요시 단계별 가이드 제공
- 마크다운 문법(**, ##, *, _등)을 절대 사용하지 마세요
- 이모지 사용을 최소화하고 꼭 필요한 경우에만 사용하세요
- 문장을 짧고 명확하게 나누어 작성하세요
- 순수 텍스트로만 응답하세요

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
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(Array.isArray(context?.previousMessages) ? context.previousMessages.slice(-5) : []),
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
    
    let reply = data.choices[0].message.content;
    let tripSaved = false;

    // 출장 등록 요청이 감지되면 실제로 데이터베이스에 저장
    if (tripRegistrationResult.shouldRegister && userId) {
      console.log('Attempting to save trip:', tripRegistrationResult.tripData);
      
      try {
        const { data: savedTrip, error: saveError } = await supabase
          .from('trips')
          .insert([{
            user_id: userId,
            destination: tripRegistrationResult.tripData.destination,
            departure_location: tripRegistrationResult.tripData.departure_location || '출발지',
            purpose: tripRegistrationResult.tripData.purpose || '업무출장',
            start_date: tripRegistrationResult.tripData.start_date,
            end_date: tripRegistrationResult.tripData.end_date,
            status: 'planned',
            trip_type: '관외',
            transportation: '대중교통',
            accommodation_needed: false,
            distance_km: null,
            budget: 0,
            notes: `챗봇을 통해 등록된 출장\n시간: ${tripRegistrationResult.tripData.schedule || '정보 없음'}`
          }])
          .select()
          .single();

        if (saveError) {
          console.error('Error saving trip:', saveError);
          reply += '\n\n⚠️ 출장 정보를 데이터베이스에 저장하는 중 오류가 발생했습니다. 출장 등록 페이지에서 직접 등록해주세요.';
        } else {
          console.log('Trip saved successfully:', savedTrip);
          tripSaved = true;
          reply += '\n\n✅ 출장 정보가 성공적으로 등록되었습니다! 대시보드에서 확인하실 수 있습니다.';
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        reply += '\n\n⚠️ 데이터베이스 연결 중 오류가 발생했습니다. 출장 등록 페이지에서 직접 등록해주세요.';
      }
    }

    return new Response(JSON.stringify({ 
      reply,
      success: true,
      tripSaved
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

// 출장 등록 요청을 감지하고 파싱하는 함수
async function detectAndParseTripRequest(message: string) {
  // 출장 등록 관련 키워드 감지
  const registrationKeywords = [
    '출장', '등록', '계획', '일정', '예약'
  ];
  
  const locationKeywords = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
    '마포', '강남', '종로', '중구', '상암', '여의도'
  ];

  const hasRegistrationKeyword = registrationKeywords.some(keyword => 
    message.includes(keyword)
  );
  
  const hasLocationKeyword = locationKeywords.some(keyword => 
    message.includes(keyword)
  );

  if (!hasRegistrationKeyword || !hasLocationKeyword) {
    return { shouldRegister: false, tripData: null };
  }

  // 날짜 패턴 감지
  const datePatterns = [
    /(\d{1,2})월\s*(\d{1,2})일/g,
    /(\d{4})[-.](\d{1,2})[-.](\d{1,2})/g,
    /(\d{1,2})\/(\d{1,2})/g
  ];

  const dates: string[] = [];
  let match;

  // 월일 패턴 (예: 8월 6일)
  const monthDayPattern = /(\d{1,2})월\s*(\d{1,2})일/g;
  while ((match = monthDayPattern.exec(message)) !== null) {
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const currentYear = new Date().getFullYear();
    const date = new Date(currentYear, month - 1, day);
    dates.push(date.toISOString().split('T')[0]);
  }

  // 목적지 추출
  let destination = '';
  for (const keyword of locationKeywords) {
    if (message.includes(keyword)) {
      // 더 구체적인 주소 찾기
      const addressMatch = message.match(new RegExp(`${keyword}[가-힣\\s]*[구군시동]`, 'g'));
      if (addressMatch) {
        destination = addressMatch[0];
      } else {
        destination = keyword;
      }
      break;
    }
  }

  // 기간 감지 (몇 일간)
  const durationMatch = message.match(/(\d+)일/);
  let endDate = dates[0];
  
  if (dates.length >= 2) {
    endDate = dates[1];
  } else if (dates.length === 1 && durationMatch) {
    const duration = parseInt(durationMatch[1]);
    const startDate = new Date(dates[0]);
    const calculatedEndDate = new Date(startDate);
    calculatedEndDate.setDate(startDate.getDate() + duration - 1);
    endDate = calculatedEndDate.toISOString().split('T')[0];
  }

  // 시간 정보 추출
  const timeMatch = message.match(/(\d{1,2})[:시]\s*(\d{1,2})?[분]?\s*[-~]\s*(\d{1,2})[:시]\s*(\d{1,2})?[분]?/);
  let schedule = '';
  if (timeMatch) {
    schedule = timeMatch[0];
  }

  // 최소한의 정보가 있어야 등록
  if (destination && dates.length > 0) {
    return {
      shouldRegister: true,
      tripData: {
        destination: destination,
        departure_location: '출발지',
        purpose: '업무출장',
        start_date: dates[0],
        end_date: endDate || dates[0],
        schedule: schedule
      }
    };
  }

  return { shouldRegister: false, tripData: null };
}