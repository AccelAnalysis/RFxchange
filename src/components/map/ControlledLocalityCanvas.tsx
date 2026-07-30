"use client";

import { useId, useMemo, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  CONTROLLED_LOCALITY_ZOOM_LEVELS,
  boundaryGeometryToSvgPath,
  projectGeographicPosition,
  viewportForZoom,
  type ControlledLocalityZoomLevel,
} from "../../application/geography/geographic-projection";

import styles from "./ControlledLocalityCanvas.module.css";

export interface ControlledLocalityCanvasProps {
  readonly model: ControlledLocalityMapModel;
  readonly initialZoom?: ControlledLocalityZoomLevel;
  readonly headingLevel?: "h1" | "h2";
}

const VIEWBOX_WIDTH = 1100;
const VIEWBOX_HEIGHT = 700;

export function ControlledLocalityCanvas({
  model,
  initialZoom = "locality",
  headingLevel = "h1",
}: ControlledLocalityCanvasProps) {
  const Heading = headingLevel;
  const titleId = useId();
  const descriptionId = useId();
  const [zoomIndex, setZoomIndex] = useState(() => {
    const index = CONTROLLED_LOCALITY_ZOOM_LEVELS.findIndex(
      (candidate) => candidate.id === initialZoom,
    );
    return index >= 0 ? index : 1;
  });
  const zoom = CONTROLLED_LOCALITY_ZOOM_LEVELS[zoomIndex];
  const viewport = useMemo(
    () =>
      viewportForZoom(
        model.camera.bounds,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT,
        zoom.id,
      ),
    [model.camera.bounds, zoom.id],
  );

  return (
    <figure className={styles.figure} data-selected-geography={model.selectedGeography.id}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Controlled locality</p>
          <Heading className={styles.title}>{model.selectedGeography.name}</Heading>
          <p className={styles.detail}>
            Selected geography is shown in full focus. Surrounding localities remain visible
            for geographic context.
          </p>
        </div>
        <div className={styles.controls} aria-label="Map zoom controls">
          <button
            type="button"
            onClick={() => setZoomIndex((current) => Math.max(0, current - 1))}
            disabled={zoomIndex === 0}
            aria-label="Zoom out"
          >
            −
          </button>
          <output aria-live="polite">{zoom.id}</output>
          <button
            type="button"
            onClick={() =>
              setZoomIndex((current) =>
                Math.min(CONTROLLED_LOCALITY_ZOOM_LEVELS.length - 1, current + 1),
              )
            }
            disabled={zoomIndex === CONTROLLED_LOCALITY_ZOOM_LEVELS.length - 1}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.canvas}>
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={titleId}>
            {`${model.selectedGeography.name} controlled locality map`}
          </title>
          <desc id={descriptionId}>
            {`U.S. Census boundary for ${model.selectedGeography.name} is prominently outlined. Adjacent localities are visible beneath a muted gray treatment.`}
          </desc>
          <defs>
            <linearGradient id={`${titleId}-selected-fill`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#79a685" />
              <stop offset="1" stopColor="#3b7b57" />
            </linearGradient>
            <pattern
              id={`${titleId}-grid`}
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 44 0 L 0 0 0 44" className={styles.gridLine} />
            </pattern>
          </defs>
          <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} className={styles.water} />
          <rect
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            fill={`url(#${titleId}-grid)`}
          />

          {model.layers.map((layer) => (
            <g
              key={layer.id}
              data-layer-id={layer.id}
              data-layer-order={layer.order}
              aria-hidden="true"
            >
              {layer.features.map((feature) => (
                <path
                  key={`${layer.id}:${feature.geography.id}`}
                  d={boundaryGeometryToSvgPath(feature.boundary.geometry, viewport)}
                  data-geography-id={feature.geography.id}
                  data-geography-role={feature.role}
                  fill={
                    layer.id === "selected-fill"
                      ? `url(#${titleId}-selected-fill)`
                      : layer.style.fill
                  }
                  fillOpacity={layer.style.fillOpacity}
                  fillRule="evenodd"
                  stroke={layer.style.stroke}
                  strokeOpacity={layer.style.strokeOpacity}
                  strokeWidth={layer.style.strokeWidth}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          ))}

          <g className={styles.labels} aria-hidden="true" data-layer-order="60">
            {model.features.map((feature) => {
              const point = projectGeographicPosition(
                [
                  feature.geography.defaultCamera.center.longitude,
                  feature.geography.defaultCamera.center.latitude,
                ],
                viewport,
              );
              return (
                <text
                  key={feature.geography.id}
                  x={point.x}
                  y={point.y}
                  className={
                    feature.role === "selected"
                      ? styles.selectedLabel
                      : styles.surroundingLabel
                  }
                  textAnchor="middle"
                >
                  {feature.geography.name}
                </text>
              );
            })}
          </g>
        </svg>

        <div className={styles.legend} aria-label="Map legend">
          <span><i className={styles.selectedSwatch} /> Selected locality</span>
          <span><i className={styles.surroundingSwatch} /> Surrounding context</span>
        </div>
        <a
          className={styles.attribution}
          href={model.attribution.sourceLayerUrl}
          target="_blank"
          rel="noreferrer"
        >
          {model.attribution.label} · {model.attribution.vintage}
        </a>
      </div>

      <figcaption className={styles.caption}>
        Boundary geometry is anchored in EPSG:4326 coordinates and reprojected as the camera
        changes; layer order keeps locality outlines above all fills.
      </figcaption>
    </figure>
  );
}
