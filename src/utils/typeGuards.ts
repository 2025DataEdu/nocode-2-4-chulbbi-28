/**
 * 타입 가드 유틸리티
 * 런타임에서 타입 안전성을 보장하기 위한 함수들
 */

import { Tables } from "@/integrations/supabase/types";

/**
 * 값이 null 또는 undefined가 아닌지 확인
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 값이 비어있지 않은 문자열인지 확인
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 값이 유효한 숫자인지 확인
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * 값이 유효한 배열인지 확인
 */
export function isValidArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Trip 객체의 유효성 검사
 */
export function isValidTrip(trip: unknown): trip is Tables<'trips'> {
  if (!trip || typeof trip !== 'object') return false;
  
  const t = trip as Record<string, unknown>;
  
  return (
    isNonEmptyString(t.id) &&
    isNonEmptyString(t.user_id) &&
    isNonEmptyString(t.destination) &&
    isNonEmptyString(t.departure_location) &&
    isNonEmptyString(t.purpose) &&
    isNonEmptyString(t.start_date) &&
    isNonEmptyString(t.end_date) &&
    isDefined(t.trip_type)
  );
}

/**
 * 날짜 문자열의 유효성 검사
 */
export function isValidDateString(dateString: unknown): dateString is string {
  if (!isNonEmptyString(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * API 응답의 유효성 검사
 */
export function isValidApiResponse<T>(
  response: unknown,
  validator: (data: unknown) => data is T
): response is { data: T; error: null } {
  if (!response || typeof response !== 'object') return false;
  
  const r = response as Record<string, unknown>;
  return r.error === null && validator(r.data);
}