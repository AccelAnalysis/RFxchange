import Link from "next/link";

type BrandWordmarkProps = {
  onDark?: boolean;
  compact?: boolean;
};

export function BrandWordmark({ onDark = false, compact = false }: BrandWordmarkProps) {
  return (
    <Link
      className="brand-wordmark"
      data-on-dark={onDark}
      data-compact={compact}
      href="/"
      aria-label="The RFxchange home"
    >
      <span className="brand-rf">RF</span>
      <span className="brand-xchange">xchange</span>
      <sup className="brand-tm">™</sup>
    </Link>
  );
}
