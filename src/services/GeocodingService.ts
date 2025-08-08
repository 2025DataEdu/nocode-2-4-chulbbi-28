// 좌표 변환 서비스 - 주소나 지명을 위도/경도로 변환
interface GeocodingResult {
  lat: number
  lng: number
  address: string
}

export class GeocodingService {
  private static readonly NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org'
  
  /**
   * 여러 주요 도시와 세부 지역의 기본 좌표 제공 (확장된 fallback)
   */
  static getKnownLocationCoordinates(locationName: string): GeocodingResult | null {
    const locations: Record<string, { lat: number; lng: number; address: string }> = {
      // 특별시/광역시
      '서울': { lat: 37.5665, lng: 126.9780, address: '서울특별시' },
      '서울특별시': { lat: 37.5665, lng: 126.9780, address: '서울특별시' },
      '부산': { lat: 35.1796, lng: 129.0756, address: '부산광역시' },
      '부산광역시': { lat: 35.1796, lng: 129.0756, address: '부산광역시' },
      '대구': { lat: 35.8714, lng: 128.6014, address: '대구광역시' },
      '대구광역시': { lat: 35.8714, lng: 128.6014, address: '대구광역시' },
      '인천': { lat: 37.4563, lng: 126.7052, address: '인천광역시' },
      '인천광역시': { lat: 37.4563, lng: 126.7052, address: '인천광역시' },
      '광주': { lat: 35.1595, lng: 126.8526, address: '광주광역시' },
      '광주광역시': { lat: 35.1595, lng: 126.8526, address: '광주광역시' },
      '대전': { lat: 36.3504, lng: 127.3845, address: '대전광역시' },
      '대전광역시': { lat: 36.3504, lng: 127.3845, address: '대전광역시' },
      '울산': { lat: 35.5384, lng: 129.3114, address: '울산광역시' },
      '울산광역시': { lat: 35.5384, lng: 129.3114, address: '울산광역시' },
      '세종': { lat: 36.4800, lng: 127.2890, address: '세종특별자치시' },
      '세종특별자치시': { lat: 36.4800, lng: 127.2890, address: '세종특별자치시' },
      
      // 제주도
      '제주': { lat: 33.4996, lng: 126.5312, address: '제주특별자치도 제주시' },
      '제주시': { lat: 33.4996, lng: 126.5312, address: '제주특별자치도 제주시' },
      '제주시청': { lat: 33.4996, lng: 126.5312, address: '제주특별자치도 제주시청' },
      '서귀포': { lat: 33.2541, lng: 126.5600, address: '제주특별자치도 서귀포시' },
      '서귀포시': { lat: 33.2541, lng: 126.5600, address: '제주특별자치도 서귀포시' },
      
      // 경기도 주요 도시
      '수원': { lat: 37.2636, lng: 127.0286, address: '경기도 수원시' },
      '고양': { lat: 37.6584, lng: 126.8320, address: '경기도 고양시' },
      '용인': { lat: 37.2411, lng: 127.1776, address: '경기도 용인시' },
      '성남': { lat: 37.4449, lng: 127.1388, address: '경기도 성남시' },
      '부천': { lat: 37.5034, lng: 126.7660, address: '경기도 부천시' },
      '안산': { lat: 37.3236, lng: 126.8219, address: '경기도 안산시' },
      '안양': { lat: 37.3943, lng: 126.9568, address: '경기도 안양시' },
      '의정부': { lat: 37.7380, lng: 127.0337, address: '경기도 의정부시' },
      '평택': { lat: 36.9921, lng: 127.1129, address: '경기도 평택시' },
      
      // 서울 구별 세부 위치
      '마포구': { lat: 37.5663, lng: 126.9019, address: '서울특별시 마포구' },
      '서울특별시 마포구': { lat: 37.5663, lng: 126.9019, address: '서울특별시 마포구' },
      '강남구': { lat: 37.5173, lng: 127.0473, address: '서울특별시 강남구' },
      '중구': { lat: 37.5641, lng: 126.9979, address: '서울특별시 중구' },
      '서울특별시 중구': { lat: 37.5641, lng: 126.9979, address: '서울특별시 중구' },
      '종로구': { lat: 37.5735, lng: 126.9788, address: '서울특별시 종로구' },
      '용산구': { lat: 37.5326, lng: 126.9905, address: '서울특별시 용산구' },
      '동작구': { lat: 37.5124, lng: 126.9393, address: '서울특별시 동작구' },
      '영등포구': { lat: 37.5264, lng: 126.8962, address: '서울특별시 영등포구' },
      '서초구': { lat: 37.4837, lng: 127.0324, address: '서울특별시 서초구' },
      '송파구': { lat: 37.5145, lng: 127.1059, address: '서울특별시 송파구' },
      '강동구': { lat: 37.5301, lng: 127.1238, address: '서울특별시 강동구' },
      
      // 기타 주요 도시
      '창원': { lat: 35.2281, lng: 128.6811, address: '경상남도 창원시' },
      '천안': { lat: 36.8151, lng: 127.1139, address: '충청남도 천안시' },
      '전주': { lat: 35.8242, lng: 127.1480, address: '전라북도 전주시' },
      '포항': { lat: 36.0190, lng: 129.3435, address: '경상북도 포항시' },
      '원주': { lat: 37.3422, lng: 127.9202, address: '강원도 원주시' },
      '춘천': { lat: 37.8813, lng: 127.7298, address: '강원도 춘천시' },
      '청주': { lat: 36.6424, lng: 127.4890, address: '충청북도 청주시' },
      '목포': { lat: 34.8118, lng: 126.3922, address: '전라남도 목포시' },
      '여수': { lat: 34.7604, lng: 127.6622, address: '전라남도 여수시' },
      '순천': { lat: 34.9507, lng: 127.4872, address: '전라남도 순천시' },
      '경주': { lat: 35.8562, lng: 129.2247, address: '경상북도 경주시' },
      '진주': { lat: 35.1800, lng: 128.1076, address: '경상남도 진주시' },
      
      // 정부기관 및 주요 시설
      '동작구청': { lat: 37.5124, lng: 126.9393, address: '서울특별시 동작구청' },
      '서울특별시 동작구청': { lat: 37.5124, lng: 126.9393, address: '서울특별시 동작구청' }
    }

    // 정확한 매칭 우선
    const exactMatch = locations[locationName];
    if (exactMatch) {
      return exactMatch;
    }

    // 부분 매칭 - 더 정교한 매칭 로직
    const normalizedLocation = locationName.toLowerCase().trim();
    
    for (const [key, coords] of Object.entries(locations)) {
      const normalizedKey = key.toLowerCase();
      
      // 포함 관계 체크 (양방향)
      if (normalizedLocation.includes(normalizedKey) || normalizedKey.includes(normalizedLocation)) {
        return coords;
      }
      
      // 공백 제거 후 체크
      const locationNoSpaces = normalizedLocation.replace(/\s+/g, '');
      const keyNoSpaces = normalizedKey.replace(/\s+/g, '');
      
      if (locationNoSpaces.includes(keyNoSpaces) || keyNoSpaces.includes(locationNoSpaces)) {
        return coords;
      }
    }

    return null;
  }

