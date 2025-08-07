/**
 * 날짜 관련 유틸리티 함수들
 */

/**
 * 한국 표준시 기준 현재 날짜 반환
 */
export function getKoreanDate(): Date {
  const now = new Date();
  const koreanOffset = 9 * 60; // UTC+9
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const koreanTime = new Date(utc + (koreanOffset * 60000));
  
  // 시간을 00:00:00으로 설정하여 날짜만 비교
  koreanTime.setHours(0, 0, 0, 0);
  return koreanTime;
}

/**
 * 두 날짜 사이의 일수 계산
 */
export function getDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * 날짜 형식을 한국어로 포맷
 */
export function formatKoreanDate(date: string | Date): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
}

/**
 * ISO 날짜 문자열을 YYYY-MM-DD 형식으로 변환
 */
export function toDateString(date: string | Date): string {
  const dateObj = new Date(date);
  return dateObj.toISOString().split('T')[0];
}