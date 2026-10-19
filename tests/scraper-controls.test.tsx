import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { apiDown, callsTo, expectNoUnmockedRequests, mockApi, renderApp, statsFixture } from './helpers';

const startedAt = '2026-10-18T05:00:00.000Z';

function mockScraperPage(active: unknown[] = []) {
  mockApi({
    'GET /api/stats': statsFixture,
    'GET /api/scrape/status': { active, activeGeo: [] },
    'GET /api/runs': { items: [], total: 0 },
    'POST /api/scrape/hnb': ({ body }) => ({
      message: body.dryRun ? 'Dry-run started for hnb (no database writes)' : 'Scrape started for hnb',
      pid: 4242,
      bank: 'hnb',
      startedAt,
      dryRun: body.dryRun === true,
    }),
    'POST /api/scrape/hnb/cancel': { message: 'Cancelled hnb scrape', cancelled: true, pid: 4242, bank: 'hnb' },
    'POST /api/geocode/hnb': { message: 'Geocode started for hnb', pid: 77, bank: 'hnb', startedAt },
  });
}

async function openPage() {
  renderApp('/run-scraper?bank=hnb');
  return screen.findByRole('button', { name: /Start scrape \(HNB\)/ });
}

describe('Authorized scrape', () => {
  it('asks for confirmation and sends nothing until it is given', async () => {
    mockScraperPage();
    await userEvent.click(await openPage());

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('This starts a real scrape that writes to the database.')).toBeInTheDocument();
    expect(within(dialog).getByText(/Nothing is published to consumers/)).toBeInTheDocument();
    expect(callsTo('POST', '/api/scrape/hnb')).toHaveLength(0);
  });

  it('keeps the confirm button disabled until the operator acknowledges the write', async () => {
    mockScraperPage();
    await userEvent.click(await openPage());

    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Start scrape' });
    expect(confirm).toBeDisabled();

    await userEvent.click(within(dialog).getByRole('checkbox'));
    expect(confirm).toBeEnabled();
  });

  it('starts a real (non dry-run) scrape only after confirmation', async () => {
    mockScraperPage();
    await userEvent.click(await openPage());

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('checkbox'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Start scrape' }));

    await waitFor(() => expect(callsTo('POST', '/api/scrape/hnb')).toHaveLength(1));
    expect(callsTo('POST', '/api/scrape/hnb')[0].body.dryRun).toBe(false);
    expect(await screen.findByText('Scraper started')).toBeInTheDocument();
  });

  it('cancelling the dialog sends nothing', async () => {
    mockScraperPage();
    await userEvent.click(await openPage());

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(callsTo('POST', '/api/scrape/hnb')).toHaveLength(0);
  });

  it('warns when rule validation is switched off', async () => {
    mockScraperPage();
    await openPage();

    await userEvent.click(screen.getByText('Skip rule validation'));
    expect(await screen.findByText('Rule validation is off')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Start scrape \(HNB\)/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Rule validation is skipped for this run.')).toBeInTheDocument();
  });
});

describe('Dry run', () => {
  it('is a separate action that starts immediately and is marked as dry-run', async () => {
    mockScraperPage();
    await openPage();

    await userEvent.click(screen.getByRole('button', { name: /Dry run \(HNB\)/ }));

    await waitFor(() => expect(callsTo('POST', '/api/scrape/hnb')).toHaveLength(1));
    expect(callsTo('POST', '/api/scrape/hnb')[0].body.dryRun).toBe(true);
    expect(await screen.findByText('Dry run started')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is explained as not writing offers, runs or staging', async () => {
    mockScraperPage();
    await openPage();

    expect(screen.getByText(/without writing offers, runs or staging to the database/)).toBeInTheDocument();
  });
});

describe('Active jobs', () => {
  const active = [{ bank: 'hnb', pid: 4242, startedAt, dryRun: false }];

  it('shows whether a running job writes to the database', async () => {
    mockScraperPage([...active, { bank: 'boc', pid: 99, startedAt, dryRun: true }]);
    renderApp('/run-scraper?bank=hnb');

    expect(await screen.findByText('Writes to database')).toBeInTheDocument();
    expect(screen.getByText('Dry run (no writes)')).toBeInTheDocument();
  });

  it('confirms before cancelling and only then calls the API', async () => {
    mockScraperPage(active);
    renderApp('/run-scraper?bank=hnb');

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('The running scrape process will be terminated.')).toBeInTheDocument();
    expect(callsTo('POST', '/api/scrape/hnb/cancel')).toHaveLength(0);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel job' }));
    await waitFor(() => expect(callsTo('POST', '/api/scrape/hnb/cancel')).toHaveLength(1));
  });

  it('blocks starting another scrape for a bank that is already running', async () => {
    mockScraperPage(active);
    renderApp('/run-scraper?bank=hnb');

    expect(await screen.findByRole('button', { name: 'A scraper is already running' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Dry run \(HNB\)/ })).toBeDisabled();
  });
});

describe('Geocoding', () => {
  it('confirms first because it can use paid quota', async () => {
    mockScraperPage();
    await openPage();

    await userEvent.click(screen.getByRole('button', { name: /Run geocode for HNB/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/paid geocoding quota/)).toBeInTheDocument();
    expect(callsTo('POST', '/api/geocode/hnb')).toHaveLength(0);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Run geocode' }));
    await waitFor(() => expect(callsTo('POST', '/api/geocode/hnb')).toHaveLength(1));
  });
});

describe('Errors and an unreachable API', () => {
  it('disables every operation and says why when the admin API is down', async () => {
    mockApi({
      'GET /api/stats': apiDown,
      'GET /api/scrape/status': apiDown,
      'GET /api/runs': apiDown,
    });
    renderApp('/run-scraper?bank=hnb');

    expect(await screen.findByText('Admin API unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dry run/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Start scrape/ })).toBeDisabled();
    expect(screen.getByText('Job status unavailable.')).toBeInTheDocument();
  });

  it('reports a rejected start (for example a conflict) without losing the page', async () => {
    mockScraperPage();
    mockApi({
      'POST /api/scrape/hnb': () =>
        new Response(JSON.stringify({ error: 'A scrape job for HNB is already running' }), {
          status: 409,
          headers: { 'content-type': 'application/json' },
        }),
    });
    await openPage();

    await userEvent.click(screen.getByRole('button', { name: /Dry run \(HNB\)/ }));

    expect(await screen.findByText('Could not start dry run')).toBeInTheDocument();
    expect(screen.getByText('A scrape job for HNB is already running')).toBeInTheDocument();
    expectNoUnmockedRequests();
  });
});
