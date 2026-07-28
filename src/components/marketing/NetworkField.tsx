export function NetworkField() {
  return (
    <div className="network-field" aria-label="Conceptual network field showing connected business activity">
      <svg viewBox="0 0 600 520" aria-hidden="true">
        <defs>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d="M120 355 C190 280 220 260 300 260 S415 185 480 130" fill="none" stroke="#D6A23A" strokeWidth="3" opacity="0.82" />
        <path d="M300 260 C365 305 420 318 505 352" fill="none" stroke="#D6A23A" strokeWidth="2" opacity="0.46" />
        <path d="M300 260 C268 195 230 154 160 126" fill="none" stroke="#2E5EAA" strokeWidth="2" opacity="0.3" />
        <circle cx="120" cy="355" r="11" fill="#0B0B0D" />
        <circle cx="300" cy="260" r="14" fill="#D6A23A" filter="url(#softGlow)" />
        <circle cx="480" cy="130" r="11" fill="#2E5EAA" />
        <circle cx="505" cy="352" r="11" fill="#3B7B57" />
        <circle cx="160" cy="126" r="9" fill="#252932" />
        <circle cx="392" cy="90" r="5" fill="#252932" opacity=".48" />
        <circle cx="540" cy="238" r="5" fill="#252932" opacity=".48" />
        <circle cx="84" cy="210" r="5" fill="#252932" opacity=".48" />
      </svg>
      <div className="network-label">
        <strong>Economic activity becomes legible.</strong>
        <span>Business capability, opportunity, support, and outcome signals share one visual language.</span>
      </div>
    </div>
  );
}
