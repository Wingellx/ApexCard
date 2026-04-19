"use client";

import { useTransition } from "react";
import { createCheckoutSession } from "./actions";
import Button from "@/components/ui/Button";

interface Props {
  planId: "starter" | "pro";
  priceId: string;
  highlighted: boolean;
}

export default function CheckoutButton({ planId, priceId, highlighted }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const url = await createCheckoutSession(priceId, planId);
      if (url) window.location.href = url;
    });
  }

  return (
    <Button
      variant={highlighted ? "primary" : "secondary"}
      className="w-full"
      loading={isPending}
      onClick={handleClick}
      type="button"
    >
      Get started
    </Button>
  );
}
