# Tasks: 공유 로직 (Shared Library)

**Feature**: 001-trading-wizard-ui
**Branch**: `001-trading-wizard-ui/shared-lib`
**Date**: 2026-01-24
**Dependency**: 이 문서의 태스크가 완료되어야 Daily Focus와 My Portfolio 개발 시작 가능

## Overview

공유 라이브러리는 두 Wizard가 공통으로 사용하는 핵심 로직을 포함합니다:
- 기술적 지표 계산 (Bollinger, RSI, MACD, Volume)
- yfinance 데이터 조회 및 캐싱
- 클라이언트 암호화 유틸리티
- 공유 타입 정의
- 공통 백엔드 API (User Data, Stock)

**Total Tasks**: 55개
**Estimated Parallel Opportunities**: 15개

---

## Phase 1: Project Setup

### Goal
모노레포 구조 및 개발 환경 설정

- [x] T001 Create root directory structure per plan.md in project root
- [x] T002 [P] Initialize pnpm workspace with pnpm-workspace.yaml in project root
- [x] T003 [P] Create docker-compose.yml for PostgreSQL and Redis in project root
- [x] T004 [P] Initialize Python virtual environment and requirements.txt in backend/
- [x] T005 Create shared/ directory structure (indicators/, data/, types/) in shared/
- [x] T006 [P] Create backend/src/ directory structure (api/, services/, config/) in backend/src/
- [x] T007 Create frontend/ monorepo structure (apps/, packages/) in frontend/
- [x] T008 Configure TypeScript strict mode in frontend/tsconfig.json
- [x] T009 Configure Python type hints and ruff linting in backend/pyproject.toml
- [x] T010 Create .env.example with DATABASE_URL, REDIS_URL in project root

---

## Phase 2: Shared Types & Models

### Goal
공유 타입 정의 확정 (PD-004, PD-005)

- [x] T011 [P] Create Python models in shared/types/models.py (Stock, TechnicalIndicators, BollingerBands, MACDIndicator)
- [x] T012 [P] Create Python models in shared/types/settings.py (DailyFocusSettings, PortfolioSettings with defaults)
- [x] T013 [P] Copy and verify TypeScript types from contracts/types.ts to frontend/packages/shared-ui/types/models.ts
- [x] T014 Create validation helpers in shared/types/validators.py (validate_symbol, validate_price_data)
- [x] T015 Create TypeScript validation helpers in shared/types/validators.ts (isValidSymbol, validateSettings)

---

## Phase 3: Data Layer - yfinance Client

### Goal
yfinance 데이터 조회 및 캐싱 (FR-001, Constitution III)

- [x] T016 Create Redis cache wrapper in shared/data/cache.py with TTL configuration (30min realtime, 24hr history)
- [x] T017 Create yfinance client in shared/data/yfinance_client.py with rate limiting (2000 req/hr token bucket)
- [x] T018 Create KOSPI 100 stock list provider in shared/data/kospi100.py with static list and validation
- [x] T019 [P] Create price data validator in shared/data/validators.py (OHLC relationship, positive price, volume >= 0)
- [x] T020 Create batch fetcher in shared/data/batch_fetcher.py for KOSPI 100 with delays between batches
- [x] T021 Add data freshness tracking (timestamp) in shared/data/yfinance_client.py responses

---

## Phase 4: Technical Indicators

### Goal
기술적 지표 계산 로직 (FR-002, Constitution II)

- [x] T022 [P] Implement Bollinger Bands calculator in shared/indicators/bollinger.py (calculate_bands, calculate_width with BB Width formula per FR-002, detect_squeeze)
- [x] T023 [P] Implement RSI calculator in shared/indicators/rsi.py (calculate_rsi with configurable period)
- [x] T024 [P] Implement MACD calculator in shared/indicators/macd.py (calculate_macd, calculate_signal, calculate_histogram)
- [x] T025 [P] Implement Volume Ratio calculator in shared/indicators/volume.py (calculate_volume_ratio with 20-day average)
- [x] T026 Implement Confidence Score calculator in shared/indicators/confidence.py per TRADING_STRATEGY_ALGORITHM.md formula (먼저 해당 문서 존재 및 공식 정의 확인 필요)
- [x] T027 Create indicators facade in shared/indicators/__init__.py that combines all indicators for a stock

---

## Phase 5: Client Encryption

### Goal
클라이언트 암호화 유틸리티 (FR-021, FR-022)

**Note**: 암호화 모듈은 TypeScript로 작성되며, frontend/packages/shared-ui/crypto/ 에 위치합니다.
shared/ 디렉토리는 Python 전용이고, frontend/packages/ 가 TypeScript 공유 코드입니다.

- [x] T028 [P] Implement password-based key derivation in frontend/packages/shared-ui/crypto/encryption.ts (PBKDF2, 100k iterations)
- [x] T029 [P] Implement AES-GCM encryption/decryption in frontend/packages/shared-ui/crypto/encryption.ts using Web Crypto API
- [x] T030 Implement user ID hash generation in frontend/packages/shared-ui/crypto/encryption.ts (SHA-256 from password)
- [x] T031 Implement PEM file parsing and key derivation in frontend/packages/shared-ui/crypto/pem.ts
- [x] T032 Create encryption facade in frontend/packages/shared-ui/crypto/index.ts with unified API (encrypt, decrypt, getUserIdHash)

