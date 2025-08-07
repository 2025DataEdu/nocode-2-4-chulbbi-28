# 테스트 실행 가이드

## 테스트 환경 설정 완료
- Vitest 설정 파일 생성됨 (vitest.config.ts)
- 테스트 유틸리티 및 설정 파일 생성됨
- 주요 컴포넌트들에 대한 단위테스트 및 통합테스트 작성됨

## 테스트 실행 방법

### 1. 개발 환경에서 테스트 실행
```bash
npm run test        # 테스트 watch 모드
npm run test:run    # 일회성 테스트 실행
npm run test:ui     # UI 모드로 테스트 실행
```

### 2. 작성된 테스트 파일들
- `src/components/__tests__/Dashboard.test.tsx` - 대시보드 컴포넌트 테스트
- `src/components/__tests__/TripCard.test.tsx` - 출장 카드 컴포넌트 테스트
- `src/components/__tests__/AppSidebar.test.tsx` - 사이드바 컴포넌트 테스트
- `src/pages/__tests__/Register.test.tsx` - 출장 등록 페이지 테스트
- `src/test/__tests__/integration.test.tsx` - 통합 테스트
- `src/utils/__tests__/distance.test.ts` - 거리 계산 유틸리티 테스트
- `src/hooks/__tests__/useAuth.test.tsx` - 인증 훅 테스트

### 3. 테스트 커버리지
각 테스트는 다음과 같은 기능들을 검증합니다:
- 컴포넌트 렌더링
- 사용자 인터랙션 (클릭, 입력 등)
- 네비게이션 동작
- 데이터 표시 및 계산
- 폼 유효성 검사
- 상태 관리

### 4. 지속적 통합
새로운 기능 추가 시 해당 기능에 대한 테스트를 함께 작성하여 코드 품질을 유지하세요.

## 테스트 작성 가이드라인
1. 각 컴포넌트마다 최소한의 렌더링 테스트 작성
2. 사용자 인터랙션이 있는 부분은 이벤트 테스트 작성
3. 비즈니스 로직은 단위테스트로 분리하여 작성
4. 페이지 간 네비게이션은 통합테스트로 검증