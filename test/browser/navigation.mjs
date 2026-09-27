import React, { useSyncExternalStore } from 'react';
const subscribe = fn => { window.addEventListener('popstate', fn); return () => window.removeEventListener('popstate', fn); };
export const usePathname = () => useSyncExternalStore(subscribe, () => window.location.pathname);
export const useSearchParams = () => new URLSearchParams(window.location.search);
export const useRouter = () => ({ replace: href => window.go(href), refresh: () => { window.refreshes++; } });
export const useLinkStatus = () => ({ pending: false });
export default function Link({ href, children, ...props }) { delete props.prefetch; return React.createElement('a', { ...props, href, onClick: event => { props.onClick?.(event); if (!event.defaultPrevented) { event.preventDefault(); window.go(href); } } }, children); }
