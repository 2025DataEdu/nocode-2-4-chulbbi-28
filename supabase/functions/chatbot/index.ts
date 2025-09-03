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
function classifyQuery(query: string): 'regulation' | 'accommodation' | 'restaurant' | 'attraction' | 'trip_creation' | 'general' {
  const lowercaseQuery = query.toLowerCase();
  
  // 출장 등록/생성 관련 키워드 - 최우선
  const tripCreationKeywords = [
    '등록', '생성', '추가', '신청', '만들', '새로', '계획', '예약',
    '출장 가', '출장을', '출장 신청', '출장 등록', '출장 생성', '출장 계획',
    '서울 출장', '부산 출장', '대전 출장', '출장 일정'
  ];
  
  // 출장 생성 키워드 우선 체크
  for (const keyword of tripCreationKeywords) {
    if (lowercaseQuery.includes(keyword)) {
      return 'trip_creation';
    }
  }
  
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
  
  // 관광지/관광 관련 키워드
  const attractionKeywords = [
    '관광지', '관광', '볼거리', '놀거리', '구경', '여행', '관광명소',
    '명소', '박물관', '공원', '유적지', '문화재', '테마파크', '놀이공원',
    '갈 만한 곳', '가볼만한', '데이트', '산책', '구경거리', '체험',
    '전시', '문화', '역사', '자연', '경치', '풍경', '사진', '인스타'
  ];
  
  // 우선순위: 규정 > 관광지 > 숙소 > 맛집
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
  
  for (const keyword of attractionKeywords) {
    if (lowercaseQuery.includes(keyword)) {
      return 'attraction';
    }
  }
  
  return 'general';
}

