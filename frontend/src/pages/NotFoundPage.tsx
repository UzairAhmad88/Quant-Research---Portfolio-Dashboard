import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { HelpCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <Card className="max-w-md w-full p-8 flex flex-col items-center justify-center">
        <div className="p-3.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 mb-4 shadow-xs">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="text-[11px] font-mono-num font-semibold text-text-muted tracking-wider uppercase mb-1">
          404 — Page Not Found
        </div>
        <h2 className="text-xl font-bold text-text-primary tracking-tight mb-2 font-sans">
          Unknown Module Route
        </h2>
        <p className="text-xs text-text-secondary mb-6 leading-relaxed">
          The requested page route does not exist in the Quant Research Dashboard specification.
        </p>
        <NavLink to="/">
          <Button variant="primary" size="md" icon={<Home className="w-4 h-4" />}>
            Return to Overview
          </Button>
        </NavLink>
      </Card>
    </div>
  );
};
