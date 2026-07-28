const journey = [
  ["01", "Capability"],
  ["02", "Discovery"],
  ["03", "Connection"],
  ["04", "Opportunity"],
  ["05", "Action"],
  ["06", "Outcome"],
] as const;

export function JourneyRail() {
  return (
    <div className="journey-rail" aria-label="Business journey from capability to outcome">
      {journey.map(([number, label]) => (
        <div className="journey-step" key={label}>
          <span>{number}</span>
          <strong>{label}</strong>
        </div>
      ))}
    </div>
  );
}
