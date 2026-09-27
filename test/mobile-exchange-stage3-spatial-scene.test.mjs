import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
register('../scripts/node-typescript-source-loader.mjs', import.meta.url);
const { installSceneInteractions } = await import('../src/components/map/exchange-scene-interactions.ts');
const data = await import('../src/components/map/exchange-scene-data.ts');

function scene() {
  const handlers = new Map(), selected = [], cameras = [], organizations = [];
  const state = { selectable: new Map(), clusters: new Map(), reducedMotion: true, markerId: 'home' };
  let collisions = [];
  const map = {
    on: (event, layer, fn) => handlers.set(`${event}:${layer}`, fn),
    getCanvas: () => ({ style: {} }), getZoom: () => 17, getMaxZoom: () => 18,
    queryRenderedFeatures: () => collisions, easeTo: camera => cameras.push(camera),
    getSource: () => ({ getClusterExpansionZoom: (_, callback) => callback(null, 12) }),
  };
  installSceneInteractions(map, () => state, () => {}, id => organizations.push(id), () => {}, item => selected.push(item));
  return { state, selected, cameras, organizations, overlap: value => { collisions = value; }, click: (layer, properties, coordinates = [1, 2]) => handlers.get(`click:${layer}`)({ point: {}, features: [{ properties, geometry: { coordinates } }] }) };
}

test('map selections resolve the current authorized projection without stale closures or fabricated records', () => {
  const s = scene();
  const original = { kind: 'organization', id: 'authorized-a' }, updated = { ...original, label: 'Updated' };
  s.state.selectable.set('render-a', original);
  s.click(data.LENS_PROJECTION_OBJECT_LAYER_ID, { renderId: 'render-a' });
  assert.equal(s.selected[0], original);
  s.state.selectable = new Map([['render-a', updated]]);
  s.click(data.LENS_PROJECTION_OBJECT_LAYER_ID, { renderId: 'render-a' });
  assert.equal(s.selected[1], updated);
  s.click(data.LENS_PROJECTION_OBJECT_LAYER_ID, { renderId: 'unknown' });
  assert.equal(s.selected.length, 2);
  s.click(data.NETWORK_MARKER_CORE_LAYER_ID, { id: 'network-marker' });
  assert.deepEqual(s.organizations, ['network-marker']);
});

test('clusters only move the camera, clamp zoom and respect reduced motion', () => {
  const s = scene();
  s.state.clusters.set('cluster-a', { projection: { kind: 'cluster' }, coordinate: [1, 2] });
  s.click(data.LENS_PROJECTION_CLUSTER_LAYER_ID, { renderId: 'cluster-a' });
  assert.deepEqual(s.cameras, [{ center: [1, 2], zoom: 18, duration: 0 }]);
  s.click(data.NETWORK_CLUSTER_CORE_LAYER_ID, { cluster_id: 1 });
  assert.equal(s.cameras[1].zoom, 12);
  assert.deepEqual(s.selected, []);
  assert.deepEqual(s.organizations, []);
});

test('overlapping points take precedence over area and cluster selection', () => {
  const s = scene();
  s.state.selectable.set('area-a', { kind: 'area' });
  s.state.clusters.set('cluster-a', { projection: { kind: 'cluster' }, coordinate: [1, 2] });
  s.overlap([{}]);
  s.click(data.LENS_PROJECTION_AREA_FILL_LAYER_ID, { renderId: 'area-a' });
  s.click(data.LENS_PROJECTION_CLUSTER_LAYER_ID, { renderId: 'cluster-a' });
  s.click(data.HOME_MARKER_CORE_LAYER_ID, {});
  assert.deepEqual([s.selected, s.cameras, s.organizations], [[], [], []]);
  s.overlap([]);
  s.click(data.LENS_PROJECTION_AREA_FILL_LAYER_ID, { renderId: 'area-a' });
  assert.equal(s.selected.length, 1);
});
