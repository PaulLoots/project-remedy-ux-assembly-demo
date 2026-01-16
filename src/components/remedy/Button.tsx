"use client";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "neutral" | "subtle";
  align?: "left" | "center";
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "neutral",
  align = "center",
  onClick,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  // Use rounded-3xl (24px) which is half the standard button height for consistent corners
  // whether content is one line or wraps to multiple lines
  const baseStyles =
    "px-3 md:px-4 py-2.5 md:py-3 rounded-2xl md:rounded-3xl font-medium text-sm md:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-black text-white hover:bg-zinc-800",
    neutral:
      "bg-white text-black border border-zinc-300 hover:bg-zinc-50",
    subtle: "bg-transparent text-black hover:text-zinc-600",
  };

  const alignStyles = align === "left" ? "text-left" : "text-center";
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${alignStyles} ${widthStyles}`}
    >
      {children}
    </button>
  );
}
