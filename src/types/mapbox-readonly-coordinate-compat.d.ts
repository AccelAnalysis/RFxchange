import "mapbox-gl";

import type {
  EaseToOptions,
  FlyToOptions,
  JumpToOptions,
  LngLatLike,
} from "mapbox-gl";

type ReadonlyCoordinate = readonly [longitude: number, latitude: number];
type ReadonlyCenter<T> = Omit<T, "center"> & {
  center?: LngLatLike | ReadonlyCoordinate;
};

declare module "mapbox-gl" {
  interface Map {
    jumpTo(options: ReadonlyCenter<JumpToOptions>): this;
    flyTo(options: ReadonlyCenter<FlyToOptions>): this;
    easeTo(options: ReadonlyCenter<EaseToOptions>): this;
  }

  interface Marker {
    setLngLat(lnglat: LngLatLike | ReadonlyCoordinate): this;
  }

  interface GeoJSONFeature {
    properties?: Readonly<Record<string, unknown>> | null;
  }
}
