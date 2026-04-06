// Stripe product configuration
export const STRIPE_PRODUCTS = {
  grraphicPro: {
    id: 'prod_T7ETlKgPjN6INU',
    priceId: 'price_1SB00tHFbNWi9orUyhVfxb18',
    name: 'Grraphic Pro',
    description: 'Unlimited large file uploads, AI improvement ideas, and priority support',
    price: 15.00,
    currency: 'usd',
    currencySymbol: '$',
    mode: 'subscription' as const,
  },
} as const;

export type StripeProduct = keyof typeof STRIPE_PRODUCTS;
