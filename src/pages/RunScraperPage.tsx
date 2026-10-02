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

const BANKS = ['hnb', 'boc', 'sampath', 'ndb', 'dfcc', 'seylan', 'peoples', 'pabc', 'nsb', 'combank'];

export default function RunScraperPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBank = searchParams.get('bank')?.toLowerCase();

  const [bank, setBank] = useState<any>(
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

  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<{ message: string; pid: number; startedAt: string } | null>(null);
  const [geoResult, setGeoResult] = useState<{ message: string; pid: number; startedAt: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [runsKey, setRunsKey] = useState(0);

  const { data: statusData, loading: statusLoading, error: statusError, refetch: refetchStatus } = useApi(
    () => api.scrapeStatus(), []
  );
  const { data: recent, loading: runsLoading } = useApi(
    () => api.runs({ limit: 10 }), [runsKey]
  );

  const apiDown = !!statusError;
  const activeJobs = statusData?.active ?? [];
  const isRunning = activeJobs.some(j => j.bank === bank.value || j.bank === 'all');

  async function handleStart() {
    setSubmitting(true);
    setSubmitError(null);
    setScrapeResult(null);
    setGeoResult(null);
    try {
      const res = await api.triggerScrape(bank.value, {
        cache: useCache,
        llm: runLlm,
        noValidate,
        skipDetails,
        concurrency: parseInt(concurrency, 10) || 5,
        maxCategories: maxCategories ? parseInt(maxCategories, 10) : undefined,
      });
      setScrapeResult(res);
      refetchStatus();
      setTimeout(() => setRunsKey(k => k + 1), 2000);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGeocode() {
    setGeocoding(true);
    setGeoError(null);
    setGeoResult(null);
    try {
      const res = await api.triggerGeocode(bank.value);
      setGeoResult(res);
    } catch (e) {
      setGeoError(e instanceof Error ? e.message : String(e));
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Trigger a scrape run and persist results to Neon Postgres"
        actions={<Button onClick={() => navigate('/runs')}>View all runs</Button>}
      >
        Run scraper
      </Header>

      {apiDown && (
        <Alert type="error" header="API server not running">
          Open a terminal in the <strong>LankaOffers</strong> directory and run: <code>npm run api</code>
        </Alert>
      )}

      {scrapeResult && (
        <Alert
          type="success"
          header="Scraper started"
          dismissible
          onDismiss={() => setScrapeResult(null)}
          action={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate('/runs')}>View runs</Button>
              <Button onClick={() => navigate(`/offers?bank=${bank.value}`)}>View offers</Button>
            </SpaceBetween>
          }
        >
          {scrapeResult.message} — PID {scrapeResult.pid} — started {new Date(scrapeResult.startedAt).toLocaleTimeString()}.
          The scraper runs in the background. Check <strong>View runs</strong> for completion status.
        </Alert>
      )}

      {submitError && !apiDown && (
        <Alert type="error" header="Failed to start scraper" dismissible onDismiss={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {geoResult && (
        <Alert type="success" header="Geocoder started" dismissible onDismiss={() => setGeoResult(null)}>
          {geoResult.message} — PID {geoResult.pid}. Requires GOOGLE_MAPS_API_KEY in <code>.env</code>.
        </Alert>
      )}

      {geoError && (
        <Alert type="error" header="Geocode failed" dismissible onDismiss={() => setGeoError(null)}>
          {geoError}
        </Alert>
      )}

      <Container header={<Header variant="h2">Step 1 — Scraper Configuration</Header>}>
        <SpaceBetween size="m">
          <FormField label="Bank" description="Which bank to scrape offers from">
            <Select
              selectedOption={bank}
              onChange={e => setBank(e.detail.selectedOption)}
              disabled={apiDown}
              options={[
                ...BANKS.map(b => ({ label: b.toUpperCase(), value: b })),
                { label: 'All banks', value: 'all' },
              ]}
            />
          </FormField>

          <ExpandableSection headerText="Execution & Pipeline Options" defaultExpanded>
            <SpaceBetween size="m">
              <ColumnLayout columns={3} variant="text-grid">
                <Toggle
                  checked={useCache}
                  onChange={e => setUseCache(e.detail.checked)}
                  description="Reuse cached HTTP responses where available"
                >
                  HTTP File Cache
                </Toggle>
                <Toggle
                  checked={runLlm}
                  onChange={e => setRunLlm(e.detail.checked)}
                  description="Run semantic evaluation with configured LLM provider"
                >
                  LLM Validation
                </Toggle>
                <Toggle
                  checked={skipDetails}
                  onChange={e => setSkipDetails(e.detail.checked)}
                  description="Fast pass — skip full detail page extraction"
                >
                  Quick Scan (Skip Details)
                </Toggle>
              </ColumnLayout>

              <ColumnLayout columns={3} variant="text-grid">
                <Toggle
                  checked={noValidate}
                  onChange={e => setNoValidate(e.detail.checked)}
                  description="Bypass deterministic rule verification checks"
                >
                  Skip Rule Validation
                </Toggle>
                <FormField label="Concurrency" description="Parallel detail request limit">
                  <Input
                    type="number"
                    value={concurrency}
                    onChange={e => setConcurrency(e.detail.value)}
                  />
                </FormField>
                <FormField label="Smoke Test Categories" description="Limit to first N categories (empty = all)">
                  <Input
                    type="number"
                    placeholder="All categories"
                    value={maxCategories}
                    onChange={e => setMaxCategories(e.detail.value)}
                  />
                </FormField>
              </ColumnLayout>
            </SpaceBetween>
          </ExpandableSection>

          <Button
            variant="primary"
            onClick={handleStart}
            loading={submitting}
            disabled={apiDown || isRunning || submitting}
          >
            {apiDown ? 'API server not running' : isRunning ? 'Scraper already running' : `Start Scraper (${bank.label})`}
          </Button>
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h2">Step 2 — Geocode locations</Header>}>
        <SpaceBetween size="m">
          <Box color="text-body-secondary">
            Run geocoding after scraping to resolve merchant addresses to coordinates.
            Requires <code>GOOGLE_MAPS_API_KEY</code> in the LankaOffers <code>.env</code> file.
          </Box>
          <Button
            onClick={handleGeocode}
            loading={geocoding}
            disabled={apiDown || geocoding}
          >
            Run geocode for {bank.label}
          </Button>
        </SpaceBetween>
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={refetchStatus} loading={statusLoading}>Refresh</Button>
              </SpaceBetween>
            }
          >
            Active jobs
          </Header>
        }
      >
        {statusLoading ? <Spinner /> : activeJobs.length === 0 ? (
          <Box color="text-body-secondary" textAlign="center" padding="l">No active scrape jobs.</Box>
        ) : (
          <Table
            header={undefined}
            columnDefinitions={[
              {
                id: 'bank', header: 'Bank',
                cell: (j: { bank: string; pid: number; startedAt: string }) => (
                  <StatusIndicator type="in-progress">{j.bank.toUpperCase()}</StatusIndicator>
                ),
              },
              { id: 'pid', header: 'PID', cell: (j: { bank: string; pid: number; startedAt: string }) => j.pid },
              {
                id: 'started', header: 'Started',
                cell: (j: { bank: string; pid: number; startedAt: string }) =>
                  new Date(j.startedAt).toLocaleTimeString(),
              },
            ]}
            items={activeJobs}
            variant="embedded"
          />
        )}
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            actions={<Button onClick={() => setRunsKey(k => k + 1)} loading={runsLoading}>Refresh</Button>}
          >
            Recent runs
          </Header>
        }
      >
        {runsLoading ? <Spinner /> : !recent?.items.length ? (
          <Box color="text-body-secondary" textAlign="center" padding="l">No runs yet.</Box>
        ) : (
          <Table
            header={undefined}
            columnDefinitions={[
              {
                id: 'bank', header: 'Bank',
                cell: (r: ApiScrapeRun) => <Box fontWeight="bold">{r.bank.toUpperCase()}</Box>,
              },
              {
                id: 'status', header: 'Status',
                cell: (r: ApiScrapeRun) => (
                  <StatusIndicator type={
                    r.status === 'completed' ? 'success' :
                    r.status === 'failed' ? 'error' :
                    r.status === 'running' ? 'in-progress' : 'stopped'
                  }>{r.status}</StatusIndicator>
                ),
              },
              { id: 'found', header: 'Found', cell: (r: ApiScrapeRun) => r.offers_found ?? '—' },
              { id: 'new', header: 'New', cell: (r: ApiScrapeRun) => r.offers_new ?? '—' },
              { id: 'changed', header: 'Changed', cell: (r: ApiScrapeRun) => r.offers_changed ?? '—' },
              {
                id: 'started', header: 'Started',
                cell: (r: ApiScrapeRun) => new Date(r.started_at).toLocaleString(),
              },
              {
                id: 'actions', header: '',
                cell: (r: ApiScrapeRun) => (
                  <Button variant="link" onClick={() => navigate(`/runs/${r.id}`)}>Details</Button>
                ),
              },
            ]}
            items={recent.items.slice(0, 10)}
            variant="embedded"
          />
        )}
      </Container>
    </SpaceBetween>
  );
}
