"use server";

import {
  getSalesAnalytics,
  getProductAnalytics,
  getUserAnalytics,
  getDashboardOverview,
} from "@/lib/services/analytics.service";

// ============ ANALYTICS ACTIONS ============

export async function getSalesAnalyticsAction(startDate: Date, endDate: Date) {
  return await getSalesAnalytics(startDate, endDate);
}

export async function getProductAnalyticsAction() {
  return await getProductAnalytics();
}

export async function getUserAnalyticsAction() {
  return await getUserAnalytics();
}

export async function getDashboardOverviewAction(startDate: Date, endDate: Date) {
  return await getDashboardOverview(startDate, endDate);
}
