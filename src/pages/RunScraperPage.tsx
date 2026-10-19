import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Alert from '@cloudscape-design/components/alert';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import Toggle from '@cloudscape-design/components/toggle';
import Input from '@cloudscape-design/components/input';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import { api, type ApiScrapeRun } from '../services/api';
import { useApi } from '../services/use-api';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';

const BANKS = ['hnb', 'boc', 'sampath', 'ndb', 'dfcc', 'seylan', 'peoples', 'pabc', 'nsb', 'combank'];

type Pending = null | { kind: 'scrape' } | { kind: 'geocode' } | { kind: 'cancel'; bank: string };

interface ActiveJob {
  bank: string;
  pid: number;
  startedAt: string;
  dryRun?: boolean;
}

export default function RunScraperPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBank = searchParams.get('bank')?.toLowerCase();

  const [bank, setBank] = useState<{ label: string; value: string }>(
    initialBank && BANKS.includes(initialBank)
      ? { label: initialBank.toUpperCase(), value: initialBank }
      : { label: 'HNB', value: 'hnb' }
  );

  useEffect(() => {
    const b = searchParams.get('bank')?.toLowerCase();
    if (b && (BANKS.includes(b) || b === 'all')) {
      setBank({ label: b.toUpperCase(), value: b });
    }
  }, [searchParams]);

  // Scraper options
  const [useCache, setUseCache] = useState(true);
  const [runLlm, setRunLlm] = useState(false);
  const [skipDetails, setSkipDetails] = useState(false);
  const [noValidate, setNoValidate] = useState(false);
  const [concurrency, setConcurrency] = useState('5');
  const [maxCategories, setMaxCategories] = useState('');

  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState<null | 'scrape' | 'dry-run' | 'geocode' | 'cancel'>(null);
  const [result, setResult] = useState<{ type: 'success' | 'error'; header: string; message: string } | null>(null);
  const [runsKey, setRunsKey] = useState(0);

  const {
    data: statusData,
    loading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useApi(() => api.scrapeStatus(), []);
  const { data: recent, loading: runsLoading, error: runsError } = useApi(() => api.runs({ limit: 10 }), [runsKey]);

  const apiDown = !!statusError;
  const activeJobs: ActiveJob[] = statusData?.active ?? [];
  const isRunning = activeJobs.some((j) => j.bank === bank.value || j.bank === 'all' || bank.value === 'all');

  function options(dryRun: boolean) {
    return {
      cache: useCache,
      llm: runLlm,
      noValidate,
      skipDetails,
      dryRun,
      concurrency: parseInt(concurrency, 10) || 5,
      maxCategories: maxCategories ? parseInt(maxCategories, 10) : undefined,
    };
  }

  async function startScrape(dryRun: boolean) {
    setBusy(dryRun ? 'dry-run' : 'scrape');
    setResult(null);
    try {
      const res = await api.triggerScrape(bank.value, options(dryRun));
      setResult({
        type: 'success',
        header: dryRun ? 'Dry run started' : 'Scraper started',
        message: `${res.message} (PID ${res.pid}, started ${new Date(res.startedAt).toLocaleTimeString()}). It runs in the background.`,
      });
      refetchStatus();
      setTimeout(() => setRunsKey((k) => k + 1), 2000);
    } catch (e) {
      setResult({
        type: 'error',
        header: dryRun ? 'Could not start dry run' : 'Could not start scraper',
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
      setPending(null);
    }
  }

  async function startGeocode() {
    setBusy('geocode');
    setResult(null);
    try {
      const res = await api.triggerGeocode(bank.value);
      setResult({ type: 'success', header: 'Geocoder started', message: `${res.message} (PID ${res.pid}).` });
    } catch (e) {
      setResult({ type: 'error', header: 'Geocode failed', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
      setPending(null);
    }
  }

  async function cancelJob(jobBank: string) {
    setBusy('cancel');
    setResult(null);
    try {
      const res = await api.cancelScrape(jobBank);
      setResult({ type: 'success', header: 'Cancellation requested', message: res.message });
      await refetchStatus();
    } catch (e) {
      setResult({ type: 'error', header: 'Could not cancel', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
      setPending(null);
    }
  }

  const bankLabel = bank.value === 'all' ? 'all banks' : bank.label;

  return (
    <PageLayout
      title="Run scraper"
      description="Dry-run first, then run an authorized scrape. Neither publishes anything to consumers."
      breadcrumbs={[{ text: 'Scrape runs', href: '/runs' }, { text: 'Run scraper', href: '/run-scraper' }]}
      actions={<Button onClick={() => navigate('/runs')}>View all runs</Button>}
    >
      {apiDown && (
        <Alert
          type="error"
          header="Admin API unavailable"
          action={<Button onClick={refetchStatus}>Retry</Button>}
        >
          Operations are disabled until the admin API responds. Start it with <code>npm run api</code> in the admin API
          repository. {statusError}
        </Alert>
      )}

      {result && (
        <Alert
          type={result.type}
          header={result.header}
          dismissible
          onDismiss={() => setResult(null)}
          action={
            result.type === 'success' ? (
              <Button onClick={() => navigate('/runs')}>View runs</Button>
            ) : undefined
          }
        >
          {result.message}
        </Alert>
      )}

      <Container header={<Header variant="h2">1. Configure</Header>}>
        <SpaceBetween size="m">
          <FormField label="Bank" description="Which bank to scrape offers from">
            <Select
              selectedOption={bank}
              onChange={(e) =>
                setBank({ label: e.detail.selectedOption.label ?? '', value: e.detail.selectedOption.value ?? 'hnb' })
              }
              disabled={apiDown}
              options={[...BANKS.map((b) => ({ label: b.toUpperCase(), value: b })), { label: 'All banks', value: 'all' }]}
            />
          </FormField>

          <ExpandableSection headerText="Execution and pipeline options" defaultExpanded>
            <SpaceBetween size="m">
              <ColumnLayout columns={3} variant="text-grid">
                <Toggle
                  checked={useCache}
                  onChange={(e) => setUseCache(e.detail.checked)}
                  description="Reuse cached HTTP responses where available"
                >
                  HTTP file cache
                </Toggle>
                <Toggle
                  checked={runLlm}
                  onChange={(e) => setRunLlm(e.detail.checked)}
                  description="Uses the configured LLM provider and counts against monthly budgets"
                >
                  LLM validation
                </Toggle>
                <Toggle
                  checked={skipDetails}
                  onChange={(e) => setSkipDetails(e.detail.checked)}
                  description="Fast pass: skip full detail page extraction"
                >
                  Quick scan (skip details)
                </Toggle>
              </ColumnLayout>

              <ColumnLayout columns={3} variant="text-grid">
                <Toggle
                  checked={noValidate}
                  onChange={(e) => setNoValidate(e.detail.checked)}
                  description="Bypasses the deterministic rule checks"
                >
                  Skip rule validation
                </Toggle>
                <FormField label="Concurrency" description="Parallel detail request limit (1 to 10)">
                  <Input type="number" value={concurrency} onChange={(e) => setConcurrency(e.detail.value)} />
                </FormField>
                <FormField label="Smoke test categories" description="Limit to the first N categories (empty = all)">
                  <Input
                    type="number"
                    placeholder="All categories"
                    value={maxCategories}
                    onChange={(e) => setMaxCategories(e.detail.value)}
                  />
                </FormField>
              </ColumnLayout>

              {noValidate && (
                <Alert type="warning" header="Rule validation is off">
                  Offers from this run will not be checked by the deterministic rules. Prefer a dry run when testing
                  parser changes.
                </Alert>
              )}
            </SpaceBetween>
          </ExpandableSection>
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h2">2. Run</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          <SpaceBetween size="s">
            <Box variant="h3">Dry run</Box>
            <Box color="text-body-secondary">
              Scrapes and validates without writing offers, runs or staging to the database. Safe to repeat. The job
              manager still records an operational lease while it runs.
            </Box>
            <Button
              onClick={() => startScrape(true)}
              loading={busy === 'dry-run'}
              disabled={apiDown || isRunning || busy !== null}
              data-testid="start-dry-run"
            >
              Dry run ({bankLabel})
            </Button>
          </SpaceBetween>

          <SpaceBetween size="s">
            <Box variant="h3">Authorized scrape</Box>
            <Box color="text-body-secondary">
              Writes extracted offers and a run record to the database the admin API is connected to. Offers are staged
              for review; nothing is published to consumers.
            </Box>
            <Button
              variant="primary"
              onClick={() => setPending({ kind: 'scrape' })}
              disabled={apiDown || isRunning || busy !== null}
              data-testid="start-scrape"
            >
              {isRunning ? 'A scraper is already running' : `Start scrape (${bankLabel})…`}
            </Button>
          </SpaceBetween>
        </ColumnLayout>
      </Container>

      <Container header={<Header variant="h2">3. Geocode locations (after scraping)</Header>}>
        <SpaceBetween size="m">
          <Box color="text-body-secondary">
            Resolves merchant addresses to coordinates. May use paid geocoding quota, so it asks for confirmation.
          </Box>
          <Button onClick={() => setPending({ kind: 'geocode' })} loading={busy === 'geocode'} disabled={apiDown || busy !== null}>
            Run geocode for {bankLabel}…
          </Button>
        </SpaceBetween>
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            actions={<Button onClick={refetchStatus} loading={statusLoading}>Refresh</Button>}
          >
            Active jobs
          </Header>
        }
      >
        {statusLoading ? (
          <Spinner />
        ) : statusError ? (
          <Box color="text-status-inactive" textAlign="center" padding="l">
            Job status unavailable.
          </Box>
        ) : activeJobs.length === 0 ? (
          <Box color="text-body-secondary" textAlign="center" padding="l">
            No active scrape jobs.
          </Box>
        ) : (
          <Table
            variant="embedded"
            columnDefinitions={[
              {
                id: 'bank',
                header: 'Bank',
                cell: (j: ActiveJob) => <StatusIndicator type="in-progress">{j.bank.toUpperCase()}</StatusIndicator>,
              },
              { id: 'mode', header: 'Mode', cell: (j: ActiveJob) => (j.dryRun ? 'Dry run (no writes)' : 'Writes to database') },
              { id: 'pid', header: 'PID', cell: (j: ActiveJob) => j.pid },
              { id: 'started', header: 'Started', cell: (j: ActiveJob) => new Date(j.startedAt).toLocaleTimeString() },
              {
                id: 'actions',
                header: '',
                cell: (j: ActiveJob) => (
                  <Button variant="inline-link" onClick={() => setPending({ kind: 'cancel', bank: j.bank })}>
                    Cancel
                  </Button>
                ),
              },
            ]}
            items={activeJobs}
          />
        )}
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            actions={<Button onClick={() => setRunsKey((k) => k + 1)} loading={runsLoading}>Refresh</Button>}
          >
            Recent runs
          </Header>
        }
      >
        {runsLoading ? (
          <Spinner />
        ) : runsError ? (
          <Box color="text-status-inactive" textAlign="center" padding="l">
            Run history unavailable.
          </Box>
        ) : !recent?.items.length ? (
          <Box color="text-body-secondary" textAlign="center" padding="l">
            No runs yet.
          </Box>
        ) : (
          <Table
            variant="embedded"
            columnDefinitions={[
              { id: 'bank', header: 'Bank', cell: (r: ApiScrapeRun) => <Box fontWeight="bold">{r.bank.toUpperCase()}</Box> },
              {
                id: 'status',
                header: 'Status',
                cell: (r: ApiScrapeRun) => (
                  <StatusIndicator
                    type={
                      r.status === 'completed'
                        ? 'success'
                        : r.status === 'failed'
                          ? 'error'
                          : r.status === 'running'
                            ? 'in-progress'
                            : 'stopped'
                    }
                  >
                    {r.status}
                  </StatusIndicator>
                ),
              },
              { id: 'found', header: 'Found', cell: (r: ApiScrapeRun) => r.offers_found ?? '—' },
              { id: 'new', header: 'New', cell: (r: ApiScrapeRun) => r.offers_new ?? '—' },
              { id: 'changed', header: 'Changed', cell: (r: ApiScrapeRun) => r.offers_changed ?? '—' },
              { id: 'started', header: 'Started', cell: (r: ApiScrapeRun) => new Date(r.started_at).toLocaleString() },
              {
                id: 'actions',
                header: '',
                cell: (r: ApiScrapeRun) => (
                  <Button variant="inline-link" onClick={() => navigate(`/runs/${r.id}`)}>
                    Details
                  </Button>
                ),
              },
            ]}
            items={recent.items.slice(0, 10)}
          />
        )}
      </Container>

      <ConfirmDialog
        visible={pending?.kind === 'scrape'}
        title={`Start scrape for ${bankLabel}?`}
        summary="This starts a real scrape that writes to the database."
        consequences={[
          'Extracted offers and a scrape run record are written to the database the admin API is connected to.',
          'Offers are staged for human review. Nothing is published to consumers by this action.',
          ...(bank.value === 'all' ? ['Runs the scraper for every supported bank.'] : []),
          ...(runLlm ? ['LLM validation is on and counts against monthly budgets.'] : []),
        ]}
        warning={noValidate ? 'Rule validation is skipped for this run.' : undefined}
        acknowledgement="I understand this writes to the connected database."
        confirmLabel="Start scrape"
        loading={busy === 'scrape'}
        onConfirm={() => startScrape(false)}
        onDismiss={() => setPending(null)}
      />

      <ConfirmDialog
        visible={pending?.kind === 'geocode'}
        title={`Run geocoding for ${bankLabel}?`}
        summary="Merchant addresses will be resolved through the configured geocoding provider."
        consequences={[
          'May consume paid geocoding quota, subject to the monthly limits in cost control.',
          'Resolved coordinates are written to the database.',
        ]}
        confirmLabel="Run geocode"
        loading={busy === 'geocode'}
        onConfirm={startGeocode}
        onDismiss={() => setPending(null)}
      />

      <ConfirmDialog
        visible={pending?.kind === 'cancel'}
        title={pending?.kind === 'cancel' ? `Cancel the ${pending.bank.toUpperCase()} job?` : 'Cancel job?'}
        summary="The running scrape process will be terminated."
        consequences={[
          'Anything this run has already written stays in the database.',
          'The run may be left incomplete; start a new run to finish it.',
        ]}
        confirmLabel="Cancel job"
        tone="danger"
        loading={busy === 'cancel'}
        onConfirm={() => pending?.kind === 'cancel' && cancelJob(pending.bank)}
        onDismiss={() => setPending(null)}
      />
    </PageLayout>
  );
}
