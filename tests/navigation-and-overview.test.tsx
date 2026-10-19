import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  apiDown, expectNoUnmockedRequests, json, mockApi, mockOverview, renderApp, statsFixture,
} from './helpers';

describe('navigation', () => {
  it('groups the side navigation by operator workflow', async () => {
    mockOverview();
    renderApp('/');

    for (const group of ['Review & publishing', 'Ingestion', 'Quality & rules', 'Reference data', 'System']) {
      expect(await screen.findByText(group)).toBeInTheDocument();
    }
    // Every old destination is still reachable.
    for (const link of ['Review queue', 'Offers', 'Scrape runs', 'Run scraper', 'Schedule', 'Merchants', 'Settings']) {
      expect(screen.getByRole('link', { name: link })).toBeInTheDocument();
    }
  });

  it('highlights the parent entry on detail routes', async () => {
    mockApi({ 'GET /api/stats': statsFixture, 'GET /api/runs': { items: [], total: 0 } });
    renderApp('/runs/1');

    const active = await screen.findByRole('link', { name: 'Scrape runs' });
    await waitFor(() => expect(active).toHaveAttribute('aria-current', 'page'));
  });

  it('navigates between pages from the side navigation', async () => {
    mockOverview();
    mockApi({ 'GET /api/offers': { items: [], total: 0, limit: 50, offset: 0 } });
    renderApp('/');

    await userEvent.click(await screen.findByRole('link', { name: 'Offers' }));

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Offers' })).toHaveAttribute('aria-current', 'page')
    );
  });

  it('marks the Cost & budget alias route as the same destination', async () => {
    mockApi({ 'GET /api/stats': statsFixture });
    renderApp('/budget');

    const link = await screen.findByRole('link', { name: 'Cost & budget tracker' });
    await waitFor(() => expect(link).toHaveAttribute('aria-current', 'page'));
  });
});

describe('Overview when the admin API is unreachable', () => {
  function allDown() {
    mockApi({
      'GET /api/stats': apiDown,
      'GET /api/banks': apiDown,
      'GET /api/runs': apiDown,
      'GET /api/geo/stats': apiDown,
    });
  }

  it('says the API is unreachable instead of showing zeros', async () => {
    allDown();
    renderApp('/');

    expect(await screen.findByText(/Cannot reach the API/)).toBeInTheDocument();
    // Unknown counts are dashes, never a reassuring 0.
    expect(screen.queryByText('0 failures')).not.toBeInTheDocument();
    expect(screen.queryByText('0 issues')).not.toBeInTheDocument();
    expect(screen.queryByText('0 active')).not.toBeInTheDocument();
  });

  it('shows health indicators as Unavailable, not as green successes', async () => {
    allDown();
    renderApp('/');

    await waitFor(() => expect(screen.getAllByText('Unavailable').length).toBeGreaterThanOrEqual(3));
  });

  it('explains that bank status is unavailable rather than "no data"', async () => {
    allDown();
    renderApp('/');

    expect(
      await screen.findByText('Bank status is unavailable because the admin API did not respond.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/No bank data found/)).not.toBeInTheDocument();
  });

  it('treats a bank-status failure as a partial failure with retry when the rest loaded', async () => {
    mockOverview();
    mockApi({ 'GET /api/banks': apiDown });
    renderApp('/');

    expect(await screen.findByText('Bank status unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    // The rest of the page still shows real numbers.
    expect(await screen.findByText('611')).toBeInTheDocument();
  });

  it('recovers when the retry succeeds', async () => {
    mockOverview();
    let healthy = false;
    mockApi({
      'GET /api/banks': async () => (healthy ? (await import('./helpers')).banksFixture : apiDown()),
    });
    renderApp('/');

    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    healthy = true;
    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('button', { name: 'HNB' })).toBeInTheDocument();
    expectNoUnmockedRequests();
  });
});

describe('Bank operational status', () => {
  async function rowFor(bank: string) {
    const button = await screen.findByRole('button', { name: bank });
    return button.closest('tr') as HTMLElement;
  }

  it('separates the last run, extraction, validation, review backlog and publication', async () => {
    mockOverview();
    renderApp('/');

    const hnb = within(await rowFor('HNB'));
    expect(hnb.getByText('Completed')).toBeInTheDocument();
    expect(hnb.getByText(/450 found · 3 new · 6 changed/)).toBeInTheDocument();
    expect(hnb.getByText(/440 \/ 448/)).toBeInTheDocument();
    expect(hnb.getByText(/8 failing/)).toBeInTheDocument();
    expect(hnb.getByRole('button', { name: '12' })).toBeInTheDocument(); // review backlog link
    expect(hnb.getByText('448')).toBeInTheDocument(); // published
  });

  it('does not let a failed run read as healthy, and keeps the last success visible', async () => {
    mockOverview();
    renderApp('/');

    const boc = within(await rowFor('BOC'));
    expect(boc.getByText('Failed')).toBeInTheDocument();
    expect(boc.getByText(/3 errors/)).toBeInTheDocument();
    // Last attempt (10-17) and last success (10-10) are different columns.
    expect(boc.getAllByText(/2026|Oct|10\/1[07]|1[07]\/10/).length).toBeGreaterThanOrEqual(2);
  });

  it('shows a bank that has never run as such, with no invented dates or counts', async () => {
    mockOverview();
    renderApp('/');

    const sampath = within(await rowFor('SAMPATH'));
    expect(sampath.getByText('Never run')).toBeInTheDocument();
    expect(sampath.getByText('Never')).toBeInTheDocument(); // last success
    expect(sampath.queryByText(/found/)).not.toBeInTheDocument();
  });

  it('keeps scrape success and publication as separate columns', async () => {
    mockOverview();
    renderApp('/');

    await screen.findByRole('button', { name: 'HNB' });
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent ?? '');
    for (const name of ['Last run', 'Last attempt', 'Last success', 'Passed rules', 'Needs review', 'Published']) {
      expect(headers.some((h) => h.includes(name)), name).toBe(true);
    }
  });
});
