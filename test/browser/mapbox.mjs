// Explicit SDK double: checks React/map lifetime, projections and camera commands, not GPU performance.
window.maps = []; window.sdkLoads = (window.sdkLoads ?? 0) + 1;
class Map {
  constructor(options) {
    this.options = options; this.handlers = new globalThis.Map(); this.sources = new globalThis.Map(); this.layers = new globalThis.Map();
    this.center = options.center; this.zoom = options.zoom; this.pitch = options.pitch; this.bearing = options.bearing;
    this.padding = { top: 0, right: 0, bottom: 0, left: 0 }; this.commands = []; this.removed = false;
    window.maps.push(this); setTimeout(() => { if (!this.removed) this.emit('load'); }, 0);
  }
  on(name, layerOrFn, fn) { const callback = fn ?? layerOrFn; const list = this.handlers.get(name) ?? new Set(); list.add(callback); this.handlers.set(name, list); return this; }
  off(name, fn) { this.handlers.get(name)?.delete(fn); return this; }
  once(name, fn) { const wrapped = event => { this.off(name, wrapped); fn(event); }; return this.on(name, wrapped); }
  emit(name, value = {}) { for (const fn of [...(this.handlers.get(name) ?? [])]) fn(value); }
  addSource(id, value) { this.sources.set(id, { ...value, setData(data) { this.data = data; } }); }
  getSource(id) { return this.sources.get(id); }
  addLayer(value) { this.layers.set(value.id, value); }
  getLayer(id) { return this.layers.get(id); }
  getStyle() { return { layers: [...this.layers.values()] }; }
  setLayoutProperty(id, key, value) { const layer = this.layers.get(id); if (layer) layer.layout = { ...layer.layout, [key]: value }; }
  setPadding(value) { this.padding = value; }
  getPadding() { return this.padding; }
  getCenter() { return { lng: this.center[0], lat: this.center[1] }; }
  getZoom() { return this.zoom; } getPitch() { return this.pitch; } getBearing() { return this.bearing; } getMaxZoom() { return 24; }
  getCanvas() { return this.options.container; } queryRenderedFeatures() { return []; } project() { return { x: 150, y: 150 }; }
  isMoving() { return false; } hasImage() { return false; } addImage() {} addControl() {}
  jumpTo(options) { this.apply(options); }
  flyTo(options) { this.apply(options); }
  easeTo(options) { this.commands.push(options); this.apply(options, options.duration > 1000); }
  fitBounds(bounds, options) { this.apply({ ...options, center: [-76.3, 36.8], zoom: 10 }); }
  apply(options, ambient = false) { for (const key of ['center', 'zoom', 'pitch', 'bearing', 'padding']) if (options[key] !== undefined) this[key] = options[key]; if (!ambient) queueMicrotask(() => { if (!this.removed) this.emit('moveend'); }); }
  stop() {} remove() { this.removed = true; this.handlers.clear(); }
}
class Marker { setLngLat() { return this; } addTo() { return this; } remove() {} }
const mapbox = { Map, Marker, NavigationControl: class {} };
export default mapbox;
