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

    // 업로드된 문서 검색 - "[별표]" 우선순위 적용
    let documentContext = '';
    if (userId) {
      try {
        // 1. 먼저 "[별표]" 관련 중요 문서 청크를 우선 검색
        const { data: priorityDocs, error: priorityError } = await supabase
          .from('documents')
          .select('content, doc_title, chunk_index')
          .eq('user_id', userId)
          .or('content.ilike.%[별표]%,content.ilike.%[중요표]%,content.ilike.%[우선순위]%')
          .limit(5);

        // 2. 일반 문서 청크도 검색
        const { data: regularDocs, error: regularError } = await supabase
          .from('documents')
          .select('content, doc_title, chunk_index')
          .eq('user_id', userId)
          .limit(8);

        if (priorityError) {
          console.error('Priority document search error:', priorityError);
        }
        if (regularError) {
          console.error('Regular document search error:', regularError);
        }

        // 우선순위 문서를 먼저 배치하고 중복 제거
        const allDocs = [...(priorityDocs || [])];
        const priorityDocIds = new Set(priorityDocs?.map(doc => `${doc.doc_title}-${doc.chunk_index}`) || []);
        
        (regularDocs || []).forEach(doc => {
          const docId = `${doc.doc_title}-${doc.chunk_index}`;
          if (!priorityDocIds.has(docId)) {
            allDocs.push(doc);
          }
        });

        if (allDocs && allDocs.length > 0) {
          console.log(`Found ${allDocs.length} document chunks for user (${priorityDocs?.length || 0} priority docs)`);
          
          // 우선순위 문서는 특별 표시와 함께 컨텍스트 구성
          let priorityContext = '';
          let regularContext = '';
          
          allDocs.forEach(doc => {
            const formattedContent = `[${doc.doc_title}] ${doc.content}`;
            
            if (doc.content.includes('[별표]') || doc.content.includes('[중요표]') || doc.content.includes('[우선순위]')) {
              priorityContext += `**[핵심규정]** ${formattedContent}\n\n`;
            } else {
              regularContext += `${formattedContent}\n\n`;
            }
          });
          
          documentContext = priorityContext + regularContext;
        } else {
          console.log('No documents found for user');
        }
      } catch (error) {
        console.error('Error searching documents:', error);
      }
    }

    // 숙소 추천 요청 감지 및 처리
    let accommodationRecommendations = '';
    if (message.includes('숙소') || message.includes('숙박') || message.includes('호텔') || message.includes('모텔')) {
      accommodationRecommendations = await getAccommodationRecommendations(message);
    }

    // 출장 등록 요청 감지 및 파싱
    const tripRegistrationResult = await detectAndParseTripRequest(message);
    
    let systemPrompt = `당신은 '출장비서 출삐'라는 AI 출장 관리 서비스의 전문 도우미입니다.

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
- 중요한 내용은 **볼드**로 강조하여 가독성을 높여주세요
- 여비 규정이나 금액 정보는 가능한 표 형식으로 정리해주세요
- 각 문단은 1~2줄로 작성하고, 문단 사이에는 반드시 빈 줄을 하나씩 넣어주세요
- 문단과 문단 사이는 반드시 줄바꿈을 두 번 넣어 구분해주세요

표 형식 예시:
**구분**: 내용
**금액**: 50,000원
**기준**: 1박당

특별 기능:
- 사용자가 출장 정보(목적지, 일정, 예산 등)를 말하면 새 출장 등록을 도와드릴 수 있습니다.
- 출장비 규정에 대한 질문에 정확한 정보 제공
- 출장지 주변 맛집, 숙소, 볼거리 추천
- 출장지 근처 숙소 추천 (같은 동/구 우선, 인허가 유효한 운영 중인 숙소만)

항상 도움이 되는 정보를 제공하고, 모르는 것은 솔직히 말씀해주세요.`;

    // 업로드된 문서가 있으면 시스템 프롬프트에 추가
    if (documentContext) {
      systemPrompt += `

참고 자료:
사용자가 업로드한 여비 규정 및 관련 문서입니다. 여비 관련 질문에 답할 때 이 정보를 우선적으로 참고하여 정확한 답변을 제공해주세요:

${documentContext}

위 참고 자료를 바탕으로 정확하고 구체적인 답변을 제공해주세요. 참고 자료에 답이 있으면 해당 내용을 인용하여 설명하고, 참고 자료에 없는 내용은 일반적인 지식을 바탕으로 답변해주세요.`;
    }

    // 숙소 추천 정보가 있으면 시스템 프롬프트에 추가
    if (accommodationRecommendations) {
      systemPrompt += `

숙소 추천 정보:
${accommodationRecommendations}

위 숙소 정보를 바탕으로 출장지 근처의 적합한 숙소를 추천해주세요. 정보를 보기 좋게 정리하여 제공해주세요.`;
    }

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

