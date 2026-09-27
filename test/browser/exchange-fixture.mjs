import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { usePathname } from './navigation.mjs';
import { PersistentParticipantShell, ParticipantPage } from '../../src/components/participant/PersistentParticipantShell';
import { ExchangeSpatialScene } from '../../src/components/map/ExchangeSpatialScene';
import { I18nProvider } from '../../src/components/i18n/I18nProvider';
import { SpatialWorkspace } from '../../src/components/participant/WorkspacePrimitives';
import '../../app/globals.css';
import { getDictionary } from '../../src/i18n/get-dictionary';
window.refreshes = 0;
window.go = href => { history.pushState({}, '', href); window.dispatchEvent(new PopStateEvent('popstate')); };
function SpatialPage({ lens }) {
  const [count, setCount] = useState(1);
  return React.createElement(ParticipantPage, { activeItem: lens, organizationName: 'Test organization' },
    React.createElement(SpatialWorkspace, { ariaLabel: lens },
      React.createElement(ExchangeSpatialScene, { model: window.fixture.model, mode: 'locality', interactive: true, organizationMarkers: [{ id: 'test-marker', coordinate: [-76.3, 36.8], label: `Record ${count}` }] }),
      React.createElement('button', { id: 'update-record', style: { position: 'absolute', top: 180, left: 20, zIndex: 25 }, onClick: () => setCount(x => x + 1) }, 'Update record')));
}
function App() {
  const pathname = usePathname();
  return React.createElement(I18nProvider, { locale: 'en-US', dictionary: getDictionary('en-US') },
    React.createElement(PersistentParticipantShell, null,
      pathname === '/signin' ? React.createElement('main', null, 'Signed out') :
      pathname === '/resources' ? React.createElement(SpatialPage, { key: 'resources', lens: 'resources' }) :
      React.createElement(SpatialPage, { key: 'opportunities', lens: 'opportunities-rfx' })));
}
createRoot(document.getElementById('root')).render(React.createElement(StrictMode, null, React.createElement(App)));
