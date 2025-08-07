/**
 * 거리 계산 유틸리티
 */

export interface LocationInfo {
  value: string;
  label: string;
  region: string;
}

export interface DistanceResult {
  distance: string;
  duration: string;
  type: 'internal' | 'external';
}

/**
 * 지역 간 실제 거리 데이터 (km)
 */
const REGION_DISTANCES: Record<string, Record<string, number>> = {
  '서울': {
    '서울': 25, '인천': 40, '경기': 50, '대전': 150, '대구': 300, 
    '부산': 400, '광주': 300, '울산': 350, '세종': 120, '강원': 200,
    '충북': 130, '충남': 140, '전북': 250, '전남': 320, '경북': 280, '경남': 380, '제주': 450
  },
  '부산': {
    '서울': 400, '인천': 420, '경기': 430, '대전': 280, '대구': 100,
    '부산': 30, '광주': 180, '울산': 60, '세종': 300, '강원': 450,
    '충북': 250, '충남': 320, '전북': 200, '전남': 150, '경북': 80, '경남': 40, '제주': 280
  },
  '대구': {
    '서울': 300, '인천': 320, '경기': 330, '대전': 180, '대구': 25,
    '부산': 100, '광주': 200, '울산': 80, '세종': 200, '강원': 350,
    '충북': 150, '충남': 220, '전북': 160, '전남': 180, '경북': 50, '경남': 80, '제주': 250
  },
  '인천': {
    '서울': 40, '인천': 20, '경기': 30, '대전': 170, '대구': 320,
    '부산': 420, '광주': 320, '울산': 370, '세종': 140, '강원': 220,
    '충북': 150, '충남': 120, '전북': 270, '전남': 340, '경북': 300, '경남': 400, '제주': 470
  },
  '광주': {
    '서울': 300, '인천': 320, '경기': 330, '대전': 150, '대구': 200,
    '부산': 180, '광주': 25, '울산': 220, '세종': 170, '강원': 400,
    '충북': 200, '충남': 180, '전북': 80, '전남': 50, '경북': 180, '경남': 160, '제주': 200
  },
  '대전': {
    '서울': 150, '인천': 170, '경기': 180, '대전': 25, '대구': 180,
    '부산': 280, '광주': 150, '울산': 250, '세종': 30, '강원': 250,
    '충북': 80, '충남': 70, '전북': 120, '전남': 180, '경북': 150, '경남': 250, '제주': 320
  },
  '울산': {
    '서울': 350, '인천': 370, '경기': 380, '대전': 250, '대구': 80,
    '부산': 60, '광주': 220, '울산': 20, '세종': 270, '강원': 400,
    '충북': 220, '충남': 290, '전북': 220, '전남': 200, '경북': 60, '경남': 40, '제주': 250
  }
};

/**
 * 도시 목록
 */
