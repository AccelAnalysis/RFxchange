type RFMarkProps = { title?: string };

export function RFMark({ title = "The RFxchange" }: RFMarkProps) {
  return (
    <svg role="img" aria-label={title} viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="18" fill="var(--exchange-black)" />
      <text x="32" y="39" textAnchor="middle" fill="var(--rf-gold)" fontFamily="Aptos, Segoe UI, sans-serif" fontWeight="750" fontSize="25">RF</text>
    </svg>
  );
}
