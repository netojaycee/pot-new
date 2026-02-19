"use server";

import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

// ============ TYPES ============

export type AnalyticsServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// ============ ANALYTICS OPERATIONS ============

/**
 * Get sales analytics for date range
 */
export async function getSalesAnalytics(
  startDate: Date,
  endDate: Date
): Promise<
  AnalyticsServiceResult<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
    dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  }>
> {
  try {
    const cacheKey = `analytics:sales:${startDate.getTime()}:${endDate.getTime()}`;
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      return { success: true, data: JSON.parse(cached) };
    }

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by status
    const ordersByStatus = orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Daily revenue
    const dailyData: Record<
      string,
      { revenue: number; orders: number }
    > = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0 };
      }
      dailyData[date].revenue += order.total;
      dailyData[date].orders += 1;
    });

    const dailyRevenue = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const result = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      ordersByStatus,
      dailyRevenue,
    };

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(result));

    return { success: true, data: result };
  } catch (error) {
    console.error("Get sales analytics error:", error);
    return {
      success: false,
      error: "Failed to fetch sales analytics",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get product analytics
 */
export async function getProductAnalytics(): Promise<
  AnalyticsServiceResult<{
    totalProducts: number;
    activeProducts: number;
    topProducts: Array<{
      id: string;
      name: string;
      sold: number;
      revenue: number;
    }>;
    lowStockProducts: Array<{
      id: string;
      name: string;
      availableQuantity: number;
    }>;
    averageRating: number;
  }>
> {
  try {
    const cacheKey = "analytics:products";
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      return { success: true, data: JSON.parse(cached) };
    }

    const [totalProducts, activeProducts, products] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { availableQuantity: { gt: 0 } } }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          availableQuantity: true,
          avgRating: true,
          _count: { select: { orderItems: true } },
        },
      }),
    ]);

    // Get top products by sales
    const topProducts = products
      .map((p) => {
        const sold = p._count.orderItems;
        return {
          id: p.id,
          name: p.name,
          sold,
          revenue: 0, // Would need join to get this
        };
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    // Get low stock products
    const lowStockProducts = products
      .filter((p) => p.availableQuantity < 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        availableQuantity: p.availableQuantity,
      }))
      .sort((a, b) => a.availableQuantity - b.availableQuantity);

    const averageRating =
      products.reduce((sum, p) => sum + p.avgRating, 0) / products.length || 0;

    const result = {
      totalProducts,
      activeProducts,
      topProducts,
      lowStockProducts,
      averageRating: parseFloat(averageRating.toFixed(2)),
    };

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(result));

    return { success: true, data: result };
  } catch (error) {
    console.error("Get product analytics error:", error);
    return {
      success: false,
      error: "Failed to fetch product analytics",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get user analytics
 */
export async function getUserAnalytics(): Promise<
  AnalyticsServiceResult<{
    totalUsers: number;
    verifiedUsers: number;
    newUsersThisMonth: number;
    topCustomers: Array<{
      id: string;
      firstName: string;
      email: string;
      totalSpent: number;
      orderCount: number;
    }>;
  }>
> {
  try {
    const cacheKey = "analytics:users";
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      return { success: true, data: JSON.parse(cached) };
    }

    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const [totalUsers, verifiedUsers, newUsersThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { verified: true } }),
      prisma.user.count({
        where: {
          createdAt: { gte: thisMonth },
        },
      }),
    ]);

    // Get top customers by spending
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        email: true,
        orders: {
          select: {
            total: true,
          },
        },
      },
    });

    const topCustomers = users
      .map((user) => ({
        id: user.id,
        firstName: user.firstName || "Unknown",
        email: user.email,
        totalSpent: user.orders.reduce((sum, o) => sum + o.total, 0),
        orderCount: user.orders.length,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const result = {
      totalUsers,
      verifiedUsers,
      newUsersThisMonth,
      topCustomers,
    };

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(result));

    return { success: true, data: result };
  } catch (error) {
    console.error("Get user analytics error:", error);
    return {
      success: false,
      error: "Failed to fetch user analytics",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get dashboard overview
 */
export async function getDashboardOverview(startDate: Date, endDate: Date): Promise<
  AnalyticsServiceResult<{
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    topProducts: Array<{
      name: string;
      sold: number;
    }>;
  }>
> {
  try {
    const cacheKey = `analytics:overview:${startDate.getTime()}:${endDate.getTime()}`;
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      return { success: true, data: JSON.parse(cached) };
    }

    const [orders, customers, products] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ["paid", "shipped", "delivered"] },
        },
        select: { total: true },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.product.count(),
    ]);

    const revenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const productDetails = await prisma.product.findMany({
      where: {
        id: { in: topProducts.map((p) => p.productId) },
      },
      select: { id: true, name: true },
    });

    const topProductsList = topProducts
      .map((tp) => {
        const product = productDetails.find((p) => p.id === tp.productId);
        return {
          name: product?.name || "Unknown",
          sold: tp._sum.quantity || 0,
        };
      });

    const result = {
      revenue,
      orders: orders.length,
      customers,
      products,
      topProducts: topProductsList,
    };

    // Cache for 30 minutes
    await redis.setex(cacheKey, 1800, JSON.stringify(result));

    return { success: true, data: result };
  } catch (error) {
    console.error("Get dashboard overview error:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard overview",
      code: "FETCH_ERROR",
    };
  }
}
