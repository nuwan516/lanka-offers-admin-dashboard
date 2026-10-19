import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { callsTo, json, mockApi, renderApp, statsFixture } from './helpers';

const updatedAt = '2026-10-18T00:00:00.000Z';

function reviewFixture(status: string, extra: Record<string, unknown> = {}) {
  return {
    offer: {
      id: 'o1', unique_id: 'hnb_1', bank: 'hnb', title: 'Pizza Hut 20% off', source_url: 'https://example.lk/o1',
      db_status: status, updated_at: updatedAt, rule_passed: true, rule_errors: [], rule_warnings: [],
    },
    rawOffer: { title: 'Pizza Hut 20% off', merchant: { name: 'Pizza Hut' }, offer: { discountPercentage: 20 } },
    pendingCandidate: null,
    pendingValidation: null,
    manualOverride: {},
    effectiveOffer: { title: 'Pizza Hut 20% off' },
    diff: [],
    duplicates: [],
    history: [],
    ...extra,
  };
}

function mockReview(status: string, extra: Record<string, unknown> = {}) {
  mockApi({
    'GET /api/stats': statsFixture,
    'GET /api/offers/o1/review': reviewFixture(status, extra),
    'POST /api/offers/o1/transition': { id: 'o1', fromStatus: status, toStatus: 'APPROVED' },
    'POST /api/sync/o1': { offerId: 'o1', outcome: 'published' },
  });
}

async function openReview(status: string, extra: Record<string, unknown> = {}) {
  mockReview(status, extra);
  renderApp('/offers/o1/review');
  await screen.findByText('Pizza Hut 20% off', { selector: 'h1, h1 *' });
}

