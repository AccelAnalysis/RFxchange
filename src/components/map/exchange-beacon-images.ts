import type { Map as MapboxMap } from "mapbox-gl";

export const EXCHANGE_BEACON_KINDS = [
  "own",
  "organization",
  "opportunities-rfx",
  "resources",
  "intelligence",
  "capabilities",
] as const;
export type ExchangeBeaconKind = (typeof EXCHANGE_BEACON_KINDS)[number];

export const EXCHANGE_BEACON_STATES = ["default", "approximate", "selected"] as const;
export type ExchangeBeaconState = (typeof EXCHANGE_BEACON_STATES)[number];

const WIDTH = 132;
const HEIGHT = 148;
const CENTER_X = 62;
const CENTER_Y = 62;
const FACE_RADIUS = 42;
const TIP_Y = 132;
const PIXEL_RATIO = 3;

const glyphs: Readonly<Record<ExchangeBeaconKind, string>> = Object.freeze({
  own: "RF",
  organization: "RF",
  "opportunities-rfx": "RFx",
  resources: "R",
  intelligence: "I",
  capabilities: "C",
});

export function beaconImageId(kind: ExchangeBeaconKind, state: ExchangeBeaconState): string {
  return `exchange-beacon-${kind}-${state}`;
}

function medallionPath(offsetX = 0, offsetY = 0): Path2D {
  const path = new Path2D();
  path.moveTo(CENTER_X + offsetX, 13 + offsetY);
  path.bezierCurveTo(91 + offsetX, 13 + offsetY, 111 + offsetX, 34 + offsetY, 111 + offsetX, 62 + offsetY);
  path.bezierCurveTo(111 + offsetX, 86 + offsetY, 96 + offsetX, 105 + offsetY, 76 + offsetX, 112 + offsetY);
  path.lineTo(CENTER_X + offsetX, TIP_Y + offsetY);
  path.lineTo(48 + offsetX, 112 + offsetY);
  path.bezierCurveTo(28 + offsetX, 105 + offsetY, 13 + offsetX, 86 + offsetY, 13 + offsetX, 62 + offsetY);
  path.bezierCurveTo(13 + offsetX, 34 + offsetY, 33 + offsetX, 13 + offsetY, CENTER_X + offsetX, 13 + offsetY);
  path.closePath();
  return path;
}

function palette(kind: ExchangeBeaconKind, state: ExchangeBeaconState) {
  const own = kind === "own";
  const selected = state === "selected";
  return Object.freeze({
    faceTop: own ? "#fffaf0" : selected ? "#404652" : "#343a45",
    faceMid: own ? "#f1e8d8" : "#252932",
    faceBottom: own ? "#cbbfa9" : "#111419",
    sideTop: own ? "#b49a63" : "#171a20",
    sideBottom: "#08090c",
    rim: selected ? "#f3cf73" : "#d6a23a",
    rimDark: "#755014",
    glyph: own ? "#1b1d22" : "#fff9ec",
    flare: kind === "opportunities-rfx" && selected,
  });
}

function drawBeacon(kind: ExchangeBeaconKind, state: ExchangeBeaconState): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("RFxchange beacon canvas is unavailable.");
  const colors = palette(kind, state);
  context.clearRect(0, 0, WIDTH, HEIGHT);

  if (colors.flare) {
    const flare = context.createLinearGradient(CENTER_X, 0, CENTER_X, 42);
    flare.addColorStop(0, "rgba(243,207,115,0)");
    flare.addColorStop(0.45, "rgba(243,207,115,0.52)");
    flare.addColorStop(1, "rgba(214,162,58,0)");
    context.fillStyle = flare;
    context.beginPath();
    context.moveTo(CENTER_X - 5, 2);
    context.lineTo(CENTER_X + 5, 2);
    context.lineTo(CENTER_X + 15, 47);
    context.lineTo(CENTER_X - 15, 47);
    context.closePath();
    context.fill();
  }

  context.save();
  context.filter = "blur(7px)";
  context.fillStyle = state === "selected" ? "rgba(214,162,58,0.28)" : "rgba(4,5,7,0.28)";
  context.beginPath();
  context.ellipse(CENTER_X + 4, TIP_Y + 3, state === "selected" ? 34 : 27, 8, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();

  const side = medallionPath(6, 2);
  const sideGradient = context.createLinearGradient(28, 18, 108, 122);
  sideGradient.addColorStop(0, colors.sideTop);
  sideGradient.addColorStop(0.58, colors.rimDark);
  sideGradient.addColorStop(1, colors.sideBottom);
  context.fillStyle = sideGradient;
  context.fill(side);

  const front = medallionPath();
  const faceGradient = context.createLinearGradient(25, 14, 103, 121);
  faceGradient.addColorStop(0, colors.faceTop);
  faceGradient.addColorStop(0.46, colors.faceMid);
  faceGradient.addColorStop(1, colors.faceBottom);
  context.fillStyle = faceGradient;
  context.fill(front);

  context.save();
  context.clip(front);
  const highlight = context.createRadialGradient(38, 30, 3, 48, 39, 72);
  highlight.addColorStop(0, "rgba(255,255,255,0.72)");
  highlight.addColorStop(0.28, "rgba(255,255,255,0.2)");
  highlight.addColorStop(0.68, "rgba(255,255,255,0)");
  context.fillStyle = highlight;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.restore();

  context.save();
  context.strokeStyle = colors.rimDark;
  context.lineWidth = state === "selected" ? 10 : 8;
  context.stroke(front);
  context.strokeStyle = colors.rim;
  context.lineWidth = state === "selected" ? 6 : 4;
  if (state === "approximate") context.setLineDash([7, 5]);
  context.stroke(front);
  context.restore();

  if (state === "selected") {
    context.strokeStyle = "rgba(255,248,226,0.82)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(CENTER_X, CENTER_Y, FACE_RADIUS + 7, Math.PI * 1.14, Math.PI * 1.83);
    context.stroke();
  }

  context.strokeStyle = kind === "own" ? "rgba(27,29,34,0.32)" : "rgba(255,255,255,0.18)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(CENTER_X, CENTER_Y, FACE_RADIUS - 7, Math.PI * 1.1, Math.PI * 1.82);
  context.stroke();

  const glyph = glyphs[kind];
  context.fillStyle = colors.glyph;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = glyph === "RFx"
    ? "800 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    : glyph === "RF"
      ? "800 25px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      : "850 31px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText(glyph, CENTER_X, CENTER_Y + 1);

  return context.getImageData(0, 0, WIDTH, HEIGHT);
}

export function registerExchangeBeaconImages(map: MapboxMap): void {
  for (const kind of EXCHANGE_BEACON_KINDS) {
    for (const state of EXCHANGE_BEACON_STATES) {
      const id = beaconImageId(kind, state);
      if (!map.hasImage(id)) map.addImage(id, drawBeacon(kind, state), { pixelRatio: PIXEL_RATIO });
    }
  }
}
