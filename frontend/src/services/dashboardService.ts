import { DashboardOverviewResponse } from '../types/dashboard';

const API_BASE = '/api/v1';

export async function fetchDashboardOverview(): Promise<DashboardOverviewResponse> {
  const response = await fetch(`${API_BASE}/dashboard/overview`);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard overview: ${response.statusText}`);
  }
  return response.json();
}
