import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing in environment variables!");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia" as any, // 최신 API 버전 사용
});

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: "",
    quota: 5,
  },
  PRO: {
    name: "Pro",
    priceId: "price_example_pro_plan", // 실제 Stripe 대시보드에서 생성한 Price ID 필요
    quota: Infinity,
  },
};
