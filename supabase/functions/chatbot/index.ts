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

    // 업로드된 문서 검색 - 더 정확하고 포괄적인 검색
    let documentContext = '';
    if (userId) {
      try {
        // 1. 먼저 메시지와 관련된 키워드로 문서 내용 검색
        const messageKeywords = extractKeywords(message);
        console.log('Extracted keywords from message:', messageKeywords);
        
        // 2. 벡터 검색을 위한 임베딩 생성 (사용 가능한 경우)
        let vectorSearchDocs = [];
        try {
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-ada-002',
              input: message
            }),
          });
          
          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json();
            const queryEmbedding = embeddingData.data[0].embedding;
            
            // 벡터 유사도 검색 (match_documents 함수 사용)
            const { data: vectorDocs, error: vectorError } = await supabase
              .rpc('match_documents', {
                query_embedding: queryEmbedding,
                match_count: 10
              });
              
            if (!vectorError && vectorDocs) {
              vectorSearchDocs = vectorDocs;
              console.log(`Found ${vectorDocs.length} documents via vector search`);
            }
          }
        } catch (vectorError) {
          console.log('Vector search not available, using keyword search');
        }
        
        // 3. 키워드 기반 검색 (fallback 또는 추가 검색)
        let keywordSearchDocs = [];
        if (messageKeywords.length > 0) {
          const keywordQuery = messageKeywords.map(keyword => `content.ilike.%${keyword}%`).join(',');
          
          const { data: keywordDocs, error: keywordError } = await supabase
            .from('documents')
            .select('content, doc_title, chunk_index, document_id')
            .eq('user_id', userId)
            .or(keywordQuery)
            .limit(15);
            
          if (!keywordError && keywordDocs) {
            keywordSearchDocs = keywordDocs;
            console.log(`Found ${keywordDocs.length} documents via keyword search`);
          }
        }
        
        // 4. 일반적인 모든 문서 검색 (최종 fallback)
        const { data: allDocs, error: allDocsError } = await supabase
          .from('documents')
          .select('content, doc_title, chunk_index, document_id')
          .eq('user_id', userId)
          .limit(20);
          
        if (allDocsError) {
          console.error('All documents search error:', allDocsError);
        }
        
        // 5. 결과 통합 및 중복 제거
        const combinedDocs = new Map();
        
        // 벡터 검색 결과 (가장 높은 우선순위)
        vectorSearchDocs.forEach(doc => {
          const key = `${doc.doc_title}-${doc.chunk_index}`;
          if (!combinedDocs.has(key)) {
            combinedDocs.set(key, { ...doc, source: 'vector', similarity: doc.similarity || 1 });
          }
        });
        
        // 키워드 검색 결과
        keywordSearchDocs.forEach(doc => {
          const key = `${doc.doc_title}-${doc.chunk_index}`;
          if (!combinedDocs.has(key)) {
            combinedDocs.set(key, { ...doc, source: 'keyword', similarity: 0.8 });
          }
        });
        
        // 전체 문서 검색 결과
        (allDocs || []).forEach(doc => {
          const key = `${doc.doc_title}-${doc.chunk_index}`;
          if (!combinedDocs.has(key)) {
            combinedDocs.set(key, { ...doc, source: 'general', similarity: 0.5 });
          }
        });
        
        // 6. 우선순위 정렬 및 컨텍스트 구성
        const sortedDocs = Array.from(combinedDocs.values())
          .sort((a, b) => {
            // 먼저 유사도로 정렬
            if (b.similarity !== a.similarity) {
              return b.similarity - a.similarity;
            }
            // 그 다음 중요 키워드 포함 여부
            const aHasImportant = hasImportantKeywords(a.content);
            const bHasImportant = hasImportantKeywords(b.content);
            if (aHasImportant !== bHasImportant) {
              return bHasImportant ? 1 : -1;
            }
            return 0;
          })
          .slice(0, 12); // 최대 12개 문서
        
        if (sortedDocs.length > 0) {
          console.log(`Found ${sortedDocs.length} document chunks for user`);
          console.log('Document sources:', sortedDocs.map(d => `${d.source}(${d.similarity?.toFixed(2) || 'N/A'})`).join(', '));
          
          // 7. 문서 컨텍스트 구성 - 중요도에 따라 마크업
          documentContext = sortedDocs.map(doc => {
            const isImportant = hasImportantKeywords(doc.content);
            const formattedContent = `[${doc.doc_title}${doc.chunk_index ? ` - 섹션 ${doc.chunk_index}` : ''}] ${doc.content}`;
            
            if (isImportant) {
              return `**[핵심규정]** ${formattedContent}`;
            } else {
              return formattedContent;
            }
          }).join('\n\n');
          
          // 8. 특별히 숙박비/여비 관련 질문에 대한 추가 검색
          if (message.includes('숙박비') || message.includes('한도') || message.includes('여비') || message.includes('지급')) {
            const specificQuery = [
              'content.ilike.%숙박비%',
              'content.ilike.%여비%',
              'content.ilike.%한도%',
              'content.ilike.%지급표%',
              'content.ilike.%별표%',
              'content.ilike.%상한액%'
            ].join(',');
            
            const { data: specificDocs, error: specificError } = await supabase
              .from('documents')
              .select('content, doc_title, chunk_index')
              .eq('user_id', userId)
              .or(specificQuery)
              .limit(10);
              
            if (!specificError && specificDocs && specificDocs.length > 0) {
              console.log(`Found ${specificDocs.length} additional specific documents`);
              const specificContext = specificDocs.map(doc => 
                `**[특별검색]** [${doc.doc_title}] ${doc.content}`
              ).join('\n\n');
              
              documentContext = specificContext + '\n\n' + documentContext;
            }
          }
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

**중요한 제약사항:**
- 오직 사용자가 업로드한 문서(파일, 텍스트 등)만을 참고하여 답변해야 합니다.
- 다른 사용자가 올린 문서나 공개 문서, 또는 기본 학습 지식은 절대로 참고하지 마세요.
- 업로드된 문서 안에 관련 내용이 없을 경우, "해당 정보는 제공된 문서 내에 없습니다."라고 솔직하게 말해주세요.
- 업로드된 문서에 명시된 규정, 규칙, 내용 외에는 어떤 판단이나 추론도 하지 마세요.

**답변 원칙:**
- 반드시 모든 답변은 업로드된 문서 내 근거를 바탕으로만 이루어져야 합니다.
- 각 답변에는 어떤 문서의 어떤 내용을 근거로 한 것인지 명확하게 밝혀주세요.
- 근거 표시 형식: **[문서명 - 해당 섹션]**에 따르면...

응답 스타일:
- 친근하고 전문적인 톤
- 한국어로 응답
- 구체적이고 실용적인 조언 제공
- 중요한 내용은 **볼드**로 강조하여 가독성을 높여주세요
- 예시나 인용 내용을 표시할 때는 **예시: 서울 출장, 8월 6일~8일** 형태로 따옴표 없이 굵은 글씨로 표시해주세요
- 답변에서 사용자의 말을 인용할 때도 따옴표 대신 **굵은 글씨**를 사용해주세요
- 규정이나 금액 정보는 가능한 표 형식으로 정리해주세요
- 각 문단은 1~2줄로 작성하고, 문단 사이에는 반드시 빈 줄을 하나씩 넣어주세요

표 형식 예시:
**구분**: 내용
**금액**: 50,000원
**기준**: 1박당

**업로드된 문서가 없는 경우:**
업로드된 문서가 없다면 "현재 참고할 수 있는 업로드된 문서가 없습니다. 관련 규정이나 문서를 업로드해 주시면 정확한 답변을 드릴 수 있습니다."라고 안내해주세요.

항상 도움이 되는 정보를 제공하되, 업로드된 문서의 범위를 벗어나지 마세요.`;

    // 업로드된 문서가 있으면 시스템 프롬프트에 추가
    if (documentContext) {
      systemPrompt += `

**참고 자료 (업로드된 문서):**
${documentContext}

위 업로드된 문서를 바탕으로만 정확한 답변을 제공해주세요. 참고 자료에 답이 있으면 해당 내용을 인용하여 설명하고, **[문서명 - 해당 섹션]** 형태로 근거를 명시해주세요. 참고 자료에 없는 내용에 대해서는 "해당 정보는 제공된 문서 내에 없습니다."라고 답변해주세요.`;
    } else {
      systemPrompt += `

**현재 상태:** 참고할 수 있는 업로드된 문서가 없습니다.
사용자에게 "현재 참고할 수 있는 업로드된 문서가 없습니다. 관련 규정이나 문서를 업로드해 주시면 정확한 답변을 드릴 수 있습니다."라고 안내해주세요.`;
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
      const hotelName = acc.사업장명;
      const address = acc.도로명전체주소 || acc.소재지전체주소 || '';
      
      // 검색 키워드 최적화: 숙소명 + 지역 정보
      const searchKeyword = address ? `${hotelName} ${address.split(' ').slice(0, 3).join(' ')}` : hotelName;
      const encodedHotelName = encodeURIComponent(hotelName);
      const encodedSearchKeyword = encodeURIComponent(searchKeyword);
      
      result += `**${index + 1}. ${hotelName}**\n`;
      result += `구분: ${acc.위생업태명 || '정보없음'}\n`;
      result += `위치: ${address || '주소정보없음'}\n`;
      if (acc.소재지전화) {
        result += `전화: ${acc.소재지전화}\n`;
      }
      
      // 예약 및 검색 링크 바로 제공
      result += `🔍 [네이버 검색](https://search.naver.com/search.naver?query=${encodedSearchKeyword}) | 🏨 [여기어때](https://www.goodchoice.kr/product/search?keyword=${encodedHotelName}) | [야놀자](https://www.yanolja.com/search/${encodedHotelName}) | [부킹닷컴](https://www.booking.com/searchresults.html?ss=${encodedSearchKeyword}) | 📍 [구글맵](https://www.google.com/maps/search/${encodedSearchKeyword})\n\n`;
    });

    if (moreAccommodations.length > 0) {
      result += `\n**추가 숙소 옵션 (${moreAccommodations.length}개):**\n`;
      moreAccommodations.slice(0, 10).forEach((acc, index) => {
        const hotelName = acc.사업장명;
        const address = acc.도로명전체주소 || acc.소재지전체주소 || '';
        const searchKeyword = address ? `${hotelName} ${address.split(' ').slice(0, 2).join(' ')}` : hotelName;
        const encodedSearchKeyword = encodeURIComponent(searchKeyword);
        
        result += `${index + 6}. **${hotelName}** (${acc.위생업태명 || '정보없음'})\n`;
        result += `   🔍 [네이버](https://search.naver.com/search.naver?query=${encodedSearchKeyword}) | [여기어때](https://www.goodchoice.kr/product/search?keyword=${encodeURIComponent(hotelName)}) | [야놀자](https://www.yanolja.com/search/${encodeURIComponent(hotelName)})\n\n`;
      });
      
      if (moreAccommodations.length > 10) {
        result += `\n...외 ${moreAccommodations.length - 10}개 숙소 더 있습니다.\n`;
      }
    }

    // 검색 팁 추가
    result += `\n💡 **검색 팁:**\n`;
    result += `- 네이버 검색으로 숙소 후기와 위치를 먼저 확인해보세요\n`;
    result += `- 예약 사이트에서 가격과 예약 가능 여부를 비교해보세요\n`;
    result += `- 구글맵으로 출장지와의 거리를 확인해보세요\n`;

    console.log(`Found ${recommendedAccommodations.length} primary and ${moreAccommodations.length} additional accommodations`);
    return result;

  } catch (error) {
    console.error('Error getting accommodation recommendations:', error);
    return '';
  }
}

