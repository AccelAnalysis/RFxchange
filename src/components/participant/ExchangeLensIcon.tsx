import type { ParticipantLensId } from "../../application/participant/participant-lens-registry";

export type ExchangeUiIconId = ParticipantLensId | "menu";

export function ExchangeLensIcon({
  icon,
  size = 24,
  strokeWidth = 1.8,
}: Readonly<{
  icon: ExchangeUiIconId;
  size?: number;
  strokeWidth?: number;
}>) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      data-exchange-icon={icon}
    >
      {icon === "opportunities-rfx" ? (
        <>
          <path {...common} d="M6.5 3.75h7l4 4v12.5h-11z" />
          <path {...common} d="M13.5 3.75v4h4M9 11h5M9 14h3" />
          <circle {...common} cx="15.75" cy="16.25" r="2.25" />
          <path {...common} d="m17.4 17.9 1.85 1.85" />
        </>
      ) : null}
      {icon === "resources" ? (
        <>
          <rect {...common} x="3.5" y="5" width="6.5" height="5.5" rx="1.25" />
          <rect {...common} x="14" y="5" width="6.5" height="5.5" rx="1.25" />
          <rect {...common} x="8.75" y="14" width="6.5" height="5.5" rx="1.25" />
          <path {...common} d="M6.75 10.5v1.25h10.5V10.5M12 11.75V14" />
        </>
      ) : null}
      {icon === "intelligence" ? (
        <>
          <circle {...common} cx="12" cy="12" r="8.25" />
          <circle {...common} cx="12" cy="12" r="4.75" />
          <path {...common} d="M12 12 17.5 8.5M12 3.75v2M20.25 12h-2M12 20.25v-2M3.75 12h2" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" />
        </>
      ) : null}
      {icon === "capabilities" ? (
        <>
          <path {...common} d="m12 3.75 7.75 4.1L12 12 4.25 7.85z" />
          <path {...common} d="m4.25 12 7.75 4.15L19.75 12M4.25 16.15 12 20.25l7.75-4.1" />
        </>
      ) : null}
      {icon === "menu" ? (
        <>
          <path {...common} d="M5 7h14M5 12h14M5 17h14" />
          <circle cx="3" cy="7" r=".75" fill="currentColor" />
          <circle cx="3" cy="12" r=".75" fill="currentColor" />
          <circle cx="3" cy="17" r=".75" fill="currentColor" />
        </>
      ) : null}
    </svg>
  );
}
