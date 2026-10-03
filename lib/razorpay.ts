import Razorpay from "razorpay";
import crypto from "crypto";

type RazorpayOrderInput = {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;

  if (!keyId) {
    throw new Error(
      "Missing RAZORPAY_KEY_ID."
    );
  }

  if (!keySecret) {
    throw new Error(
      "Missing RAZORPAY_KEY_SECRET."
    );
  }

  return {
    keyId,
    keySecret,
  };
}

export function getRazorpayKeyId() {
  return getRazorpayCredentials()
    .keyId;
}

function createRazorpayClient() {
  const {
    keyId,
    keySecret,
  } = getRazorpayCredentials();

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createRazorpayOrder({
  amount,
  currency = "INR",
  receipt,
  notes,
}: RazorpayOrderInput) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Razorpay amount must be greater than zero."
    );
  }

  if (!receipt?.trim()) {
    throw new Error(
      "Razorpay receipt is required."
    );
  }

  const razorpay =
    createRazorpayClient();

  return razorpay.orders.create({
    amount: Math.round(amount),
    currency,
    receipt: receipt.trim(),
    notes,
  });
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
  const {
    keySecret,
  } = getRazorpayCredentials();

  const generatedSignature =
    crypto
      .createHmac(
        "sha256",
        keySecret
      )
      .update(
        `${orderId}|${paymentId}`
      )
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(
      generatedSignature
    ),
    Buffer.from(signature)
  );
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
) {
  const secret =
    process.env
      .RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "Missing RAZORPAY_WEBHOOK_SECRET."
    );
  }

  const generatedSignature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(rawBody)
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(
      generatedSignature
    ),
    Buffer.from(signature)
  );
}
