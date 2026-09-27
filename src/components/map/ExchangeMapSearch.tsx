"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "../i18n/I18nProvider";
import {
  EMPTY_FEATURE_COLLECTION,
  SEARCH_AREA_SOURCE_ID,
  bboxFeatureCollection,
  parseMapboxSearchResults,
  searchZoom,
  type MapSearchResult,
} from "./exchange-scene-data";
import styles from "./ExchangeSpatialScene.module.css";

export function ExchangeMapSearch({
  map,
  sdk,
  token,
  localityName,
  onFitLocality,
  onInteraction,
  onHighlightChange,
}: Readonly<{
  map: mapboxgl.Map;
  sdk: typeof import("mapbox-gl").default;
  token: string;
  localityName: string;
  onFitLocality: () => void;
  onInteraction: () => void;
  onHighlightChange: (active: boolean) => void;
}>) {
  const { t } = useI18n();
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly MapSearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeSearchResultId, setActiveSearchResultId] = useState<string | null>(null);
  const clearSearchHighlight = useCallback(() => {
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
    setActiveSearchResultId(null);
    onHighlightChange(false);
    const source = map.getSource(SEARCH_AREA_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(EMPTY_FEATURE_COLLECTION);
  }, [map, onHighlightChange]);

  const selectSearchResult = useCallback(
    (result: MapSearchResult) => {
      if (!map) return;
      onInteraction();
      clearSearchHighlight();
      setActiveSearchResultId(result.id);
      onHighlightChange(true);

      searchMarkerRef.current = new sdk.Marker({ color: "#2e5eaa", scale: 0.9 })
        .setLngLat([result.center[0], result.center[1]])
        .addTo(map);
      const source = map.getSource(SEARCH_AREA_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      source?.setData(bboxFeatureCollection(result.bbox));

      if (result.bbox) {
        const [west, south, east, north] = result.bbox;
        map.fitBounds(
          [
            [west, south],
            [east, north],
          ],
          {
            padding: 72,
            maxZoom: 17,
            duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850,
          },
        );
      } else {
        map.flyTo({
          center: [result.center[0], result.center[1]],
          zoom: searchZoom(result.featureType),
          duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850,
        });
      }
    },
    [map, sdk, clearSearchHighlight, onInteraction, onHighlightChange],
  );

  const submitMapSearch = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const query = searchQuery.trim();
      if (!query || !token.startsWith("pk.")) return;

      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      setSearchStatus("loading");

      try {
        const params = new URLSearchParams({
          q: query,
          access_token: token,
          language: "en",
          limit: "6",
          types: "country,region,district,place,city,locality,neighborhood,street,address,poi",
        });
        if (map) {
          const center = map.getCenter();
          params.set("proximity", `${center.lng},${center.lat}`);
        }
        const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/forward?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Mapbox search failed with HTTP ${response.status}.`);
        const results = parseMapboxSearchResults(await response.json());
        setSearchResults(results);
        setSearchStatus("idle");
        if (results.length === 1) selectSearchResult(results[0]);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSearchResults([]);
        setSearchStatus("error");
      }
    },
    [map, searchQuery, selectSearchResult, token],
  );

  useEffect(
    () => () => {
      searchAbortRef.current?.abort();
      searchMarkerRef.current?.remove();
      onHighlightChange(false);
      if (map.getStyle()?.sources?.[SEARCH_AREA_SOURCE_ID]) {
        (map.getSource(SEARCH_AREA_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined)?.setData(EMPTY_FEATURE_COLLECTION);
      }
    },
    [map, onHighlightChange],
  );
  return (
    <section className={styles.searchPanel} aria-label="Search the Exchange map">
      <form className={styles.searchForm} role="search" onSubmit={submitMapSearch}>
        <label>
          <span aria-hidden="true" className={styles.searchGlyph}>
            ⌕
          </span>
          <span className={styles.srOnly}>Search any geography, address, or place</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search any geography or place"
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={!searchQuery.trim() || searchStatus === "loading"}>
          {searchStatus === "loading" ? "Searching…" : "Search"}
        </button>
      </form>
      <div className={styles.homeContext}>
        <span>Home locality</span>
        <strong>{localityName}</strong>
        <button
          type="button"
          onClick={() => {
            clearSearchHighlight();
            onFitLocality();
          }}
        >
          {t("interface.map.fitHome")}
        </button>
      </div>
      {searchStatus === "error" ? (
        <p className={styles.searchMessage} role="status">
          Search is temporarily unavailable. Map navigation remains available.
        </p>
      ) : null}
      {searchResults.length > 0 ? (
        <ul className={styles.searchResults} aria-label="Map search results">
          {searchResults.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                data-active={activeSearchResultId === result.id}
                onClick={() => selectSearchResult(result)}
              >
                <strong>{result.name}</strong>
                <span>{result.context || result.featureType}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {activeSearchResultId ? (
        <button type="button" className={styles.clearSearch} onClick={clearSearchHighlight}>
          Clear search highlight
        </button>
      ) : null}
      <p className={styles.searchHint}>Search moves the camera only and never changes your home locality.</p>
    </section>
  );
}
