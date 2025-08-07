// 좌표 변환 서비스 - 주소나 지명을 위도/경도로 변환
interface GeocodingResult {
  lat: number
  lng: number
  address: string
}

export class GeocodingService {
  private static readonly NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org'
  
  /**
   * OpenStreetMap Nominatim API를 사용해 주소를 좌표로 변환
   */
  static async getCoordinates(address: string): Promise<GeocodingResult | null> {
    try {
      // 한국 내 검색을 위해 countrycodes 파라미터 추가
      const encodedAddress = encodeURIComponent(address)
      const url = `${this.NOMINATIM_API_URL}/search?format=json&q=${encodedAddress}&countrycodes=kr&limit=1&addressdetails=1`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TripManager/1.0' // Nominatim API 요구사항
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        }
      }

      return null
    } catch (error) {
      console.error('Error geocoding address:', error)
      return null
    }
  }

  /**
   * 여러 주요 도시의 기본 좌표 제공 (fallback)
   */
  static getKnownCityCoordinates(cityName: string): GeocodingResult | null {
    const cities: Record<string, { lat: number; lng: number; address: string }> = {
      '서울': { lat: 37.5665, lng: 126.9780, address: '서울특별시' },
      '부산': { lat: 35.1796, lng: 129.0756, address: '부산광역시' },
      '대구': { lat: 35.8714, lng: 128.6014, address: '대구광역시' },
      '인천': { lat: 37.4563, lng: 126.7052, address: '인천광역시' },
      '광주': { lat: 35.1595, lng: 126.8526, address: '광주광역시' },
      '대전': { lat: 36.3504, lng: 127.3845, address: '대전광역시' },
      '울산': { lat: 35.5384, lng: 129.3114, address: '울산광역시' },
      '세종': { lat: 36.4800, lng: 127.2890, address: '세종특별자치시' },
      '수원': { lat: 37.2636, lng: 127.0286, address: '경기도 수원시' },
      '고양': { lat: 37.6584, lng: 126.8320, address: '경기도 고양시' },
      '용인': { lat: 37.2411, lng: 127.1776, address: '경기도 용인시' },
      '창원': { lat: 35.2281, lng: 128.6811, address: '경상남도 창원시' },
      '천안': { lat: 36.8151, lng: 127.1139, address: '충청남도 천안시' },
      '전주': { lat: 35.8242, lng: 127.1480, address: '전라북도 전주시' },
      '안산': { lat: 37.3236, lng: 126.8219, address: '경기도 안산시' },
      '안양': { lat: 37.3943, lng: 126.9568, address: '경기도 안양시' },
      '포항': { lat: 36.0190, lng: 129.3435, address: '경상북도 포항시' },
      '의정부': { lat: 37.7380, lng: 127.0337, address: '경기도 의정부시' },
      '원주': { lat: 37.3422, lng: 127.9202, address: '강원도 원주시' },
      '춘천': { lat: 37.8813, lng: 127.7298, address: '강원도 춘천시' }
    }

    // 부분 매칭 지원
    for (const [city, coords] of Object.entries(cities)) {
      if (cityName.includes(city) || city.includes(cityName)) {
        return coords
      }
    }

    return null
  }

  /**
   * 주소를 좌표로 변환 (API 실패 시 알려진 도시 데이터 사용)
   */
  static async geocode(address: string): Promise<GeocodingResult | null> {
    // 먼저 API로 시도
    const apiResult = await this.getCoordinates(address)
    if (apiResult) {
      return apiResult
    }

    // API 실패 시 알려진 도시 데이터 사용
    return this.getKnownCityCoordinates(address)
  }
}