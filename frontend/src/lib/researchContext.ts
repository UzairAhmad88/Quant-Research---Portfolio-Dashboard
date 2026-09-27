export type RangePreset = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX';
export type PriceSource = 'adjusted' | 'close';
export type MarketFrequency = 'DAILY' | 'HOURLY' | 'MINUTE';

export interface ResearchContext {
  instrumentId?: string;
  symbol?: string;
  instrumentIds?: string[];
  symbols?: string[];
  startDate?: string;
  endDate?: string;
  rangePreset?: RangePreset;
  priceSource?: PriceSource;
  frequency?: MarketFrequency;
  portfolioId?: string;
  strategyConfigurationId?: string;
  backtestId?: string;
  reportId?: string;
}

const VALID_RANGE_PRESETS: RangePreset[] = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];
const VALID_PRICE_SOURCES: PriceSource[] = ['adjusted', 'close'];
const VALID_FREQUENCIES: MarketFrequency[] = ['DAILY', 'HOURLY', 'MINUTE'];

/**
 * Calculates start and end ISO date strings (YYYY-MM-DD) based on a RangePreset.
 */
export function getDatesFromPreset(preset: RangePreset, referenceDate?: Date): { startDate: string; endDate: string } {
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const endDate = now.toISOString().split('T')[0];
  let start = new Date(now);

  switch (preset) {
    case '1M':
      start.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      start.setMonth(now.getMonth() - 3);
      break;
    case '6M':
      start.setMonth(now.getMonth() - 6);
      break;
    case '1Y':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case '3Y':
      start.setFullYear(now.getFullYear() - 3);
      break;
    case '5Y':
      start.setFullYear(now.getFullYear() - 5);
      break;
    case 'MAX':
      start = new Date('2000-01-01');
      break;
    default:
      start.setFullYear(now.getFullYear() - 1);
  }

  const startDate = start.toISOString().split('T')[0];
  return { startDate, endDate };
}

/**
 * Parses URLSearchParams into a strongly-typed ResearchContext object.
 * Sanitizes and validates query parameters, resolving aliases smoothly.
 */
export function parseResearchContext(searchParams: URLSearchParams): ResearchContext {
  const context: ResearchContext = {};

  // 1. Single Instrument / Symbol (alias handling)
  const symbol = searchParams.get('symbol') || searchParams.get('instrument');
  if (symbol && symbol.trim()) {
    context.symbol = symbol.trim().toUpperCase();
  }

  const instrumentId = searchParams.get('instrument_id') || searchParams.get('instrumentId');
  if (instrumentId && instrumentId.trim()) {
    context.instrumentId = instrumentId.trim();
  }

  // 2. Multi-Instrument Symbols / IDs
  const rawSymbols = searchParams.get('symbols') || searchParams.get('instruments');
  if (rawSymbols && rawSymbols.trim()) {
    const list = rawSymbols
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);
    if (list.length > 0) {
      // Remove duplicates while preserving order
      context.symbols = Array.from(new Set(list));
    }
  }

  const rawInstrumentIds = searchParams.get('instrument_ids') || searchParams.get('instrumentIds');
  if (rawInstrumentIds && rawInstrumentIds.trim()) {
    const list = rawInstrumentIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    if (list.length > 0) {
      context.instrumentIds = Array.from(new Set(list));
    }
  }

  // 3. Range Preset
  const rawPreset = (searchParams.get('range') || searchParams.get('rangePreset') || '').toUpperCase() as RangePreset;
  if (VALID_RANGE_PRESETS.includes(rawPreset)) {
    context.rangePreset = rawPreset;
  }

  // 4. Dates (Explicit start/end dates take priority over presets)
  const start = searchParams.get('start') || searchParams.get('start_date') || searchParams.get('startDate');
  const end = searchParams.get('end') || searchParams.get('end_date') || searchParams.get('endDate');

  if (start && start.trim()) {
    context.startDate = start.trim();
  }
  if (end && end.trim()) {
    context.endDate = end.trim();
  }

  // If no explicit start date is set but rangePreset exists, derive dates
  if (!context.startDate && context.rangePreset) {
    const derived = getDatesFromPreset(context.rangePreset);
    context.startDate = derived.startDate;
    context.endDate = derived.endDate;
  }

  // 5. Price Source
  const rawPriceSource = (
    searchParams.get('priceSource') ||
    searchParams.get('price_source') ||
    ''
  ).toLowerCase();
  if (VALID_PRICE_SOURCES.includes(rawPriceSource as PriceSource)) {
    context.priceSource = rawPriceSource as PriceSource;
  } else if (rawPriceSource === 'adjusted_close') {
    context.priceSource = 'adjusted';
  }

  // 6. Frequency
  const rawFreq = (searchParams.get('frequency') || '').toUpperCase() as MarketFrequency;
  if (VALID_FREQUENCIES.includes(rawFreq)) {
    context.frequency = rawFreq;
  }

  // 7. Portfolio ID
  const portfolioId = searchParams.get('portfolio') || searchParams.get('portfolio_id') || searchParams.get('portfolioId');
  if (portfolioId && portfolioId.trim()) {
    context.portfolioId = portfolioId.trim();
  }

  // 8. Strategy Configuration ID
  const strategyId = searchParams.get('strategy') || searchParams.get('strategy_configuration_id') || searchParams.get('strategyId');
  if (strategyId && strategyId.trim()) {
    context.strategyConfigurationId = strategyId.trim();
  }

  // 9. Backtest ID
  const backtestId = searchParams.get('backtest') || searchParams.get('backtest_id') || searchParams.get('id');
  if (backtestId && backtestId.trim()) {
    context.backtestId = backtestId.trim();
  }

  // 10. Report ID
  const reportId = searchParams.get('report') || searchParams.get('report_id');
  if (reportId && reportId.trim()) {
    context.reportId = reportId.trim();
  }

  return context;
}

