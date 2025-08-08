import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, MapPin, UtensilsCrossed, Building2, Clock } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { GeocodingService } from '@/services/GeocodingService'

interface AccommodationData {
  id: string
  name: string
  address: string
  phone?: string
  status: string
  type: string
  distance?: number
}

interface RestaurantData {
  id: string
  name: string
  address: string
  phone?: string
  food_type?: string
  status: string
  distance?: number
}

interface NearbyRecommendationsProps {
  destination: string
  latitude?: number
  longitude?: number
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Convert Korean coordinates (EPSG:5174) to WGS84 (approximate conversion)
function convertKoreanCoords(x: string, y: string): { lat: number, lng: number } | null {
  try {
    const numX = parseFloat(x)
    const numY = parseFloat(y)
    
    if (isNaN(numX) || isNaN(numY)) return null
    
    // Approximate conversion from Korean coordinate system to lat/lng
    // This is a simplified conversion - for production use proper coordinate transformation
    const lat = (numY - 1000000) / 111000 + 37.5
    const lng = (numX - 200000) / 88000 + 127.0
    
    // Basic validation for Korean peninsula coordinates
    if (lat < 33 || lat > 43 || lng < 124 || lng > 132) return null
    
    return { lat, lng }
  } catch {
    return null
  }
}

export function NearbyRecommendations({ destination, latitude, longitude }: NearbyRecommendationsProps) {
  const [accommodations, setAccommodations] = useState<AccommodationData[]>([])
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([])
  const [loading, setLoading] = useState(true)
  const [destCoords, setDestCoords] = useState<{ lat: number, lng: number } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      try {
        // Get destination coordinates
        let coords = null
        if (latitude && longitude) {
          coords = { lat: latitude, lng: longitude }
        } else {
          coords = await GeocodingService.geocode(destination)
        }
        
        if (!coords) {
          console.warn('Could not get coordinates for destination:', destination)
          setLoading(false)
          return
        }
        
        setDestCoords(coords)

        // Fetch accommodations
        const { data: accommodationData, error: accomError } = await supabase
          .from('accommodations')
          .select('*')
          .eq('영업상태명', '영업')
          .limit(200)

        if (accomError) {
          console.error('Error fetching accommodations:', accomError)
        }

        // Fetch restaurants
        const { data: restaurantData, error: restError } = await supabase
          .from('certified_restaurant')
          .select('*')
          .eq('영업상태명', '영업')
          .limit(200)

        if (restError) {
          console.error('Error fetching restaurants:', restError)
        }

        // Process accommodations with distance calculation
        const processedAccommodations: AccommodationData[] = []
        if (accommodationData) {
          for (const item of accommodationData) {
            if (!item['좌표정보x(epsg5174)'] || !item['좌표정보y(epsg5174)']) continue
            
            const itemCoords = convertKoreanCoords(
              item['좌표정보x(epsg5174)'], 
              item['좌표정보y(epsg5174)']
            )
            
            if (!itemCoords) continue
            
            const distance = calculateDistance(
              coords.lat, coords.lng,
              itemCoords.lat, itemCoords.lng
            )
            
            if (distance <= 10) { // Within 10km
              processedAccommodations.push({
                id: item.관리번호 || `accom-${processedAccommodations.length}`,
                name: item.사업장명 || '숙소명 없음',
                address: item.도로명전체주소 || item.소재지전체주소 || '주소 정보 없음',
                phone: item.소재지전화,
                status: item.영업상태명,
                type: item.위생업태명 || '숙박업',
                distance: Math.round(distance * 10) / 10
              })
            }
          }
        }

        // Process restaurants with distance calculation
        const processedRestaurants: RestaurantData[] = []
        if (restaurantData) {
          for (const item of restaurantData) {
            // For restaurants, we don't have coordinates, so use address-based filtering
            const address = item.도로명주소 || item.소재지주소 || ''
            
            // Simple region-based filtering for now
            if (address.includes(destination) || 
                (destination.includes('서울') && address.includes('서울')) ||
                (destination.includes('인천') && address.includes('인천')) ||
                (destination.includes('부산') && address.includes('부산'))) {
              
              processedRestaurants.push({
                id: item.관리번호 || `rest-${processedRestaurants.length}`,
                name: item.업소명 || '음식점명 없음',
                address: address,
                phone: item.전화번호,
                food_type: item.주된음식종류,
                status: item.영업상태명,
                distance: 0 // Will show as "지역 내" since we can't calculate exact distance
              })
            }
          }
        }

        // Sort by distance (for accommodations) and limit results
        processedAccommodations.sort((a, b) => (a.distance || 0) - (b.distance || 0))
        
        setAccommodations(processedAccommodations.slice(0, 10))
        setRestaurants(processedRestaurants.slice(0, 10))
        
      } catch (error) {
        console.error('Error fetching nearby recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [destination, latitude, longitude])

  const renderStars = (rating: number = 4) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const renderAccommodationCard = (item: AccommodationData) => (
    <div key={item.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-foreground">{item.name}</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              {item.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">{renderStars()}</div>
            <span className="text-sm font-medium">4.0</span>
            {item.distance && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {item.distance}km
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3" />
            {item.address}
          </p>
          {item.phone && (
            <p className="text-xs text-muted-foreground">
              📞 {item.phone}
            </p>
          )}
        </div>
      </div>
      
      <div className="bg-accent/10 border border-accent/20 rounded-md p-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">영업중</span>
        </div>
      </div>
    </div>
  )

  const renderRestaurantCard = (item: RestaurantData) => (
    <div key={item.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-foreground">{item.name}</h3>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              맛집
            </Badge>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">{renderStars()}</div>
            <span className="text-sm font-medium">4.0</span>
            <Badge variant="outline" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              지역 내
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3" />
            {item.address}
          </p>
          {item.phone && (
            <p className="text-xs text-muted-foreground mb-1">
              📞 {item.phone}
            </p>
          )}
          {item.food_type && (
            <p className="text-xs text-muted-foreground">
              🍽️ {item.food_type}
            </p>
          )}
        </div>
      </div>
      
      <div className="bg-accent/10 border border-accent/20 rounded-md p-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">영업중</span>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {destination} 근처 추천 장소
        </h2>
        <p className="text-muted-foreground">
          출장지 반경 10km 내 숙소 및 인증 맛집 정보
        </p>
        {destCoords && (
          <p className="text-xs text-muted-foreground mt-1">
            기준 좌표: {destCoords.lat.toFixed(4)}, {destCoords.lng.toFixed(4)}
          </p>
        )}
      </div>

      <Tabs defaultValue="restaurants" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="restaurants" className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            인증 맛집 ({restaurants.length})
          </TabsTrigger>
          <TabsTrigger value="accommodations" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            숙소 ({accommodations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                인증 음식점
              </CardTitle>
            </CardHeader>
            <CardContent>
              {restaurants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>해당 지역의 인증 음식점 정보가 없습니다.</p>
                  <p className="text-sm">다른 지역을 검색해보시거나 일반 맛집 정보를 참고해주세요.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {restaurants.map(renderRestaurantCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accommodations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                숙박시설
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accommodations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>반경 10km 내 숙박시설 정보가 없습니다.</p>
                  <p className="text-sm">검색 반경을 늘리거나 다른 지역을 검색해보세요.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {accommodations.map(renderAccommodationCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}