describe('Offer review: approval and rejection', () => {
  it('asks before approving and makes clear approval is not publication', async () => {
    await openReview('REVIEW_REQUIRED');

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText(/not visible to consumers until you run Publish/)).toBeInTheDocument();
    expect(callsTo('POST', '/api/offers/o1/transition')).toHaveLength(0);
  });

  it('approves only after confirmation, with the optimistic-concurrency token', async () => {
    await openReview('REVIEW_REQUIRED');

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(callsTo('POST', '/api/offers/o1/transition')).toHaveLength(1));
    const call = callsTo('POST', '/api/offers/o1/transition')[0];
    expect(call.body.action).toBe('APPROVE');
    expect(call.body.expectedUpdatedAt).toBe(updatedAt);
  });

  it('confirms a rejection, and cancelling sends nothing', async () => {
    await openReview('REVIEW_REQUIRED');

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('The offer will not be published.')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(callsTo('POST', '/api/offers/o1/transition')).toHaveLength(0);
  });

  it('rejects after confirmation', async () => {
    await openReview('REVIEW_REQUIRED');

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

    await waitFor(() => expect(callsTo('POST', '/api/offers/o1/transition')).toHaveLength(1));
    expect(callsTo('POST', '/api/offers/o1/transition')[0].body.action).toBe('REJECT');
  });

  it('confirms disabling, and says disabled offers are not served to consumers', async () => {
    await openReview('PUBLISHED');

    await userEvent.click(screen.getByRole('button', { name: 'Disable' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Disabled offers are not served to consumers.')).toBeInTheDocument();
    expect(callsTo('POST', '/api/offers/o1/transition')).toHaveLength(0);
  });
});

describe('Offer review: publishing', () => {
  it('cannot publish an offer that is not approved', async () => {
    await openReview('REVIEW_REQUIRED');

    expect(screen.getByRole('button', { name: 'Publish / Sync' })).toBeDisabled();
  });

  it('requires an explicit acknowledgement before publishing an approved offer', async () => {
    await openReview('APPROVED');

    await userEvent.click(screen.getByRole('button', { name: 'Publish / Sync' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Publish' });

    expect(within(dialog).getByText(/visible in the web and mobile apps/)).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    expect(callsTo('POST', '/api/sync/o1')).toHaveLength(0);

    await userEvent.click(within(dialog).getByRole('checkbox'));
    await userEvent.click(confirm);
    await waitFor(() => expect(callsTo('POST', '/api/sync/o1')).toHaveLength(1));
  });
});

describe('Offer review: comparison, duplicates and errors', () => {
  it('shows the published and incoming candidate side by side for changed fields', async () => {
    await openReview('PUBLISHED', {
      pendingCandidate: { title: 'Pizza Hut 25% off' },
      pendingValidation: { rulePassed: true, ruleErrors: [], ruleWarnings: [], llmScore: 90, llmValid: true },
      diff: [
        { path: 'offer.discountPercentage', label: 'Discount (%)', publishedValue: 20, candidateValue: 25, effectiveValue: 25, changed: true, overridden: false },
      ],
    });

    expect(await screen.findByText('Field changes')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Published/ })).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('warns about possible duplicates before publishing', async () => {
    await openReview('REVIEW_REQUIRED', {
      duplicates: [
        {
          id: 'd1', offer_id: 'o1', candidate_offer_id: 'o2', score: 0.93, classification: 'LIKELY_DUPLICATE',
          reasons: ['same merchant'], status: 'PENDING', created_at: updatedAt, reviewed_at: null, reviewed_by: null,
          candidate_title: 'Pizza Hut 20% (copy)',
        },
      ],
    });

    expect(await screen.findByText('Possible duplicates')).toBeInTheDocument();
    expect(screen.getByText(/Pizza Hut 20% \(copy\)/)).toBeInTheDocument();
  });

  it('reports a concurrent-modification conflict and reloads instead of overwriting', async () => {
    await openReview('REVIEW_REQUIRED');
    mockApi({
      'POST /api/offers/o1/transition': () =>
        json({ error: 'Concurrent modification conflict: offer changed' }, 409),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));

    expect(await screen.findByText(/Conflict detected/)).toBeInTheDocument();
    expect(callsTo('GET', '/api/offers/o1/review').length).toBeGreaterThanOrEqual(2);
  });

  it('shows an error state when the offer cannot be loaded', async () => {
    mockApi({ 'GET /api/stats': statsFixture, 'GET /api/offers/missing/review': () => json({ error: 'Offer not found' }, 404) });
    renderApp('/offers/missing/review');

    expect((await screen.findAllByText('Offer not found')).length).toBeGreaterThanOrEqual(1);
  });
});

describe('Scheduler safety', () => {
  const schedule = {
    id: 'S1', name: 'HNB daily', cron: '0 6 * * *', description: 'Daily HNB scrape', bank: 'hnb',
    enabled: false, timeoutMs: 900000, lastRun: null, nextRun: 'Disabled', lastStatus: 'idle',
    retryCount: 0, maxRetries: 2, backoffMinutes: 5,
  };

  function mockSchedule(enabled = false) {
    mockApi({
      'GET /api/stats': statsFixture,
      'GET /api/schedule': { enabled, totalSchedules: 1, activeSchedules: 0, schedules: [schedule] },
      'POST /api/schedule/toggle-global': ({ body }) => ({ enabled: body.enabled, message: 'ok' }),
      'POST /api/schedule/S1/run-now': { message: 'started', jobId: 'job-1', pid: 5, bank: 'hnb' },
      'POST /api/schedule/S1/toggle': ({ body }) => ({ ...schedule, enabled: body.enabled }),
    });
  }

  it('does not offer to add a schedule that cannot be saved', async () => {
    mockSchedule();
    renderApp('/schedule');

    await screen.findByText('HNB daily');
    expect(screen.queryByRole('button', { name: 'Add schedule' })).not.toBeInTheDocument();
  });

  it('requires acknowledgement before turning on unattended scraping', async () => {
    mockSchedule();
    renderApp('/schedule');

    await userEvent.click(await screen.findByRole('button', { name: 'Activate Scheduler' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText(/Nothing is published automatically/)).toBeInTheDocument();
    expect(callsTo('POST', '/api/schedule/toggle-global')).toHaveLength(0);
    const confirm = within(dialog).getByRole('button', { name: 'Activate scheduler' });
    expect(confirm).toBeDisabled();

    await userEvent.click(within(dialog).getByRole('checkbox'));
    await userEvent.click(confirm);
    await waitFor(() => expect(callsTo('POST', '/api/schedule/toggle-global')).toHaveLength(1));
    expect(callsTo('POST', '/api/schedule/toggle-global')[0].body.enabled).toBe(true);
  });

  it('pausing the scheduler needs no confirmation', async () => {
    mockSchedule(true);
    renderApp('/schedule');

    await userEvent.click(await screen.findByRole('button', { name: 'Pause Scheduler' }));

    await waitFor(() => expect(callsTo('POST', '/api/schedule/toggle-global')).toHaveLength(1));
    expect(callsTo('POST', '/api/schedule/toggle-global')[0].body.enabled).toBe(false);
  });

  it('confirms before "Run now" starts a real scrape', async () => {
    mockSchedule();
    renderApp('/schedule');

    await userEvent.click(await screen.findByRole('button', { name: 'Run now' }));
    const dialog = await screen.findByRole('dialog');
    expect(callsTo('POST', '/api/schedule/S1/run-now')).toHaveLength(0);

    await userEvent.click(within(dialog).getByRole('checkbox'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Run now' }));
    await waitFor(() => expect(callsTo('POST', '/api/schedule/S1/run-now')).toHaveLength(1));
  });
});

describe('Test isolation', () => {
  it('never reaches a real server: only same-origin fixture requests are allowed', async () => {
    mockApi({ 'GET /api/stats': statsFixture });

    await expect(fetch('https://admin.example.com/api/stats')).rejects.toThrow(/Blocked non-fixture request/);
    await expect(fetch('http://localhost:3002/api/stats')).rejects.toThrow(/Blocked non-fixture request/);
  });
});
