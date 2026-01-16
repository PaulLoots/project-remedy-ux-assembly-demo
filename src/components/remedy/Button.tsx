"use client";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "neutral" | "subtle";
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "neutral",
  onClick,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  const baseStyles =
    "px-4 py-3 rounded-full font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-black text-white hover:bg-zinc-800",
    neutral:
      "bg-white text-black border border-zinc-300 hover:bg-zinc-50",
    subtle: "bg-transparent text-black hover:text-zinc-600",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyles}`}
    >
      {children}
    </button>
  );
}
