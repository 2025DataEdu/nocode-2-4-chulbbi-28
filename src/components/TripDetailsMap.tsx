import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import { DetailedRecommendations } from './DetailedRecommendations'

// Leaflet 아이콘 URL 설정
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})


interface TripDetailsMapProps {
  destination: string
  latitude?: number
  longitude?: number
}

export function TripDetailsMap({ destination, latitude, longitude }: TripDetailsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationInfo, setLocationInfo] = useState<string>('')

  useEffect(() => {
    let mapInstance: L.Map | null = null

    const initializeMap = async () => {
      if (!mapRef.current) return

      // 좌표 결정 - 제공된 좌표 우선, 없으면 기본값
      let lat = latitude || 37.5665
      let lng = longitude || 126.9780
      let displayName = destination

      // 좌표가 제공되지 않았다면 지오코딩 시도
      if (!latitude || !longitude) {
        console.log('Attempting to geocode destination:', destination)
        try {
          // GeocodingService 사용하여 좌표 찾기
          const { GeocodingService } = await import('@/services/GeocodingService')
          const result = await GeocodingService.geocode(destination)
          
          if (result) {
            lat = result.lat
            lng = result.lng
            displayName = result.address
            console.log('Geocoding successful:', result)
          } else {
            console.warn('Geocoding failed, using default coordinates')
          }
        } catch (error) {
          console.error('Geocoding error:', error)
        }
      }

      setCurrentCoords({ lat, lng })
      setLocationInfo(displayName)

      // DOM이 완전히 준비될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 지도 초기화 (DOM 요소 재확인)
      if (!mapRef.current) return
      
      try {
        mapInstance = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: true,
          boxZoom: true,
          keyboard: true
        })

        // OpenStreetMap 타일 레이어 추가
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 5
        }).addTo(mapInstance)

        // 목적지 마커 추가 (커스텀 아이콘 사용)
        const marker = L.marker([lat, lng], {
          title: destination
        }).addTo(mapInstance)

        // 팝업 설정
        const popupContent = `
          <div style="text-align: center; min-width: 150px;">
            <b style="font-size: 14px; color: #1f2937;">${destination}</b><br>
            <span style="font-size: 12px; color: #6b7280;">출장 목적지</span><br>
            <span style="font-size: 11px; color: #9ca3af;">위도: ${lat.toFixed(4)}, 경도: ${lng.toFixed(4)}</span>
          </div>
        `
        
        marker.bindPopup(popupContent, {
          closeButton: false,
          autoClose: false,
          className: 'custom-popup'
        }).openPopup()

        // 마커 주변 원형 표시 (반경 1km)
        L.circle([lat, lng], {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          radius: 1000,
          weight: 2
        }).addTo(mapInstance)

        console.log('Map initialized successfully at:', lat, lng)
      } catch (mapError) {
        console.error('Error initializing map:', mapError)
      }
    }

    initializeMap()

    return () => {
      if (mapInstance) {
        try {
          mapInstance.remove()
        } catch (error) {
          console.warn('Error removing map:', error)
        }
      }
    }
  }, [destination, latitude, longitude])

  return (
    <div className="space-y-6">
      {/* 지도 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            출장지 위치
          </CardTitle>
          {currentCoords && (
            <p className="text-sm text-muted-foreground">
              {locationInfo || destination} 
              <span className="ml-2 text-xs">
                ({currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)})
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div 
            ref={mapRef} 
            className="w-full h-72 rounded-lg border border-border bg-muted/30" 
            style={{ minHeight: '300px' }}
          />
          <div className="mt-3 text-xs text-muted-foreground text-center">
            지도를 드래그하여 이동하거나 마우스 휠로 확대/축소할 수 있습니다.
          </div>
        </CardContent>
      </Card>

      {/* 상세 추천 정보 */}
      <DetailedRecommendations destination={destination} />
    </div>
  )
}