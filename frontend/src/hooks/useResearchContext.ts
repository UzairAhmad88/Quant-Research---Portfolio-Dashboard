import { useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ResearchContext,
  parseResearchContext,
  serializeResearchContext,
  buildResearchUrl,
  validateResearchContext,
} from '../lib/researchContext';

export function useResearchContext() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parse current URL search params into typed context
  const context = useMemo(() => {
    return parseResearchContext(searchParams);
  }, [searchParams]);

  // Update URL search parameters
  const updateContext = useCallback(
    (updates: Partial<ResearchContext>, options?: { replace?: boolean }) => {
      const merged: ResearchContext = {
        ...context,
        ...updates,
      };

      // Remove undefined/null/empty keys by serializing
      const serialized = serializeResearchContext(merged);
      setSearchParams(serialized, { replace: options?.replace ?? false });
    },
    [context, setSearchParams]
  );

  // Set context completely (overwriting current context)
  const setContext = useCallback(
    (newContext: ResearchContext, options?: { replace?: boolean }) => {
      const serialized = serializeResearchContext(newContext);
      setSearchParams(serialized, { replace: options?.replace ?? false });
    },
    [setSearchParams]
  );

  // Clear research context from URL
  const clearContext = useCallback(() => {
    setSearchParams({}, { replace: false });
  }, [setSearchParams]);

  // Build a URL string carrying current or updated context
  const buildUrl = useCallback(
    (route: string, customContext?: Partial<ResearchContext>) => {
      const merged = { ...context, ...customContext };
      return buildResearchUrl(route, merged);
    },
    [context]
  );

  // Navigate to route carrying context
  const navigateWithContext = useCallback(
    (route: string, customContext?: Partial<ResearchContext>) => {
      const targetUrl = buildUrl(route, customContext);
      navigate(targetUrl);
    },
    [buildUrl, navigate]
  );

  const validation = useMemo(() => {
    return validateResearchContext(context);
  }, [context]);

  return {
    context,
    updateContext,
    setContext,
    clearContext,
    buildUrl,
    navigateWithContext,
    isValid: validation.isValid,
    validationErrors: validation.errors,
  };
}
