import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Layers,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 rounded-xl border border-dashed border-border bg-surface/50 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="p-3.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1">
        {title}
      </h4>
      <p className="text-xs text-text-secondary max-w-md mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
