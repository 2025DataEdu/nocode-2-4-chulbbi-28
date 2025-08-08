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

// 질문 유형 분류 함수
function classifyQuery(query: string): 'regulation' | 'accommodation' | 'restaurant' | 'general' {
  const lowercaseQuery = query.toLowerCase();
  
  // 규정 관련 키워드
  const regulationKeywords = [
    '일비', '식비', '숙박비', '교통비', '출장비', '여비', '한도', '금액', 
    '지급', '기준', '규정', '수당', '경비', '비용', '지원', '보조',
    '국내', '국외', '해외', '공무원', '공공기관', '민간', '기업',
    '얼마', '얼마나', '얼마까지', '얼마인지', '얼마야', '한계', 
    '최대', '최소', '범위', '제한', '정해진', '정액', '정률'
  ];
  
  // 숙소 관련 키워드
  const accommodationKeywords = [
    '숙소', '호텔', '모텔', '펜션', '게스트하우스', '민박', '리조트',
    '잠', '자', '잘', '머물', '숙박', '체크인', '방', '룸', '숙박시설'
  ];
  
  // 맛집 관련 키워드  
  const restaurantKeywords = [
    '맛집', '음식점', '식당', '레스토랑', '먹을', '음식', '밥', '식사',
    '맛있는', '유명한', '추천', '인증', '맛', '요리', '메뉴', '먹거리'
  ];
  
  // 우선순위: 규정 > 숙소 > 맛집
  for (const keyword of regulationKeywords) {
    if (lowercaseQuery.includes(keyword)) {
      return 'regulation';
    }
  }
  
  for (const keyword of accommodationKeywords) {
    if (lowercaseQuery.includes(keyword)) {
      return 'accommodation';
    }
  }
  
  for (const keyword of restaurantKeywords) {
    if (lowercaseQuery.includes(keyword)) {
      return 'restaurant';
    }
  }
  
  return 'general';
}

// 지역명 추출 함수
function extractLocationFromQuery(query: string): string | null {
  // 간단한 지역명 추출 로직
  const cities = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
    '수원', '성남', '고양', '용인', '부천', '안산', '안양', '남양주', '화성',
    '평택', '의정부', '시흥', '파주', '광명', '김포', '군포', '이천', '양주',
    '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척',
    '청주', '충주', '제천', '천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진',
    '전주', '군산', '익산', '정읍', '남원', '김제',
    '목포', '여수', '순천', '나주', '광양',
    '포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산',
    '진주', '통영', '사천', '김해', '밀양', '거제', '양산', '창원', '마산', '진해',
    '제주시', '서귀포'
  ];
  
  for (const city of cities) {
    if (query.includes(city)) {
      return city;
    }
  }
  
  return null;
}

// 숙소 데이터 검색 함수
async function searchAccommodations(location: string): Promise<string> {
  console.log(`숙소 검색 시작: ${location}`);
  
  try {
    const { data, error } = await supabase
      .from('accommodations')
      .select('사업장명, 소재지전체주소, 소재지전화, 양실수, 한실수')
      .or(`소재지전체주소.ilike.%${location}%,사업장명.ilike.%${location}%`)
      .limit(10);

    if (error) {
      console.error('숙소 검색 오류:', error);
      return '숙소 정보를 가져오는 중 오류가 발생했습니다.';
    }

    if (!data || data.length === 0) {
      return `${location} 지역의 등록된 숙소 정보를 찾을 수 없습니다.`;
    }

    let accommodationResults = `${location} 지역의 추천 숙소 목록:\n\n`;
    
    data.forEach((accommodation, index) => {
      accommodationResults += `${index + 1}. ${accommodation.사업장명 || '이름 미확인'}\n`;
      accommodationResults += `   주소: ${accommodation.소재지전체주소 || '주소 미확인'}\n`;
      if (accommodation.소재지전화) {
        accommodationResults += `   전화: ${accommodation.소재지전화}\n`;
      }
      if (accommodation.양실수 || accommodation.한실수) {
        accommodationResults += `   객실: 양실 ${accommodation.양실수 || 0}개, 한실 ${accommodation.한실수 || 0}개\n`;
      }
      accommodationResults += '\n';
    });

    return accommodationResults;
  } catch (error) {
    console.error('숙소 검색 중 오류:', error);
    return '숙소 검색 중 오류가 발생했습니다.';
  }
}

