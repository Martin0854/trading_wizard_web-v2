# Data Model: Trading Wizard Web Interface

**Feature**: 001-trading-wizard-ui
**Date**: 2026-01-24
**Source**: spec.md Key Entities

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Server-Side (PostgreSQL)                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  UserData (encrypted_blob)                                   │    │
│  │  - 서버는 평문 접근 불가                                      │    │
│  │  - 클라이언트에서 복호화 후 아래 엔티티로 파싱                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (decrypt)
┌─────────────────────────────────────────────────────────────────────┐
│                     Client-Side (Decrypted JSON)                     │
│                                                                      │
│  ┌──────────────────┐     ┌──────────────────────────────────────┐  │
│  │ StrategySettings │     │           PortfolioPosition          │  │
│  │ (Daily Focus)    │     │  ┌──────────────┐  ┌──────────────┐  │  │
│  └──────────────────┘     │  │    Stock     │  │TradingHistory│  │  │
│                           │  └──────────────┘  └──────────────┘  │  │
│  ┌──────────────────┐     │                                      │  │
│  │ StrategySettings │     │  ┌──────────────────────────────┐   │  │
│  │ (My Portfolio)   │     │  │      SellRecommendation      │   │  │
│  └──────────────────┘     │  └──────────────────────────────┘   │  │
│                           └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      External Data (yfinance)                        │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐    │
│  │      Stock       │  │          TechnicalIndicators          │    │
│  │   (실시간 가격)   │  │  (Bollinger, RSI, MACD, Volume)       │    │
│  └──────────────────┘  └──────────────────────────────────────┘    │
│                                    │                                 │
│                                    ▼                                 │
│                        ┌──────────────────────┐                     │
│                        │   BuyRecommendation  │                     │
│                        │    (계산된 신호)      │                     │
│                        └──────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. UserData (Server-Side)

서버 DB에 저장되는 암호화된 사용자 데이터.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `user_id_hash` | VARCHAR(64) | PK, NOT NULL | 비밀번호/PEM에서 파생된 SHA-256 해시 (hex) |
| `encrypted_blob` | BYTEA | NOT NULL | AES-GCM 암호화된 JSON blob |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 최초 생성 시각 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 마지막 업데이트 시각 |

**Notes**:
- 서버는 `encrypted_blob`을 복호화할 수 없음
- `user_id_hash`는 비밀번호 변경 시 변경됨 (새 사용자로 취급)

---

## 2. DecryptedUserData (Client-Side JSON)

클라이언트에서 복호화된 후의 데이터 구조.

```typescript
interface DecryptedUserData {
  version: number;  // 스키마 버전 (마이그레이션용)
  dailyFocusSettings: StrategySettings;
  portfolioSettings: PortfolioSettings;
  positions: PortfolioPosition[];
  tradingHistory: TradingHistory[];
}
```

---

## 3. Stock

종목 기본 정보 (yfinance에서 조회).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `symbol` | string | PK | 종목코드 (예: "005930.KS") |
| `name` | string | NOT NULL | 종목명 (예: "삼성전자") |
| `market` | enum | "KOSPI" \| "KOSDAQ" | 시장 구분 |
| `currentPrice` | number | >= 0 | 현재가 (원) |
| `previousClose` | number | >= 0 | 전일 종가 |
| `changePercent` | number | | 등락률 (%) |
| `volume` | number | >= 0 | 당일 거래량 |
| `updatedAt` | datetime | | 데이터 조회 시각 (KST) |

**Validation**:
- `currentPrice` > 0
- `volume` >= 0
- OHLC 관계: Low <= Open, Close <= High

---

## 4. TechnicalIndicators

종목별 기술적 지표 (계산된 값).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `symbol` | string | FK → Stock | 종목코드 |
| `bollinger` | BollingerBands | | 볼린저 밴드 지표 |
| `rsi` | number | 0-100 | RSI (14일) |
| `macd` | MACDIndicator | | MACD 지표 |
| `volumeRatio` | number | >= 0 | 거래량 비율 (당일/20일 평균) |
| `calculatedAt` | datetime | | 계산 시각 (KST) |

### BollingerBands (Sub-entity)

