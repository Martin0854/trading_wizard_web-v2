interface WizardCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export function WizardCard({ title, description, icon, onClick }: WizardCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="wizard-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="wizard-icon">{icon}</div>
      <h3 className="wizard-title">{title}</h3>
      <p className="wizard-description">{description}</p>
      <span className="wizard-arrow">→</span>
    </div>
  );
}
