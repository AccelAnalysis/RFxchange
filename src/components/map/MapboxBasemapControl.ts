import mapboxgl from "mapbox-gl";

export type RfxBasemapTreatmentId = "standard" | "detailed" | "light" | "dark" | "muted";

type BasemapTreatment = Readonly<{
  id: RfxBasemapTreatmentId;
  label: string;
  description: string;
  theme: "default" | "faded" | "monochrome";
  lightPreset: "day" | "night";
  showPointOfInterestLabels: boolean;
  showTransitLabels: boolean;
  show3dObjects: boolean;
}>;

const STORAGE_KEY = "rfxchange:map-basemap-treatment";

export const RFX_BASEMAP_TREATMENTS: readonly BasemapTreatment[] = Object.freeze([
  Object.freeze({
    id: "standard" as const,
    label: "Standard",
    description: "Balanced streets, places, labels, and 3D context.",
    theme: "default" as const,
    lightPreset: "day" as const,
    showPointOfInterestLabels: true,
    showTransitLabels: false,
    show3dObjects: true,
  }),
  Object.freeze({
    id: "detailed" as const,
    label: "Detailed",
    description: "More contextual labels for dense market exploration.",
    theme: "default" as const,
    lightPreset: "day" as const,
    showPointOfInterestLabels: true,
    showTransitLabels: true,
    show3dObjects: true,
  }),
  Object.freeze({
    id: "light" as const,
    label: "Light",
    description: "Monochrome daytime context that keeps Exchange records prominent.",
    theme: "monochrome" as const,
    lightPreset: "day" as const,
    showPointOfInterestLabels: true,
    showTransitLabels: false,
    show3dObjects: true,
  }),
  Object.freeze({
    id: "dark" as const,
    label: "Dark",
    description: "Night lighting for low-light viewing.",
    theme: "default" as const,
    lightPreset: "night" as const,
    showPointOfInterestLabels: true,
    showTransitLabels: false,
    show3dObjects: true,
  }),
  Object.freeze({
    id: "muted" as const,
    label: "Muted",
    description: "Faded daytime geography for a softer backdrop.",
    theme: "faded" as const,
    lightPreset: "day" as const,
    showPointOfInterestLabels: true,
    showTransitLabels: false,
    show3dObjects: true,
  }),
]);

function treatmentById(value: string | null): BasemapTreatment {
  return RFX_BASEMAP_TREATMENTS.find((candidate) => candidate.id === value)
    ?? RFX_BASEMAP_TREATMENTS.find((candidate) => candidate.id === "muted")!;
}

function storedTreatment(): BasemapTreatment {
  try {
    return treatmentById(window.sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return treatmentById("muted");
  }
}

function applyTreatment(map: mapboxgl.Map, treatment: BasemapTreatment): void {
  map.setConfigProperty("basemap", "theme", treatment.theme);
  map.setConfigProperty("basemap", "lightPreset", treatment.lightPreset);
  map.setConfigProperty("basemap", "showPointOfInterestLabels", treatment.showPointOfInterestLabels);
  map.setConfigProperty("basemap", "showTransitLabels", treatment.showTransitLabels);
  map.setConfigProperty("basemap", "show3dObjects", treatment.show3dObjects);
}

export class MapboxBasemapControl implements mapboxgl.IControl {
  private map: mapboxgl.Map | null = null;
  private container: HTMLDivElement | null = null;
  private menu: HTMLDivElement | null = null;
  private trigger: HTMLButtonElement | null = null;
  private active: BasemapTreatment = treatmentById("muted");

  onAdd(map: mapboxgl.Map): HTMLElement {
    this.map = map;
    this.active = storedTreatment();

    const container = document.createElement("div");
    container.className = "mapboxgl-ctrl mapboxgl-ctrl-group rfx-basemap-control";
    container.style.position = "relative";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.setAttribute("aria-label", "Choose map type");
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    trigger.title = `Map type: ${this.active.label}`;
    trigger.textContent = "▧";
    trigger.addEventListener("click", () => this.toggleMenu());

    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Map type");
    menu.hidden = true;
    Object.assign(menu.style, {
      position: "absolute",
      top: "0",
      right: "42px",
      minWidth: "220px",
      padding: "8px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.96)",
      boxShadow: "0 10px 30px rgba(11,11,13,0.18)",
      backdropFilter: "blur(18px)",
    });

    for (const treatment of RFX_BASEMAP_TREATMENTS) {
      const option = document.createElement("button");
      option.type = "button";
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("aria-checked", String(treatment.id === this.active.id));
      option.dataset.basemapTreatment = treatment.id;
      option.style.width = "100%";
      option.style.minHeight = "44px";
      option.style.padding = "7px 9px";
      option.style.display = "grid";
      option.style.gridTemplateColumns = "minmax(0, 1fr) auto";
      option.style.gap = "8px";
      option.style.border = "0";
      option.style.borderRadius = "8px";
      option.style.background = "transparent";
      option.style.textAlign = "left";
      option.style.cursor = "pointer";

      const copy = document.createElement("span");
      const label = document.createElement("strong");
      label.textContent = treatment.label;
      label.style.display = "block";
      const description = document.createElement("small");
      description.textContent = treatment.description;
      description.style.display = "block";
      description.style.marginTop = "2px";
      copy.append(label, description);
      const check = document.createElement("span");
      check.textContent = treatment.id === this.active.id ? "✓" : "";
      option.append(copy, check);
      option.addEventListener("click", () => this.select(treatment));
      menu.append(option);
    }

    container.append(trigger, menu);
    this.container = container;
    this.menu = menu;
    this.trigger = trigger;

    const apply = () => applyTreatment(map, this.active);
    if (map.isStyleLoaded()) apply();
    else map.once("style.load", apply);
    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = null;
    this.menu = null;
    this.trigger = null;
    this.map = null;
  }

  getDefaultPosition(): mapboxgl.ControlPosition {
    return "top-right";
  }

  private toggleMenu(): void {
    if (!this.menu || !this.trigger) return;
    this.menu.hidden = !this.menu.hidden;
    this.trigger.setAttribute("aria-expanded", String(!this.menu.hidden));
    if (!this.menu.hidden) {
      this.menu.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    }
  }

  private select(treatment: BasemapTreatment): void {
    if (!this.map || !this.menu || !this.trigger) return;
    this.active = treatment;
    applyTreatment(this.map, treatment);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, treatment.id);
    } catch {
      // Optional presentation continuity never grants geography or Exchange authority.
    }
    this.trigger.title = `Map type: ${treatment.label}`;
    for (const option of this.menu.querySelectorAll<HTMLButtonElement>("[data-basemap-treatment]")) {
      const active = option.dataset.basemapTreatment === treatment.id;
      option.setAttribute("aria-checked", String(active));
      option.lastElementChild!.textContent = active ? "✓" : "";
    }
    this.menu.hidden = true;
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.focus();
  }
}
