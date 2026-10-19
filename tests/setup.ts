import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { resetApi } from './helpers';

// Cloudscape expects browser APIs that jsdom does not implement.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof NoopResizeObserver }).ResizeObserver ??= NoopResizeObserver;
window.scrollTo = (() => undefined) as typeof window.scrollTo;
Element.prototype.scrollIntoView ??= () => undefined;

beforeEach(() => {
  localStorage.clear();
  resetApi();
});

afterEach(() => {
  cleanup();
});
