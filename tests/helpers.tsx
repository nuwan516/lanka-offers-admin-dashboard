import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, expect } from 'vitest';
import App from '../src/App';
import { ThemeProvider } from '../src/hooks/useTheme';

type Body = unknown;
export type Handler = (request: { url: URL; method: string; body: any }) => Body | Response | Promise<Body | Response>;

interface Call {
  method: string;
  path: string;
  body: any;
}

let routes = new Map<string, Handler>();
let calls: Call[] = [];
let unmocked: string[] = [];

export function resetApi() {
  routes = new Map();
  calls = [];
  unmocked = [];
  installFetch();
}

/** Register a fixture for `"GET /api/stats"`-style keys. */
export function mockApi(table: Record<string, Handler | Body>) {
  for (const [key, value] of Object.entries(table)) {
    routes.set(key, typeof value === 'function' ? (value as Handler) : () => value);
  }
}

export const json = (body: Body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** What a dead admin API looks like through the dev proxy: an HTML error page. */
export const apiDown = () =>
  new Response('<html>Bad gateway</html>', { status: 502, headers: { 'content-type': 'text/html' } });

export const requests = () => calls;
export const callsTo = (method: string, path: string) =>
  calls.filter((c) => c.method === method && c.path === path);

function installFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin);
      const method = (init?.method ?? 'GET').toUpperCase();

      // Tests may only talk to same-origin /api/*, answered from fixtures. An
      // absolute URL (a real admin API host, Neon, anything) is a test bug.
      if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
        unmocked.push(`${method} ${url.href}`);
        throw new Error(`Blocked non-fixture request: ${method} ${url.href}`);
      }

      const key = `${method} ${url.pathname}`;
      const handler = routes.get(key);
      if (!handler) {
        unmocked.push(key);
        return json({ error: `No fixture for ${key}` }, 404);
      }
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, path: url.pathname, body });
      const result = await handler({ url, method, body });
      return result instanceof Response ? result : json(result);
    })
  );
}

/** Fails the test if the app asked for anything that has no fixture. */
export function expectNoUnmockedRequests() {
  expect(unmocked, 'requests with no fixture').toEqual([]);
}

export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MemoryRouter>
  );
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

export const statsFixture = {
  offers: {
    active_offers: '611', total_offers: '810', llm_valid: '600', rule_failed: '4', llm_scored: '590',
    avg_llm_score: '88', banks_with_data: '4', pending_review: '12', pending_sync: '3', unresolved_geo: '7',
  },
  runs: { running_jobs: '0', failed_today: '0', runs_today: '2', last_run_at: '2026-10-18T05:00:00Z', scraped_today: '120', new_today: '5', changed_today: '9' },
  validation: { validation_failures: '4', total_validated: '810' },
  duplicates: { pending: 2, confirmed: 1, notDuplicate: 0 },
};

export const banksFixture = {
  items: [
    {
      bank: 'hnb', total_offers: '448', active_offers: '448', published_count: '448',
      review_required_count: '12', validated_count: '440', rule_failures: '8', geo_count: '300',
      avg_llm_score: '90', last_updated: '2026-10-18T05:10:00Z',
      last_run_status: 'completed', last_run_at: '2026-10-18T05:00:00Z', last_attempted_at: '2026-10-18T05:00:00Z',
      last_success_at: '2026-10-18T05:09:00Z', last_run_found: 450, last_run_new: 3, last_run_changed: 6, last_run_errors: 0,
      health_status: 'Healthy',
    },
    {
      bank: 'boc', total_offers: '46', active_offers: '46', published_count: '46',
      review_required_count: '0', validated_count: '46', rule_failures: '0', geo_count: '30',
      avg_llm_score: '85', last_updated: '2026-10-10T05:10:00Z',
      last_run_status: 'failed', last_run_at: '2026-10-17T05:00:00Z', last_attempted_at: '2026-10-17T05:00:00Z',
      last_success_at: '2026-10-10T05:09:00Z', last_run_found: 0, last_run_new: 0, last_run_changed: 0, last_run_errors: 3,
      health_status: 'Failed',
    },
    {
      bank: 'sampath', total_offers: '0', active_offers: '0', published_count: '0',
      review_required_count: '0', validated_count: '0', rule_failures: '0', geo_count: '0',
      avg_llm_score: null, last_updated: null,
      last_run_status: null, last_run_at: null, last_attempted_at: null, last_success_at: null,
      health_status: 'Idle',
    },
  ],
};

export const geoFixture = { totalOffers: 810, offersWithGeom: 600, offersWithoutGeom: 210, coveragePercent: 74.1, unresolved: 7 };

export function mockOverview() {
  mockApi({
    'GET /api/stats': statsFixture,
    'GET /api/banks': banksFixture,
    'GET /api/runs': { items: [], total: 0 },
    'GET /api/geo/stats': geoFixture,
  });
}
