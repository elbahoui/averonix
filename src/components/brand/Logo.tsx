import { Link } from "@tanstack/react-router";

type LogoVariant = "horizontal" | "icon" | "monochrome" | "dark";
type LogoSize = "sm" | "md" | "lg" | "xl";

const LOGO_SRC: Record<LogoVariant, string> = {
  horizontal: "/brand/logo-horizontal.svg",
  icon: "/brand/logo-icon.svg",
  monochrome: "/brand/logo-monochrome.svg",
  dark: "/brand/logo-horizontal-dark.svg",
};

const SIZE_CLASS: Record<LogoSize, Record<LogoVariant, string>> = {
  sm: {
    horizontal: "h-[32px] w-auto",
    icon: "h-[32px] w-[32px]",
    monochrome: "h-[32px] w-auto",
    dark: "h-[32px] w-auto",
  },
  md: {
    horizontal: "h-[48px] w-auto",
    icon: "h-[40px] w-[40px]",
    monochrome: "h-[48px] w-auto",
    dark: "h-[48px] w-auto",
  },
  lg: {
    horizontal: "h-[60px] w-auto",
    icon: "h-[52px] w-[52px]",
    monochrome: "h-[60px] w-auto",
    dark: "h-[60px] w-auto",
  },
  xl: {
    horizontal: "h-[72px] w-auto",
    icon: "h-[64px] w-[64px]",
    monochrome: "h-[72px] w-auto",
    dark: "h-[72px] w-auto",
  },
};

export function Logo({
  className = "",
  variant = "horizontal",
  size = "md",
  showBeta = false,
  imgClassName = "",
}: {
  className?: string;
  imgClassName?: string;
  variant?: LogoVariant;
  size?: LogoSize;
  showBeta?: boolean;
}) {
  const alt = variant === "icon" ? "Averonix icon" : "Averonix";

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={LOGO_SRC[variant]}
        alt={alt}
        loading="eager"
        decoding="async"
        className={`block shrink-0 object-contain opacity-100 ${SIZE_CLASS[size][variant]} ${imgClassName}`}
      />
      {showBeta ? (
        <span
          aria-label="Beta"
          className="rounded-full border border-[#E9DDF7] bg-[#F6F0FF] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7C3AED]"
        >
          BETA
        </span>
      ) : null}
    </Link>
  );
}