// 메시지에서 키워드 추출 함수
function extractKeywords(message: string): string[] {
  // 출장 관련 주요 키워드들
  const businessTripKeywords = [
    '숙박비', '여비', '한도', '상한액', '지급표', '별표', '규정', '출장',
    '일비', '식비', '교통비', '체재비', '관내', '관외', '국내', '국외',
    '영수증', '정산', '신청', '승인', '기준', '규칙', '제한',
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '제주',
    '1박', '2박', '당일', '숙소', '호텔', '모텔'
  ];
  
  const foundKeywords = businessTripKeywords.filter(keyword => 
    message.includes(keyword)
  );
  
  // 추가로 숫자와 함께 나오는 패턴들 추출
  const numberPatterns = message.match(/\d+[,.]?\d*원?/g) || [];
  const datePatterns = message.match(/\d+월|\d+일|\d+박/g) || [];
  
  return [...foundKeywords, ...numberPatterns, ...datePatterns];
}

// 중요 키워드 포함 여부 확인 함수
function hasImportantKeywords(content: string): boolean {
  const importantKeywords = [
    '별표', '지급표', '상한액', '한도', '규정', '제', '조',
    '숙박비', '여비', '일비', '식비', '교통비',
    '서울특별시', '광역시', '100,000', '80,000', '70,000'
  ];
  
  return importantKeywords.some(keyword => content.includes(keyword));
}