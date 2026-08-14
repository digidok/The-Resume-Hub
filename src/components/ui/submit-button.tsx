"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/**
 * Disables itself once the enclosing form actually submits, to guard
 * against double form submissions (e.g. a user double-clicking "Buy" and
 * starting two Payfast checkouts).
 *
 * This has to hook the form's "submit" event, not the button's "click" —
 * disabling a submit button synchronously inside its own click handler
 * cancels that same click's form submission in every major browser (the
 * disabled check happens as part of initiating submission), which silently
 * broke every button using this component. Hooking "submit" instead disables
 * only after the browser has already committed to submitting.
 */
export function SubmitButton({
  children,
  pendingLabel = "Please wait…",
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const [pending, setPending] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const form = buttonRef.current?.form;
    if (!form) return;
    const handleSubmit = () => setPending(true);
    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, []);

  return (
    <Button {...props} ref={buttonRef} type="submit" disabled={props.disabled || pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