| Field | Type | Description |
|-------|------|-------------|
| `upper` | number | 상단 밴드 |
| `middle` | number | 중심선 (SMA) |
| `lower` | number | 하단 밴드 |
| `width` | number | 밴드폭 (%) |
| `widthMA` | number | 밴드폭 이동평균 |
| `isInSqueeze` | boolean | 스퀴즈 상태 여부 |
| `isExpanding` | boolean | 밴드 확장 중 여부 |

### MACDIndicator (Sub-entity)

| Field | Type | Description |
|-------|------|-------------|
| `macd` | number | MACD 라인 |
| `signal` | number | 시그널 라인 |
| `histogram` | number | 히스토그램 |

---

## 5. BuyRecommendation

매수 추천 신호 (Daily Focus Wizard 출력).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `symbol` | string | FK → Stock | 종목코드 |
| `stock` | Stock | | 종목 정보 (조인) |
| `confidenceScore` | number | 0-100 | 신뢰도 점수 |
| `signalReason` | string | | 추천 사유 (예: "볼린저 상단 돌파 + 스퀴즈 해제") |
| `indicators` | TechnicalIndicators | | 계산된 지표 |
| `generatedAt` | datetime | | 신호 생성 시각 (KST) |

**Derived Fields**:
- `isAboveThreshold`: confidenceScore >= settings.confidenceThreshold

**Calculation** (from TRADING_STRATEGY_ALGORITHM.md):
```
confidenceScore = 25 (기본)
                + min(25, (volumeRatio - 1) * 25)  // 거래량
                + RSI 점수 (0-20, 50에서 최대)      // RSI
                + MACD 점수 (0-30, histogram/signal) // MACD
```

---

## 6. StrategySettings (Daily Focus)

Daily Focus Wizard 전략 파라미터.

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `bollingerPeriod` | number | 12 | 5-50 | 볼린저 밴드 기간 (일) |
| `bollingerStdDev` | number | 1.3 | 0.5-3.0 | 표준편차 배수 (σ) |
| `squeezeThresholdPct` | number | 55 | 30-80 | 스퀴즈 판단 임계값 (%) |
| `squeezeLookbackDays` | number | 5 | 3-20 | 스퀴즈 확인 기간 (일) |
| `bbWidthMAPeriod` | number | 10 | 5-30 | BB Width MA 기간 |
| `confidenceThreshold` | number | 55 | 0-100 | 최소 신뢰도 점수 |
| `rsiPeriod` | number | 14 | 7-28 | RSI 기간 |
| `macdFast` | number | 12 | 5-20 | MACD 빠른 EMA |
| `macdSlow` | number | 26 | 15-40 | MACD 느린 EMA |
| `macdSignal` | number | 9 | 5-15 | MACD 시그널 EMA |
| `volumeAvgPeriod` | number | 20 | 10-60 | 거래량 평균 기간 |

---

## 7. PortfolioSettings (My Portfolio)

My Portfolio Wizard 매도 전략 파라미터.

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `stopLossPct` | number | -4.5 | -20 to 0 | 손절매 기준 (%) |
| `takeProfitPct` | number | 12.0 | 0-100 | 익절매 기준 (%) |
| `sellOnMiddleBand` | boolean | false | | 중심선 이탈 시 매도 여부 |
| `bollingerPeriod` | number | 12 | 5-50 | 볼린저 밴드 기간 (매도 신호용) |
| `bollingerStdDev` | number | 1.3 | 0.5-3.0 | 표준편차 배수 |

---

## 8. PortfolioPosition

보유 종목 포지션.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | string | PK, UUID | 포지션 고유 ID |
| `symbol` | string | NOT NULL | 종목코드 |
| `stockName` | string | NOT NULL | 종목명 (매수 시점 기록) |
| `avgBuyPrice` | number | > 0 | 평균 매수가 |
| `quantity` | number | > 0, integer | 보유 수량 |
| `totalInvested` | number | > 0 | 총 투자금액 |
| `firstBuyDate` | date | NOT NULL | 최초 매수일 |
| `lastBuyDate` | date | NOT NULL | 마지막 매수일 |
| `status` | enum | "holding" \| "sold" | 보유 상태 |
| `soldPrice` | number? | >= 0 | 매도가 (매도 시) |
| `soldDate` | date? | | 매도일 (매도 시) |
| `soldQuantity` | number? | | 매도 수량 |

