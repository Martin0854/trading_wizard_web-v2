# Implementation Plan: Trading Wizard Web Interface

**Branch**: `001-trading-wizard-ui` | **Date**: 2026-01-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-trading-wizard-ui/spec.md`

## Summary

두 개의 독립적인 웹 인터페이스(Daily Focus Wizard - 매수 추천, My Portfolio Wizard - 포트폴리오 관리)를 구현합니다. 볼린저 밴드 스퀴즈 전략 기반 매수 신호 분석, 클라이언트 사이드 암호화를 통한 개인정보 보호, 병렬 개발을 위한 모듈화된 아키텍처를 적용합니다.

## Technical Context

**Language/Version**: Python 3.11 (Backend), TypeScript 5.x (Frontend)
**Primary Dependencies**: FastAPI (Backend API), React 18 (Frontend), yfinance (주가 데이터), Web Crypto API (클라이언트 암호화)
**Storage**: PostgreSQL (암호화된 blob 저장), Redis (캐싱 - Constitution 준수)
**Testing**: pytest (Backend), Vitest + React Testing Library (Frontend)
**Target Platform**: Web (모던 브라우저 - Chrome, Firefox, Safari, Edge 최신 2버전)
**Project Type**: Web application (Backend + Frontend)
**Performance Goals**: 5초 이내 매수 추천 목록 로드 (SC-001), 100명 동시 사용자 지원 (SC-006)
**Constraints**: yfinance rate limit 준수 (max 2000 req/hr), 클라이언트 암호화 필수
**Scale/Scope**: KOSPI Top 100 종목, 100명 동시 사용자

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation |
|-----------|--------|----------------|
| **I. Code Quality** | ✅ PASS | |
| - Separation of Concerns | ✅ | 공유 라이브러리(indicators, data)와 Wizard별 UI/서비스 분리 |
| - Type Safety | ✅ | Python type hints, TypeScript strict mode |
| - Error Handling | ✅ | FR-020: 데이터 조회 실패 시 오류 메시지 표시 |
| - Documentation | ✅ | 공개 API 및 알고리즘에 docstring 작성 |
| **II. Algorithm Integrity** | ✅ PASS | |
| - No Magic Numbers | ✅ | 모든 파라미터를 설정 파일로 관리 (FR-007, FR-016) |
| - Calculation Transparency | ✅ | TRADING_STRATEGY_ALGORITHM.md 기준 구현 |
| - Backtesting Validation | ✅ | MVP 범위 외 (Constitution 1.1.0 예외 조항 적용); 프로덕션 배포 전 구현 예정 |
| - No Financial Advice | ✅ | "신호/지표"로 표현, 면책조항 포함 |
| **III. API Rate Limit Protection** | ✅ PASS | |
| - Caching First | ✅ | Redis 캐싱 (30분 실시간, 24시간 히스토리) |
| - Request Throttling | ✅ | yfinance 호출 제한 (2000 req/hr) |
| - Batch Processing | ✅ | KOSPI 100 종목 배치 처리 |
| - Graceful Degradation | ✅ | 오류 메시지 표시 (Constitution 1.1.0 사용자 선택 조항 적용; 캐시 fallback 미적용) |
| **Data Integrity Standards** | ✅ PASS | |
| - Data Freshness Tracking | ✅ | 캐시 타임스탬프 UI 표시 |
| - Validation on Fetch | ✅ | 가격 데이터 검증 로직 |
| - Missing Data Handling | ✅ | 미조회 종목 제외 + 사유 표시 |
| - Timezone Consistency | ✅ | KST 기준 저장/표시 |

**Gate Result**: ✅ PASS (Constitution 1.1.0 기준 모든 원칙 충족)

## Project Structure

### Documentation (this feature)

```text
specs/001-trading-wizard-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── openapi.yaml     # REST API 명세
│   └── types.ts         # 공유 타입 정의
├── tasks-shared.md      # Phase 2 output - 공유 라이브러리 태스크 (52개)
├── tasks-daily-focus.md # Phase 2 output - Daily Focus 태스크 (34개)
└── tasks-my-portfolio.md # Phase 2 output - My Portfolio 태스크 (45개)
```

### Source Code (repository root)

```text
# 병렬 개발 지원 구조 (PD-001 ~ PD-003)

shared/                          # 공유 라이브러리 - Python 전용 (PD-003)
├── indicators/                  # 기술적 지표 계산 (Python)
│   ├── bollinger.py
│   ├── rsi.py
│   ├── macd.py
│   └── volume.py
├── data/                        # 데이터 조회 (Python)
│   ├── yfinance_client.py
│   ├── cache.py
│   └── kospi100.py
├── types/                       # 공유 타입 정의 (Python)
│   ├── models.py
│   └── settings.py
└── tests/
    └── unit/

backend/
├── src/
│   ├── api/
│   │   ├── daily_focus/         # Daily Focus API (독립)
│   │   ├── portfolio/           # Portfolio API (독립)
│   │   └── common/              # 공통 API (인증, 저장)
│   ├── services/
│   │   ├── signal_scanner.py    # 매수 신호 스캔
│   │   ├── sell_signal.py       # 매도 신호 판단
│   │   └── portfolio.py         # 포트폴리오 관리
│   └── config/
│       └── settings.py          # 전략 파라미터 기본값
└── tests/
    ├── unit/
    └── integration/

frontend/
├── apps/
│   ├── daily-focus/             # Daily Focus Wizard (PD-001, 독립 빌드)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── services/
│   │   ├── public/
│   │   └── vite.config.ts
│   └── my-portfolio/            # My Portfolio Wizard (PD-001, 독립 빌드)
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   └── services/
│       ├── public/
│       └── vite.config.ts
├── packages/
│   └── shared-ui/               # 공유 TypeScript 코드 (UI + 암호화 + 타입)
│       ├── components/          # 공유 UI 컴포넌트
│       ├── crypto/              # 클라이언트 암호화 유틸 (TypeScript)
│       ├── types/               # 공유 타입 정의 (TypeScript)
│       └── styles/              # 공유 스타일
└── tests/
    └── e2e/
```

**Structure Decision**: Web application 구조 채택. 병렬 개발 요구사항(PD-001~014)에 따라 Daily Focus와 My Portfolio를 독립적인 프론트엔드 앱으로 분리하고, 공유 로직은 shared/ 디렉토리로 추출. 각 앱은 독립적으로 빌드/실행 가능(PD-007, PD-008).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 2개의 독립 프론트엔드 앱 | 병렬 개발 요구사항 (PD-001, PD-007) | 단일 앱은 병렬 개발 시 Git 충돌 및 의존성 문제 발생 |
| 클라이언트 암호화 + 서버 저장 | 개인정보 최소화 + 멀티 기기 접근 (FR-021, FR-022) | 로컬 저장만으로는 기기 간 데이터 동기화 불가 |
