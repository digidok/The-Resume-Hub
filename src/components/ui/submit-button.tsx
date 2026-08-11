"use client";

import { useState, type ComponentProps, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";

/**
 * Disables itself on click to guard against double form submissions (e.g.
 * a user double-clicking "Buy" and starting two Payfast checkouts).
 */
export function SubmitButton({
  children,
  pendingLabel = "Please wait…",
  onClick,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const [pending, setPending] = useState(false);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    setPending(true);
  }

  return (
    <Button {...props} type="submit" disabled={props.disabled || pending} onClick={handleClick}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
