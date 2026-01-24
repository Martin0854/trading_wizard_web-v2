# Trading Wizard Design System

Trading Wizard 애플리케이션의 통일된 디자인 시스템입니다.

## 개요

모든 앱(Portal, Daily Focus, My Portfolio)은 동일한 디자인 토큰을 사용하여 일관된 사용자 경험을 제공합니다.

## 컬러 팔레트

### Primary Colors (Blue)
메인 액션, 링크, 강조 요소에 사용됩니다.

| Token | Hex | 용도 |
|-------|-----|------|
| `--tw-color-primary` | `#2563eb` | 기본 primary 색상 |
| `--tw-color-primary-light` | `#3b82f6` | hover, 밝은 변형 |
| `--tw-color-primary-dark` | `#1d4ed8` | active, 어두운 변형 |

### Secondary Colors (Teal/Green)
보조 액션, 성공 상태, 긍정적 지표에 사용됩니다.

| Token | Hex | 용도 |
|-------|-----|------|
| `--tw-color-secondary` | `#10b981` | 기본 secondary 색상 |
| `--tw-color-secondary-light` | `#34d399` | 밝은 변형 |
| `--tw-color-secondary-dark` | `#059669` | 어두운 변형 |

### Semantic Colors

| Token | Hex | 용도 |
|-------|-----|------|
| `--tw-color-success` | `#22c55e` | 성공 메시지 |
| `--tw-color-warning` | `#f59e0b` | 경고 메시지 |
| `--tw-color-error` | `#ef4444` | 에러 메시지 |
| `--tw-color-info` | `#3b82f6` | 정보 메시지 |

### Trading Colors
주식 거래 관련 데이터 표시에 사용됩니다.

| Token | Hex | 용도 |
|-------|-----|------|
| `--tw-color-bullish` | `#22c55e` | 상승/긍정 (초록) |
| `--tw-color-bearish` | `#ef4444` | 하락/부정 (빨강) |
| `--tw-color-neutral` | `#64748b` | 중립 (회색) |

### Background Colors

| Token | Hex | 용도 |
|-------|-----|------|
| `--tw-color-bg` | `#f8fafc` | 페이지 배경 |
| `--tw-color-bg-secondary` | `#f1f5f9` | 섹션 배경, 입력 필드 배경 |
| `--tw-color-bg-card` | `#ffffff` | 카드, 모달 배경 |
| `--tw-color-bg-elevated` | `#ffffff` | 떠있는 요소 |

### Text Colors

| Token | Hex | 용도 |
|-------|-----|------|
| `--tw-color-text` | `#1e293b` | 기본 텍스트 |
| `--tw-color-text-secondary` | `#64748b` | 보조 텍스트, 설명 |
| `--tw-color-text-muted` | `#94a3b8` | 비활성 텍스트, 힌트 |

### Border Colors

| Token | Hex | 용도 |
|-------|-----|------|
| `--tw-color-border` | `#e2e8f0` | 기본 테두리 |
| `--tw-color-border-light` | `#f1f5f9` | 밝은 테두리 |
| `--tw-color-border-dark` | `#cbd5e1` | 강조 테두리 |

## Typography

### Font Family

```css
--tw-font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--tw-font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
```

### Font Sizes

| Token | Size | Pixels | 용도 |
|-------|------|--------|------|
| `--tw-text-xs` | 0.75rem | 12px | 캡션, 뱃지 |
| `--tw-text-sm` | 0.875rem | 14px | 보조 텍스트, 버튼 |
| `--tw-text-base` | 1rem | 16px | 본문 |
| `--tw-text-lg` | 1.125rem | 18px | 소제목 |
| `--tw-text-xl` | 1.25rem | 20px | 제목 |
| `--tw-text-2xl` | 1.5rem | 24px | 큰 제목 |
| `--tw-text-3xl` | 1.875rem | 30px | 페이지 제목 |
| `--tw-text-4xl` | 2.25rem | 36px | 히어로 제목 |

### Font Weights

| Token | Weight | 용도 |
|-------|--------|------|
| `--tw-font-normal` | 400 | 본문 |
| `--tw-font-medium` | 500 | 강조 텍스트 |
| `--tw-font-semibold` | 600 | 버튼, 소제목 |
| `--tw-font-bold` | 700 | 제목 |

## Spacing

일관된 간격을 위해 4px 기반의 스케일을 사용합니다.

| Token | Size | Pixels | 용도 |
|-------|------|--------|------|
| `--tw-spacing-1` | 0.25rem | 4px | 아이콘 간격 |
| `--tw-spacing-2` | 0.5rem | 8px | 작은 간격 |
| `--tw-spacing-3` | 0.75rem | 12px | 요소 내부 패딩 |
| `--tw-spacing-4` | 1rem | 16px | 기본 간격 |
| `--tw-spacing-6` | 1.5rem | 24px | 섹션 간격 |
| `--tw-spacing-8` | 2rem | 32px | 큰 섹션 간격 |

### Semantic Spacing

| Token | Size | 용도 |
|-------|------|------|
| `--tw-spacing-xs` | 4px | 최소 간격 |
| `--tw-spacing-sm` | 8px | 작은 간격 |
| `--tw-spacing-md` | 16px | 기본 간격 |
| `--tw-spacing-lg` | 24px | 큰 간격 |
| `--tw-spacing-xl` | 32px | 섹션 간격 |

## Border Radius

