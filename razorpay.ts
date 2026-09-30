import crypto from "node:crypto";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function credentials() {
  const keyId = required("RAZORPAY_KEY_ID");
  const keySecret = required("RAZORPAY_KEY_SECRET");
  return { keyId, keySecret };
}

export function razorpayConfig() {
  return {
    ...credentials(),
    webhookSecret: required("RAZORPAY_WEBHOOK_SECRET"),
  };
}

export async function createRazorpayOrder(input: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const { keyId, keySecret } = credentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Razorpay order error:", text);
    throw new Error("Unable to create Razorpay order.");
  }

  return response.json() as Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
  }>;
}

export async function fetchRazorpayPayment(paymentId: string) {
  const { keyId, keySecret } = credentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    }
  );

  if (!response.ok) throw new Error("Unable to verify Razorpay payment.");

  return response.json() as Promise<{
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
  }>;
}

export function verifyPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}) {
  const { keySecret } = credentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  const actual = Buffer.from(input.signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const { webhookSecret } = razorpayConfig();
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const actual = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}
