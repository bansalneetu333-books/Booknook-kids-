import crypto from "node:crypto";

type RazorpayOrderInput = {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
};

type RazorpayOrderResponse = {
  id: string;
  entity: "order";
  amount: number;
  amount_due: number;
  amount_paid: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes?: Record<string, string>;
  created_at: number;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId) throw new Error("Missing RAZORPAY_KEY_ID.");
  if (!keySecret) throw new Error("Missing RAZORPAY_KEY_SECRET.");
  return { keyId, keySecret };
}

export function getRazorpayKeyId() {
  return getRazorpayCredentials().keyId;
}

export async function createRazorpayOrder({
  amount,
  currency = "INR",
  receipt,
  notes,
}: RazorpayOrderInput): Promise<RazorpayOrderResponse> {
  if (!Number.isSafeInteger(amount) || amount < 100) {
    throw new Error("Razorpay amount must be at least 100 paise.");
  }
  const cleanCurrency = currency.trim().toUpperCase();
  if (cleanCurrency !== "INR") {
    throw new Error("Only INR payments are enabled for this store.");
  }
  const cleanReceipt = receipt.trim();
  if (!cleanReceipt || cleanReceipt.length > 40) {
    throw new Error("Razorpay receipt must be 1-40 characters.");
  }

  const { keyId, keySecret } = getRazorpayCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: cleanCurrency,
      receipt: cleanReceipt,
      notes,
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | RazorpayOrderResponse
    | { error?: { description?: string } }
    | null;

  if (!response.ok) {
    const description = data && "error" in data ? data.error?.description : undefined;
    throw new Error(
      description || `Razorpay order creation failed (HTTP ${response.status}).`
    );
  }

  if (!data || !("id" in data) || !data.id) {
    throw new Error("Razorpay returned an invalid order response.");
  }

  return data as RazorpayOrderResponse;
}

export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = getRazorpayCredentials();
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature, "utf8"),
    Buffer.from(signature, "utf8")
  );
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET.");

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature, "utf8"),
    Buffer.from(signature, "utf8")
  );
}
