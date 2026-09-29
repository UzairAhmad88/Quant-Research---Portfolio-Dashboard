import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useResearchContext } from '../../hooks/useResearchContext';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const { buildUrl } = useResearchContext();

  return (
    <nav className={`flex items-center gap-1.5 text-xs font-mono text-text-muted ${className}`}>
      <NavLink
        to={buildUrl('/')}
        className="flex items-center gap-1 hover:text-text-primary transition-colors"
      >
        <Home className="w-3.5 h-3.5 text-forest-700" />
        <span>Dashboard</span>
      </NavLink>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-border-strong shrink-0" />
            {isLast || !item.route ? (
              <span className="font-semibold text-text-primary truncate">{item.label}</span>
            ) : (
              <NavLink
                to={buildUrl(item.route)}
                className="hover:text-forest-700 transition-colors truncate"
              >
                {item.label}
              </NavLink>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
