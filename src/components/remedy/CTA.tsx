"use client";

import { Button } from "./Button";

interface CTAProps {
  primary: string;
  secondary?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export function CTA({
  primary,
  secondary,
  onPrimaryClick,
  onSecondaryClick,
}: CTAProps) {
  return (
    <div className="flex flex-col gap-2 px-5 py-3 w-full">
      <Button variant="primary" onClick={onPrimaryClick}>
        {primary}
      </Button>
      {secondary && (
        <Button variant="neutral" onClick={onSecondaryClick}>
          {secondary}
        </Button>
      )}
    </div>
  );
}
