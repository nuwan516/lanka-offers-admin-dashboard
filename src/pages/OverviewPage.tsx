import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Alert from '@cloudscape-design/components/alert';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import Badge from '@cloudscape-design/components/badge';
import { api, type ApiScrapeRun, type ApiBankSummary, type ApiGeoStats } from '../services/api';
import { useApi } from '../services/use-api';
import PageLayout from '../components/PageLayout';

/** Postgres counts arrive as strings; null means "not reported", never 0. */
function count(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmtWhen(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? fallback : d.toLocaleString();
}

function Metric({ label, value, loading }: { label: string; value: string | number; loading: boolean }) {
  return (
    <div>
      <Box variant="awsui-key-label">{label}</Box>
      {loading ? <Spinner size="normal" /> : <Box variant="awsui-value-large">{value}</Box>}
    </div>
  );
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const { data: stats, loading, error, refetch } = useApi(() => api.stats(), []);
  const { data: banks, loading: banksLoading, error: banksError, refetch: refetchBanks } = useApi(() => api.banks(), []);
  const { data: runs, loading: runsLoading } = useApi(() => api.runs({ limit: 5 }), []);
  const { data: geoStats, loading: geoStatsLoading } = useApi<ApiGeoStats>(() => api.geoStats(), []);

  const o = stats?.offers;
  const r = stats?.runs;
  const v = stats?.validation;

  return (
    <PageLayout
      title="Overview"
      description="Lanka Offers data pipeline — live from Neon Postgres"
      error={error ? `Cannot reach the API at localhost:3002. Start it with \`npm run api\` in admin/api. ${error}` : null}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={refetch}>Refresh</Button>
          <Button variant="primary" onClick={() => navigate('/run-scraper')}>Run scraper</Button>
        </SpaceBetween>
      }
    >

      <Container header={<Header variant="h2">Operations metrics</Header>}>
        <ColumnLayout columns={4} variant="text-grid">
          <Metric label="Active published offers" value={o?.active_offers ?? '—'} loading={loading} />
          <div>
            <Box variant="awsui-key-label">Pending review / staging</Box>
            {loading ? <Spinner size="normal" /> : (
              <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                <Box variant="awsui-value-large">{o?.pending_review ?? '—'}</Box>
                {parseInt(o?.pending_review ?? '—') > 0 && <Badge color="blue">Review</Badge>}
              </SpaceBetween>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">Pending DB sync (approved)</Box>
            {loading ? <Spinner size="normal" /> : (
              <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                <Box variant="awsui-value-large">{o?.pending_sync ?? '—'}</Box>
                {parseInt(o?.pending_sync ?? '—') > 0 && <Badge color="green">Sync</Badge>}
              </SpaceBetween>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">Unresolved geo records</Box>
            {loading ? <Spinner size="normal" /> : (
              <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                <Box variant="awsui-value-large">{o?.unresolved_geo ?? '—'}</Box>
                {parseInt(o?.unresolved_geo ?? '—') > 0 && <Badge color="red">Action</Badge>}
              </SpaceBetween>
            )}
          </div>
        </ColumnLayout>
        <Box margin={{ top: 'm' }}>
          <ColumnLayout columns={4} variant="text-grid">
            <Metric label="Offers scraped (24h)" value={r?.scraped_today ?? '—'} loading={loading} />
            <Metric label="New offers today" value={r?.new_today ?? '—'} loading={loading} />
            <Metric label="Changed offers today" value={r?.changed_today ?? '—'} loading={loading} />
            <Metric label="Avg LLM score" value={o?.avg_llm_score ? `${o.avg_llm_score}/100` : '—'} loading={loading} />
          </ColumnLayout>
        </Box>
      </Container>

      <Grid gridDefinition={[
        { colspan: { default: 12, m: 6 } },
        { colspan: { default: 12, m: 6 } },
        { colspan: { default: 12 } },
      ]}>
        <Container header={<Header variant="h2">Pipeline & Scraper Health</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Running jobs</Box>
              {loading ? <Spinner size="normal" /> : (
                <StatusIndicator type={!r ? 'pending' : parseInt(r.running_jobs) > 0 ? 'in-progress' : 'success'}>
                  {r ? `${r.running_jobs} active` : 'Unavailable'}
                </StatusIndicator>
              )}
            </div>
            <div>
              <Box variant="awsui-key-label">Failed runs today</Box>
              {loading ? <Spinner size="normal" /> : (
                <StatusIndicator type={!r ? 'pending' : parseInt(r.failed_today) > 0 ? 'error' : 'success'}>
                  {r ? `${r.failed_today} failures` : 'Unavailable'}
                </StatusIndicator>
              )}
            </div>
            <div>
              <Box variant="awsui-key-label">Validation rule failures</Box>
              {loading ? <Spinner size="normal" /> : (
                <StatusIndicator type={!v ? 'pending' : parseInt(v.validation_failures) > 0 ? 'warning' : 'success'}>
                  {v ? `${v.validation_failures} issues` : 'Unavailable'}
                </StatusIndicator>
              )}
            </div>
            <div>
              <Box variant="awsui-key-label">LLM validated count</Box>
              {loading ? <Spinner size="normal" /> : <Box variant="awsui-value-large">{o?.llm_scored ?? '—'}</Box>}
            </div>
          </ColumnLayout>
        </Container>

        <Container header={<Header variant="h2" description="PostGIS spatial coverage">Geo Coverage</Header>}>
          {geoStatsLoading ? <Spinner /> : geoStats ? (
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Total offers</Box>
                <Box variant="awsui-value-large">{geoStats.totalOffers}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">With geometry</Box>
                <StatusIndicator type="success">{geoStats.offersWithGeom}</StatusIndicator>
              </div>
              <div>
                <Box variant="awsui-key-label">Coverage</Box>
                <Box variant="awsui-value-large">{geoStats.coveragePercent?.toFixed(1) ?? '0'}%</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Without geometry</Box>
                <StatusIndicator type={geoStats.offersWithoutGeom > 0 ? 'warning' : 'success'}>{geoStats.offersWithoutGeom}</StatusIndicator>
              </div>
            </ColumnLayout>
          ) : (
            <Box color="text-body-secondary">Unable to load geo statistics</Box>
          )}
        </Container>

        <Container header={<Header variant="h2" description="Deterministic same-bank candidate matcher">Duplicate Detection</Header>}>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Pending review</Box>
              {loading ? <Spinner size="normal" /> : (
                <StatusIndicator type={!stats?.duplicates ? 'pending' : stats.duplicates.pending > 0 ? 'warning' : 'success'}>
                  {stats?.duplicates ? stats.duplicates.pending : '—'}
                </StatusIndicator>
              )}
            </div>
            <div>
              <Box variant="awsui-key-label">Confirmed duplicates</Box>
              {loading ? <Spinner size="normal" /> : <Box variant="awsui-value-large">{stats?.duplicates?.confirmed ?? '—'}</Box>}
            </div>
            <div>
              <Box variant="awsui-key-label">Marked not-duplicate</Box>
              {loading ? <Spinner size="normal" /> : <Box variant="awsui-value-large">{stats?.duplicates?.notDuplicate ?? '—'}</Box>}
            </div>
          </ColumnLayout>
          <Box margin={{ top: 'm' }}>
            <Button variant="link" onClick={() => navigate('/duplicates')}>Open duplicate candidate queue</Button>
          </Box>
        </Container>
      </Grid>

      <Container header={
        <Header
          variant="h2"
          actions={<Button variant="link" onClick={() => navigate('/runs')}>View all</Button>}
        >
          Recent scrape runs
        </Header>
      }>
        <Table
          loading={runsLoading}
          loadingText="Loading runs"
          onRowClick={e => navigate(`/runs/${e.detail.item.id}`)}
          columnDefinitions={[
            {
              id: 'bank', header: 'Bank', width: 90,
              cell: (r: ApiScrapeRun) => <Box fontWeight="bold">{r.bank.toUpperCase()}</Box>,
            },
            {
              id: 'status', header: 'Status', width: 130,
              cell: (r: ApiScrapeRun) => (
                <StatusIndicator type={
                  r.status === 'completed' ? 'success' :
                  r.status === 'failed' ? 'error' :
                  r.status === 'running' ? 'in-progress' : 'stopped'
                }>{r.status}</StatusIndicator>
              ),
            },
            {
              id: 'found', header: 'Found', width: 80,
              cell: (r: ApiScrapeRun) => r.offers_found ?? 0,
            },
            {
              id: 'new', header: 'New', width: 80,
              cell: (r: ApiScrapeRun) => r.offers_new ?? 0,
            },
            {
              id: 'changed', header: 'Changed', width: 80,
              cell: (r: ApiScrapeRun) => r.offers_changed ?? 0,
            },
            {
              id: 'started', header: 'Started',
              cell: (r: ApiScrapeRun) => (
                <Box color="text-body-secondary" fontSize="body-s">
                  {new Date(r.started_at).toLocaleString()}
                </Box>
              ),
            },
          ]}
          items={runs?.items.slice(0, 5) ?? []}
          empty={
            <Box textAlign="center" color="inherit" padding={{ vertical: 'l' }}>
              No scrape runs yet.{' '}
              <Button variant="link" onClick={() => navigate('/run-scraper')}>Run a scraper</Button>
            </Box>
          }
          variant="embedded"
        />
      </Container>

      {banksError && !error && (
        <Alert type="warning" header="Bank status unavailable" action={<Button onClick={refetchBanks}>Retry</Button>}>
          The rest of the overview loaded, but per-bank status did not: {banksError}
        </Alert>
      )}

      <Table
        loading={banksLoading}
        loadingText="Loading banks"
        header={
          <Header
            variant="h2"
            description="Operational status, last execution outcome, and offer distribution across all supported banks"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => navigate('/bank-parser-rules')}>Parser rules</Button>
                <Button variant="primary" onClick={() => navigate('/run-scraper')}>Trigger scrape</Button>
              </SpaceBetween>
            }
          >
            Bank Operational Status
          </Header>
        }
        columnDefinitions={[
          {
            id: 'bank', header: 'Bank', width: 110,
            cell: (b: ApiBankSummary) => (
              <Button variant="link" onClick={() => navigate(`/offers?bank=${b.bank}`)}>
                {b.bank.toUpperCase()}
              </Button>
            ),
          },
          {
            id: 'execution', header: 'Last run', width: 150,
            cell: (b: ApiBankSummary) => {
              switch (b.last_run_status) {
                case 'running': return <StatusIndicator type="in-progress">Running</StatusIndicator>;
                case 'completed': return <StatusIndicator type="success">Completed</StatusIndicator>;
                case 'failed': return <StatusIndicator type="error">Failed</StatusIndicator>;
                case undefined:
                case null: return <StatusIndicator type="stopped">Never run</StatusIndicator>;
                default: return <StatusIndicator type="warning">{b.last_run_status}</StatusIndicator>;
              }
            },
          },
          {
            id: 'attempt', header: 'Last attempt', width: 150,
            cell: (b: ApiBankSummary) => fmtWhen(b.last_attempted_at ?? b.last_run_at),
          },
          {
            id: 'success', header: 'Last success', width: 150,
            cell: (b: ApiBankSummary) => fmtWhen(b.last_success_at, 'Never'),
          },
          {
            id: 'extraction', header: 'Extracted (last run)', width: 190,
            cell: (b: ApiBankSummary) => {
              if (b.last_run_status === undefined || b.last_run_status === null) return '—';
              const errors = b.last_run_errors ?? 0;
              return (
                <SpaceBetween direction="horizontal" size="xs">
                  <span>{b.last_run_found ?? 0} found · {b.last_run_new ?? 0} new · {b.last_run_changed ?? 0} changed</span>
                  {errors > 0 && <Box color="text-status-error">{errors} error{errors === 1 ? '' : 's'}</Box>}
                </SpaceBetween>
              );
            },
          },
          {
            id: 'validation', header: 'Passed rules', width: 140,
            cell: (b: ApiBankSummary) => {
              const total = count(b.total_offers);
              const passed = count(b.validated_count);
              const failures = count(b.rule_failures);
              if (total === null || passed === null) return '—';
              return (
                <span>
                  {passed} / {total}
                  {failures ? <Box display="inline" color="text-status-warning"> · {failures} failing</Box> : null}
                </span>
              );
            },
          },
          {
            id: 'review', header: 'Needs review', width: 120,
            cell: (b: ApiBankSummary) => {
              const n = count(b.review_required_count);
              if (n === null) return '—';
              return n > 0
                ? <Button variant="inline-link" onClick={() => navigate(`/review-queue?bank=${b.bank}`)}>{n}</Button>
                : <span>0</span>;
            },
          },
          {
            id: 'published', header: 'Published', width: 100,
            cell: (b: ApiBankSummary) => count(b.published_count ?? b.active_offers) ?? '—',
          },
          {
            id: 'actions', header: 'Actions', width: 170,
            cell: (b: ApiBankSummary) => (
              <SpaceBetween direction="horizontal" size="xxs">
                <Button variant="inline-link" onClick={() => navigate(`/offers?bank=${b.bank}`)}>Offers</Button>
                <Button variant="inline-link" onClick={() => navigate(`/bank-parser-rules?bank=${b.bank}`)}>Rules</Button>
                <Button variant="inline-link" onClick={() => navigate(`/run-scraper?bank=${b.bank}`)}>Scrape</Button>
              </SpaceBetween>
            ),
          },
        ]}
        items={banks?.items ?? []}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'l' }}>
            {banksError
              ? 'Bank status is unavailable because the admin API did not respond.'
              : 'No bank data found. Run a scrape to populate bank records.'}
          </Box>
        }
        variant="full-page"
        stickyHeader
      />
    </PageLayout>
  );
}
