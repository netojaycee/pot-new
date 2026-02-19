/**
 * Client-side utilities for order operations
 */

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";

// Get order status display label
export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: "Pending Payment",
    paid: "Paid",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    failed: "Payment Failed",
  };

  return labels[status] || status;
}

// Get order status color (for UI styling)
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: "yellow",
    paid: "blue",
    processing: "blue",
    shipped: "purple",
    delivered: "green",
    cancelled: "gray",
    failed: "red",
  };

  return colors[status] || "gray";
}

// Check if order can be cancelled
export function canCancelOrder(status: OrderStatus): boolean {
  return status === "pending";
}

// Get order summary
export function getOrderSummary(order: any): {
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
} {
  const itemCount = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    itemCount,
    createdAt: new Date(order.createdAt).toLocaleDateString(),
  };
}

// Format order total
export function formatOrderTotal(total: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(total);
}

// Calculate order timeline
export function getOrderTimeline(order: any): Array<{
  status: OrderStatus;
  label: string;
  date?: string;
  completed: boolean;
}> {
  const timeline: Array<{ status: OrderStatus; label: string; date?: string; completed: boolean }> = [];
  const statuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"];

  for (const status of statuses) {
    const isCompleted = statuses.indexOf(order.status) >= statuses.indexOf(status);

    timeline.push({
      status,
      label: getOrderStatusLabel(status),
      completed: isCompleted,
    });
  }

  return timeline;
}

// Build order tracking URL (mock, adjust based on carrier)
export function getBuildTrackingUrl(trackingNumber: string, carrier: string = "generic"): string {
  const carriers: Record<string, string> = {
    fedex: "https://tracking.fedex.com/en-us/tracking/",
    ups: "https://www.ups.com/track?tracknum=",
    usps: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
    generic: "#",
  };

  const baseUrl = carriers[carrier.toLowerCase()] || carriers.generic;
  return `${baseUrl}${trackingNumber}`;
}

// Check if order is delivered
export function isOrderDelivered(status: OrderStatus): boolean {
  return status === "delivered";
}

// Check if order has failed payment
export function hasFailedPayment(status: OrderStatus): boolean {
  return status === "failed";
}

// Get estimated delivery date (mock, adjust based on order date and carrier)
export function getEstimatedDeliveryDate(order: any): string {
  const createdDate = new Date(order.createdAt);
  // Add 3-5 business days (simplified)
  const estimatedDate = new Date(createdDate.getTime() + 4 * 24 * 60 * 60 * 1000);

  return estimatedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Check if order can be reviewed
export function canReviewOrder(status: OrderStatus): boolean {
  return status === "delivered";
}

// Build order email content (for sending)
export function buildOrderEmailContent(order: any): {
  subject: string;
  text: string;
  html: string;
} {
  const itemList = order.items
    ?.map((item: any) => `- ${item.product.name} (${item.quantity}x) $${item.price}`)
    .join("\n") || "";

  const subject = `Order Confirmation #${order.orderNumber}`;
  const text = `
Order Number: ${order.orderNumber}
Status: ${getOrderStatusLabel(order.status)}
Total: ${formatOrderTotal(order.total)}

Items:
${itemList}

Thank you for your order!
  `.trim();

  const html = `
    <h2>Order Confirmation</h2>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p><strong>Status:</strong> ${getOrderStatusLabel(order.status)}</p>
    <p><strong>Total:</strong> ${formatOrderTotal(order.total)}</p>
    <h3>Items:</h3>
    <ul>
      ${order.items?.map((item: any) => `<li>${item.product.name} (${item.quantity}x) $${item.price}</li>`).join("") || ""}
    </ul>
    <p>Thank you for your order!</p>
  `.trim();

  return { subject, text, html };
}
