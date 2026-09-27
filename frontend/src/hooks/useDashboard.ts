import { useQuery } from '@tanstack/react-query';
import { fetchDashboardOverview } from '../services/dashboardService';

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => fetchDashboardOverview(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