  /**
   * OpenStreetMap Nominatim API를 사용해 주소를 좌표로 변환 (재시도 로직 포함)
   */
  static async getCoordinates(address: string): Promise<GeocodingResult | null> {
    const maxRetries = 2;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // 한국 내 검색을 위해 countrycodes 파라미터 추가
        const encodedAddress = encodeURIComponent(address);
        const url = `${this.NOMINATIM_API_URL}/search?format=json&q=${encodedAddress}&countrycodes=kr&limit=1&addressdetails=1`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'TripManager/1.0'
          },
          signal: AbortSignal.timeout(5000) // 5초 타임아웃
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name
          };
        }

        return null;
      } catch (error) {
        console.warn(`Geocoding attempt ${attempt + 1} failed:`, error);
        
        // 마지막 시도가 아니면 잠시 대기 후 재시도
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    return null;
  }

  /**
   * 주소를 좌표로 변환 (API 우선, 실패 시 알려진 데이터 사용)
   */
  static async geocode(address: string): Promise<GeocodingResult | null> {
    console.log('Geocoding request for:', address);
    
    // 먼저 알려진 위치 데이터에서 확인 (빠른 응답)
    const knownLocation = this.getKnownLocationCoordinates(address);
    
    // API 시도 (백그라운드)
    try {
      const apiResult = await this.getCoordinates(address);
      if (apiResult) {
        console.log('Geocoding success via API:', apiResult);
        return apiResult;
      }
    } catch (error) {
      console.warn('API geocoding failed, using fallback:', error);
    }

    // API 실패 시 알려진 데이터 사용
    if (knownLocation) {
      console.log('Geocoding success via fallback data:', knownLocation);
      return knownLocation;
    }

    console.warn('Geocoding failed for:', address);
    return null;
  }
}