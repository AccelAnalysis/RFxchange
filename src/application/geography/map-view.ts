export type MapViewMode = "2d" | "perspective" | "3d";

export interface ParticipantMapCamera {
  readonly longitude: number;
  readonly latitude: number;
  readonly zoom: number;
  readonly pitch: number;
  readonly bearing: number;
  readonly viewMode: MapViewMode;
}

export const PARTICIPANT_MAP_VIEW_OPTIONS = Object.freeze([
  Object.freeze({ id: "2d" as const, label: "2D", pitch: 0, resetBearing: true, description: "Flat north-up operational map" }),
  Object.freeze({ id: "perspective" as const, label: "Perspective", pitch: 35, resetBearing: false, description: "Tilted spatial context" }),
  Object.freeze({ id: "3d" as const, label: "3D", pitch: 75, resetBearing: false, description: "Deep spatial view" }),
] as const);

export function mapViewModeForPitch(pitch: number): MapViewMode {
  if (pitch >= 48) return "3d";
  if (pitch >= 15) return "perspective";
  return "2d";
}

export function isMapViewMode(value: unknown): value is MapViewMode {
  return value === "2d" || value === "perspective" || value === "3d";
}

export function isParticipantMapCamera(value: unknown): value is ParticipantMapCamera {
  if (!value || typeof value !== "object") return false;
  const camera = value as Partial<ParticipantMapCamera>;
  return (
    typeof camera.longitude === "number" && Number.isFinite(camera.longitude) && camera.longitude >= -180 && camera.longitude <= 180 &&
    typeof camera.latitude === "number" && Number.isFinite(camera.latitude) && camera.latitude >= -85.05112878 && camera.latitude <= 85.05112878 &&
    typeof camera.zoom === "number" && Number.isFinite(camera.zoom) && camera.zoom >= 0 && camera.zoom <= 24 &&
    typeof camera.pitch === "number" && Number.isFinite(camera.pitch) && camera.pitch >= 0 && camera.pitch <= 85 &&
    typeof camera.bearing === "number" && Number.isFinite(camera.bearing) && camera.bearing >= -360 && camera.bearing <= 360 &&
    isMapViewMode(camera.viewMode) && camera.viewMode === mapViewModeForPitch(camera.pitch)
  );
}