| Token | Size | 용도 |
|-------|------|------|
| `--tw-radius-sm` | 4px | 뱃지, 작은 요소 |
| `--tw-radius-md` | 6px | 버튼, 입력 필드 |
| `--tw-radius-lg` | 8px | 카드, 모달 |
| `--tw-radius-xl` | 12px | 큰 카드 |
| `--tw-radius-2xl` | 16px | 히어로 섹션 |
| `--tw-radius-full` | 9999px | 원형 요소 |

## Shadows

| Token | 용도 |
|-------|------|
| `--tw-shadow-sm` | 미세한 그림자 |
| `--tw-shadow` | 기본 그림자 |
| `--tw-shadow-md` | 카드 그림자 |
| `--tw-shadow-lg` | 모달, 드롭다운 |
| `--tw-shadow-xl` | 팝오버 |

## Transitions

| Token | Duration | 용도 |
|-------|----------|------|
| `--tw-transition-fast` | 150ms | 빠른 피드백 (hover) |
| `--tw-transition-base` | 200ms | 기본 전환 |
| `--tw-transition-slow` | 300ms | 복잡한 애니메이션 |

## Z-Index Scale

| Token | Value | 용도 |
|-------|-------|------|
| `--tw-z-dropdown` | 100 | 드롭다운 메뉴 |
| `--tw-z-sticky` | 200 | 고정 헤더 |
| `--tw-z-fixed` | 300 | 고정 요소 |
| `--tw-z-modal-backdrop` | 400 | 모달 배경 |
| `--tw-z-modal` | 500 | 모달 |
| `--tw-z-popover` | 600 | 팝오버 |
| `--tw-z-tooltip` | 700 | 툴팁 |

## Breakpoints

| Name | Width | 용도 |
|------|-------|------|
| sm | 640px | 모바일 (landscape) |
| md | 768px | 태블릿 |
| lg | 1024px | 작은 데스크탑 |
| xl | 1280px | 데스크탑 |
| 2xl | 1536px | 큰 데스크탑 |

## 컴포넌트 가이드라인

### 버튼

```css
/* Primary Button */
.btn-primary {
  background: var(--tw-color-primary);
  color: white;
  padding: var(--tw-spacing-3) var(--tw-spacing-6);
  border-radius: var(--tw-radius-lg);
  font-weight: var(--tw-font-semibold);
  transition: background var(--tw-transition-base);
}

.btn-primary:hover {
  background: var(--tw-color-primary-dark);
}

/* Secondary Button */
.btn-secondary {
  background: var(--tw-color-bg-card);
  color: var(--tw-color-secondary);
  border: 1px solid var(--tw-color-secondary);
  padding: var(--tw-spacing-3) var(--tw-spacing-6);
  border-radius: var(--tw-radius-lg);
}

.btn-secondary:hover {
  background: var(--tw-color-secondary);
  color: white;
}
```

### 카드

```css
.card {
  background: var(--tw-color-bg-card);
  border: 1px solid var(--tw-color-border);
  border-radius: var(--tw-radius-xl);
  padding: var(--tw-spacing-6);
  box-shadow: var(--tw-shadow);
}

.card:hover {
  border-color: var(--tw-color-primary);
  box-shadow: var(--tw-shadow-lg);
}
```

### 입력 필드

```css
.input {
  background: var(--tw-color-bg-card);
  border: 1px solid var(--tw-color-border);
  border-radius: var(--tw-radius-lg);
  padding: var(--tw-spacing-3) var(--tw-spacing-4);
  font-size: var(--tw-text-base);
  transition: border-color var(--tw-transition-base);
}

.input:focus {
  border-color: var(--tw-color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}
```

### 뱃지

```css
.badge {
  display: inline-flex;
  padding: var(--tw-spacing-1) var(--tw-spacing-2);
  background: var(--tw-color-bg-secondary);
  border-radius: var(--tw-radius-sm);
  font-size: var(--tw-text-xs);
  font-weight: var(--tw-font-semibold);
  text-transform: uppercase;
}

.badge-success { color: var(--tw-color-success); }
.badge-warning { color: var(--tw-color-warning); }
.badge-error { color: var(--tw-color-error); }
```

## 사용 방법

### CSS에서 사용

```css
/* 앱의 메인 CSS 파일에서 */
:root {
  /* Design tokens 정의 */
  --tw-color-primary: #2563eb;
  /* ... */
}

.my-component {
  color: var(--tw-color-text);
  padding: var(--tw-spacing-4);
  border-radius: var(--tw-radius-lg);
}
```

### TypeScript/JavaScript에서 사용

```typescript
import { theme, colors, spacing } from '@trading-wizard/shared-ui';

// 테마 값 사용
const primaryColor = colors.primary.main; // '#2563eb'
const baseSpacing = spacing[4]; // '1rem'
```

## 파일 구조

```
frontend/packages/shared-ui/src/styles/
├── design-tokens.css    # CSS 변수 정의
└── theme.ts             # TypeScript 테마 객체

frontend/apps/
├── portal/src/styles/index.css
├── daily-focus/src/styles/global.css
└── my-portfolio/src/styles/index.css
```

## 변경 이력

- **2024-01**: 다크 테마에서 라이트 테마로 통일
- **2024-01**: CSS 변수 네이밍 규칙 `--tw-` 접두사로 통일
- **2024-01**: Trading 관련 컬러 (bullish/bearish) 추가
