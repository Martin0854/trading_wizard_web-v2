# Shared Library

Trading Wizard 공용 라이브러리. Daily Focus와 My Portfolio 앱에서 공통으로 사용하는 기능을 제공합니다.

## 설치

```bash
pip install -r backend/requirements.txt
```

## 모듈 구조

```
shared/
├── types/          # 데이터 모델 및 타입 정의
├── data/           # 데이터 가져오기 및 캐싱
├── indicators/     # 기술적 지표 계산
└── tests/          # 단위 테스트
```

## 사용법

### 기술적 지표 (Technical Indicators)

```python
from shared.indicators import TechnicalIndicatorEngine

# 엔진 초기화
engine = TechnicalIndicatorEngine()

# 모든 지표 한번에 계산
result = engine.calculate_all(
    prices=price_dataframe,
    bollinger_period=12,
    bollinger_std_dev=1.3,
    rsi_period=14,
    volume_ma_period=20
)

# 결과 사용
print(f"Bollinger Bands: {result.bollinger}")
print(f"RSI: {result.rsi}")
print(f"MACD: {result.macd}")
print(f"Volume Ratio: {result.volume_ratio}")
print(f"Confidence Score: {result.confidence_score}")
```

### 개별 지표 사용

```python
from shared.indicators.bollinger import calculate_bollinger_bands
from shared.indicators.rsi import calculate_rsi
from shared.indicators.macd import calculate_macd
from shared.indicators.volume import calculate_volume_ratio
from shared.indicators.confidence import calculate_confidence_score

# Bollinger Bands
bollinger = calculate_bollinger_bands(
    prices=df['Close'],
    period=12,
    std_dev=1.3,
    squeeze_threshold=0.1
)
print(f"Upper: {bollinger.upper}, Middle: {bollinger.middle}, Lower: {bollinger.lower}")
print(f"Squeeze 여부: {bollinger.is_in_squeeze}")

# RSI (Wilder's Smoothing)
rsi = calculate_rsi(prices=df['Close'], period=14)

# MACD
macd = calculate_macd(
    prices=df['Close'],
    fast_period=12,
    slow_period=26,
    signal_period=9
)

# Volume Ratio
volume_ratio = calculate_volume_ratio(
    volumes=df['Volume'],
    ma_period=20
)

# Confidence Score (0-100)
confidence = calculate_confidence_score(
    volume_ratio=volume_ratio,
    rsi=rsi,
    macd_histogram=macd.histogram,
    macd_signal=macd.signal
)
```

### 신뢰도 점수 계산 공식

```
Confidence Score = Base + Volume + RSI + MACD

- Base (25점): Bollinger Band 돌파 기본 점수
- Volume (0-25점): 거래량 증가 비율에 비례
  - volume_ratio > 1.0일 때: min(25, (ratio - 1.0) * 25)
- RSI (0-20점): 30-70 범위에서 50에 가까울수록 높음
  - 30 ≤ RSI ≤ 70일 때: 20 * (1 - |RSI - 50| / 20)
- MACD (0-30점): 히스토그램이 양수이고 시그널 대비 강할수록 높음
  - histogram > 0일 때: 30 * min(histogram / |signal|, 1.0)
```

### yfinance 클라이언트

```python
from shared.data.yfinance_client import YFinanceClient

client = YFinanceClient()

# 현재 가격 조회
response = client.get_current_price('005930.KS')  # 삼성전자
if response:
    print(f"현재가: {response.stock.current_price:,}원")
    print(f"전일 대비: {response.stock.change_percent:+.2f}%")

# 가격 히스토리 조회
history = client.get_price_history('005930.KS', period='3mo')
if history is not None:
    print(history.tail())

# 여러 종목 일괄 조회
from shared.data.batch_fetcher import BatchFetcher

fetcher = BatchFetcher(client)
results = fetcher.fetch_multiple(
    symbols=['005930.KS', '000660.KS', '035720.KQ'],
    on_progress=lambda current, total: print(f"{current}/{total}")
)
```

### KOSPI 100 종목 리스트

```python
from shared.data.kospi100 import get_kospi100_stocks, get_kospi100_symbols

# 전체 종목 정보
stocks = get_kospi100_stocks()
for stock in stocks[:5]:
    print(f"{stock['symbol']}: {stock['name']}")

# 심볼만 가져오기
symbols = get_kospi100_symbols()
print(symbols[:5])  # ['005930.KS', '000660.KS', ...]
```

### Redis 캐싱

```python
from shared.data.cache import RedisCache

cache = RedisCache(host='localhost', port=6379)

# 실시간 가격 캐싱 (TTL: 30분)
cache.set_realtime_price('005930.KS', {'price': 72500, 'change': 0.5})
price = cache.get_realtime_price('005930.KS')

# 히스토리 캐싱 (TTL: 24시간)
cache.set_history('005930.KS', history_df.to_dict())
history = cache.get_history('005930.KS')
```

### 데이터 검증

```python
from shared.data.validators import validate_ohlcv_row, validate_price_dataframe

# 단일 행 검증
result = validate_ohlcv_row(
    open_price=72000,
    high=73500,
    low=71500,
    close=72500,
    volume=15000000
)
if not result.is_valid:
    print(f"검증 실패: {result.error_message}")

# DataFrame 검증
result = validate_price_dataframe(df)
if result.is_valid:
    print("데이터 유효")
```

### 타입 및 모델

```python
from shared.types.models import Stock, Market, TechnicalIndicators
from shared.types.settings import DailyFocusSettings, PortfolioSettings

# Daily Focus 기본 설정
settings = DailyFocusSettings()
print(f"Bollinger Period: {settings.bollinger_period}")
print(f"Confidence Threshold: {settings.confidence_threshold}")

# Portfolio 기본 설정
portfolio = PortfolioSettings()
print(f"Stop Loss: {portfolio.stop_loss_pct}%")
print(f"Take Profit: {portfolio.take_profit_pct}%")
```

## Rate Limiting

yfinance API 호출은 자동으로 rate limit이 적용됩니다:
- 최대 2000 requests/hour
- Token bucket 알고리즘 사용
- 토큰 부족 시 자동 대기

## 테스트

```bash
# 단위 테스트 실행
pytest shared/tests/unit/ -v

# 전체 테스트
pytest shared/tests/ -v
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `REDIS_HOST` | localhost | Redis 호스트 |
| `REDIS_PORT` | 6379 | Redis 포트 |
| `CACHE_TTL_REALTIME` | 1800 | 실시간 데이터 TTL (초) |
| `CACHE_TTL_HISTORY` | 86400 | 히스토리 데이터 TTL (초) |

## 의존성

- Python 3.11+
- pandas >= 2.0.0
- numpy >= 1.24.0
- yfinance >= 0.2.28
- redis >= 5.0.0