// 숙소 추천 기능
async function getAccommodationRecommendations(message: string) {
  try {
    // 메시지에서 지역 정보 추출
    const locationKeywords = [
      '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
      '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
      '마포', '강남', '종로', '중구', '상암', '여의도', '유성', '도룡'
    ];

    let searchLocation = '';
    for (const keyword of locationKeywords) {
      if (message.includes(keyword)) {
        // 더 구체적인 주소 찾기
        const addressMatch = message.match(new RegExp(`${keyword}[가-힣\\s]*[구군시동로]`, 'g'));
        if (addressMatch) {
          searchLocation = addressMatch[0];
        } else {
          searchLocation = keyword;
        }
        break;
      }
    }

    if (!searchLocation) {
      return '';
    }

    console.log('Searching accommodations for location:', searchLocation);

    // 1단계: 같은 동/구 우선 검색
    const { data: primaryAccommodations, error: primaryError } = await supabase
      .from('accommodations')
      .select('사업장명, 도로명전체주소, 소재지전체주소, 소재지전화, 위생업태명, 영업상태명')
      .ilike('도로명전체주소', `%${searchLocation}%`)
      .eq('영업상태명', '영업')
      .is('인허가취소일자', null)
      .not('위생업태명', 'ilike', '%여관%')
      .not('위생업태명', 'ilike', '%민박%')
      .order('사업장명')
      .limit(5);

    if (primaryError) {
      console.error('Primary accommodation search error:', primaryError);
    }

    // 2단계: 결과가 부족하면 더 넓은 지역에서 검색 (여관, 민박 포함)
    let additionalAccommodations = [];
    if ((primaryAccommodations?.length || 0) < 5) {
      const { data: secondaryAccommodations, error: secondaryError } = await supabase
        .from('accommodations')
        .select('사업장명, 도로명전체주소, 소재지전체주소, 소재지전화, 위생업태명, 영업상태명')
        .ilike('도로명전체주소', `%${searchLocation.substring(0, 2)}%`)
        .eq('영업상태명', '영업')
        .is('인허가취소일자', null)
        .order('사업장명')
        .limit(20);

      if (secondaryError) {
        console.error('Secondary accommodation search error:', secondaryError);
      } else {
        additionalAccommodations = secondaryAccommodations || [];
      }
    }

    // 결과 정리 및 우선순위 적용
    const allAccommodations = [...(primaryAccommodations || []), ...additionalAccommodations];
    
    if (allAccommodations.length === 0) {
      return '';
    }

    // 중복 제거 및 우선순위 정렬
    const uniqueAccommodations = Array.from(
      new Map(allAccommodations.map(acc => [acc.사업장명, acc])).values()
    );

    // 우선순위: 호텔 > 모텔 > 펜션 > 기타 > 여관/민박
    const prioritizeAccommodations = (accommodations: any[]) => {
      const priority = {
        '호텔': 1,
        '모텔': 2,
        '펜션': 3,
        '여관': 8,
        '민박': 9
      };

      return accommodations.sort((a, b) => {
        const aPriority = Object.entries(priority).find(([key]) => 
          a.위생업태명?.includes(key)
        )?.[1] || 5;
        
        const bPriority = Object.entries(priority).find(([key]) => 
          b.위생업태명?.includes(key)
        )?.[1] || 5;

        return aPriority - bPriority;
      });
    };

    const sortedAccommodations = prioritizeAccommodations(uniqueAccommodations);
    const recommendedAccommodations = sortedAccommodations.slice(0, 5);
    const moreAccommodations = sortedAccommodations.slice(5, 25);

    // 추천 결과 포맷팅
    let result = `**${searchLocation} 주변 추천 숙소:**\n\n`;
    
    recommendedAccommodations.forEach((acc, index) => {
      result += `**${index + 1}. ${acc.사업장명}**\n`;
      result += `- 업태: ${acc.위생업태명 || '정보없음'}\n`;
      result += `- 주소: ${acc.도로명전체주소 || acc.소재지전체주소 || '주소정보없음'}\n`;
      if (acc.소재지전화) {
        result += `- 전화: ${acc.소재지전화}\n`;
      }
      result += `\n`;
    });

    if (moreAccommodations.length > 0) {
      result += `\n**추가 숙소 옵션 (${moreAccommodations.length}개):**\n`;
      moreAccommodations.slice(0, 10).forEach((acc, index) => {
        result += `${index + 6}. ${acc.사업장명} (${acc.위생업태명 || '정보없음'})\n`;
      });
      
      if (moreAccommodations.length > 10) {
        result += `\n...외 ${moreAccommodations.length - 10}개 숙소 더 있습니다.\n`;
      }
    }

    console.log(`Found ${recommendedAccommodations.length} primary and ${moreAccommodations.length} additional accommodations`);
    return result;

  } catch (error) {
    console.error('Error getting accommodation recommendations:', error);
    return '';
  }
}