---

## Phase 6: Common Backend API

### Goal
공통 API 엔드포인트 (User Data, Stock)

- [x] T033 Create FastAPI app entry point in backend/src/main.py with CORS configuration
- [x] T034 Create database connection and UserData model in backend/src/db/models.py (PostgreSQL)
- [x] T035 Create Alembic migration for user_data table in backend/src/db/migrations/
- [x] T036 [P] Implement GET /api/user-data/{user_id_hash} endpoint in backend/src/api/common/user_data.py
- [x] T037 [P] Implement PUT /api/user-data/{user_id_hash} endpoint in backend/src/api/common/user_data.py
- [x] T038 [P] Implement GET /api/stocks/search endpoint in backend/src/api/common/stocks.py
- [x] T039 [P] Implement GET /api/stocks/kospi100 endpoint in backend/src/api/common/stocks.py
- [x] T040 [P] Implement GET /api/stocks/{symbol}/price endpoint in backend/src/api/common/stocks.py

---

## Phase 7: Shared UI Components

### Goal
공유 UI 컴포넌트 라이브러리

- [x] T041 Initialize shared-ui package in frontend/packages/shared-ui/
- [x] T042 [P] Create StockCard component in frontend/packages/shared-ui/components/StockCard.tsx
- [x] T043 [P] Create LoadingSpinner component in frontend/packages/shared-ui/components/LoadingSpinner.tsx
- [x] T044 [P] Create ErrorMessage component in frontend/packages/shared-ui/components/ErrorMessage.tsx
- [x] T045 [P] Create SettingsForm base component in frontend/packages/shared-ui/components/SettingsForm.tsx
- [x] T046 Create shared styles (colors, typography) in frontend/packages/shared-ui/styles/theme.ts
- [x] T046-1 [P] Create shared Header component in frontend/packages/shared-ui/components/Header.tsx (navigation links, freshness indicator)
- [x] T046-2 [P] Create shared Footer component in frontend/packages/shared-ui/components/Footer.tsx (disclaimer text prop)
- [x] T046-3 [P] Create shared settingsService in frontend/packages/shared-ui/services/settingsService.ts (encrypt/decrypt/save/load)
- [x] T047 Build and export shared-ui package with proper package.json exports

---

## Phase 8: Integration & Verification

### Goal
통합 테스트 및 검증

- [x] T048 Create unit tests for indicators in shared/tests/unit/test_indicators.py with known input/output pairs
- [x] T049 Create unit tests for yfinance client in shared/tests/unit/test_yfinance.py with mocked responses
- [x] T050 Create integration test for common API endpoints in backend/tests/integration/test_common_api.py
- [x] T051 Verify Docker Compose setup (PostgreSQL, Redis) works with backend connection
- [x] T052 Document shared library API in shared/README.md for Daily Focus and My Portfolio teams

---

## Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────────────────▶
                 │
                 ▼
Phase 2 (Types) ─────────────────────────────────────────────────────▶
                 │
        ┌────────┴────────┬─────────────────┬─────────────────┐
        ▼                 ▼                 ▼                 ▼
Phase 3 (Data)     Phase 4 (Indicators)  Phase 5 (Crypto)  Phase 7 (UI)
        │                 │                 │                 │
        └────────┬────────┴─────────────────┴─────────────────┘
                 ▼
Phase 6 (Common API) ────────────────────────────────────────────────▶
                 │
                 ▼
Phase 8 (Integration) ───────────────────────────────────────────────▶
```

---

## Parallel Execution Opportunities

### Group A (Phase 2) - Types
```
T011, T012, T013 can run in parallel (different files)
```

### Group B (Phase 3-4) - Data & Indicators
```
T022, T023, T024, T025 can run in parallel (independent indicator modules)
T019 can run in parallel with T016, T017, T018
```

### Group C (Phase 5) - Crypto
```
T028, T029 can run in parallel (different encryption functions)
```

### Group D (Phase 6) - APIs
```
T036, T037 can run in parallel (different endpoints)
T038, T039, T040 can run in parallel (different stock endpoints)
```

### Group E (Phase 7) - UI
```
T042, T043, T044, T045 can run in parallel (independent components)
```

---

## Completion Criteria

공유 라이브러리 완료 조건:
1. ✅ 모든 기술적 지표 계산 함수가 단위 테스트 통과
2. ✅ yfinance 클라이언트가 rate limiting과 캐싱을 준수
3. ✅ 클라이언트 암호화/복호화가 Web Crypto API로 동작
4. ✅ 공통 API 엔드포인트가 OpenAPI 명세와 일치
5. ✅ shared-ui 패키지가 빌드되어 다른 앱에서 import 가능
6. ✅ Docker Compose로 PostgreSQL, Redis 실행 가능

**완료 후**: Daily Focus (`tasks-daily-focus.md`)와 My Portfolio (`tasks-my-portfolio.md`) 개발 병렬 시작 가능
