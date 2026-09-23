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
      className={`p-8 rounded-md border border-dashed border-[#263244] bg-[#111827]/40 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="p-3 rounded-full bg-[#151F2E] border border-[#263244] text-[#3B82F6] mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-xs font-semibold text-[#E5E7EB] uppercase tracking-wider mb-1">
        {title}
      </h4>
      <p className="text-xs text-[#94A3B8] max-w-md mb-4 leading-relaxed">
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