// 맛집 데이터 검색 함수
async function searchRestaurants(location: string): Promise<string> {
  console.log(`맛집 검색 시작: ${location}`);
  
  try {
    const { data, error } = await supabase
      .from('certified_restaurant')
      .select('업소명, 도로명주소, 소재지주소, 전화번호, 주된음식종류, 음식의유형')
      .or(`도로명주소.ilike.%${location}%,소재지주소.ilike.%${location}%,업소명.ilike.%${location}%`)
      .eq('영업상태명', '영업/정상')
      .limit(10);

    if (error) {
      console.error('맛집 검색 오류:', error);
      return '맛집 정보를 가져오는 중 오류가 발생했습니다.';
    }

    if (!data || data.length === 0) {
      return `${location} 지역의 인증된 맛집 정보를 찾을 수 없습니다.`;
    }

    let restaurantResults = `${location} 지역의 인증 맛집 목록:\n\n`;
    
    data.forEach((restaurant, index) => {
      restaurantResults += `${index + 1}. ${restaurant.업소명 || '이름 미확인'}\n`;
      restaurantResults += `   주소: ${restaurant.도로명주소 || restaurant.소재지주소 || '주소 미확인'}\n`;
      if (restaurant.전화번호) {
        restaurantResults += `   전화: ${restaurant.전화번호}\n`;
      }
      if (restaurant.주된음식종류) {
        restaurantResults += `   주요 메뉴: ${restaurant.주된음식종류}\n`;
      }
      if (restaurant.음식의유형) {
        restaurantResults += `   음식 유형: ${restaurant.음식의유형}\n`;
      }
      restaurantResults += '\n';
    });

    return restaurantResults;
  } catch (error) {
    console.error('맛집 검색 중 오류:', error);
    return '맛집 검색 중 오류가 발생했습니다.';
  }
}

