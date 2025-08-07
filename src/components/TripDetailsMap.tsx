import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Coffee, Utensils, Camera, Star, Loader2 } from 'lucide-react'
import { OSMPOIService } from '@/services/OSMPOIService'

// Leaflet 기본 아이콘 설정 수정
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface POI {
  id: string
  name: string
  type: 'restaurant' | 'cafe' | 'attraction'
  rating: number
  description: string
  lat: number
  lng: number
  address: string
}

interface TripDetailsMapProps {
  destination: string
  lat?: number
  lng?: number
}

export function TripDetailsMap({ destination, lat = 37.5665, lng = 126.9780 }: TripDetailsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(true)

  // 실제 POI 데이터 가져오기
  useEffect(() => {
    const fetchPOIs = async () => {
      setLoading(true)
      try {
        console.log(`Fetching POIs for coordinates: ${lat}, ${lng}`)
        const nearbyPOIs = await OSMPOIService.getNearbyPOIs(lat, lng)
        console.log('Fetched POIs:', nearbyPOIs)
        setPois(nearbyPOIs)
      } catch (error) {
        console.error('Failed to fetch POIs:', error)
        // 에러 시 fallback 데이터 표시
        setPois([
          {
            id: 'fallback-1',
            name: '주변 식당',
            type: 'restaurant',
            rating: 4.2,
            description: '현지 맛집 추천',
            lat: lat + 0.002,
            lng: lng + 0.003,
            address: '주변 지역'
          },
          {
            id: 'fallback-2',
            name: '주변 카페',
            type: 'cafe',
            rating: 4.0,
            description: '커피와 디저트',
            lat: lat - 0.001,
            lng: lng + 0.002,
            address: '주변 지역'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchPOIs()
  }, [lat, lng])

  useEffect(() => {
    if (!mapRef.current) return

    // 지도 초기화
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
    }

    const map = L.map(mapRef.current).setView([lat, lng], 14)

    // OpenStreetMap 타일 레이어 추가 (무료 사용)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      tileSize: 256,
      zoomOffset: 0
    }).addTo(map)

    // 출장지 마커 (메인)
    const mainMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `
          <div class="relative">
            <div class="w-8 h-8 bg-gradient-primary rounded-full shadow-lg flex items-center justify-center border-2 border-white">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        `,
        className: 'main-marker',
        iconSize: [32, 40],
        iconAnchor: [16, 40]
      })
    }).addTo(map)

    mainMarker.bindPopup(`
      <div class="p-2 text-sm">
        <h3 class="font-semibold text-foreground">${destination}</h3>
        <p class="text-muted-foreground text-xs mt-1">출장지</p>
      </div>
    `)

    // POI 마커들 추가
    pois.forEach(poi => {
      const getIcon = (type: string) => {
        const iconClasses = {
          restaurant: 'text-red-500',
          cafe: 'text-amber-500',
          attraction: 'text-blue-500'
        }
        
        const icons = {
          restaurant: 'utensils',
          cafe: 'coffee',
          attraction: 'camera'
        }

        return L.divIcon({
          html: `
            <div class="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200">
              <svg class="w-3 h-3 ${iconClasses[type as keyof typeof iconClasses]}" fill="currentColor" viewBox="0 0 20 20">
                ${type === 'restaurant' ? 
                  '<path d="M8 5v5.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V5h1v5.5c0 1.38-1.12 2.5-2.5 2.5S6 11.88 6 10.5V5h2zm4-2v12h2V3h-2z"/>' :
                  type === 'cafe' ?
                  '<path d="M4 3h12c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1h-1v5c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V7H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1zm13 3V4h-1v2h1z"/>' :
                  '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'
                }
              </svg>
            </div>
          `,
          className: 'poi-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }

      const marker = L.marker([poi.lat, poi.lng], {
        icon: getIcon(poi.type)
      }).addTo(map)

      marker.bindPopup(`
        <div class="p-3 text-sm min-w-48">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-semibold text-foreground">${poi.name}</h3>
            <div class="flex items-center gap-1">
              <svg class="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span class="text-xs text-muted-foreground">${poi.rating}</span>
            </div>
          </div>
          <p class="text-muted-foreground text-xs mb-2">${poi.description}</p>
          <p class="text-xs text-muted-foreground">${poi.address}</p>
        </div>
      `)
    })

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng, pois])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return <Utensils className="h-4 w-4" />
      case 'cafe': return <Coffee className="h-4 w-4" />
      case 'attraction': return <Camera className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'restaurant': return '식당'
      case 'cafe': return '카페'
      case 'attraction': return '관광지'
      default: return '기타'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant': return 'bg-red-50 text-red-600 border-red-200'
      case 'cafe': return 'bg-amber-50 text-amber-600 border-amber-200'
      case 'attraction': return 'bg-blue-50 text-blue-600 border-blue-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* 지도 */}
      <Card className="overflow-hidden border-0 shadow-elegant">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-title">
            <MapPin className="h-5 w-5 text-accent" />
            {destination} 주변 추천 장소
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={mapRef} 
            className="w-full h-80 sm:h-96 bg-muted/20"
            style={{ minHeight: '320px' }}
          />
        </CardContent>
      </Card>

      {/* POI 목록 */}
      <Card className="border-0 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-title flex items-center gap-2">
            추천 장소 목록
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">주변 장소를 찾는 중...</span>
            </div>
          ) : pois.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">주변에 추천할 장소가 없습니다</p>
            </div>
          ) : (
            pois.map((poi) => (
            <div 
              key={poi.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth border border-border/50"
            >
              <div className={`p-2 rounded-lg ${getTypeColor(poi.type)}`}>
                {getTypeIcon(poi.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground text-sm">{poi.name}</h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {getTypeLabel(poi.type)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400 fill-current" />
                    <span className="text-xs text-muted-foreground">{poi.rating}</span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-1">{poi.description}</p>
                <p className="text-xs text-muted-foreground opacity-75">{poi.address}</p>
              </div>
            </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}