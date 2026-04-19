import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

async function resolveSubscription(stripe: Stripe, subRef: unknown): Promise<Stripe.Subscription | null> {
  if (!subRef) return null;
  if (typeof subRef === "string") return stripe.subscriptions.retrieve(subRef);
  return subRef as Stripe.Subscription;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = event.data.object as any;

  switch (event.type) {
    case "checkout.session.completed": {
      const userId = obj.metadata?.supabase_user_id as string | undefined;
      const plan   = obj.metadata?.plan as "starter" | "pro" | undefined;
      if (!userId) break;

      await admin
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_plan:   plan ?? null,
          stripe_customer_id:  obj.customer as string,
        })
        .eq("id", userId);
      break;
    }

    case "invoice.paid": {
      const sub = await resolveSubscription(stripe, obj.subscription);
      if (!sub) break;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;

      await admin
        .from("profiles")
        .update({
          subscription_status: "active",
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        })
        .eq("id", userId);
      break;
    }

    case "invoice.payment_failed": {
      const sub = await resolveSubscription(stripe, obj.subscription);
      if (!sub) break;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;

      await admin
        .from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const userId = obj.metadata?.supabase_user_id as string | undefined;
      if (!userId) break;

      await admin
        .from("profiles")
        .update({ subscription_status: "canceled", subscription_plan: null })
        .eq("id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
