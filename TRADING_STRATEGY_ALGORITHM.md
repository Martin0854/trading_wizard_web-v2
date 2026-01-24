# Trading Wizard 매수 종목 추천 알고리즘 분석

## 개요

Trading Wizard는 한국 주식 시장(KOSPI/KOSDAQ)을 대상으로 기술적 분석 기반의 매수 종목 추천 시스템입니다.
두 가지 핵심 전략을 사용합니다:

1. **Bollinger Band Squeeze Breakout 전략** - 주력 전략

---

## 1. Bollinger Band Squeeze Breakout 전략 (주력)

### 1.1 핵심 개념

볼린저 밴드가 좁아지는 "스퀴즈(Squeeze)" 구간 이후 상단 밴드를 돌파하는 종목을 매수 신호로 포착합니다.

### 1.2 기술적 지표 계산

| 지표 | 계산 방법 | 기본값 |
|------|----------|--------|
| **Bollinger Bands** | SMA ± (표준편차 × 배수) | 기간: 12일, 배수: 1.3σ |
| **BB Width** | (상단 - 하단) / 중심선 × 100 | - |
| **BB Width MA** | BB Width의 이동평균 | 10일 |
| **RSI** | 14일 RSI | 기간: 14일 |
| **MACD** | EMA(12) - EMA(26), Signal: EMA(9) | 12/26/9 |
| **Volume Ratio** | 당일 거래량 / 20일 평균 거래량 | 20일 |

### 1.3 매수 신호 조건

```
BUY Signal = (가격 돌파) AND (스퀴즈 또는 밴드 확장)
```

**조건 1: 가격 돌파 (Price Breakout)**
```python
price_breakout = Close > BB_Upper
```

**조건 2: 스퀴즈 또는 밴드 확장**
```python
was_in_squeeze = BB_Width < (BB_Width_MA × 0.55)  # 최근 5일 중 하나라도 스퀴즈 상태
bandwidth_expanding = BB_Width[today] > BB_Width[yesterday]
```

### 1.4 신뢰도 점수 계산 (0-100점)

```python
def calculate_confidence_score(volume_ratio, rsi, macd_histogram, macd_signal):
    score = 25.0  # 기본 점수 (볼린저 돌파)

    # Volume Score (0-25점)
    # 1.0x → 0점, 1.5x → 12.5점, 2.0x → 25점
    if volume_ratio > 1.0:
        score += min(25.0, (volume_ratio - 1.0) * 25.0)

    # RSI Score (0-20점)
    # RSI 50이 최적(20점), 30/70에서 0점
    if 30 <= rsi <= 70:
        distance = abs(rsi - 50)
        score += 20.0 * (1 - distance / 20.0)

    # MACD Score (0-30점)
    # Histogram이 양수일 때 Signal 대비 비율로 점수 계산
    if macd_histogram > 0:
        macd_ratio = min(macd_histogram / abs(macd_signal), 1.0)
        score += 30.0 * macd_ratio

    return score  # 최대 100점
```

### 1.5 신뢰도 점수 구성

| 항목 | 최대 점수 | 평가 기준 |
|------|----------|----------|
| 기본 (볼린저 돌파) | 25점 | 상단 밴드 돌파 시 부여 |
| 거래량 | 25점 | 평균 대비 2배 이상에서 만점 |
| RSI | 20점 | 50 근처에서 만점, 30/70에서 0점 |
| MACD | 30점 | 히스토그램이 시그널 대비 강할수록 높은 점수 |
| **합계** | **100점** | - |

### 1.6 매수 추천 필터

- 신뢰도 점수 ≥ `confidence_threshold` (기본: 55점)
- 이미 보유 중인 종목 제외
- 결과를 신뢰도 순으로 정렬

---

## 2. 매도 신호 조건

### 2.1 손절매 (Stop Loss)
```python
if pnl_pct <= -stop_loss_percent:  # 기본: -4.5%
    signal = "SELL" (전량 매도)
```