export const cities: LocationInfo[] = [
  // 서울
  { value: 'seoul-jung', label: '서울 중구', region: '서울' },
  { value: 'seoul-gangnam', label: '서울 강남구', region: '서울' },
  { value: 'seoul-gangdong', label: '서울 강동구', region: '서울' },
  { value: 'seoul-gangbuk', label: '서울 강북구', region: '서울' },
  { value: 'seoul-gangseo', label: '서울 강서구', region: '서울' },
  
  // 부산
  { value: 'busan-haeundae', label: '부산 해운대구', region: '부산' },
  { value: 'busan-busanjin', label: '부산 부산진구', region: '부산' },
  { value: 'busan-dong', label: '부산 동구', region: '부산' },
  { value: 'busan-nam', label: '부산 남구', region: '부산' },
  
  // 대구
  { value: 'daegu-jung', label: '대구 중구', region: '대구' },
  { value: 'daegu-dong', label: '대구 동구', region: '대구' },
  { value: 'daegu-seo', label: '대구 서구', region: '대구' },
  { value: 'daegu-nam', label: '대구 남구', region: '대구' },
  
  // 인천
  { value: 'incheon-jung', label: '인천 중구', region: '인천' },
  { value: 'incheon-dong', label: '인천 동구', region: '인천' },
  { value: 'incheon-michuhol', label: '인천 미추홀구', region: '인천' },
  { value: 'incheon-yeonsu', label: '인천 연수구', region: '인천' },
  
  // 광주
  { value: 'gwangju-dong', label: '광주 동구', region: '광주' },
  { value: 'gwangju-seo', label: '광주 서구', region: '광주' },
  { value: 'gwangju-nam', label: '광주 남구', region: '광주' },
  { value: 'gwangju-buk', label: '광주 북구', region: '광주' },
  
  // 대전
  { value: 'daejeon-jung', label: '대전 중구', region: '대전' },
  { value: 'daejeon-dong', label: '대전 동구', region: '대전' },
  { value: 'daejeon-seo', label: '대전 서구', region: '대전' },
  { value: 'daejeon-yuseong', label: '대전 유성구', region: '대전' },
  
  // 울산
  { value: 'ulsan-jung', label: '울산 중구', region: '울산' },
  { value: 'ulsan-nam', label: '울산 남구', region: '울산' },
  { value: 'ulsan-dong', label: '울산 동구', region: '울산' },
  { value: 'ulsan-buk', label: '울산 북구', region: '울산' },
  
  // 세종
  { value: 'sejong-city', label: '세종특별자치시', region: '세종' },
  
  // 경기도
  { value: 'gyeonggi-suwon', label: '경기 수원시', region: '경기' },
  { value: 'gyeonggi-seongnam', label: '경기 성남시', region: '경기' },
  { value: 'gyeonggi-goyang', label: '경기 고양시', region: '경기' },
  { value: 'gyeonggi-yongin', label: '경기 용인시', region: '경기' },
  
  // 강원도
  { value: 'gangwon-chuncheon', label: '강원 춘천시', region: '강원' },
  { value: 'gangwon-wonju', label: '강원 원주시', region: '강원' },
  { value: 'gangwon-gangneung', label: '강원 강릉시', region: '강원' },
  
  // 충청북도
  { value: 'chungbuk-cheongju', label: '충북 청주시', region: '충북' },
  { value: 'chungbuk-chungju', label: '충북 충주시', region: '충북' },
  
  // 충청남도
  { value: 'chungnam-cheonan', label: '충남 천안시', region: '충남' },
  { value: 'chungnam-asan', label: '충남 아산시', region: '충남' },
  
  // 전라북도
  { value: 'jeonbuk-jeonju', label: '전북 전주시', region: '전북' },
  { value: 'jeonbuk-iksan', label: '전북 익산시', region: '전북' },
  
  // 전라남도
  { value: 'jeonnam-mokpo', label: '전남 목포시', region: '전남' },
  { value: 'jeonnam-yeosu', label: '전남 여수시', region: '전남' },
  
  // 경상북도
  { value: 'gyeongbuk-pohang', label: '경북 포항시', region: '경북' },
  { value: 'gyeongbuk-gyeongju', label: '경북 경주시', region: '경북' },
  
  // 경상남도
  { value: 'gyeongnam-changwon', label: '경남 창원시', region: '경남' },
  { value: 'gyeongnam-jinju', label: '경남 진주시', region: '경남' },
  
  // 제주도
  { value: 'jeju-city', label: '제주시', region: '제주' },
  { value: 'jeju-seogwipo', label: '서귀포시', region: '제주' }
];

/**
 * 두 지점 간의 거리 계산
 */
export function calculateDistance(departure: string, destination: string): DistanceResult | null {
  const depLocation = cities.find(loc => loc.value === departure);
  const destLocation = cities.find(loc => loc.value === destination);
  
  if (!depLocation || !destLocation) {
    return null;
  }
  
  const depRegion = depLocation.region;
  const destRegion = destLocation.region;
  
  // 같은 지역 내 이동
  if (depRegion === destRegion) {
    const baseDistance = 15 + Math.random() * 15; // 15-30km
    const duration = Math.round(baseDistance * 2); // 약 2분/km
    
    return {
      distance: `${Math.round(baseDistance)}km`,
      duration: `${duration}분`,
      type: 'internal'
    };
  }
  
  // 지역 간 이동
  const distanceKm = REGION_DISTANCES[depRegion]?.[destRegion] || 
                    REGION_DISTANCES[destRegion]?.[depRegion] || 
                    300; // 기본값
  
  const hours = Math.round(distanceKm / 80); // 평균 속도 80km/h
  const minutes = Math.round((distanceKm / 80 - hours) * 60);
  
  const durationText = hours > 0 
    ? `${hours}시간${minutes > 0 ? ` ${minutes}분` : ''}`
    : `${Math.round(distanceKm / 80 * 60)}분`;
  
  return {
    distance: `${distanceKm}km`,
    duration: durationText,
    type: 'external'
  };
}

/**
 * 거리 문자열에서 숫자 추출 (km)
 */
export function extractDistanceKm(distanceStr: string): number {
  const match = distanceStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * 지역명 정규화
 */
export function normalizeRegion(destination: string): string {
  if (destination.includes('서울')) return '서울';
  if (destination.includes('부산')) return '부산';
  if (destination.includes('대구')) return '대구';
  if (destination.includes('인천')) return '인천';
  if (destination.includes('광주')) return '광주';
  if (destination.includes('대전')) return '대전';
  if (destination.includes('울산')) return '울산';
  if (destination.includes('세종')) return '세종';
  if (destination.includes('경기')) return '경기';
  if (destination.includes('강원')) return '강원';
  if (destination.includes('충북') || destination.includes('충청북도')) return '충북';
  if (destination.includes('충남') || destination.includes('충청남도')) return '충남';
  if (destination.includes('전북') || destination.includes('전라북도')) return '전북';
  if (destination.includes('전남') || destination.includes('전라남도')) return '전남';
  if (destination.includes('경북') || destination.includes('경상북도')) return '경북';
  if (destination.includes('경남') || destination.includes('경상남도')) return '경남';
  if (destination.includes('제주')) return '제주';
  return '서울'; // 기본값
}