/**
 * Serializes a ResearchContext object into a clean query param map.
 * Omits undefined or empty parameters for clean, shareable URLs.
 */
export function serializeResearchContext(context: ResearchContext): Record<string, string> {
  const params: Record<string, string> = {};

  if (context.symbol) {
    params.symbol = context.symbol;
  }
  if (context.instrumentId) {
    params.instrument_id = context.instrumentId;
  }
  if (context.symbols && context.symbols.length > 0) {
    params.symbols = context.symbols.join(',');
  }
  if (context.instrumentIds && context.instrumentIds.length > 0) {
    params.instrument_ids = context.instrumentIds.join(',');
  }
  if (context.rangePreset) {
    params.range = context.rangePreset;
  }
  if (context.startDate) {
    params.start = context.startDate;
  }
  if (context.endDate) {
    params.end = context.endDate;
  }
  if (context.priceSource) {
    params.priceSource = context.priceSource;
  }
  if (context.frequency) {
    params.frequency = context.frequency;
  }
  if (context.portfolioId) {
    params.portfolio = context.portfolioId;
  }
  if (context.strategyConfigurationId) {
    params.strategy = context.strategyConfigurationId;
  }
  if (context.backtestId) {
    params.backtest = context.backtestId;
  }
  if (context.reportId) {
    params.report = context.reportId;
  }

  return params;
}

/**
 * Builds a full URL string combining a base route and a ResearchContext payload.
 */
export function buildResearchUrl(route: string, context: ResearchContext): string {
  const queryMap = serializeResearchContext(context);
  const searchParams = new URLSearchParams(queryMap);
  const queryString = searchParams.toString();
  return queryString ? `${route}?${queryString}` : route;
}

/**
 * Validates a ResearchContext payload for internal logical consistency.
 */
export function validateResearchContext(context: ResearchContext): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (context.startDate && context.endDate) {
    const startTs = new Date(context.startDate).getTime();
    const endTs = new Date(context.endDate).getTime();
    if (isNaN(startTs) || isNaN(endTs)) {
      errors.push('Invalid date format for start or end date.');
    } else if (startTs > endTs) {
      errors.push('Start date cannot be after end date.');
    }
  }

  if (context.symbols && context.symbols.length > 0) {
    if (context.symbols.length > 20) {
      errors.push('Multi-instrument context exceeds maximum limit of 20 tickers.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
