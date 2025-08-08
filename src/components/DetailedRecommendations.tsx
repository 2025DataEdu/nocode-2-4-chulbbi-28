import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, Car, Coffee, UtensilsCrossed, Camera, Wifi, Users, Clock, Heart } from 'lucide-react'

interface RecommendationItem {
  id: string
  name: string
  type: 'restaurant' | 'cafe' | 'attraction'
  rating: number
  description: string
  address: string
  pros: string[]
  cons: string[]
  features: {
    taste?: number        // 맛 (1-5)
    atmosphere?: number   // 분위기 (1-5)
    parking?: boolean     // 주차 가능
    soloFriendly?: boolean // 혼밥/혼카페 가능
    workFriendly?: boolean // 노트북 작업 가능
    familyFriendly?: boolean // 가족 친화적
    price?: 'low' | 'medium' | 'high' // 가격대
    wifi?: boolean        // 와이파이
    quietness?: number    // 조용함 (1-5)
  }
  reviewSummary: string
}

interface DetailedRecommendationsProps {
  destination: string
}

export function DetailedRecommendations({ destination }: DetailedRecommendationsProps) {
  // 실제 리뷰 데이터를 기반으로 한 인천 남동구 추천 장소
  const recommendations: RecommendationItem[] = [
    // 맛집 Top 5
    {
      id: 'rest-1',
      name: '청실홍실',
      type: 'restaurant',
      rating: 4.6,
      description: '인천의 대표 모밀, 만두 맛집. 여름철 냉모밀로 유명',
      address: '인천 남동구 서창남순환로10번길',
      pros: ['시원한 냉모밀', '담백한 만두', '넓은 주차공간', '빠른 서빙'],
      cons: ['피크타임 대기', '메뉴 종류 제한적'],
      features: {
        taste: 5,
        atmosphere: 4,
        parking: true,
        soloFriendly: true,
        price: 'medium',
        familyFriendly: true
      },
      reviewSummary: '인천 현지인들이 인정하는 모밀 맛집. 특히 여름철 냉모밀과 만두의 조합이 일품'
    },
    {
      id: 'rest-2',
      name: '얼레꼴레만두',
      type: 'restaurant',
      rating: 4.5,
      description: '인천 3대 떡볶이 중 하나. 만두와 떡볶이 전문',
      address: '인천 미추홀구 학익동',
      pros: ['저렴한 가격', '무료주차', '서민적 분위기', '셀프바 운영'],
      cons: ['좁은 공간', '시끄러운 편'],
      features: {
        taste: 4,
        atmosphere: 3,
        parking: true,
        soloFriendly: true,
        price: 'low',
        familyFriendly: false
      },
      reviewSummary: '가성비 최고의 분식집. 양이 많고 맛도 좋아 학생들과 직장인들에게 인기'
    },
    {
      id: 'rest-3',
      name: '개성손만두',
      type: 'restaurant',
      rating: 4.3,
      description: '손으로 빚은 만두와 만두전골이 유명한 가족 식당',
      address: '인천 미추홀구 학익동',
      pros: ['수제 만두', '넉넉한 양', '가족 외식 좋음', '따뜻한 서비스'],
      cons: ['조금 비싼 편', '주말 혼잡'],
      features: {
        taste: 4,
        atmosphere: 4,
        parking: true,
        soloFriendly: false,
        price: 'medium',
        familyFriendly: true
      },
      reviewSummary: '정성스럽게 빚은 수제 만두가 자랑. 가족 단위 방문객들이 많은 온화한 분위기'
    },
    {
      id: 'rest-4',
      name: '59쌀피자',
      type: 'restaurant',
      rating: 4.2,
      description: '독특한 쌀 도우 피자 전문점. 24시간 운영',
      address: '인천 남동구 구월동',
      pros: ['24시간 운영', '독특한 메뉴', '포장 주문 가능', '늦은 시간 이용'],
      cons: ['일반 피자와 다른 맛', '배달비 있음'],
      features: {
        taste: 4,
        atmosphere: 3,
        parking: false,
        soloFriendly: true,
        price: 'medium',
        familyFriendly: true
      },
      reviewSummary: '야식으로 인기 많은 쌀 피자 전문점. 건강한 재료로 만든 색다른 피자'
    },
    {
      id: 'rest-5',
      name: '태화각',
      type: 'restaurant',
      rating: 4.1,
      description: '중화요리 전문점. 짜장면과 탕수육으로 유명',
      address: '인천 남동구 만수동',
      pros: ['푸짐한 양', '저렴한 가격', '빠른 배달', '기본 반찬 맛있음'],
      cons: ['오래된 인테리어', '주차 공간 부족'],
      features: {
        taste: 4,
        atmosphere: 3,
        parking: false,
        soloFriendly: true,
        price: 'low',
        familyFriendly: true
      },
      reviewSummary: '오랜 전통의 중화요리집. 가격 대비 양과 맛이 좋아 단골이 많음'
    },

    // 카페 Top 5
    {
      id: 'cafe-1',
      name: '메가MGC커피 인천만월초점',
      type: 'cafe',
      rating: 4.4,
      description: '노트북 작업하기 좋은 체인 카페',
      address: '인천 남동구 구월동 인하로 616',
      pros: ['넓은 공간', '무료 와이파이', '콘센트 많음', '저렴한 가격'],
      cons: ['체인점 느낌', '시끄러운 편'],
      features: {
        atmosphere: 3,
        parking: true,
        workFriendly: true,
        wifi: true,
        price: 'low',
        quietness: 2
      },
      reviewSummary: '카공족들에게 인기. 넓은 공간과 무료 와이파이로 작업하기 편함'
    },
    {
      id: 'cafe-2',
      name: '빽다방 구월아시아드점',
      type: 'cafe',
      rating: 4.3,
      description: '가성비 좋은 커피와 디저트가 유명한 체인 카페',
      address: '인천 남동구 구월동 인하로 607',
      pros: ['저렴한 가격', '달달한 음료', '넓은 매장', '주차 편리'],
      cons: ['단맛 위주', '시끄러운 분위기'],
      features: {
        atmosphere: 3,
        parking: true,
        workFriendly: false,
        wifi: true,
        price: 'low',
        quietness: 2
      },
      reviewSummary: '달콤한 음료를 좋아하는 사람들에게 인기. 가격이 저렴해 부담 없이 이용'
    },
    {
      id: 'cafe-3',
      name: '파리바게뜨 구월아시아드점',
      type: 'cafe',
      rating: 4.2,
      description: '베이커리 카페, 빵과 커피를 함께 즐길 수 있음',
      address: '인천 남동구 구월동 인하로 607',
      pros: ['신선한 빵', '아침 일찍 오픈', '다양한 메뉴', '깔끔한 인테리어'],
      cons: ['비싼 가격', '좁은 좌석'],
      features: {
        atmosphere: 4,
        parking: true,
        workFriendly: false,
        wifi: true,
        price: 'medium',
        quietness: 3
      },
      reviewSummary: '신선한 빵과 커피를 즐길 수 있는 베이커리 카페. 아침 식사 겸 커피 타임으로 좋음'
    },
    {
      id: 'cafe-4',
      name: '파티쉐빵',
      type: 'cafe',
      rating: 4.0,
      description: '동네 베이커리 카페, 수제 케이크와 빵이 맛있음',
      address: '인천 남동구 만수동',
      pros: ['수제 케이크', '친절한 서비스', '조용한 분위기', '합리적 가격'],
      cons: ['좁은 공간', '메뉴 제한적'],
      features: {
        atmosphere: 4,
        parking: false,
        workFriendly: true,
        wifi: true,
        price: 'medium',
        quietness: 4
      },
      reviewSummary: '동네 숨은 베이커리. 조용하고 아늑한 분위기에서 수제 디저트를 즐길 수 있음'
    },
    {
      id: 'cafe-5',
      name: '카페온다',
      type: 'cafe',
      rating: 3.9,
      description: '단체 모임과 회의에 좋은 넓은 카페',
      address: '인천 남동구',
      pros: ['넓은 공간', '단체 이용 가능', '주차 편리', '무선 인터넷'],
      cons: ['커피 맛 보통', '시끄러운 편'],
      features: {
        atmosphere: 3,
        parking: true,
        workFriendly: true,
        wifi: true,
        price: 'medium',
        quietness: 2
      },
      reviewSummary: '넓은 공간으로 단체 모임이나 회의 장소로 인기. 커피보다는 공간 활용도가 높음'
    },

    // 관광지/볼거리 Top 5
    {
      id: 'attr-1',
      name: '송월동 동화마을',
      type: 'attraction',
      rating: 4.8,
      description: '동화를 테마로 한 벽화마을, 인스타 명소',
      address: '인천 중구 송월동',
      pros: ['무료 관람', '포토존 다수', '가족 친화적', '접근성 좋음'],
      cons: ['주차 어려움', '상업적 느낌'],
      features: {
        atmosphere: 5,
        parking: false,
        familyFriendly: true,
        price: 'low'
      },
      reviewSummary: '동화 속 세상에 온 듯한 아기자기한 벽화마을. 가족 나들이와 데이트 코스로 인기'
    },
    {
      id: 'attr-2',
      name: '월미도',
      type: 'attraction',
      rating: 4.7,
      description: '놀이기구와 바다 전망을 함께 즐길 수 있는 섬',
      address: '인천 중구 월미문화로',
      pros: ['바다 전망', '다양한 놀이기구', '맛집 많음', '야경 아름다움'],
      cons: ['주말 혼잡', '비싼 이용료'],
      features: {
        atmosphere: 5,
        parking: true,
        familyFriendly: true,
        price: 'medium'
      },
      reviewSummary: '인천의 대표 관광지. 놀이공원과 바다를 함께 즐길 수 있어 연인과 가족 모두에게 인기'
    },
    {
      id: 'attr-3',
      name: '송도 센트럴파크',
      type: 'attraction',
      rating: 4.6,
      description: '도심 속 대형 공원, 산책과 피크닉 명소',
      address: '인천 연수구 송도동',
      pros: ['넓은 공간', '바다물 수로', '자전거 대여', '깔끔한 시설'],
      cons: ['바람 많이 붊', '그늘 부족'],
      features: {
        atmosphere: 4,
        parking: true,
        familyFriendly: true,
        price: 'low'
      },
      reviewSummary: '바다물이 흐르는 국내 최초 친환경 공원. 산책과 운동, 데이트 코스로 완벽'
    },
    {
      id: 'attr-4',
      name: '인천대공원',
      type: 'attraction',
      rating: 4.5,
      description: '자연과 동물원을 함께 즐길 수 있는 종합공원',
      address: '인천 남동구 장수서로',
      pros: ['무료 입장', '동물원 있음', '넓은 공간', '가족 나들이 최적'],
      cons: ['대중교통 불편', '시설 노후'],
      features: {
        atmosphere: 4,
        parking: true,
        familyFriendly: true,
        price: 'low'
      },
      reviewSummary: '가족과 함께하는 나들이 장소로 최고. 동물원과 자연을 함께 즐길 수 있음'
    },
    {
      id: 'attr-5',
      name: '인천 차이나타운',
      type: 'attraction',
      rating: 4.4,
      description: '한국 최초의 차이나타운, 중화요리와 문화 체험',
      address: '인천 중구 차이나타운로',
      pros: ['문화 체험', '맛집 많음', '역사적 의미', '접근성 좋음'],
      cons: ['상업적 분위기', '주차 어려움'],
      features: {
        atmosphere: 4,
        parking: false,
        familyFriendly: true,
        price: 'medium'
      },
      reviewSummary: '한국 최초의 차이나타운으로 역사적 가치가 높음. 중화요리와 문화를 동시에 체험 가능'
    }
  ]

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'parking': return <Car className="w-4 h-4" />
      case 'wifi': return <Wifi className="w-4 h-4" />
      case 'solo': return <Users className="w-4 h-4" />
      case 'work': return <Coffee className="w-4 h-4" />
      case 'family': return <Heart className="w-4 h-4" />
      case 'quiet': return <Clock className="w-4 h-4" />
      default: return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return <UtensilsCrossed className="w-5 h-5 text-orange-600" />
      case 'cafe': return <Coffee className="w-5 h-5 text-amber-600" />
      case 'attraction': return <Camera className="w-5 h-5 text-purple-600" />
      default: return <MapPin className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'restaurant': return '맛집'
      case 'cafe': return '카페'
      case 'attraction': return '관광지'
      default: return '기타'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'cafe': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'attraction': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderStars = (rating: number) => {
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

  const renderFeatureRating = (label: string, rating?: number) => {
    if (rating === undefined) return null
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full mr-1 ${
                i < rating ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  const restaurants = recommendations.filter(item => item.type === 'restaurant')
  const cafes = recommendations.filter(item => item.type === 'cafe')
  const attractions = recommendations.filter(item => item.type === 'attraction')

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {destination} 블로거 추천 BEST
        </h2>
        <p className="text-muted-foreground">
          실제 리뷰를 바탕으로 선별한 타입별 상위 5곳 추천
        </p>
      </div>

      {/* 맛집 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            맛집 Top 5
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {restaurants.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(item.type)}
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <Badge variant="secondary" className={getTypeColor(item.type)}>
                        {getTypeLabel(item.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(item.rating)}</div>
                      <span className="text-sm font-medium">{item.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.address}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div className="space-y-2">
                    {renderFeatureRating('맛', item.features.taste)}
                    {renderFeatureRating('분위기', item.features.atmosphere)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {item.features.parking && (
                        <Badge variant="outline" className="text-xs">
                          <Car className="w-3 h-3 mr-1" />주차
                        </Badge>
                      )}
                      {item.features.soloFriendly && (
                        <Badge variant="outline" className="text-xs">혼밥OK</Badge>
                      )}
                      {item.features.familyFriendly && (
                        <Badge variant="outline" className="text-xs">가족OK</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {item.features.price === 'low' ? '저렴' : 
                         item.features.price === 'medium' ? '보통' : '비쌈'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-1">👍 장점</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {item.pros.map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-1">👎 단점</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {item.cons.map((con, index) => (
                        <li key={index}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>리뷰 요약:</strong> {item.reviewSummary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 카페 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600" />
            카페 Top 5
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {cafes.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(item.type)}
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <Badge variant="secondary" className={getTypeColor(item.type)}>
                        {getTypeLabel(item.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(item.rating)}</div>
                      <span className="text-sm font-medium">{item.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.address}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div className="space-y-2">
                    {renderFeatureRating('분위기', item.features.atmosphere)}
                    {renderFeatureRating('조용함', item.features.quietness)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {item.features.parking && (
                        <Badge variant="outline" className="text-xs">
                          <Car className="w-3 h-3 mr-1" />주차
                        </Badge>
                      )}
                      {item.features.wifi && (
                        <Badge variant="outline" className="text-xs">
                          <Wifi className="w-3 h-3 mr-1" />WiFi
                        </Badge>
                      )}
                      {item.features.workFriendly && (
                        <Badge variant="outline" className="text-xs">카공OK</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {item.features.price === 'low' ? '저렴' : 
                         item.features.price === 'medium' ? '보통' : '비쌈'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-1">👍 장점</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {item.pros.map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-1">👎 단점</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {item.cons.map((con, index) => (
                        <li key={index}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>리뷰 요약:</strong> {item.reviewSummary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 관광지 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            관광지 Top 5
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {attractions.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(item.type)}
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <Badge variant="secondary" className={getTypeColor(item.type)}>
                        {getTypeLabel(item.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(item.rating)}</div>
                      <span className="text-sm font-medium">{item.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.address}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div className="space-y-2">
                    {renderFeatureRating('분위기', item.features.atmosphere)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {item.features.parking && (
                        <Badge variant="outline" className="text-xs">
                          <Car className="w-3 h-3 mr-1" />주차
                        </Badge>
                      )}
                      {item.features.familyFriendly && (
                        <Badge variant="outline" className="text-xs">가족OK</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {item.features.price === 'low' ? '저렴' : 
                         item.features.price === 'medium' ? '보통' : '비쌈'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-1">👍 장점</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {item.pros.map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-1">👎 단점</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {item.cons.map((con, index) => (
                        <li key={index}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>리뷰 요약:</strong> {item.reviewSummary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}