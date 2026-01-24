# Quickstart: Trading Wizard Web Interface

**Feature**: 001-trading-wizard-ui
**Date**: 2026-01-24

## Prerequisites

- Python 3.11+
- Node.js 18+ with pnpm
- Docker & Docker Compose (PostgreSQL, Redis)
- Git

## 1. Initial Setup

### Clone and Branch Setup

```bash
# 저장소 클론 (이미 완료된 경우 생략)
git clone <repository-url>
cd trading-wizard

# 기능 브랜치 체크아웃
git checkout 001-trading-wizard-ui
```

### Infrastructure (Docker)

```bash
# PostgreSQL + Redis 실행
docker compose up -d postgres redis

# 상태 확인
docker compose ps
```

`docker-compose.yml` 예시:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: trading
      POSTGRES_PASSWORD: trading_dev
      POSTGRES_DB: trading_wizard
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 2. Backend Setup

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집: DATABASE_URL, REDIS_URL 설정

# DB 마이그레이션
alembic upgrade head

# 개발 서버 실행 (포트 8000)
uvicorn src.main:app --reload --port 8000
```

### Backend .env 예시

```env
DATABASE_URL=postgresql://trading:trading_dev@localhost:5432/trading_wizard
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development
```

## 3. Frontend Setup (Shared Library First)

병렬 개발 요구사항에 따라 공유 라이브러리를 먼저 설정합니다.

```bash
cd frontend

# pnpm 워크스페이스 초기화
pnpm install

# 공유 타입 빌드
pnpm --filter shared-ui build
```

### Daily Focus Wizard 실행 (포트 3001)

```bash
# 별도 터미널에서
pnpm --filter daily-focus dev
# http://localhost:3001 에서 접속
```

### My Portfolio Wizard 실행 (포트 3002)

```bash
# 별도 터미널에서
pnpm --filter my-portfolio dev
# http://localhost:3002 에서 접속
```

## 4. 병렬 개발 가이드

### Git 브랜치 전략

```bash
# 공유 라이브러리 개발 (선행)
git checkout -b 001-trading-wizard-ui/shared-lib

# Daily Focus 개발 (병렬)
git checkout 001-trading-wizard-ui
git checkout -b 001-trading-wizard-ui/daily-focus

# My Portfolio 개발 (병렬)
git checkout 001-trading-wizard-ui
git checkout -b 001-trading-wizard-ui/my-portfolio
```

### 독립 개발 확인

각 Wizard는 독립적으로 빌드/테스트 가능해야 합니다:

```bash
# Daily Focus 독립 빌드
cd frontend/apps/daily-focus
pnpm build
pnpm test

# My Portfolio 독립 빌드
cd frontend/apps/my-portfolio
pnpm build
pnpm test

# Backend 테스트
cd backend
pytest tests/
```

## 5. 개발 서버 포트 요약

| Service | Port | Command |
|---------|------|---------|
| Backend API | 8000 | `uvicorn src.main:app --reload --port 8000` |
| Daily Focus | 3001 | `pnpm --filter daily-focus dev` |
| My Portfolio | 3002 | `pnpm --filter my-portfolio dev` |
| PostgreSQL | 5432 | `docker compose up postgres` |
| Redis | 6379 | `docker compose up redis` |

## 6. 테스트 데이터

### 테스트용 비밀번호로 로그인

개발 환경에서는 다음 테스트 비밀번호를 사용할 수 있습니다:

```
비밀번호: test-password-dev-2026
```

이 비밀번호로 생성되는 사용자 ID 해시:
```
SHA-256: (런타임에 계산됨)
```

### yfinance 테스트

```python
import yfinance as yf

# 삼성전자 조회 테스트
ticker = yf.Ticker("005930.KS")
print(ticker.history(period="5d"))
```

## 7. 트러블슈팅

### yfinance Rate Limit

```
Error: Too Many Requests
```
→ Redis 캐시가 정상 동작하는지 확인. 개발 중에는 캐시 TTL을 늘리거나 mock 데이터 사용.

### PostgreSQL 연결 실패

```bash
# Docker 컨테이너 로그 확인
docker compose logs postgres
```

### 프론트엔드 빌드 오류

```bash
# node_modules 재설치
rm -rf node_modules
pnpm install
```

## 8. 다음 단계

1. `/speckit.tasks` 실행하여 상세 작업 목록 생성
2. 공유 라이브러리 (`shared/`) 개발 시작
3. 각 Wizard 병렬 개발 착수

## 참고 문서

- [spec.md](./spec.md) - 기능 명세
- [plan.md](./plan.md) - 구현 계획
- [research.md](./research.md) - 기술 조사 결과
- [data-model.md](./data-model.md) - 데이터 모델
- [contracts/openapi.yaml](./contracts/openapi.yaml) - API 명세
- [contracts/types.ts](./contracts/types.ts) - 공유 타입 정의
