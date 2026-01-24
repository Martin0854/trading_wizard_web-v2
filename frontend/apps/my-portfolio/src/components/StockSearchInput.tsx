/**
 * StockSearchInput component with autocomplete
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchStocks } from '../services/api';
import type { Stock } from '@trading-wizard/shared-ui/types';

interface StockSearchInputProps {
  onSelect: (stock: Stock) => void;
  placeholder?: string;
  disabled?: boolean;
}

function StockSearchInput({
  onSelect,
  placeholder = '종목명 또는 코드로 검색',
  disabled = false,
}: StockSearchInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['stockSearch', query],
    queryFn: () => searchStocks(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stock: Stock) => {
    onSelect(stock);
    setQuery('');
    setIsOpen(false);
  };

  const results = searchResults?.results || [];

  return (
    <div className="stock-search">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="stock-search-input"
      />

      {isOpen && query.length >= 2 && (
        <div ref={dropdownRef} className="stock-search-dropdown">
          {isLoading ? (
            <div className="stock-search-loading">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="stock-search-empty">검색 결과가 없습니다</div>
          ) : (
            results.map((stock) => (
              <button
                key={stock.symbol}
                className="stock-search-item"
                onClick={() => handleSelect(stock)}
              >
                <span className="stock-search-name">{stock.name}</span>
                <span className="stock-search-symbol">
                  {stock.symbol.split('.')[0]}
                </span>
                <span className="stock-search-market">{stock.market}</span>
              </button>
            ))
          )}
        </div>
      )}

      <style>{`
        .stock-search {
          position: relative;
          width: 100%;
        }

        .stock-search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .stock-search-input:focus {
          border-color: var(--color-primary);
        }

        .stock-search-input:disabled {
          background-color: var(--color-background);
          cursor: not-allowed;
        }

        .stock-search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 0.25rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          max-height: 300px;
          overflow-y: auto;
          z-index: 100;
        }

        .stock-search-loading,
        .stock-search-empty {
          padding: 1rem;
          text-align: center;
          color: var(--color-text-secondary);
        }

        .stock-search-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .stock-search-item:hover {
          background-color: var(--color-background);
        }

        .stock-search-name {
          flex: 1;
          font-weight: 500;
        }

        .stock-search-symbol {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .stock-search-market {
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          background-color: var(--color-background);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}

export default StockSearchInput;