// 키워드 추출 함수
function extractKeywords(message: string): string[] {
  const keywords: string[] = [];
  
  // 출장비 관련 키워드
  const expenseKeywords = [
    '일비', '식비', '숙박비', '교통비', '출장비', '여비', '한도', '금액', 
    '지급', '기준', '규정', '수당', '경비', '비용', '지원', '보조',
    '국내', '국외', '해외', '공무원', '공공기관', '민간', '기업'
  ];
  
  const lowercaseMessage = message.toLowerCase();
  
  expenseKeywords.forEach(keyword => {
    if (lowercaseMessage.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return keywords;
}

// 키워드 유사도 계산 함수
function calculateKeywordSimilarity(content: string, keywords: string[]): number {
  if (!content || keywords.length === 0) return 0;
  
  const lowercaseContent = content.toLowerCase();
  let matchCount = 0;
  
  keywords.forEach(keyword => {
    if (lowercaseContent.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  });
  
  return matchCount / keywords.length;
}

// 중요 키워드 포함 여부 확인
function hasImportantKeywords(content: string): boolean {
  const importantKeywords = [
    '일비', '식비', '숙박비', '교통비', '출장비', '여비', '한도', '금액', 
    '지급', '기준', '규정', '수당', '경비', '비용'
  ];
  
  const lowercaseContent = content.toLowerCase();
  return importantKeywords.some(keyword => lowercaseContent.includes(keyword));
}

// 웹 검색 함수
async function performTargetedWebSearch(query: string, userProfile: any): Promise<string> {
  console.log(`웹 검색 시작: ${query}, 사용자 유형: ${userProfile?.user_type}`);
  
  try {
    let searchQuery = query;
    let targetSite = '';
    
    // 사용자 유형에 따른 사이트 결정
    if (userProfile?.user_type === '공무원') {
      targetSite = 'site:law.go.kr';
      searchQuery = `${query} 공무원 출장 여비 규정 ${targetSite}`;
    } else if (userProfile?.user_type === '공공기관') {
      targetSite = 'site:alio.go.kr';
      searchQuery = `${query} 공공기관 출장 여비 규정 ${targetSite}`;
    } else {
      // 기타 사용자의 경우 일반 검색
      searchQuery = `${query} 출장 여비 규정`;
    }
    
    console.log(`검색 쿼리: ${searchQuery}`);
    return '웹 검색 기능이 현재 준비 중입니다.';
  } catch (error) {
    console.error('웹 검색 중 오류:', error);
    return '웹 검색 중 오류가 발생했습니다.';
  }
}

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

    // 사용자 프로필 정보 가져오기 (user_type 확인용)
    let userProfile = null;
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, organization')
          .eq('user_id', userId)
          .single();
        userProfile = profile;
        console.log('User profile:', userProfile);
      } catch (error) {
        console.log('Could not fetch user profile:', error);
      }
    }

    // 질문 유형 분류
    const queryType = classifyQuery(message);
    console.log('질문 유형:', queryType);

    let systemPrompt = '';
    let responseContext = '';

    if (queryType === 'accommodation') {
      // 숙소 추천 - Supabase 데이터베이스 사용
      console.log('숙소 추천 요청 처리');
      
      const location = extractLocationFromQuery(message) || '전국';
      const accommodationData = await searchAccommodations(location);
      
      systemPrompt = `당신은 출장 숙소 추천 전문가입니다. 제공된 숙소 데이터를 바탕으로 사용자에게 적절한 숙소를 추천해주세요.

숙소 데이터:
${accommodationData}

사용자의 질문에 대해 위 데이터를 기반으로 친절하고 상세하게 답변해주세요. 숙소 정보를 보기 좋게 정리하여 제공하고, 각 숙소의 특징을 설명해주세요.`;
      
    } else if (queryType === 'restaurant') {
      // 맛집 추천 - Supabase 데이터베이스 사용
      console.log('맛집 추천 요청 처리');
      
      const location = extractLocationFromQuery(message) || '전국';
      const restaurantData = await searchRestaurants(location);
      
      systemPrompt = `당신은 출장 맛집 추천 전문가입니다. 제공된 인증 맛집 데이터를 바탕으로 사용자에게 적절한 맛집을 추천해주세요.

맛집 데이터:
${restaurantData}

사용자의 질문에 대해 위 데이터를 기반으로 친절하고 상세하게 답변해주세요. 맛집 정보를 보기 좋게 정리하여 제공하고, 각 맛집의 특징을 설명해주세요.`;
      
    } else {
      // 규정 관련 질문 또는 일반 질문 - 사용자 업로드 문서 기반
      console.log('규정/일반 질문 처리 - 사용자 문서 기반');

      // 업로드된 문서 검색 - 개선된 임베딩 기반 검색
      let documentContext = '';
      let hasRelevantDocuments = false;
      
      if (userId) {
        try {
          // 1. 메시지에서 키워드 추출
          const messageKeywords = extractKeywords(message);
          console.log('Extracted keywords from message:', messageKeywords);
          
          // 2. 향상된 벡터 검색 (임베딩 기반)
          let bestMatches = [];
          try {
            const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: message,
                dimensions: 1536
              }),
            });
            
            if (embeddingResponse.ok) {
              const embeddingData = await embeddingResponse.json();
              const queryEmbedding = embeddingData.data[0].embedding;
              
              // 벡터 유사도 검색 - 임계값 0.7 이상만 채택
              const { data: vectorDocs, error: vectorError } = await supabase
                .rpc('match_documents', {
                  query_embedding: queryEmbedding,
                  match_count: 15
                });
                
              if (!vectorError && vectorDocs) {
                // 유사도 임계값 적용 및 정렬
                bestMatches = vectorDocs
                  .filter(doc => doc.similarity > 0.3)
                  .sort((a, b) => b.similarity - a.similarity);
                console.log(`Found ${bestMatches.length} high-similarity matches (>0.3)`);
              }
            }
          } catch (vectorError) {
            console.log('Vector search failed, using keyword search');
          }
          
          // 3. 키워드 기반 보완 검색
          let keywordMatches = [];
          if (messageKeywords.length > 0) {
            const keywordQueries = [
              ...messageKeywords.map(keyword => `content.ilike.%${keyword}%`),
              ...messageKeywords.map(keyword => `doc_title.ilike.%${keyword}%`)
            ];
            
            const { data: keywordDocs, error: keywordError } = await supabase
              .from('documents')
              .select('content, doc_title, chunk_index, document_id')
              .eq('user_id', userId)
              .or(keywordQueries.join(','))
              .limit(20);
              
            if (!keywordError && keywordDocs) {
              keywordMatches = keywordDocs.map(doc => ({
                ...doc,
                similarity: calculateKeywordSimilarity(doc.content, messageKeywords)
              })).filter(doc => doc.similarity > 0.3);
              console.log(`Found ${keywordMatches.length} keyword matches`);
            }
          }
          
          // 4. 결과 통합 및 중복 제거
          const allMatches = new Map();
          
          bestMatches.forEach(doc => {
            const key = `${doc.doc_title}-${doc.chunk_index}`;
            allMatches.set(key, { ...doc, source: 'vector' });
          });
          
          keywordMatches.forEach(doc => {
            const key = `${doc.doc_title}-${doc.chunk_index}`;
            if (!allMatches.has(key)) {
              allMatches.set(key, { ...doc, source: 'keyword' });
            }
          });
          
          // 5. 최종 정렬 및 선택
          const finalMatches = Array.from(allMatches.values())
            .sort((a, b) => {
              if (a.similarity > 0.8 || b.similarity > 0.8) {
                return b.similarity - a.similarity;
              }
              const aHasImportant = hasImportantKeywords(a.content);
              const bHasImportant = hasImportantKeywords(b.content);
              if (aHasImportant !== bHasImportant) {
                return bHasImportant ? 1 : -1;
              }
              return b.similarity - a.similarity;
            })
            .slice(0, 10);
          
          // 6. 관련성 높은 문서가 있는지 판단
          hasRelevantDocuments = finalMatches.some(doc => 
            doc.similarity > 0.5 || hasImportantKeywords(doc.content)
          );
          
          if (finalMatches.length > 0) {
            console.log(`Using ${finalMatches.length} documents for context (relevant: ${hasRelevantDocuments})`);
            console.log('Top similarities:', finalMatches.slice(0, 3).map(d => d.similarity?.toFixed(3)).join(', '));
            
            documentContext = finalMatches.map(doc => {
              const isHighRelevance = doc.similarity > 0.8;
              const isImportant = hasImportantKeywords(doc.content);
              const formattedContent = `[${doc.doc_title}${doc.chunk_index ? ` - 섹션 ${doc.chunk_index}` : ''}] ${doc.content}`;
              
              if (isHighRelevance || isImportant) {
                return `**[핵심규정 - 유사도: ${(doc.similarity * 100).toFixed(1)}%]** ${formattedContent}`;
              } else {
                return `**[참고자료 - 유사도: ${(doc.similarity * 100).toFixed(1)}%]** ${formattedContent}`;
              }
            }).join('\n\n');
          } else {
            console.log('No relevant documents found');
          }
        } catch (error) {
          console.error('Error in document search:', error);
        }
      }

      // 웹 검색 수행 (업로드된 문서에 관련 내용이 부족한 경우)
      let webSearchResults = '';
      if (!hasRelevantDocuments && userProfile) {
        console.log('Performing web search due to insufficient document matches');
        webSearchResults = await performTargetedWebSearch(message, userProfile);
      }

      // 시스템 프롬프트 설정
      systemPrompt = `당신은 '출장비서 출삐'라는 AI 출장 관리 서비스의 전문 도우미입니다.

**중요한 제약사항:**
- 출장 규정, 일비, 식비, 숙박비 등에 관한 질문은 오직 사용자가 업로드한 문서(파일, 텍스트 등)만을 참고하여 답변해야 합니다.
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
- 중요한 내용은 **볼드**로 강조하여 가독성을 높여주세요`;

      if (documentContext) {
        systemPrompt += `

**참고 자료 (업로드된 문서):**
${documentContext}

위 업로드된 문서를 바탕으로만 정확한 답변을 제공해주세요. 참고 자료에 답이 있으면 해당 내용을 인용하여 설명하고, **[문서명 - 해당 섹션]** 형태로 근거를 명시해주세요. 참고 자료에 없는 내용에 대해서는 "해당 정보는 제공된 문서 내에 없습니다."라고 답변해주세요.`;
      } else if (webSearchResults) {
        systemPrompt += `

**웹 검색 결과 (공식 자료):**
${webSearchResults}

위 공식 웹 검색 결과를 참고하여 답변해주세요. 웹 검색 결과를 인용할 때는 **[웹 검색 - 출처]** 형태로 명시해주세요.`;
      } else {
        systemPrompt += `

**현재 상태:** 참고할 수 있는 업로드된 문서가 없습니다.
사용자에게 "현재 참고할 수 있는 업로드된 문서가 없습니다. 관련 규정이나 문서를 업로드해 주시면 정확한 답변을 드릴 수 있습니다."라고 안내해주세요.`;
      }
    }

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