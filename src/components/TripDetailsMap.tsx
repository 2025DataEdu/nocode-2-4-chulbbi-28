import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Star, Coffee, UtensilsCrossed, Camera } from 'lucide-react'
import { OSMPOIService } from '@/services/OSMPOIService'

// Leaflet 아이콘 URL 설정
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
  phone?: string
  website?: string
}

interface TripDetailsMapProps {
  destination: string
  latitude?: number
  longitude?: number
}

export function TripDetailsMap({ destination, latitude, longitude }: TripDetailsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(true)

  // 지도 마커 아이콘 생성
  const getMarkerIcon = (type: string) => {
    const iconSize: [number, number] = [25, 41]
    const iconAnchor: [number, number] = [12, 41]
    
    let iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'
    
    switch (type) {
      case 'restaurant':
        iconUrl = 'https://cdn.mapmarker.io/api/v1/pin?text=🍽️&size=50&hoffset=1'
        break
      case 'cafe':
        iconUrl = 'https://cdn.mapmarker.io/api/v1/pin?text=☕&size=50&hoffset=1'
        break
      case 'attraction':
        iconUrl = 'https://cdn.mapmarker.io/api/v1/pin?text=🎯&size=50&hoffset=1'
        break
    }

    return L.icon({
      iconUrl,
      iconSize,
      iconAnchor,
      popupAnchor: [1, -34],
    })
  }

  useEffect(() => {
    let mapInstance: L.Map | null = null
    let markers: L.Marker[] = []

    const initializeMap = async () => {
      if (!mapRef.current) return

      const lat = latitude || 37.5665
      const lng = longitude || 126.9780

      console.log('Initializing map for:', destination, 'at coordinates:', lat, lng)

      // 지도 초기화
      mapInstance = L.map(mapRef.current).setView([lat, lng], 14)

      // OpenStreetMap 타일 레이어 추가
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance)

      // 목적지 마커 추가
      const destinationMarker = L.marker([lat, lng])
        .addTo(mapInstance)
        .bindPopup(`<b>${destination}</b><br>출장 목적지`)
        .openPopup()
      
      markers.push(destinationMarker)

      // POI 데이터 가져오기
      try {
        if (destination && latitude && longitude) {
          setLoading(true)
          console.log('Fetching POIs for coordinates:', lat, lng)
          const poisData = await OSMPOIService.fetchNearbyPOIs(lat, lng)
          console.log('Fetched POIs:', poisData)
          setPois(Array.isArray(poisData) ? poisData : [])

          // POI 마커 추가
          if (Array.isArray(poisData)) {
            poisData.forEach((poi) => {
              const icon = getMarkerIcon(poi.type)
              const poiMarker = L.marker([poi.lat, poi.lng], { icon })
                .addTo(mapInstance!)
                .bindPopup(`<b>${poi.name}</b><br>${poi.type}<br>${poi.description || ''}`)
              
              markers.push(poiMarker)
            })
          }
        } else {
          console.log('Missing destination or coordinates, skipping POI fetch')
          setPois([])
        }
      } catch (error) {
        console.error('Error fetching POIs:', error)
        setPois([]);
        // 에러 시 fallback 데이터 표시
        const fallbackPois: POI[] = [
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
        ]
        setPois(fallbackPois)
        
        // Fallback POI 마커 추가
        fallbackPois.forEach((poi) => {
          const icon = getMarkerIcon(poi.type)
          const poiMarker = L.marker([poi.lat, poi.lng], { icon })
            .addTo(mapInstance!)
            .bindPopup(`<b>${poi.name}</b><br>${poi.type}<br>${poi.description || ''}`)
          
          markers.push(poiMarker)
        })
      } finally {
        setLoading(false)
      }
    }

    initializeMap()

    return () => {
      markers.forEach(marker => marker.remove())
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [destination, latitude, longitude])

  // 유형별 아이콘 가져오기
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return <UtensilsCrossed className="w-4 h-4" />
      case 'cafe':
        return <Coffee className="w-4 h-4" />
      case 'attraction':
        return <Camera className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  // 유형별 레이블 가져오기
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'restaurant':
        return '맛집'
      case 'cafe':
        return '카페'
      case 'attraction':
        return '관광지'
      default:
        return '기타'
    }
  }

  // 유형별 색상 가져오기
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'cafe':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'attraction':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* 지도 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            출장지 위치
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="w-full h-64 rounded-lg" />
        </CardContent>
      </Card>

      {/* 주변 추천 장소 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            주변 추천 장소
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">주변 정보를 찾고 있어요...</p>
            </div>
          ) : pois.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">주변 정보를 찾을 수 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pois.map((poi) => (
                <div key={poi.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(poi.type)}
                        <h3 className="font-semibold text-foreground">{poi.name}</h3>
                        <Badge variant="secondary" className={getTypeColor(poi.type)}>
                          {getTypeLabel(poi.type)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">
                          {poi.rating.toFixed(1)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">{poi.description}</p>
                      <p className="text-xs text-muted-foreground">{poi.address}</p>
                      
                      {poi.phone && (
                        <p className="text-xs text-muted-foreground mt-1">📞 {poi.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}