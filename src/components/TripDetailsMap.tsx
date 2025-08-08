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

  useEffect(() => {
    let mapInstance: L.Map | null = null

    const initializeMap = async () => {
      if (!mapRef.current) return

      const lat = latitude || 37.5665
      const lng = longitude || 126.9780

      // DOM이 완전히 준비될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 지도 초기화 (DOM 요소 재확인)
      if (!mapRef.current) return
      mapInstance = L.map(mapRef.current).setView([lat, lng], 14)

      // OpenStreetMap 타일 레이어 추가
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance)

      // 목적지 마커 추가
      L.marker([lat, lng])
        .addTo(mapInstance)
        .bindPopup(`<b>${destination}</b><br>출장 목적지`)
        .openPopup()
    }

    initializeMap()

    return () => {
      if (mapInstance) {
        mapInstance.remove()
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
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="w-full h-64 rounded-lg" />
        </CardContent>
      </Card>

      {/* 상세 추천 정보 */}
      <DetailedRecommendations destination={destination} />
    </div>
  )
}