### 2.2 익절매 (Take Profit)
```python
if pnl_pct >= take_profit_pct:  # 기본: +12%
    signal = "SELL"
    sell_quantity = quantity × take_profit_ratio  # 기본: 100%
```

### 2.3 중심선 이탈 (선택적)
```python
if sell_on_middle_band and Close < BB_Middle:
    signal = "SELL" (추세 이탈)
```

---

## 3. 사용자 설정 파라미터

### 3.1 Bollinger Band 전략 설정

| 파라미터 | 기본값 | 설명 |
|---------|--------|------|
| `bollinger_period` | 15 | 볼린저 밴드 이동평균 기간 |
| `bollinger_std_dev` | 1.5 | 표준편차 배수 |
| `squeeze_threshold_pct` | 60 | 스퀴즈 판단 임계값 (%) |
| `squeeze_lookback_days` | 10 | 스퀴즈 MA 기간 |
| `confidence_threshold` | 55 | 최소 신뢰도 점수 |

### 3.2 포지션 관리 설정

| 파라미터 | 기본값 | 설명 |
|---------|--------|------|
| `max_positions` | 15 | 최대 동시 보유 종목 수 |
| `max_position_pct` | 10.0 | 종목당 최대 투자 비중 (%) |
| `stop_loss_pct` | 4.5 | 손절매 기준 (%) |
| `take_profit_pct` | 12.0 | 익절매 기준 (%) |
| `sell_on_middle_band` | False | 중심선 이탈 시 매도 여부 |

---

## 4. 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                      Stock Universe                              │
│                    (KOSPI Top 100)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Fetch Layer                              │
│  ┌─────────────────┐    ┌──────────────────────────────────┐    │
│  │  PostgreSQL DB  │◄───│  yfinance API (30분 이상 경과 시) │    │
│  │  (Primary)      │    │  (Fallback & Update)              │    │
│  └─────────────────┘    └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Indicator Calculation                            │
│  Bollinger Bands │ RSI │ MACD │ Volume Ratio │ Squeeze Detection │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│   Squeeze Breakout        │     │   Contrarian Strategy     │
│   Strategy                │     │                           │
│   ─────────────────────   │     │   ─────────────────────   │
│   • 볼린저 상단 돌파      │     │   • RSI ≤ 30 과매도       │
│   • 스퀴즈 후 확장        │     │   • MACD 골든크로스       │
│   • 신뢰도 점수 계산      │     │   • 반등 신뢰도 계산      │
└───────────────────────────┘     └───────────────────────────┘
            │                                   │
            └─────────────────┬─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Recommendation Engine                           │
│  ─────────────────────────────────────────────────────────────   │
│  • 신뢰도 임계값 필터링                                          │
│  • 신뢰도 순 정렬                                                │
│  • 포지션 사이징 (max_position_pct 적용)                         │
│  • 현금 잔고 검증                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Final Recommendations                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  종목코드 │ 종목명 │ 신호 │ 신뢰도 │ 가격 │ 수량 │ 사유  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 주요 소스 코드 파일

| 파일 경로 | 역할 |
|----------|------|
| `backend/src/core/indicators.py` | 기술적 지표 계산 함수 |
| `backend/src/core/signal_scanner.py` | 신호 스캐너 (백테스트용) |
| `backend/src/wizard/signal_scanner.py` | 신호 스캐너 (실시간/DB 연동) |
| `backend/src/core/recommendation.py` | 추천 엔진 (포지션 사이징) |
| `backend/src/api/contrarian.py` | Contrarian API 엔드포인트 |
| `backend/src/models/user_settings.py` | 사용자 전략 설정 모델 |

---

## 6. 리스크 관리 가이드라인

시스템은 `check_constitution_compliance()` 메서드를 통해 다음 규칙을 권장합니다:

- `stop_loss_pct` ≥ 5% (손실 제한)
- `max_position_pct` ≤ 10% (집중 리스크 방지)
- `max_positions` ≤ 15 (분산 투자)

---

*문서 생성일: 2026-01-24*
*소스 코드 분석 기반*
