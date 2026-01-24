# Research: Trading Wizard Web Interface

**Feature**: 001-trading-wizard-ui
**Date**: 2026-01-24
**Status**: Complete

## 1. Client-Side Encryption with Web Crypto API

### Decision
Web Crypto API를 사용하여 AES-GCM 256bit 암호화 적용. 비밀번호에서 PBKDF2로 키 파생.

### Rationale
- Web Crypto API는 모든 모던 브라우저에서 네이티브 지원 (추가 의존성 없음)
- AES-GCM은 인증된 암호화(AEAD)를 제공하여 무결성 보장
- PBKDF2는 비밀번호 기반 키 파생의 표준 (100,000+ iterations 권장)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| CryptoJS | 추가 의존성, Web Crypto보다 느림, 유지보수 불활성 |
| libsodium.js | 번들 크기 증가 (>200KB), 과잉 기능 |
| Stanford JS Crypto | Web Crypto 대비 장점 없음 |

### Implementation Notes
```typescript
// 키 파생: 비밀번호 → 암호화 키
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
  await crypto.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveKey"]),
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);

// 사용자 ID: 비밀번호 → SHA-256 해시
const userId = await crypto.subtle.digest("SHA-256", passwordBytes);
```

---

## 2. PEM File Based Authentication

### Decision
PEM 파일(RSA 2048bit 이상 개인키)을 사용한 대체 인증 방식 지원. 개인키에서 AES 키 파생.

### Rationale
- 비밀번호 대비 높은 엔트로피 (RSA 2048 = ~112bit 보안)
- 기업 환경에서 기존 PKI 인프라 활용 가능
- 파일 기반으로 복잡한 비밀번호 기억 부담 감소

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Hardware Security Key (WebAuthn) | MVP 범위 초과, 브라우저 호환성 이슈 |
| QR 코드 기반 | 모바일 연동 필요, 복잡도 증가 |

### Implementation Notes
- PEM 파일 파싱: asn1js 또는 pkijs 라이브러리 사용
- 개인키 해시를 사용자 ID로 사용
- 개인키에서 AES 키 파생 (RSA decrypt 후 HKDF)

---

## 3. yfinance Rate Limiting Strategy

### Decision
Redis 기반 캐싱 + 토큰 버킷 알고리즘으로 rate limiting 구현.

### Rationale
- yfinance 비공식 rate limit: ~2000 requests/hour (IP 기반)
- Constitution 요구사항: Caching First, Request Throttling, Batch Processing
- Redis는 캐시와 rate limiter 모두 지원

### Cache Strategy
| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| 실시간 가격 | 30분 | 장중 업데이트 빈도 고려 |
| 일봉 히스토리 | 24시간 | 하루 1회 변경 |
| KOSPI 100 목록 | 7일 | 변동 빈도 낮음 |

### Rate Limiting
```python
# Token Bucket: 2000 tokens/hour, 100 tokens/batch
RATE_LIMIT = 2000  # per hour
BATCH_SIZE = 100   # KOSPI Top 100 한번에 조회
BATCH_DELAY = 0.5  # seconds between batches
```

---

## 4. Monorepo Structure for Parallel Development

### Decision
pnpm workspaces + Turborepo로 프론트엔드 모노레포 구성. 백엔드는 단일 Python 프로젝트.

### Rationale
- 병렬 개발 요구사항(PD-001~009) 충족
- 각 Wizard 독립 빌드/배포 가능
- 공유 코드(shared-ui, types) 중복 없이 참조

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Nx | 설정 복잡도 높음, 소규모 프로젝트에 과잉 |
| Lerna | 유지보수 불활성, pnpm 네이티브 지원 부족 |
| 완전 분리 저장소 | 공유 코드 동기화 어려움, 버전 관리 복잡 |

### Workspace Structure
```json
// pnpm-workspace.yaml
packages:
  - 'frontend/apps/*'
  - 'frontend/packages/*'
  - 'shared/*'
```

---

## 5. PostgreSQL Encrypted Blob Storage

### Decision
PostgreSQL BYTEA 타입으로 암호화된 blob 저장. 사용자 ID (해시) 기반 조회.

### Rationale
- 서버는 평문 데이터에 접근 불가 (복호화 키 미보유)
- PostgreSQL은 대용량 BYTEA 효율적 처리 가능 (최대 1GB)
- 인덱스: 사용자 ID 해시 (고유)

### Schema Preview
```sql
CREATE TABLE user_data (
    user_id_hash VARCHAR(64) PRIMARY KEY,  -- SHA-256 hex
    encrypted_blob BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| MongoDB | BYTEA 처리는 PostgreSQL과 동등, 추가 인프라 |
| S3 + DynamoDB | 복잡도 증가, 소규모에 과잉 |

---

## 6. Technical Indicator Calculation Library

### Decision
pandas + numpy 기반 자체 구현. TRADING_STRATEGY_ALGORITHM.md 사양 100% 일치 보장.

### Rationale
- 기존 라이브러리(TA-Lib, pandas-ta)는 파라미터/계산 방식이 사양과 미세하게 다를 수 있음
- Constitution 요구사항: Calculation Transparency - 문서와 구현 100% 일치
- 단위 테스트로 알려진 입출력 쌍 검증 가능

### Implementation Modules
| Module | Functions |
|--------|-----------|
| `bollinger.py` | `calculate_bands()`, `calculate_width()`, `detect_squeeze()` |
| `rsi.py` | `calculate_rsi()` |
| `macd.py` | `calculate_macd()`, `calculate_signal()`, `calculate_histogram()` |
| `volume.py` | `calculate_volume_ratio()` |
| `confidence.py` | `calculate_confidence_score()` |

---

## 7. Frontend State Management

### Decision
Zustand + React Query 조합. Zustand는 클라이언트 상태, React Query는 서버 상태 관리.

### Rationale
- Zustand: 가볍고 간단한 API, Redux 대비 보일러플레이트 최소화
- React Query: 캐싱, 재시도, 백그라운드 리프레시 자동 처리
- 두 라이브러리 조합은 React 생태계에서 검증된 패턴

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Redux Toolkit | 보일러플레이트 과다, 소규모 앱에 과잉 |
| Jotai/Recoil | React Query와 역할 중복 |
| Context API만 | 캐싱/리프레시 직접 구현 필요 |

---

## 8. Development Port Allocation

### Decision
각 서비스에 고정 포트 할당하여 병렬 개발 시 충돌 방지.

### Port Mapping
| Service | Port | Notes |
|---------|------|-------|
| Backend API | 8000 | FastAPI uvicorn |
| Daily Focus Wizard | 3001 | Vite dev server |
| My Portfolio Wizard | 3002 | Vite dev server |
| PostgreSQL | 5432 | Docker compose |
| Redis | 6379 | Docker compose |

---

## Summary

모든 기술적 미확정 사항이 해결되었습니다:

| Category | Decision |
|----------|----------|
| 암호화 | Web Crypto API (AES-GCM 256bit, PBKDF2 키 파생) |
| PEM 인증 | RSA 개인키 기반 키 파생 |
| Rate Limiting | Redis 캐싱 + 토큰 버킷 |
| 모노레포 | pnpm workspaces + Turborepo |
| DB 저장 | PostgreSQL BYTEA |
| 지표 계산 | pandas/numpy 자체 구현 |
| 상태 관리 | Zustand + React Query |
| 포트 할당 | 8000, 3001, 3002, 5432, 6379 |
