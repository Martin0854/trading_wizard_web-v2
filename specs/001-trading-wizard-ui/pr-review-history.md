# PR Review History

## PR #1: Trading Wizard 공유 라이브러리 구현

**Date**: 2026-01-24
**Branch**: `001-trading-wizard-ui` → `develop`
**Status**: 수정 후 머지 예정

### Review Summary

전반적으로 잘 구조화된 초기 구현. 기술적 지표 로직이 정확하고 문서화가 잘 되어 있음.
암호화 구현이 견고함. 보안 강화를 위한 일부 수정 필요.

**Recommendation**: Approve with minor changes

---

### Issues Found & Fixes Applied

#### High Priority

| Issue | Description | Fix Applied |
|-------|-------------|-------------|
| Blob Size Limit | DoS 방지를 위한 blob 크기 제한 없음 | ✅ `MAX_BLOB_SIZE = 1MB` 제한 추가 (`user_data.py`) |
| Test Quality | DB 연결 없이 500 상태 코드 허용 | ✅ DB 모킹으로 테스트 재작성 (`test_common_api.py`) |
| API Rate Limiting | API 엔드포인트에 rate limiting 없음 | ✅ `RateLimitMiddleware` 추가 (60 req/min, burst 100) |

#### Medium Priority

| Issue | Description | Fix Applied |
|-------|-------------|-------------|
| Hardcoded Credentials | docker-compose에 하드코딩된 인증정보 | ✅ 환경변수 참조로 변경 (`${POSTGRES_PASSWORD:-trading_dev}`) |
| Encryption Tests | 프론트엔드 암호화 테스트 없음 | ✅ `encryption.test.ts` 추가 |
| Sequential Fetching | 다중 종목 조회가 순차적 (50초+ 소요) | 🔄 추후 개선 예정 (async/concurrent 적용) |

#### Low Priority

| Issue | Description | Fix Applied |
|-------|-------------|-------------|
| Lock Initialization | RateLimiter Lock 초기화 방식 비정상 | ✅ `field(default_factory=Lock)` 사용 |
| Error Types | 더 세분화된 에러 타입 필요 | 🔄 추후 개선 예정 |

---

### Security Considerations

#### Good

- 클라이언트 사이드 암호화로 서버는 데이터 복호화 불가
- 사용자 ID 해시로 서버가 비밀번호 알 수 없음
- Base64 및 해시 형식 검증
- PBKDF2 100k iterations (OWASP 2023 권장 준수)
- AES-GCM 256bit, 12-byte IV

#### Concerns Addressed

| Concern | Status |
|---------|--------|
| CSRF Protection | FastAPI 기본 + SameSite 쿠키로 대응 예정 |
| CORS with Credentials | 프로덕션 origin 검증 필요 |
| API Rate Limiting | ✅ 미들웨어 추가됨 |

---

### Technical Correctness

#### Indicator Calculations ✅

- **Bollinger Bands**: SMA + std_dev 정확
- **RSI**: Gain/Loss 평균 공식 정확
- **MACD**: 12/26/9 EMA 표준 구현
- **Confidence Score**: 문서화된 공식과 일치 (Base 25 + Volume 0-25 + RSI 0-20 + MACD 0-30)

#### Encryption ✅

- PBKDF2: 100k iterations
- AES-GCM: 256-bit key, 12-byte IV
- Salt: 암호문과 함께 저장

---

### Files Changed in This Fix

```
backend/src/api/common/user_data.py          # Blob size limit 추가
backend/src/main.py                           # Rate limit middleware 추가
backend/src/middleware/__init__.py            # New: middleware package
backend/src/middleware/rate_limit.py          # New: rate limiting
backend/tests/integration/test_common_api.py  # DB 모킹으로 재작성
docker-compose.yml                            # 환경변수 참조
shared/data/yfinance_client.py               # Lock 초기화 수정
frontend/.../crypto/__tests__/encryption.test.ts  # New: 암호화 테스트
```

---

### Pending Improvements

1. **Async Batch Fetching**: 다중 종목 조회 성능 개선 (현재 순차적 → 비동기 병렬)
2. **Granular Error Types**: 더 세분화된 에러 타입 정의
3. **CSRF Protection**: 프론트엔드 연동 시 추가
4. **Production CORS**: 프로덕션 배포 시 origin 설정 검토

---

### Lessons Learned

1. **보안 우선**: DoS 방지를 위한 입력 크기 제한은 필수
2. **테스트 품질**: 500 에러를 허용하는 테스트는 실제 테스트가 아님
3. **인증정보 관리**: 환경변수 또는 시크릿 관리 도구 사용 필수
4. **Rate Limiting**: 외부 API뿐 아니라 내부 API에도 필요
