/**
 * 출장 관련 검증 유틸리티 함수들
 */

export interface TripValidationError {
  field: string;
  message: string;
}

export interface TripFormData {
  destination: string;
  departure: string;
  purpose: string;
  startDate: string;
  endDate?: string;
  isDayTrip: boolean;
}

/**
 * 출장 등록 폼 데이터 검증
 */
export function validateTripForm(data: TripFormData): TripValidationError[] {
  const errors: TripValidationError[] = [];

  // 필수 필드 검증
  if (!data.destination?.trim()) {
    errors.push({ field: 'destination', message: '출장지를 선택해주세요.' });
  }

  if (!data.departure?.trim()) {
    errors.push({ field: 'departure', message: '출발지를 선택해주세요.' });
  }

  if (!data.purpose?.trim()) {
    errors.push({ field: 'purpose', message: '출장 목적을 입력해주세요.' });
  }

  if (!data.startDate) {
    errors.push({ field: 'startDate', message: '출발일을 선택해주세요.' });
  }

  // 날짜 검증
  if (data.startDate) {
    const startDate = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      errors.push({ field: 'startDate', message: '출발일은 오늘 이후여야 합니다.' });
    }

    // 하루 출장이 아닌 경우 종료일 검증
    if (!data.isDayTrip) {
      if (!data.endDate) {
        errors.push({ field: 'endDate', message: '종료일을 선택해주세요.' });
      } else {
        const endDate = new Date(data.endDate);
        if (endDate < startDate) {
          errors.push({ field: 'endDate', message: '종료일은 출발일 이후여야 합니다.' });
        }
      }
    }
  }

  return errors;
}

/**
 * 안전한 숫자 변환
 */
export function safeParseNumber(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
}

/**
 * 한국 시간 기준 현재 날짜 가져오기
 */
export function getKoreanDate(): Date {
  const now = new Date();
  const koreanDateString = now.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');
  
  return new Date(koreanDateString);
}

/**
 * 출장 상태 계산
 */
export function calculateTripStatus(startDate: string, endDate: string): 'planned' | 'ongoing' | 'completed' {
  const today = getKoreanDate();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (today < start) {
    return 'planned';
  } else if (today >= start && today <= end) {
    return 'ongoing';
  } else {
    return 'completed';
  }
}