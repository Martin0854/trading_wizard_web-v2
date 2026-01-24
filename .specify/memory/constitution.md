<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0
Bump rationale: Initial constitution creation (MAJOR)

Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (I. Code Quality, II. Algorithm Integrity, III. API Rate Limit Protection)
  - Data Integrity Standards
  - Development Workflow
  - Governance

Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ No changes needed (Constitution Check section already present)
  - .specify/templates/spec-template.md: ✅ No changes needed (generic template)
  - .specify/templates/tasks-template.md: ✅ No changes needed (generic template)

Follow-up TODOs: None
==================
-->

# Trading Wizard Web Constitution

## Core Principles

### I. Code Quality

All code MUST be well-structured, maintainable, and independently testable:

- **Separation of Concerns**: Business logic (indicators, signals, scoring) MUST be separated from infrastructure (API, database, UI)
- **Type Safety**: All Python code MUST use type hints; TypeScript strict mode MUST be enabled for frontend
- **Error Handling**: All external calls (APIs, database) MUST have explicit error handling with meaningful error messages
- **Documentation**: Public functions and complex algorithms MUST have docstrings explaining purpose, parameters, and return values

**Rationale**: A trading system requires high reliability. Bugs in signal calculation or data handling can lead to incorrect recommendations. Maintainable code enables rapid debugging and feature iteration.

### II. Algorithm Integrity

All trading signal calculations MUST be verifiable, reproducible, and accurately documented:

- **No Magic Numbers**: All indicator parameters (Bollinger period=12, std_dev=1.3, RSI period=14, etc.) MUST be configurable constants, not hardcoded inline
- **Calculation Transparency**: The confidence score formula and signal conditions MUST match documentation exactly; any change requires updating TRADING_STRATEGY_ALGORITHM.md
- **Backtesting Validation**: New signal logic or parameter changes MUST be validated through backtesting before deployment
- **No Financial Advice**: System output MUST be framed as "signals" or "indicators", never as "recommendations to buy/sell"; disclaimers MUST be visible

**Rationale**: Users rely on algorithmic signals for trading decisions. Discrepancies between documented and actual behavior erode trust. Transparency ensures users understand exactly what they're getting.

### III. API Rate Limit Protection

All external data fetching MUST implement rate limiting and caching to prevent API provider bans:

- **Caching First**: Stock price data MUST be cached; re-fetch only when cache is stale (default: 30 minutes for real-time, 24 hours for historical)
- **Request Throttling**: API calls MUST be throttled to stay within provider limits (yfinance: max 2000 requests/hour recommended)
- **Batch Processing**: When scanning multiple stocks, requests MUST be batched with delays between batches
- **Graceful Degradation**: If rate-limited, system MUST use cached data and inform users rather than failing silently

**Rationale**: yfinance and other data providers will block IPs that exceed rate limits. A blocked IP means zero functionality for all users. Caching also improves performance and reduces unnecessary network calls.

## Data Integrity Standards

Data accuracy is critical for a trading signal system. The following standards MUST be enforced:

- **Data Freshness Tracking**: All cached data MUST include timestamps; UI MUST display data age
- **Validation on Fetch**: Price data MUST be validated (no negative prices, volume >= 0, OHLC relationship: Low <= Open/Close <= High)
- **Missing Data Handling**: If data is unavailable for a stock, exclude it from scan results with a clear reason; do not use stale data beyond 24 hours for signal calculation
- **Timezone Consistency**: All timestamps MUST be stored and displayed in KST (Korea Standard Time) for consistency with market hours

## Development Workflow

The following workflow MUST be followed for all code changes:

- **Branch Strategy**: Feature branches from `main`; naming convention: `[issue-number]-feature-name`
- **Testing Requirements**:
  - Unit tests for indicator calculations with known input/output pairs
  - Integration tests for API endpoints
  - Manual testing for UI changes with documented test cases
- **Code Review**: All PRs MUST be reviewed before merge; reviewer MUST verify:
  - No hardcoded API keys or secrets
  - Rate limiting compliance for new API integrations
  - Algorithm changes match documentation updates
- **Pre-commit Checks**: Linting (ruff for Python, ESLint for TypeScript) MUST pass before commit

## Governance

This constitution governs all development decisions for Trading Wizard Web:

- **Amendment Process**: Changes to this constitution require documented justification and explicit approval
- **Version Policy**: Constitution follows semantic versioning (MAJOR.MINOR.PATCH)
  - MAJOR: Principle removal or fundamental redefinition
  - MINOR: New principle or significant guidance expansion
  - PATCH: Clarifications, typo fixes, wording improvements
- **Compliance Review**: All PRs MUST verify compliance with applicable principles; reviewers MUST check the Constitution Check section in implementation plans
- **Conflict Resolution**: Constitution supersedes other documentation in case of conflict

**Version**: 1.0.0 | **Ratified**: 2026-01-24 | **Last Amended**: 2026-01-24
