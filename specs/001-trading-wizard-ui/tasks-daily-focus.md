# Tasks: Daily Focus Wizard

**Feature**: 001-trading-wizard-ui
**Branch**: `001-trading-wizard-ui/daily-focus`
**Date**: 2026-01-24
**Dependency**: `tasks-shared.md` 완료 필수 (공유 라이브러리)

## Overview

Daily Focus Wizard는 KOSPI Top 100 종목의 매수 추천 시스템입니다:
- 볼린저 밴드 스퀴즈 전략 기반 매수 신호 분석
- 신뢰도 점수 기반 종목 정렬
- 전략 파라미터 커스터마이징

**User Stories Covered**:
- US1: Daily Focus Wizard 매수 추천 조회 (P1)
- US4: Daily Focus Wizard 전략 파라미터 설정 (P2)

**Total Tasks**: 34개
**Port**: 3001

---

## Phase 1: Project Setup (Daily Focus)

### Goal
Daily Focus 프론트엔드 앱 초기화

- [ ] DF-T001 Initialize Vite React app in frontend/apps/daily-focus/
- [ ] DF-T002 Configure vite.config.ts with port 3001 and shared-ui alias in frontend/apps/daily-focus/vite.config.ts
- [ ] DF-T003 Install dependencies (react-query, zustand, axios) in frontend/apps/daily-focus/package.json
- [ ] DF-T004 Create basic App.tsx with router setup in frontend/apps/daily-focus/src/App.tsx
- [ ] DF-T005 Create environment configuration in frontend/apps/daily-focus/.env (API_URL=http://localhost:8000)

---

## Phase 2: User Story 1 - 매수 추천 조회 (P1)

### Story Goal
사용자가 Daily Focus Wizard에 접속하여 오늘의 매수 추천 종목 목록을 확인

### Independent Test
Daily Focus 페이지 접속 시 매수 추천 종목 목록이 신뢰도 점수 순으로 표시됨

### Backend Tasks

- [ ] DF-T006 [US1] Create signal scanner service in backend/src/services/signal_scanner.py (squeeze detection, breakout check)
- [ ] DF-T007 [US1] Implement confidence score calculation in backend/src/services/signal_scanner.py per TRADING_STRATEGY_ALGORITHM.md
- [ ] DF-T008 [US1] Create buy recommendation generator in backend/src/services/signal_scanner.py (filter by threshold, sort by score)
- [ ] DF-T009 [US1] Implement GET /api/daily-focus/recommendations endpoint in backend/src/api/daily_focus/recommendations.py
- [ ] DF-T010 [US1] Implement GET /api/daily-focus/stock/{symbol} endpoint in backend/src/api/daily_focus/stock_detail.py

### Frontend Tasks

- [ ] DF-T011 [US1] Create API client in frontend/apps/daily-focus/src/services/api.ts (fetchRecommendations, fetchStockDetail)
- [ ] DF-T012 [US1] Create Zustand store in frontend/apps/daily-focus/src/store/dailyFocusStore.ts (recommendations, loading, error)
- [ ] DF-T013 [US1] Create RecommendationList component in frontend/apps/daily-focus/src/components/RecommendationList.tsx
- [ ] DF-T014 [US1] Create RecommendationCard component in frontend/apps/daily-focus/src/components/RecommendationCard.tsx (stock info, confidence score, indicators)
- [ ] DF-T015 [US1] Create StockDetailModal component in frontend/apps/daily-focus/src/components/StockDetailModal.tsx (detailed indicators)
- [ ] DF-T016 [US1] Create EmptyState component in frontend/apps/daily-focus/src/components/EmptyState.tsx ("오늘은 매수 추천 종목이 없습니다")
- [ ] DF-T017 [US1] Create HomePage in frontend/apps/daily-focus/src/pages/HomePage.tsx (integrates RecommendationList)
- [ ] DF-T018 [US1] Add loading spinner and error handling to HomePage in frontend/apps/daily-focus/src/pages/HomePage.tsx

---

## Phase 3: User Story 4 - 전략 파라미터 설정 (P2)

### Story Goal
사용자가 볼린저 밴드 스퀴즈 전략의 파라미터를 자신의 투자 스타일에 맞게 조정

### Independent Test
파라미터 변경 후 저장하면 변경된 설정으로 매수 추천이 재계산됨

### Frontend Tasks

- [ ] DF-T019 [US4] Create settings state in frontend/apps/daily-focus/src/store/settingsStore.ts (DailyFocusSettings with defaults)
- [ ] DF-T020 [US4] Create SettingsPage in frontend/apps/daily-focus/src/pages/SettingsPage.tsx
- [ ] DF-T021 [US4] Create BollingerSettings form in frontend/apps/daily-focus/src/components/settings/BollingerSettings.tsx (period, stdDev, squeeze threshold)
- [ ] DF-T022 [US4] Create IndicatorSettings form in frontend/apps/daily-focus/src/components/settings/IndicatorSettings.tsx (RSI, MACD, Volume periods)
- [ ] DF-T023 [US4] Create ConfidenceSettings form in frontend/apps/daily-focus/src/components/settings/ConfidenceSettings.tsx (threshold slider)
- [ ] DF-T024 [US4] Add validation to settings forms in frontend/apps/daily-focus/src/components/settings/ (range checks per data-model.md)
- [ ] DF-T025 [US4] Integrate shared settingsService for save with encryption in frontend/apps/daily-focus/src/store/settingsStore.ts (uses shared-ui/services/settingsService)
- [ ] DF-T026 [US4] Integrate shared settingsService for load with decryption in frontend/apps/daily-focus/src/store/settingsStore.ts (uses shared-ui/services/settingsService)
- [ ] DF-T027 [US4] Add reset to defaults button in frontend/apps/daily-focus/src/pages/SettingsPage.tsx
- [ ] DF-T028 [US4] Connect settings to recommendations API call in frontend/apps/daily-focus/src/pages/HomePage.tsx (pass custom params)

---

## Phase 4: Polish & Integration

### Goal
UI 완성도 및 통합

- [ ] DF-T029 Configure shared Header component with Daily Focus navigation in frontend/apps/daily-focus/src/App.tsx (uses shared-ui/Header)
- [ ] DF-T030 Configure shared Footer component with disclaimer ("투자 신호이며 매수 추천이 아닙니다") in frontend/apps/daily-focus/src/App.tsx (uses shared-ui/Footer)
- [ ] DF-T031 Pass data freshness timestamp to Header component in frontend/apps/daily-focus/src/pages/HomePage.tsx
- [ ] DF-T032 Configure My Portfolio Wizard link in Header navigation props
- [ ] DF-T033 Style pages with shared-ui theme in frontend/apps/daily-focus/src/styles/
- [ ] DF-T034 Verify independent build works: `pnpm --filter daily-focus build` in frontend/apps/daily-focus/

---

## Dependencies

```
tasks-shared.md (완료) ─────────────────────────────────────────────▶
                          │
                          ▼
Phase 1 (Setup) ─────────────────────────────────────────────────────▶
                          │
                          ▼
Phase 2 (US1: 매수 추천) ────────────────────────────────────────────▶
                          │
                          ▼
Phase 3 (US4: 파라미터 설정) ────────────────────────────────────────▶
                          │
                          ▼
Phase 4 (Polish) ────────────────────────────────────────────────────▶
```

---

## Parallel Execution Opportunities

### Within Phase 2 (US1)
```
Backend: DF-T006, DF-T007, DF-T008 must be sequential
Frontend: DF-T013, DF-T014, DF-T015, DF-T016 can run in parallel (independent components)
```

### Within Phase 3 (US4)
```
DF-T021, DF-T022, DF-T023 can run in parallel (different settings forms)
```

### Backend/Frontend Parallel
```
Once DF-T009 (API) is done, frontend tasks DF-T011+ can start
DF-T006~T008 (service) can run parallel with DF-T011~T012 (frontend setup)
```

---

## Acceptance Criteria

### US1: 매수 추천 조회
- [ ] KOSPI Top 100 중 매수 신호 발생 종목이 목록으로 표시됨
- [ ] 신뢰도 점수 내림차순 정렬됨
- [ ] 종목 선택 시 상세 지표(볼린저, RSI, MACD, 거래량) 표시됨
- [ ] 추천 종목 없을 시 "오늘은 매수 추천 종목이 없습니다" 메시지 표시
- [ ] 페이지 로드 5초 이내 (SC-001)

### US4: 전략 파라미터 설정
- [ ] 볼린저 기간/표준편차 변경 가능
- [ ] 신뢰도 임계값 변경 가능
- [ ] 변경 후 저장하면 설정이 영구 저장됨
- [ ] 초기화 버튼으로 기본값 복원 가능
- [ ] 설정 변경 30초 이내 완료 가능 (SC-004)

---

## Completion Criteria

Daily Focus Wizard 완료 조건:
1. ✅ 포트 3001에서 독립 실행 가능 (`pnpm --filter daily-focus dev`)
2. ✅ 매수 추천 목록이 정상 표시됨
3. ✅ 종목 상세 분석 모달이 동작함
4. ✅ 설정 페이지에서 파라미터 변경/저장/초기화 가능
5. ✅ 설정이 암호화되어 서버에 저장됨
6. ✅ My Portfolio 링크가 정상 동작함 (링크만, 기능은 별도)

**이 문서는 My Portfolio (`tasks-my-portfolio.md`)와 병렬 개발 가능**
