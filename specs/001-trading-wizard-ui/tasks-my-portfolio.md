# Tasks: My Portfolio Wizard

**Feature**: 001-trading-wizard-ui
**Branch**: `001-trading-wizard-ui/my-portfolio`
**Date**: 2026-01-24
**Dependency**: `tasks-shared.md` 완료 필수 (공유 라이브러리)

## Overview

My Portfolio Wizard는 보유 종목 관리 및 매도 추천 시스템입니다:
- 종목 매수/매도 기록 관리
- 실시간 수익률 계산
- 손절매/익절매/추세이탈 매도 신호 분석
- 포트폴리오 대시보드

**User Stories Covered**:
- US2: My Portfolio Wizard 보유 종목 관리 (P1)
- US3: My Portfolio Wizard 매도 추천 확인 (P2)
- US5: My Portfolio Wizard 전략 파라미터 설정 (P2)
- US6: 포트폴리오 수익률 요약 대시보드 (P3)

**Total Tasks**: 45개
**Port**: 3002

---

## Phase 1: Project Setup (My Portfolio)

### Goal
My Portfolio 프론트엔드 앱 초기화

- [ ] MP-T001 Initialize Vite React app in frontend/apps/my-portfolio/
- [ ] MP-T002 Configure vite.config.ts with port 3002 and shared-ui alias in frontend/apps/my-portfolio/vite.config.ts
- [ ] MP-T003 Install dependencies (react-query, zustand, axios, uuid) in frontend/apps/my-portfolio/package.json
- [ ] MP-T004 Create basic App.tsx with router setup in frontend/apps/my-portfolio/src/App.tsx
- [ ] MP-T005 Create environment configuration in frontend/apps/my-portfolio/.env (API_URL=http://localhost:8000)

---

## Phase 2: User Story 2 - 보유 종목 관리 (P1)

### Story Goal
사용자가 My Portfolio Wizard에서 자신이 매수한 종목을 등록하고, 매수가와 수량을 기록

### Independent Test
My Portfolio Wizard에서 종목을 추가하고, 매수가/수량을 입력한 후 수익률이 계산되어 표시됨

### Backend Tasks

- [ ] MP-T006 [US2] Create sell signal service in backend/src/services/sell_signal.py (stop_loss, take_profit, trend_break)
- [ ] MP-T007 [US2] Implement POST /api/portfolio/sell-signals endpoint in backend/src/api/portfolio/sell_signals.py
- [ ] MP-T008 [US2] Create PnL calculator service in backend/src/services/pnl_calculator.py (position-level and portfolio-level)
- [ ] MP-T009 [US2] Implement POST /api/portfolio/calculate-pnl endpoint in backend/src/api/portfolio/calculate_pnl.py

### Frontend Tasks

- [ ] MP-T010 [US2] Create API client in frontend/apps/my-portfolio/src/services/api.ts (fetchSellSignals, calculatePnL, searchStocks)
- [ ] MP-T011 [US2] Create Zustand store in frontend/apps/my-portfolio/src/store/portfolioStore.ts (positions, history, loading, error)
- [ ] MP-T012 [US2] Create PositionList component in frontend/apps/my-portfolio/src/components/PositionList.tsx
- [ ] MP-T013 [US2] Create PositionCard component in frontend/apps/my-portfolio/src/components/PositionCard.tsx (stock info, pnl, sell signals)
- [ ] MP-T014 [US2] Create AddPositionModal component in frontend/apps/my-portfolio/src/components/AddPositionModal.tsx
- [ ] MP-T015 [US2] Create StockSearchInput component in frontend/apps/my-portfolio/src/components/StockSearchInput.tsx (autocomplete)
- [ ] MP-T016 [US2] Create BuyForm component in frontend/apps/my-portfolio/src/components/BuyForm.tsx (price, quantity, date inputs)
- [ ] MP-T017 [US2] Create SellModal component in frontend/apps/my-portfolio/src/components/SellModal.tsx (sell price, date, quantity)
- [ ] MP-T018 [US2] Create average buy price calculator in frontend/apps/my-portfolio/src/utils/priceCalculator.ts
- [ ] MP-T019 [US2] Create PortfolioPage in frontend/apps/my-portfolio/src/pages/PortfolioPage.tsx (integrates PositionList)
- [ ] MP-T020 [US2] Add loading spinner and error handling to PortfolioPage in frontend/apps/my-portfolio/src/pages/PortfolioPage.tsx
- [ ] MP-T021 [US2] Create EmptyState component in frontend/apps/my-portfolio/src/components/EmptyState.tsx ("보유 종목이 없습니다")

---

## Phase 3: User Story 3 - 매도 추천 확인 (P2)

### Story Goal
사용자가 보유 중인 종목에 대해 매도 추천 신호(손절매, 익절매, 추세이탈)를 확인

### Independent Test
보유 종목 중 매도 조건을 충족하는 종목에 매도 추천 신호가 표시됨

### Frontend Tasks

- [ ] MP-T022 [US3] Create SellSignalBadge component in frontend/apps/my-portfolio/src/components/SellSignalBadge.tsx (stop_loss, take_profit, trend_break)
- [ ] MP-T023 [US3] Create SellSignalList component in frontend/apps/my-portfolio/src/components/SellSignalList.tsx (all active signals)
- [ ] MP-T024 [US3] Create SellSignalDetailModal component in frontend/apps/my-portfolio/src/components/SellSignalDetailModal.tsx (signal reason, indicators)
- [ ] MP-T025 [US3] Integrate sell signals into PositionCard in frontend/apps/my-portfolio/src/components/PositionCard.tsx
- [ ] MP-T026 [US3] Add sell signal refresh on portfolio load in frontend/apps/my-portfolio/src/pages/PortfolioPage.tsx

---

## Phase 4: User Story 5 - 전략 파라미터 설정 (P2)

### Story Goal
사용자가 매도 전략의 파라미터(손절매 비율, 익절매 비율 등)를 조정

### Independent Test
손절매 비율을 변경한 후, 해당 비율에 따라 매도 추천이 재계산됨

### Frontend Tasks

- [ ] MP-T027 [US5] Create settings state in frontend/apps/my-portfolio/src/store/settingsStore.ts (PortfolioSettings with defaults)
- [ ] MP-T028 [US5] Create SettingsPage in frontend/apps/my-portfolio/src/pages/SettingsPage.tsx
- [ ] MP-T029 [US5] Create StopLossSettings form in frontend/apps/my-portfolio/src/components/settings/StopLossSettings.tsx (percentage slider)
- [ ] MP-T030 [US5] Create TakeProfitSettings form in frontend/apps/my-portfolio/src/components/settings/TakeProfitSettings.tsx (percentage slider)
- [ ] MP-T031 [US5] Create TrendBreakSettings form in frontend/apps/my-portfolio/src/components/settings/TrendBreakSettings.tsx (enable/disable toggle, bollinger params)
- [ ] MP-T032 [US5] Add validation to settings forms in frontend/apps/my-portfolio/src/components/settings/ (range checks per data-model.md)
- [ ] MP-T033 [US5] Integrate shared settingsService for save with encryption in frontend/apps/my-portfolio/src/store/settingsStore.ts (uses shared-ui/services/settingsService)
- [ ] MP-T034 [US5] Integrate shared settingsService for load with decryption in frontend/apps/my-portfolio/src/store/settingsStore.ts (uses shared-ui/services/settingsService)
- [ ] MP-T035 [US5] Add reset to defaults button in frontend/apps/my-portfolio/src/pages/SettingsPage.tsx
- [ ] MP-T036 [US5] Connect settings to sell signals API call in frontend/apps/my-portfolio/src/pages/PortfolioPage.tsx (pass custom params)

---

## Phase 5: User Story 6 - 포트폴리오 대시보드 (P3)

### Story Goal
사용자가 전체 포트폴리오의 수익률 현황을 한눈에 파악

### Independent Test
포트폴리오에 여러 종목이 등록된 상태에서 전체 평가금액과 총 수익률이 정확히 계산됨

### Frontend Tasks

- [ ] MP-T037 [US6] Create DashboardSummary component in frontend/apps/my-portfolio/src/components/DashboardSummary.tsx (total invested, current value, total PnL)
- [ ] MP-T038 [US6] Create PortfolioAllocation component in frontend/apps/my-portfolio/src/components/PortfolioAllocation.tsx (pie chart or bar)
- [ ] MP-T039 [US6] Integrate DashboardSummary into PortfolioPage in frontend/apps/my-portfolio/src/pages/PortfolioPage.tsx

---

## Phase 6: Polish & Integration

### Goal
UI 완성도 및 통합

- [ ] MP-T040 Configure shared Header component with My Portfolio navigation in frontend/apps/my-portfolio/src/App.tsx (uses shared-ui/Header)
- [ ] MP-T041 Configure shared Footer component with disclaimer ("투자 참고용이며 매매 권유가 아닙니다") in frontend/apps/my-portfolio/src/App.tsx (uses shared-ui/Footer)
- [ ] MP-T042 Pass data freshness timestamp to Header component in frontend/apps/my-portfolio/src/pages/PortfolioPage.tsx
- [ ] MP-T043 Configure Daily Focus Wizard link in Header navigation props
- [ ] MP-T044 Style pages with shared-ui theme in frontend/apps/my-portfolio/src/styles/
- [ ] MP-T045 Verify independent build works: `pnpm --filter my-portfolio build` in frontend/apps/my-portfolio/

---

## Dependencies

```
tasks-shared.md (완료) ─────────────────────────────────────────────▶
                          │
                          ▼
Phase 1 (Setup) ─────────────────────────────────────────────────────▶
                          │
                          ▼
Phase 2 (US2: 보유 종목 관리) ──────────────────────────────────────────▶
                          │
                          ▼
Phase 3 (US3: 매도 추천) ───────────────────────────────────────────────▶
                          │
                          ▼
Phase 4 (US5: 파라미터 설정) ───────────────────────────────────────────▶
                          │
                          ▼
Phase 5 (US6: 대시보드) ────────────────────────────────────────────────▶
                          │
                          ▼
Phase 6 (Polish) ───────────────────────────────────────────────────────▶
```

---

## Parallel Execution Opportunities

### Within Phase 2 (US2)
```
Backend: MP-T006, MP-T007 and MP-T008, MP-T009 can run in parallel (different services)
Frontend: MP-T012, MP-T013, MP-T014, MP-T015, MP-T016, MP-T017, MP-T021 can run in parallel (independent components)
```

### Within Phase 3 (US3)
```
MP-T022, MP-T023, MP-T024 can run in parallel (independent components)
```

### Within Phase 4 (US5)
```
MP-T029, MP-T030, MP-T031 can run in parallel (different settings forms)
```

### Within Phase 5 (US6)
```
MP-T037, MP-T038 can run in parallel (independent dashboard components)
```

### Backend/Frontend Parallel
```
Once MP-T007, MP-T009 (APIs) are done, frontend tasks MP-T010+ can start
MP-T006~T009 (services/APIs) can run parallel with MP-T010~T011 (frontend setup)
```

---

## Acceptance Criteria

### US2: 보유 종목 관리
- [ ] 종목 검색 후 매수가, 수량, 매수일 입력 가능
- [ ] 포트폴리오에 등록된 종목의 현재가, 수익률(%) 표시
- [ ] 동일 종목 복수 매수 시 평균 매수가 자동 계산
- [ ] 종목 매도 처리 시 매도가, 매도일 기록 가능
- [ ] 종목 추가 1분 이내 완료 (SC-002)

### US3: 매도 추천 확인
- [ ] 손실률 -4.5% 이하 종목에 "손절매 추천" 신호 표시
- [ ] 수익률 +12% 이상 종목에 "익절매 추천" 신호 표시
- [ ] 볼린저 중심선 하향 돌파 종목에 "추세 이탈" 신호 표시 (설정 시)
- [ ] 매도 신호 정확도 100% (SC-005)

### US5: 전략 파라미터 설정
- [ ] 손절매 비율 변경 가능 (-20% ~ 0%)
- [ ] 익절매 비율 변경 가능 (0% ~ 100%)
- [ ] 중심선 이탈 매도 on/off 토글 가능
- [ ] 설정 변경 30초 이내 완료 (SC-004)

### US6: 포트폴리오 대시보드
- [ ] 총 투자금액 표시
- [ ] 현재 평가금액 표시
- [ ] 전체 수익률(%) 표시
- [ ] 종목별 비중 표시

---

## Completion Criteria

My Portfolio Wizard 완료 조건:
1. ✅ 포트 3002에서 독립 실행 가능 (`pnpm --filter my-portfolio dev`)
2. ✅ 종목 검색 및 매수 기록이 정상 동작함
3. ✅ 보유 종목의 현재가, 수익률이 정확히 계산됨
4. ✅ 매도 신호(손절/익절/추세이탈)가 조건 충족 시 표시됨
5. ✅ 설정 페이지에서 파라미터 변경/저장/초기화 가능
6. ✅ 설정이 암호화되어 서버에 저장됨
7. ✅ 포트폴리오 대시보드에 수익률 요약 표시됨
8. ✅ Daily Focus 링크가 정상 동작함 (링크만, 기능은 별도)

**이 문서는 Daily Focus (`tasks-daily-focus.md`)와 병렬 개발 가능**