**Derived Fields** (계산):
- `currentPrice`: Stock에서 조회
- `currentValue`: currentPrice * quantity
- `pnl`: currentValue - totalInvested
- `pnlPercent`: (pnl / totalInvested) * 100
- `holdingDays`: today - firstBuyDate

**Average Price Calculation** (동일 종목 복수 매수):
```
newAvgPrice = (oldAvgPrice * oldQty + newPrice * newQty) / (oldQty + newQty)
```

---

## 9. SellRecommendation

매도 추천 신호 (My Portfolio Wizard 출력).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `positionId` | string | FK → PortfolioPosition | 포지션 ID |
| `type` | enum | "stop_loss" \| "take_profit" \| "trend_break" | 추천 유형 |
| `reason` | string | | 추천 사유 |
| `currentPnlPct` | number | | 현재 수익률 (%) |
| `triggerValue` | number | | 트리거 값 (손절: -4.5%, 익절: +12% 등) |
| `generatedAt` | datetime | | 신호 생성 시각 |

**Signal Conditions**:
- `stop_loss`: pnlPercent <= settings.stopLossPct
- `take_profit`: pnlPercent >= settings.takeProfitPct
- `trend_break`: currentPrice < bollinger.middle AND settings.sellOnMiddleBand

---

## 10. TradingHistory

거래 내역 기록.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | string | PK, UUID | 거래 고유 ID |
| `positionId` | string | FK → PortfolioPosition | 연결된 포지션 |
| `symbol` | string | NOT NULL | 종목코드 |
| `type` | enum | "buy" \| "sell" | 거래 유형 |
| `price` | number | > 0 | 거래 가격 |
| `quantity` | number | > 0, integer | 거래 수량 |
| `totalAmount` | number | > 0 | 거래 금액 |
| `tradedAt` | datetime | NOT NULL | 거래 일시 (KST) |
| `note` | string? | | 메모 |

---

## State Transitions

### PortfolioPosition Lifecycle

```
                    ┌──────────────────────┐
                    │                      │
    [매수 추가]      │                      │    [매도 처리]
        │           │      holding         │──────────────────▶ sold
        │           │                      │
        └──────────▶│                      │
                    │                      │
                    └──────────────────────┘
                             │
                             │ [추가 매수]
                             │ avgBuyPrice 재계산
                             ▼
                    ┌──────────────────────┐
                    │      holding         │
                    │   (수량/평균가 갱신)  │
                    └──────────────────────┘
```

### SellRecommendation Generation

```
[Position 조회] ──▶ [현재가 조회] ──▶ [수익률 계산] ──▶ [조건 검사]
                                                           │
                        ┌──────────────────────────────────┼──────────────────┐
                        │                                  │                  │
                        ▼                                  ▼                  ▼
                   pnl <= stopLoss              pnl >= takeProfit    price < middle
                        │                                  │          AND sellOnMiddle
                        ▼                                  ▼                  │
                   stop_loss                          take_profit             ▼
                                                                         trend_break
```

---

## Indexes

### Server-Side (PostgreSQL)

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| user_data | user_id_hash | PRIMARY | 사용자 조회 |

### Client-Side (in-memory)

| Entity | Index Key | Purpose |
|--------|-----------|---------|
| PortfolioPosition | symbol | 종목별 포지션 조회 |
| PortfolioPosition | status | 보유/매도 필터링 |
| TradingHistory | positionId | 포지션별 거래 내역 |
| TradingHistory | tradedAt | 시간순 정렬 |

---

## Version Migration

`DecryptedUserData.version` 필드로 스키마 버전 관리:

| Version | Changes |
|---------|---------|
| 1 | 초기 스키마 |
| 2+ | 향후 필드 추가/변경 시 마이그레이션 로직 적용 |

```typescript
function migrateUserData(data: any): DecryptedUserData {
  if (data.version === 1) {
    // v1 → v2 마이그레이션
  }
  return data as DecryptedUserData;
}
```
