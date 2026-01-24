"""KOSPI Top 100 stock list provider.

Contains static list of KOSPI Top 100 stocks with validation.
List should be periodically updated as market cap rankings change.
"""

from dataclasses import dataclass
from typing import Optional

from shared.types.models import Market


@dataclass
class KospiStock:
    """KOSPI stock information."""
    symbol: str  # e.g., "005930.KS"
    name: str  # e.g., "삼성전자"
    market: Market = Market.KOSPI


# KOSPI Top 100 stocks by market cap (as of 2026-01)
# Symbol format: {code}.KS for KOSPI, {code}.KQ for KOSDAQ
KOSPI_100_STOCKS: list[KospiStock] = [
    KospiStock("005930.KS", "삼성전자"),
    KospiStock("000660.KS", "SK하이닉스"),
    KospiStock("373220.KS", "LG에너지솔루션"),
    KospiStock("207940.KS", "삼성바이오로직스"),
    KospiStock("005935.KS", "삼성전자우"),
    KospiStock("005380.KS", "현대차"),
    KospiStock("000270.KS", "기아"),
    KospiStock("006400.KS", "삼성SDI"),
    KospiStock("051910.KS", "LG화학"),
    KospiStock("035420.KS", "NAVER"),
    KospiStock("028260.KS", "삼성물산"),
    KospiStock("105560.KS", "KB금융"),
    KospiStock("055550.KS", "신한지주"),
    KospiStock("035720.KS", "카카오"),
    KospiStock("012330.KS", "현대모비스"),
    KospiStock("066570.KS", "LG전자"),
    KospiStock("003670.KS", "포스코홀딩스"),
    KospiStock("096770.KS", "SK이노베이션"),
    KospiStock("034730.KS", "SK"),
    KospiStock("003550.KS", "LG"),
    KospiStock("032830.KS", "삼성생명"),
    KospiStock("086790.KS", "하나금융지주"),
    KospiStock("015760.KS", "한국전력"),
    KospiStock("017670.KS", "SK텔레콤"),
    KospiStock("033780.KS", "KT&G"),
    KospiStock("034020.KS", "두산에너빌리티"),
    KospiStock("010130.KS", "고려아연"),
    KospiStock("018260.KS", "삼성에스디에스"),
    KospiStock("009150.KS", "삼성전기"),
    KospiStock("024110.KS", "기업은행"),
    KospiStock("000810.KS", "삼성화재"),
    KospiStock("010950.KS", "S-Oil"),
    KospiStock("000100.KS", "유한양행"),
    KospiStock("005490.KS", "POSCO"),
    KospiStock("003490.KS", "대한항공"),
    KospiStock("036570.KS", "엔씨소프트"),
    KospiStock("011170.KS", "롯데케미칼"),
    KospiStock("090430.KS", "아모레퍼시픽"),
    KospiStock("051900.KS", "LG생활건강"),
    KospiStock("030200.KS", "KT"),
    KospiStock("068270.KS", "셀트리온"),
    KospiStock("009540.KS", "HD한국조선해양"),
    KospiStock("035250.KS", "강원랜드"),
    KospiStock("000880.KS", "한화"),
    KospiStock("016360.KS", "삼성증권"),
    KospiStock("011790.KS", "SKC"),
    KospiStock("010140.KS", "삼성중공업"),
    KospiStock("006360.KS", "GS건설"),
    KospiStock("001040.KS", "CJ"),
    KospiStock("004020.KS", "현대제철"),
    KospiStock("004990.KS", "롯데지주"),
    KospiStock("016380.KS", "KG동부제철"),
    KospiStock("000720.KS", "현대건설"),
    KospiStock("138930.KS", "BNK금융지주"),
    KospiStock("326030.KS", "SK바이오팜"),
    KospiStock("005940.KS", "NH투자증권"),
    KospiStock("006800.KS", "미래에셋증권"),
    KospiStock("000150.KS", "두산"),
    KospiStock("007070.KS", "GS리테일"),
    KospiStock("267250.KS", "HD현대"),
    KospiStock("002790.KS", "아모레G"),
    KospiStock("005830.KS", "DB손해보험"),
    KospiStock("139480.KS", "이마트"),
    KospiStock("004170.KS", "신세계"),
    KospiStock("271560.KS", "오리온"),
    KospiStock("161390.KS", "한국타이어앤테크놀로지"),
    KospiStock("011210.KS", "현대위아"),
    KospiStock("042670.KS", "두산인프라코어"),
    KospiStock("011780.KS", "금호석유"),
    KospiStock("021240.KS", "코웨이"),
    KospiStock("282330.KS", "BGF리테일"),
    KospiStock("128940.KS", "한미약품"),
    KospiStock("011070.KS", "LG이노텍"),
    KospiStock("047050.KS", "포스코인터내셔널"),
    KospiStock("009830.KS", "한화솔루션"),
    KospiStock("097950.KS", "CJ제일제당"),
    KospiStock("010620.KS", "현대미포조선"),
    KospiStock("000120.KS", "CJ대한통운"),
    KospiStock("241560.KS", "두산밥캣"),
    KospiStock("047810.KS", "한국항공우주"),
    KospiStock("180640.KS", "한진칼"),
    KospiStock("001450.KS", "현대해상"),
    KospiStock("012450.KS", "한화에어로스페이스"),
    KospiStock("000990.KS", "DB하이텍"),
    KospiStock("036460.KS", "한국가스공사"),
    KospiStock("032640.KS", "LG유플러스"),
    KospiStock("011200.KS", "HMM"),
    KospiStock("069960.KS", "현대백화점"),
    KospiStock("006260.KS", "LS"),
    KospiStock("004370.KS", "농심"),
    KospiStock("003410.KS", "쌍용C&E"),
    KospiStock("272210.KS", "한화시스템"),
    KospiStock("000210.KS", "대림산업"),
    KospiStock("003230.KS", "삼양식품"),
    KospiStock("023530.KS", "롯데쇼핑"),
    KospiStock("020150.KS", "일진머티리얼즈"),
    KospiStock("001120.KS", "LX인터내셔널"),
    KospiStock("005250.KS", "녹십자홀딩스"),
    KospiStock("078930.KS", "GS"),
    KospiStock("001800.KS", "오리온홀딩스"),
]


