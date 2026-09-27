import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportMenu, ExportOption } from '../ExportMenu';
import * as exportService from '../../../services/exportService';

describe('ExportMenu Component', () => {
  const mockOptions: ExportOption[] = [
    {
      label: 'Market Data Tabular',
      format: 'CSV',
      description: 'Historical OHLCV observations in CSV format',
      url: '/api/v1/market-data/export?format=csv',
    },
    {
      label: 'Market Data Specification',
      format: 'JSON',
      description: 'Structured JSON payload with data provenance',
      url: '/api/v1/market-data/export?format=json',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders export button with default label and closed menu', () => {
    render(<ExportMenu options={mockOptions} />);

    expect(screen.getByText('Export')).toBeDefined();
    expect(screen.queryByText('Market Data Tabular')).toBeNull();
  });

  it('opens dropdown menu on click and renders all options', () => {
    render(<ExportMenu options={mockOptions} label="Export Dataset" />);

    const button = screen.getByText('Export Dataset');
    fireEvent.click(button);

    expect(screen.getByText('Market Data Tabular')).toBeDefined();
    expect(screen.getByText('Historical OHLCV observations in CSV format')).toBeDefined();
    expect(screen.getByText('Market Data Specification')).toBeDefined();
    expect(screen.getByText('CSV')).toBeDefined();
    expect(screen.getByText('JSON')).toBeDefined();
  });

  it('does not open menu when disabled is true', () => {
    render(<ExportMenu options={mockOptions} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveProperty('disabled', true);

    fireEvent.click(button);
    expect(screen.queryByText('Market Data Tabular')).toBeNull();
  });

  it('invokes triggerDownload when an export option is selected', async () => {
    const triggerSpy = vi.spyOn(exportService, 'triggerDownload').mockImplementation(async () => {});

    render(<ExportMenu options={mockOptions} />);

    const button = screen.getByText('Export');
    fireEvent.click(button);

    const optionBtn = screen.getByText('Market Data Tabular');
    fireEvent.click(optionBtn);

    await waitFor(() => {
      expect(triggerSpy).toHaveBeenCalledWith('/api/v1/market-data/export?format=csv', undefined);
    });
  });

  it('displays error message when triggerDownload fails', async () => {
    vi.spyOn(exportService, 'triggerDownload').mockRejectedValue(new Error('Network export error 500'));

    render(<ExportMenu options={mockOptions} />);

    const button = screen.getByText('Export');
    fireEvent.click(button);

    const optionBtn = screen.getByText('Market Data Tabular');
    fireEvent.click(optionBtn);

    await waitFor(() => {
      expect(screen.getByText(/Network export error 500/i)).toBeDefined();
    });
  });
});
