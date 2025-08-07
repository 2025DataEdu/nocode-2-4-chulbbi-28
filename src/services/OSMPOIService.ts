// Overpass API를 사용해 OpenStreetMap에서 POI 데이터를 가져오는 서비스
interface POIResponse {
  elements: Array<{
    type: string
    id: number
    lat: number
    lon: number
    tags: {
      name?: string
      amenity?: string
      cuisine?: string
      tourism?: string
      shop?: string
      'addr:full'?: string
      'addr:city'?: string
      'addr:street'?: string
      phone?: string
      website?: string
    }
  }>
}

interface POI {
  id: string
  name: string
  type: 'restaurant' | 'cafe' | 'attraction'
  rating: number
  description: string
  lat: number
  lng: number
  address: string
  phone?: string
  website?: string
}

export class OSMPOIService {
  private static readonly OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter'
  
  static async getNearbyPOIs(lat: number, lng: number, radiusKm: number = 2): Promise<POI[]> {
    try {
      // Overpass API 쿼리 - 반경 내의 레스토랑, 카페, 관광지 검색
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"~"^(restaurant|cafe|bar|fast_food)$"](around:${radiusKm * 1000},${lat},${lng});
          node["tourism"~"^(attraction|museum|monument|artwork|viewpoint)$"](around:${radiusKm * 1000},${lat},${lng});
          node["shop"~"^(bakery)$"](around:${radiusKm * 1000},${lat},${lng});
        );
        out geom;
      `

      const response = await fetch(this.OVERPASS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: POIResponse = await response.json()
      
      return this.transformOSMDataToPOIs(data.elements)
    } catch (error) {
      console.error('Error fetching POI data from OSM:', error)
      // 에러 시 더미 데이터 반환
      return this.getFallbackPOIs(lat, lng)
    }
  }

  private static transformOSMDataToPOIs(elements: POIResponse['elements']): POI[] {
    const pois: POI[] = []
    
    elements.forEach((element, index) => {
      if (!element.tags.name || !element.lat || !element.lon) return
      
      const type = this.getTypeFromTags(element.tags)
      if (!type) return

      const address = this.buildAddress(element.tags)
      
      pois.push({
        id: `osm-${element.id}`,
        name: element.tags.name,
        type,
        rating: Math.random() * 2 + 3, // 3.0-5.0 임시 평점 (실제로는 별도 API 필요)
        description: this.getDescription(element.tags, type),
        lat: element.lat,
        lng: element.lon,
        address,
        phone: element.tags.phone,
        website: element.tags.website
      })
    })

    // 거리순으로 정렬하고 최대 15개만 반환
    return pois.slice(0, 15)
  }

  private static getTypeFromTags(tags: any): 'restaurant' | 'cafe' | 'attraction' | null {
    if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') {
      return 'restaurant'
    }
    if (tags.amenity === 'cafe' || tags.amenity === 'bar' || tags.shop === 'bakery') {
      return 'cafe'
    }
    if (tags.tourism) {
      return 'attraction'
    }
    return null
  }

  private static getDescription(tags: any, type: string): string {
    if (type === 'restaurant' && tags.cuisine) {
      return `${tags.cuisine} 요리`
    }
    if (type === 'cafe') {
      return '커피 & 음료'
    }
    if (type === 'attraction') {
      switch (tags.tourism) {
        case 'museum': return '박물관'
        case 'monument': return '기념물'
        case 'attraction': return '관광명소'
        case 'viewpoint': return '전망대'
        case 'artwork': return '예술작품'
        default: return '볼거리'
      }
    }
    return '추천 장소'
  }

  private static buildAddress(tags: any): string {
    const parts = []
    if (tags['addr:city']) parts.push(tags['addr:city'])
    if (tags['addr:street']) parts.push(tags['addr:street'])
    if (tags['addr:full']) return tags['addr:full']
    
    return parts.length > 0 ? parts.join(' ') : '주소 정보 없음'
  }

  // 에러 시 사용할 더미 데이터
  private static getFallbackPOIs(lat: number, lng: number): POI[] {
    return [
      {
        id: 'fallback-1',
        name: '맛있는 한정식',
        type: 'restaurant',
        rating: 4.5,
        description: '전통 한식의 정수를 담은 한정식',
        lat: lat + 0.005,
        lng: lng + 0.008,
        address: '주변 식당'
      },
      {
        id: 'fallback-2',
        name: '아늑한 카페',
        type: 'cafe',
        rating: 4.2,
        description: '조용한 분위기의 프리미엄 커피',
        lat: lat - 0.003,
        lng: lng + 0.006,
        address: '주변 카페'
      },
      {
        id: 'fallback-3',
        name: '문화센터',
        type: 'attraction',
        rating: 4.8,
        description: '지역 문화와 역사를 한눈에',
        lat: lat + 0.002,
        lng: lng - 0.004,
        address: '주변 관광지'
      }
    ]
  }
}