// 지역명 추출 함수
function extractLocationFromQuery(query: string): string | null {
  // 서울 구 단위 지역명
  const seoulDistricts = [
    '마포구', '강남구', '강북구', '강서구', '강동구', '관악구', '광진구', '구로구',
    '금천구', '노원구', '도봉구', '동대문구', '동작구', '서대문구', '서초구', '성동구',
    '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
  ];
  
  // 일반 시/도/군 지역명
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
  
  // 서울 구 단위 우선 검색
  for (const district of seoulDistricts) {
    if (query.includes(district)) {
      return district;
    }
  }
  
  // 일반 지역명 검색
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
    // 특정 구/군 검색
    const { data, error } = await supabase
      .from('accommodations')
      .select('사업장명, 소재지전체주소, 소재지전화, 양실수, 한실수')
      .or(`소재지전체주소.ilike.%${location}%,사업장명.ilike.%${location}%`)
      .limit(10);

    if (error) {
      console.error('숙소 검색 오류:', error);
      return '숙소 정보를 가져오는 중 오류가 발생했습니다.';
    }

    // 특정 구/군에서 결과가 없으면 상위 지역(서울)에서 검색
    if (!data || data.length === 0) {
      if (location.includes('마포구') || location.includes('강남구') || location.includes('구')) {
        const upperLocation = '서울';
        console.log(`${location}에서 결과 없음, ${upperLocation}로 확장 검색`);
        
        const { data: upperData, error: upperError } = await supabase
          .from('accommodations')
          .select('사업장명, 소재지전체주소, 소재지전화, 양실수, 한실수')
          .or(`소재지전체주소.ilike.%${upperLocation}%,사업장명.ilike.%${upperLocation}%`)
          .limit(10);

        if (!upperError && upperData && upperData.length > 0) {
          let accommodationResults = `현재 제공된 숙소 데이터에는 ${location} 내 숙소 정보가 없지만, 서울 전역에서 추천할 만한 숙소를 몇 가지 소개해드리겠습니다.\n\n`;
          
          upperData.forEach((accommodation, index) => {
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
        }
      }
      
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
    // 특정 구/군 검색
    const { data, error } = await supabase
      .from('certified_restaurant')
      .select('업소명, 도로명주소, 소재지주소, 전화번호, 주된음식종류, 음식의유형')
      .or(`도로명주소.ilike.%${location}%,소재지주소.ilike.%${location}%,업소명.ilike.%${location}%`)
      .eq('영업상태명', '영업')
      .limit(10);

    if (error) {
      console.error('맛집 검색 오류:', error);
      return '맛집 정보를 가져오는 중 오류가 발생했습니다.';
    }

    // 특정 구/군에서 결과가 없으면 상위 지역(서울)에서 검색
    if (!data || data.length === 0) {
      if (location.includes('마포구') || location.includes('강남구') || location.includes('구')) {
        const upperLocation = '서울';
        console.log(`${location}에서 결과 없음, ${upperLocation}로 확장 검색`);
        
        const { data: upperData, error: upperError } = await supabase
          .from('certified_restaurant')
          .select('업소명, 도로명주소, 소재지주소, 전화번호, 주된음식종류, 음식의유형')
          .or(`도로명주소.ilike.%${upperLocation}%,소재지주소.ilike.%${upperLocation}%,업소명.ilike.%${upperLocation}%`)
          .eq('영업상태명', '영업')
          .limit(10);

        if (!upperError && upperData && upperData.length > 0) {
          let restaurantResults = `현재 제공된 맛집 데이터에는 ${location} 내 맛집 정보가 없지만, 서울 전역에서 추천할 만한 인증 맛집을 몇 가지 소개해드리겠습니다.\n\n`;
          
          upperData.forEach((restaurant, index) => {
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
        }
      }
      
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

// 관광지 데이터 검색 함수
async function searchAttractions(location: string): Promise<string> {
  console.log(`관광지 검색 시작: ${location}`);
  
  try {
    // 특정 구/군 검색
    const { data, error } = await supabase
      .from('tourist_attraction')
      .select('관광지명, 소재지도로명주소, 소재지지번주소, 관광지소개, 관리기관명, 관리기관전화번호, 면적, 수용인원수, 주차가능수')
      .or(`소재지도로명주소.ilike.%${location}%,소재지지번주소.ilike.%${location}%,관광지명.ilike.%${location}%`)
      .limit(10);

    if (error) {
      console.error('관광지 검색 오류:', error);
      return '관광지 정보를 가져오는 중 오류가 발생했습니다.';
    }

    // 특정 구/군에서 결과가 없으면 상위 지역에서 검색
    if (!data || data.length === 0) {
      if (location.includes('마포구') || location.includes('강남구') || location.includes('구')) {
        const upperLocation = '서울';
        console.log(`${location}에서 결과 없음, ${upperLocation}로 확장 검색`);
        
        const { data: upperData, error: upperError } = await supabase
          .from('tourist_attraction')
          .select('관광지명, 소재지도로명주소, 소재지지번주소, 관광지소개, 관리기관명, 관리기관전화번호, 면적, 수용인원수, 주차가능수')
          .or(`소재지도로명주소.ilike.%${upperLocation}%,소재지지번주소.ilike.%${upperLocation}%,관광지명.ilike.%${upperLocation}%`)
          .limit(10);

        if (!upperError && upperData && upperData.length > 0) {
          let attractionResults = `현재 제공된 관광지 데이터에는 ${location} 내 관광지 정보가 없지만, 서울 전역에서 추천할 만한 관광지를 몇 가지 소개해드리겠습니다.\n\n`;
          
          upperData.forEach((attraction, index) => {
            attractionResults += `${index + 1}. ${attraction.관광지명 || '이름 미확인'}\n`;
            attractionResults += `   주소: ${attraction.소재지도로명주소 || attraction.소재지지번주소 || '주소 미확인'}\n`;
            if (attraction.관광지소개) {
              attractionResults += `   소개: ${attraction.관광지소개}\n`;
            }
            if (attraction.관리기관명) {
              attractionResults += `   관리기관: ${attraction.관리기관명}\n`;
            }
            if (attraction.관리기관전화번호) {
              attractionResults += `   문의: ${attraction.관리기관전화번호}\n`;
            }
            if (attraction.수용인원수) {
              attractionResults += `   수용인원: ${attraction.수용인원수}명\n`;
            }
            if (attraction.주차가능수) {
              attractionResults += `   주차: ${attraction.주차가능수}대 가능\n`;
            }
            attractionResults += '\n';
          });

          return attractionResults;
        }
      }
      
      return `${location} 지역의 관광지 정보를 찾을 수 없습니다.`;
    }

    let attractionResults = `${location} 지역의 추천 관광지 목록:\n\n`;
    
    data.forEach((attraction, index) => {
      attractionResults += `${index + 1}. ${attraction.관광지명 || '이름 미확인'}\n`;
      attractionResults += `   주소: ${attraction.소재지도로명주소 || attraction.소재지지번주소 || '주소 미확인'}\n`;
      if (attraction.관광지소개) {
        attractionResults += `   소개: ${attraction.관광지소개}\n`;
      }
      if (attraction.관리기관명) {
        attractionResults += `   관리기관: ${attraction.관리기관명}\n`;
      }
      if (attraction.관리기관전화번호) {
        attractionResults += `   문의: ${attraction.관리기관전화번호}\n`;
      }
      if (attraction.수용인원수) {
        attractionResults += `   수용인원: ${attraction.수용인원수}명\n`;
      }
      if (attraction.주차가능수) {
        attractionResults += `   주차: ${attraction.주차가능수}대 가능\n`;
      }
      attractionResults += '\n';
    });

    return attractionResults;
  } catch (error) {
    console.error('관광지 검색 중 오류:', error);
    return '관광지 검색 중 오류가 발생했습니다.';
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

// 웹 검색 함수 (OpenAI 기반 규정 정보 제공)
async function performWebSearch(query: string, userType: string): Promise<string> {
  console.log(`웹 검색 시작: ${query}, 사용자 유형: ${userType}`);
  
  try {
    let systemPrompt = '';
    let searchContext = '';
    
    // 사용자 유형에 따른 검색 컨텍스트 설정
    if (userType === '공무원') {
      systemPrompt = `당신은 공무원 출장 규정 전문가입니다. 법제처(law.go.kr) 및 공무원 관련 법령을 기반으로 정확한 출장 규정 정보를 제공해주세요.`;
      searchContext = `공무원 출장 규정 (law.go.kr 기반):
- 공무원여비규정, 공무원 복무규정 등 관련 법령 참조
- 국내여비, 국외여비 기준 적용
- 급별, 지역별 차등 지급 원칙
- 실비 지급 및 정액 지급 기준`;
    } else if (userType === '공공기관') {
      systemPrompt = `당신은 공공기관 출장 규정 전문가입니다. 공공기관 경영정보 공개시스템(alio.go.kr) 및 공공기관 관련 규정을 기반으로 정확한 출장 규정 정보를 제공해주세요.`;
      searchContext = `공공기관 출장 규정 (alio.go.kr 기반):
- 공공기관의 운영에 관한 법률 및 각 기관별 내부 규정
- 기관별 출장여비 지급 기준
- 임직원 등급별 지급 한도
- 숙박비, 식비, 교통비 등 세부 기준`;
    } else {
      systemPrompt = `당신은 일반 기업 출장 규정 전문가입니다. 일반적인 기업 출장 규정과 노동법을 기반으로 합리적인 출장 관련 정보를 제공해주세요.`;
      searchContext = `일반 기업 출장 규정:
- 근로기준법상 출장 관련 규정
- 일반적인 기업 출장비 지급 기준
- 업계 평균 수준의 출장비 가이드라인
- 세법상 비과세 한도 기준`;
    }
    
    console.log(`검색 컨텍스트: ${searchContext}`);
    
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
            role: 'system',
            content: `${systemPrompt}

컨텍스트 정보:
${searchContext}

사용자의 질문에 대해 위 컨텍스트를 기반으로 정확하고 유용한 정보를 제공해주세요. 
반드시 답변 끝에 "※ 이 정보는 일반적인 ${userType} 규정을 기반으로 한 참고 자료입니다. 정확한 규정은 소속 기관의 내부 규정을 확인하시기 바랍니다."라고 안내해주세요.

답변 형식:
- 구체적이고 실용적인 정보 제공
- 금액이나 기준이 있다면 명시
- 관련 법령이나 규정명 언급
- **중요한 내용은 볼드로 강조**`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API 오류: ${response.status}`);
      return '웹 검색을 수행할 수 없습니다.';
    }

    const data = await response.json();
    console.log('OpenAI 응답 생성 완료');
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content || '검색 결과를 찾을 수 없습니다.';
    }

    return '검색 결과를 처리할 수 없습니다.';
  } catch (error) {
    console.error('웹 검색 중 오류:', error);
    return '웹 검색 중 오류가 발생했습니다.';
  }
}

// 출장 정보 추출 및 생성 함수
async function extractTripInfoAndCreate(message: string, userId: string): Promise<{ success: boolean; tripData?: any; message: string }> {
  console.log('출장 정보 추출 시작:', message);
  
  try {
    // OpenAI API를 사용하여 출장 정보 추출
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
            role: 'system',
            content: `당신은 출장 정보 추출 전문가입니다. 사용자의 메시지에서 출장 관련 정보를 추출하여 JSON 형태로 반환해주세요.

다음 형식으로 출장 정보를 추출해주세요:
{
  "destination": "목적지 (시/구/군 포함)",
  "departure_location": "출발지 (현재 위치 추정)",
  "purpose": "출장 목적",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD", 
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "transportation": "교통수단 (자차/기차/버스/항공 등)",
  "accommodation_needed": true/false,
  "trip_type": "관내/관외",
  "notes": "추가 메모"
}

추출 규칙:
1. 목적지는 시/구/군 단위로 정확하게 추출
2. 출발지가 명시되지 않으면 "서울특별시"로 기본 설정
3. 날짜가 불명확하면 null로 설정
4. 시간이 없으면 start_time: "09:00", end_time: "18:00"으로 기본 설정
5. 교통수단이 명시되지 않으면 "미정"으로 설정
6. 출장 목적이 없으면 "업무 관련"으로 설정
7. 관내/관외는 목적지 기준으로 판단 (서울 내부면 관내, 서울 외부면 관외)

JSON만 반환하고 다른 텍스트는 포함하지 마세요.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API 오류: ${response.status}`);
      return { success: false, message: '출장 정보를 추출할 수 없습니다.' };
    }

    const data = await response.json();
    const extractedInfo = data.choices[0].message.content;
    
    console.log('추출된 출장 정보:', extractedInfo);
    
    // JSON 파싱
    let tripInfo;
    try {
      tripInfo = JSON.parse(extractedInfo);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      return { success: false, message: '출장 정보 형식이 올바르지 않습니다.' };
    }

    // 필수 정보 검증
    if (!tripInfo.destination || !tripInfo.start_date || !tripInfo.end_date) {
      return { 
        success: false, 
        message: '출장 등록을 위해서는 **목적지**, **시작일**, **종료일**이 필요합니다.\n\n예시: "서울 출장, 8월 15일부터 17일까지"' 
      };
    }

    // 거리 계산 (간단한 추정)
    const estimatedDistance = calculateEstimatedDistance(tripInfo.departure_location, tripInfo.destination);

    // Supabase에 출장 데이터 저장
    const { data: newTrip, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: userId,
        destination: tripInfo.destination,
        departure_location: tripInfo.departure_location || '서울특별시',
        purpose: tripInfo.purpose || '업무 관련',
        start_date: tripInfo.start_date,
        end_date: tripInfo.end_date,
        start_time: tripInfo.start_time || '09:00',
        end_time: tripInfo.end_time || '18:00',
        transportation: tripInfo.transportation || '미정',
        accommodation_needed: tripInfo.accommodation_needed || false,
        trip_type: tripInfo.trip_type || '관외',
        distance_km: estimatedDistance,
        notes: tripInfo.notes || null,
        status: 'planned',
        budget: 0,
        spent: 0
      })
      .select()
      .single();

    if (tripError) {
      console.error('출장 저장 오류:', tripError);
      return { success: false, message: '출장 저장 중 오류가 발생했습니다.' };
    }

    console.log('출장 저장 성공:', newTrip);

    // 성공 메시지 생성
    const successMessage = `✅ **출장이 성공적으로 등록되었습니다!**

📋 **등록된 출장 정보:**
- **목적지:** ${tripInfo.destination}
- **출발지:** ${tripInfo.departure_location || '서울특별시'}
- **기간:** ${tripInfo.start_date} ~ ${tripInfo.end_date}
- **시간:** ${tripInfo.start_time || '09:00'} - ${tripInfo.end_time || '18:00'}
- **목적:** ${tripInfo.purpose || '업무 관련'}
- **교통수단:** ${tripInfo.transportation || '미정'}
- **숙박 필요:** ${tripInfo.accommodation_needed ? '예' : '아니오'}
- **거리:** 약 ${estimatedDistance}km

다음에 필요한 작업:
- 숙소 예약 ${tripInfo.accommodation_needed ? '✅ 필요' : '❌ 불필요'}
- 교통편 예약
- 출장비 신청

추가로 도움이 필요하시면 언제든 말씀해주세요! 😊`;

    return { 
      success: true, 
      tripData: newTrip, 
      message: successMessage 
    };

  } catch (error) {
    console.error('출장 생성 중 오류:', error);
    return { 
      success: false, 
      message: '출장 등록 중 오류가 발생했습니다. 다시 시도해주세요.' 
    };
  }
}

// 간단한 거리 추정 함수
function calculateEstimatedDistance(departure: string, destination: string): number {
  // 주요 도시 간 거리 데이터 (km)
  const distances: Record<string, Record<string, number>> = {
    '서울': { '부산': 400, '대구': 300, '대전': 150, '광주': 300, '인천': 40 },
    '부산': { '서울': 400, '대구': 100, '대전': 280, '광주': 180 },
    '대구': { '서울': 300, '부산': 100, '대전': 180, '광주': 200 },
    '대전': { '서울': 150, '부산': 280, '대구': 180, '광주': 150 },
    '광주': { '서울': 300, '부산': 180, '대구': 200, '대전': 150 }
  };

  // 출발지와 목적지에서 주요 도시명 추출
  const depCity = Object.keys(distances).find(city => departure?.includes(city)) || '서울';
  const destCity = Object.keys(distances).find(city => destination?.includes(city)) || '서울';

  // 같은 도시 내 이동이면 50km로 추정
  if (depCity === destCity) {
    return 50;
  }

  return distances[depCity]?.[destCity] || distances[destCity]?.[depCity] || 200;
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
      console.error('OPENAI_API_KEY is not configured');
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
      
    } else if (queryType === 'attraction') {
      // 관광지 추천 - Supabase 데이터베이스 사용
      console.log('관광지 추천 요청 처리');
      
      const location = extractLocationFromQuery(message) || '전국';
      const attractionData = await searchAttractions(location);
      
      systemPrompt = `당신은 출장지 관광/관광지 추천 전문가입니다. 제공된 관광지 데이터를 바탕으로 사용자에게 적절한 관광지와 볼거리를 추천해주세요.

관광지 데이터:
${attractionData}

사용자의 질문에 대해 위 데이터를 기반으로 친절하고 상세하게 답변해주세요. 관광지 정보를 보기 좋게 정리하여 제공하고, 각 관광지의 특징과 볼거리를 설명해주세요.`;
      
    } else if (queryType === 'trip_creation') {
      // 출장 생성 요청 처리
      console.log('출장 생성 요청 처리');
      
      if (!userId) {
        systemPrompt = `죄송합니다. 출장 등록을 위해서는 로그인이 필요합니다. 
        로그인 후 다시 시도해주세요.`;
      } else {
        // 출장 정보 추출 및 생성
        const tripResult = await extractTripInfoAndCreate(message, userId);
        
        if (tripResult.success) {
          // 출장 생성 성공
          return new Response(JSON.stringify({ 
            reply: tripResult.message,
            success: true,
            tripSaved: true,
            tripData: tripResult.tripData
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // 출장 생성 실패 - 추가 정보 요청
          systemPrompt = `출장 등록을 도와드리겠습니다.

${tripResult.message}

추가로 필요한 정보가 있으시면 말씀해주세요. 출장 등록을 위해서는 다음 정보가 필요합니다:
- **목적지** (시/구/군 포함)
- **출장 기간** (시작일 ~ 종료일)
- **출장 목적** (선택사항)
- **교통수단** (선택사항)

예시: "서울 마포구 출장, 8월 15일부터 17일까지, 교육 참석"`;
        }
      }
      
    } else {
      // 규정 관련 질문 또는 일반 질문 - 사용자 업로드 문서 기반
      console.log('규정/일반 질문 처리 - 사용자 문서 기반');

      // 업로드된 문서 검색 - 개선된 임베딩 기반 검색
      let documentContext = '';
      let hasRelevantDocuments = false;
      
      if (userId) {
        try {
          // 1. 임베딩 벡터 기반 검색
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

          let embedding;
          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json();
            embedding = embeddingData.data[0].embedding;
          }

          // 사용자 문서에서 임베딩 벡터 기반 검색
          // 중요: match_documents는 이미 user_id 필터가 적용되어 있음 (auth.uid() 사용)
          const { data: vectorResults, error: vectorError } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_count: 10
          })

          if (vectorError) {
            console.error('Vector search error:', vectorError)
          }

          // 키워드 기반 검색으로 보완
          let keywordResults: any[] = []
          const extractedKeywords = extractKeywords(message)
          console.log('Extracted keywords from message:', extractedKeywords)

          if (extractedKeywords.length > 0) {
            for (const keyword of extractedKeywords) {
              const { data: kwResults, error: kwError } = await supabase
                .from('documents')
                .select('*')
                .textSearch('content', keyword, { type: 'websearch' })
                .eq('user_id', userId)
                .limit(10)

              if (!kwError && kwResults) {
                keywordResults = keywordResults.concat(kwResults)
              }
            }
          }

          // 결과 통합 및 중복 제거
          const allResults = [...(vectorResults || []), ...keywordResults]
          const uniqueResults = allResults.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
          )

          // 임베딩 유사도 분석
          const highSimilarityThreshold = 0.3
          const highSimilarityMatches = (vectorResults || []).filter(doc => doc.similarity > highSimilarityThreshold)
          console.log(`Found ${highSimilarityMatches.length} high-similarity matches (>${highSimilarityThreshold})`)

          if (vectorResults && vectorResults.length > 0) {
            const topSimilarities = vectorResults.slice(0, 3).map(doc => doc.similarity?.toFixed(3)).join(', ')
            console.log('Top similarities:', topSimilarities)
          }

          // 키워드 매칭 개수
          const keywordMatchCount = keywordResults.length
          console.log(`Found ${keywordMatchCount} keyword matches`)

          // 사용자 문서 기반 RAG 우선 원칙 - 키워드 검색 개선
          const hasAnyDocuments = uniqueResults.length > 0
          const hasKeywordMatches = keywordMatchCount > 0
          const hasSimilarityMatches = highSimilarityMatches.length > 0
          
          // 최고 유사도 점수 확인
          const maxSimilarity = uniqueResults.length > 0 ? Math.max(...uniqueResults.map(doc => doc.similarity || 0)) : 0
          
          // 개선된 키워드 매칭 - 더 정확한 텍스트 검색
          let improvedKeywordMatches = 0
          if (extractedKeywords.length > 0 && uniqueResults.length > 0) {
            uniqueResults.forEach(doc => {
              const content = doc.content.toLowerCase()
              extractedKeywords.forEach(keyword => {
                if (content.includes(keyword.toLowerCase())) {
                  improvedKeywordMatches++
                }
              })
            })
          }
          
          // 관련성 판단: 키워드가 있으면 무조건 우선 사용 + 낮은 임계값 적용
          hasRelevantDocuments = hasAnyDocuments && (
            hasKeywordMatches || 
            improvedKeywordMatches > 0 || 
            hasSimilarityMatches || 
            maxSimilarity > 0.05  // 5% 이상이면 관련성 있다고 판단
          )
          
          console.log(`Document availability: any=${hasAnyDocuments}, keywords=${hasKeywordMatches}, similarity=${hasSimilarityMatches}`)
          console.log(`Max similarity: ${(maxSimilarity * 100).toFixed(1)}%, threshold: 10.0%`)
          console.log(`Final relevance decision: ${hasRelevantDocuments} (similarity check: ${hasSimilarityMatches || hasKeywordMatches})`)

          if (hasRelevantDocuments) {
            // 키워드 매칭 결과와 유사도 높은 결과를 우선하여 최대 10개 선택
            const prioritizedResults = [
              ...keywordResults.slice(0, 5),  // 키워드 매칭 우선
              ...highSimilarityMatches.slice(0, 5)  // 유사도 높은 것
            ].filter((item, index, self) => 
              index === self.findIndex(t => t.id === item.id)
            ).slice(0, 10)

            const documentsToUse = prioritizedResults.length > 0 ? prioritizedResults : uniqueResults.slice(0, 10)
            console.log(`Using ${documentsToUse.length} documents for context (relevant: ${hasRelevantDocuments})`)

            documentContext = documentsToUse.map(doc => {
              const similarity = doc.similarity || 0
              const isHighRelevance = similarity > 0.7
              const isImportant = hasImportantKeywords(doc.content)
              const formattedContent = `[${doc.doc_title}${doc.chunk_index ? ` - 섹션 ${doc.chunk_index}` : ''}] ${doc.content}`
              
              if (isHighRelevance || isImportant) {
                return `**[핵심규정 - 유사도: ${(similarity * 100).toFixed(1)}%]** ${formattedContent}`
              } else {
                return `**[참고자료 - 유사도: ${(similarity * 100).toFixed(1)}%]** ${formattedContent}`
              }
            }).join('\n\n')
          } else {
            console.log('No relevant documents found')
          }
        } catch (error) {
          console.error('Error in document search:', error);
        }
      }

      // *** 핵심 개선: 사용자 문서 우선 원칙 강화 ***
      // 웹 검색은 오직 사용자 문서에 전혀 관련성이 없는 경우만 수행
      let webSearchResults = '';
      if (!hasRelevantDocuments && userProfile) {
        console.log('웹 검색 시작:', message, ', 사용자 유형:', userProfile.user_type || '기타');
        webSearchResults = await performWebSearch(message, userProfile.user_type || '기타');
      }

      // 시스템 프롬프트 설정 - RAG 응답 원칙 적용
      if (hasRelevantDocuments && documentContext) {
        // [1] 사용자 문서 우선 - 유사도 10% 이상인 경우
        systemPrompt = `당신은 사용자 문서를 분석하고 질문에 정확히 답하는 AI 어시스턴트입니다.

📌 **[1] 사용자 문서 우선 원칙 (유사도 10% 이상 적용 중)**
- 기본적으로, Supabase documents 테이블에 저장된 **해당 사용자가 업로드한 문서**만을 참고하여 답변해야 합니다.
- 벡터 검색을 기반으로 연관된 문서를 판단하고, 해당 문서에서 최대한 유사한 내용을 찾아 답변하십시오.
- 키워드 매칭이 부족하더라도, 문맥과 유사 개념을 고려해 **문서 기반 답변을 생성**하십시오.
- 유사도가 10% 이상인데 "문서에 관련 정보가 없습니다"라고 답변하는 것은 금지합니다.

🔍 **[4] 답변 형식**
- 문서 기반 답변 시에는 반드시 출처를 아래와 같이 명시하십시오:
  → **[문서명 - 섹션/페이지]**에 따르면 …
- 문서 내용이 불충분한 경우에는 다음과 같이 설명하십시오:
  → "문서에서 직접적인 내용은 없지만, 유사한 문맥에 따르면 다음과 같은 해석이 가능합니다."

**참고 자료 (업로드된 문서):**
${documentContext}

위 업로드된 문서를 바탕으로만 정확한 답변을 제공하고, 반드시 출처를 명시해주세요.

응답 스타일:
- 친근하고 전문적인 톤
- 한국어로 응답
- 구체적이고 실용적인 조언 제공
- 중요한 내용은 **볼드**로 강조하여 가독성을 높여주세요`;
        
      } else if (webSearchResults) {
        // [2] 웹 검색 조건 - 유사도 10% 미만일 때만
        const sourceInfo = userProfile?.user_type === '공무원' ? 'law.go.kr 기반 공무원여비규정' : 
                          userProfile?.user_type === '공공기관' ? 'alio.go.kr 기반 출장여비 지급기준' : 
                          '근로기준법, 일반 기업 출장 규정';
        
        systemPrompt = `당신은 사용자 문서를 분석하고 질문에 정확히 답하는 AI 어시스턴트입니다.

🟡 **[3] 유사도 10% 미만일 경우에만 웹 검색 허용**
- 질문과 관련된 사용자 문서의 유사도 점수가 10% 미만이므로, 예외적으로 웹 검색을 통해 정보를 보완합니다.
- 사용자 유형(${userProfile?.user_type || '기타'})에 따라 ${sourceInfo}를 우선 참조합니다.

🔍 **[4] 답변 형식**
- 웹 검색 기반 답변 시에는 반드시 출처를 아래와 같이 명시하십시오:
  → **[웹 검색 - ${sourceInfo}]**에 따르면 …
- 웹 검색 기반으로 작성한 답변은 항상 출처를 명시하고, 문서 기반이 아님을 명확히 밝혀야 합니다.

**웹 검색 결과:**
${webSearchResults}

위 웹 검색 결과를 바탕으로 정확한 답변을 제공하고, 반드시 출처를 명시해주세요.

응답 스타일:
- 친근하고 전문적인 톤
- 한국어로 응답
- 구체적이고 실용적인 조언 제공
- 중요한 내용은 **볼드**로 강조하여 가독성을 높여주세요`;
        
      } else {
        // 업로드된 문서도 없고 웹 검색 결과도 없는 경우
        systemPrompt = `당신은 사용자 문서를 분석하고 질문에 정확히 답하는 AI 어시스턴트입니다.

⛔ **[6] 금지 사항**
- 현재 참고할 수 있는 업로드된 문서가 없습니다.
- 오직 사용자가 업로드한 문서만을 참고하여 답변해야 합니다.
- 업로드된 문서 안에 관련 내용이 없을 경우, "해당 정보는 제공된 문서 내에 없습니다."라고 솔직하게 말해주세요.

사용자에게 "현재 참고할 수 있는 업로드된 문서가 없습니다. 관련 규정이나 문서를 업로드해 주시면 정확한 답변을 드릴 수 있습니다."라고 안내하고, 마지막에 "※ 본 답변은 사용자 제공 문서 부재로 인한 안내입니다."를 추가해주세요.

응답 스타일:
- 친근하고 전문적인 톤
- 한국어로 응답`;
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