def get_kospi100_symbols() -> list[str]:
    """Get list of KOSPI 100 stock symbols.

    Returns:
        List of stock symbols (e.g., ["005930.KS", "000660.KS", ...])
    """
    return [stock.symbol for stock in KOSPI_100_STOCKS]


def get_kospi100_stocks() -> list[KospiStock]:
    """Get list of KOSPI 100 stocks with names.

    Returns:
        List of KospiStock objects
    """
    return KOSPI_100_STOCKS.copy()


def get_stock_by_symbol(symbol: str) -> Optional[KospiStock]:
    """Find stock by symbol.

    Args:
        symbol: Stock symbol (e.g., "005930.KS")

    Returns:
        KospiStock if found, None otherwise
    """
    for stock in KOSPI_100_STOCKS:
        if stock.symbol == symbol:
            return stock
    return None


def search_stocks(query: str, limit: int = 10) -> list[KospiStock]:
    """Search stocks by name or symbol.

    Args:
        query: Search query (partial match)
        limit: Maximum results to return

    Returns:
        List of matching stocks
    """
    query_lower = query.lower()
    results: list[KospiStock] = []

    for stock in KOSPI_100_STOCKS:
        if query_lower in stock.symbol.lower() or query_lower in stock.name.lower():
            results.append(stock)
            if len(results) >= limit:
                break

    return results


def validate_symbol(symbol: str) -> bool:
    """Check if symbol is in KOSPI 100 list.

    Args:
        symbol: Stock symbol to validate

    Returns:
        True if valid KOSPI 100 symbol
    """
    return any(stock.symbol == symbol for stock in KOSPI_100_STOCKS)
