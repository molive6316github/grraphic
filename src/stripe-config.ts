// Stripe product configuration
export const STRIPE_PRODUCTS = {
  grraphicPro: {
    id: 'prod_T6JXobIzJJ9y2i',
    priceId: 'price_1SA6uPHp5AwvS0eqZWxMsyNN',
    name: 'Grraphic Pro',
    description: 'Unlimited large file uploads, AI improvement ideas, and priority support',
    price: 15.00,
    currency: 'usd',
    currencySymbol: '$',
    mode: 'subscription' as const,
  },
} as const;

export type StripeProduct = keyof typeof STRIPE_PRODUCTS;