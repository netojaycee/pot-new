/**
 * Client-side utilities for payment operations
 * Helpers for Stripe integration and payment processing
 */

// Stripe Elements styles
export const stripeElementStyles = {
  base: {
    fontSize: "16px",
    color: "#424770",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  invalid: {
    color: "#9e2146",
  },
};

// Payment intent status colors
export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    succeeded: "green",
    requires_payment_method: "yellow",
    requires_action: "yellow",
    requires_confirmation: "yellow",
    processing: "blue",
    canceled: "gray",
    failed: "red",
  };

  return colors[status] || "gray";
}

// Payment intent status labels
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    succeeded: "Payment Successful",
    requires_payment_method: "Payment Method Required",
    requires_action: "Awaiting Payment Confirmation",
    requires_confirmation: "Awaiting Confirmation",
    processing: "Processing Payment",
    canceled: "Payment Cancelled",
    failed: "Payment Failed",
  };

  return labels[status] || status;
}

// Format currency for Stripe (cents)
export function toStripeCents(amount: number): number {
  return Math.round(amount * 100);
}

// Format currency from Stripe (cents to dollars)
export function fromStripeCents(amount: number): number {
  return parseFloat((amount / 100).toFixed(2));
}

// Check if payment succeeded
export function isPaymentSucceeded(status: string): boolean {
  return status === "succeeded";
}

// Check if payment needs action (3D Secure, etc.)
export function isPaymentNeedsAction(status: string): boolean {
  return status === "requires_action";
}

// Check if payment failed
export function isPaymentFailed(status: string): boolean {
  return status === "failed" || status === "canceled";
}

// Validate card expiry
export function isValidCardExpiry(expiryDate: string): boolean {
  const [month, year] = expiryDate.split("/").map((s) => s.trim());

  if (!month || !year) return false;

  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (isNaN(m) || isNaN(y)) return false;
  if (m < 1 || m > 12) return false;

  // Year should be 2 digits
  const currentYear = new Date().getFullYear() % 100;
  if (y < currentYear) return false;

  return true;
}

// Validate card CVC
export function isValidCardCVC(cvc: string): boolean {
  return /^\d{3,4}$/.test(cvc);
}

// Validate card number (Luhn algorithm)
export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");

  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Get card brand from number
export function getCardBrand(cardNumber: string): "visa" | "mastercard" | "amex" | "discover" | "unknown" {
  const digits = cardNumber.replace(/\D/g, "");

  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(digits)) {
    return "visa";
  }
  if (/^5[1-5][0-9]{14}$/.test(digits)) {
    return "mastercard";
  }
  if (/^3[47][0-9]{13}$/.test(digits)) {
    return "amex";
  }
  if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(digits)) {
    return "discover";
  }

  return "unknown";
}

// Format card number for display
export function formatCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  return digits.replace(/(\d{4})/g, "$1 ").trim();
}

// Build payment error message
export function buildPaymentErrorMessage(error: any): string {
  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error?.message) {
    return error.error.message;
  }

  return "An error occurred during payment processing";
}

// Check if error is retryable
export function isPaymentErrorRetryable(error: any): boolean {
  if (typeof error === "string") {
    return false;
  }

  const retryableCodes = [
    "card_declined",
    "processing_error",
    "rate_limit",
    "api_connection_error",
  ];

  return retryableCodes.includes(error?.code);
}

// Calculate payment processing fee
export function calculateProcessingFee(amount: number, feePercent: number = 2.9, feeCents: number = 30): number {
  return parseFloat(((amount * (feePercent / 100)) + (feeCents / 100)).toFixed(2));
}

// Get payment method display name
export function getPaymentMethodName(type: string): string {
  const names: Record<string, string> = {
    card: "Credit/Debit Card",
    bank_account: "Bank Account",
    boleto: "Boleto",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    klarna: "Klarna",
    afterpay: "Afterpay",
  };

  return names[type] || "Payment Method";
}
