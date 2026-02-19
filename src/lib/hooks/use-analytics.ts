import { useQuery } from "@tanstack/react-query";
import {
  getSalesAnalyticsAction,
  getProductAnalyticsAction,
  getUserAnalyticsAction,
  getDashboardOverviewAction,
} from "@/lib/actions/analytics.actions";

// ============ QUERY KEYS ============

const analyticsQueryKeys = {
  all: ["analytics"] as const,
  sales: (startDate: string, endDate: string) => [
    ...analyticsQueryKeys.all,
    "sales",
    startDate,
    endDate,
  ] as const,
  products: () => [...analyticsQueryKeys.all, "products"] as const,
  users: () => [...analyticsQueryKeys.all, "users"] as const,
  overview: (startDate: string, endDate: string) => [
    ...analyticsQueryKeys.all,
    "overview",
    startDate,
    endDate,
  ] as const,
};

// ============ ANALYTICS HOOKS ============

export function useSalesAnalytics(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: analyticsQueryKeys.sales(
      startDate.toISOString(),
      endDate.toISOString()
    ),
    queryFn: async () => {
      const result = await getSalesAnalyticsAction(startDate, endDate);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useProductAnalytics() {
  return useQuery({
    queryKey: analyticsQueryKeys.products(),
    queryFn: async () => {
      const result = await getProductAnalyticsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useUserAnalytics() {
  return useQuery({
    queryKey: analyticsQueryKeys.users(),
    queryFn: async () => {
      const result = await getUserAnalyticsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useDashboardOverview(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: analyticsQueryKeys.overview(
      startDate.toISOString(),
      endDate.toISOString()
    ),
    queryFn: async () => {
      const result = await getDashboardOverviewAction(startDate, endDate);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
