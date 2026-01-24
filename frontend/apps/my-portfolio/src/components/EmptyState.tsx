/**
 * EmptyState component for portfolio page
 */

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({
  title = '보유 종목이 없습니다',
  message = '종목을 추가하여 포트폴리오를 시작하세요.',
  actionLabel = '종목 추가',
  onAction,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17,21 17,13 7,13 7,21" />
          <polyline points="7,3 7,8 15,8" />
        </svg>
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {onAction && (
        <button className="empty-state-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}

      <style>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
          background-color: var(--color-surface);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-lg);
        }

        .empty-state-icon {
          color: var(--color-text-secondary);
          margin-bottom: 1rem;
        }

        .empty-state-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 0.5rem;
        }

        .empty-state-message {
          color: var(--color-text-secondary);
          margin-bottom: 1.5rem;
        }

        .empty-state-button {
          padding: 0.75rem 1.5rem;
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .empty-state-button:hover {
          background-color: var(--color-primary-dark);
        }
      `}</style>
    </div>
  );
}

export default EmptyState;
