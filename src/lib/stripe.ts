import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: '2026-01-28.clover', // Use latest API version available/compatible
  typescript: true,
});
