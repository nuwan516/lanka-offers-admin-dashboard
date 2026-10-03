import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Alert from '@cloudscape-design/components/alert';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import Badge from '@cloudscape-design/components/badge';
import { api, type ApiScrapeRun, type ApiBankSummary } from '../services/api';
import { useApi } from '../services/use-api';

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
  const { data: banks, loading: banksLoading } = useApi(() => api.banks(), []);
  const { data: runs, loading: runsLoading } = useApi(() => api.runs({ limit: 5 }), []);

  const o = stats?.offers;
  const r = stats?.runs;
  const v = stats?.validation;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Lanka Offers data pipeline — live from Neon Postgres"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={refetch}>Refresh</Button>
            <Button variant="primary" onClick={() => navigate('/run-scraper')}>Run scraper</Button>
          </SpaceBetween>
        }
      >
        Overview
      </Header>

      {error && (
        <Alert type="error" header="API unavailable">
          Cannot reach the Lanka Offers API at localhost:3001. Start it with <code>npm run api</code> in the LankaOffers directory.
          <br />{error}
        </Alert>
      )}

      <Container header={<Header variant="h2">Operations metrics</Header>}>
        <ColumnLayout columns={4} variant="text-grid">
          <Metric label="Active published offers" value={o?.active_offers ?? '—'} loading={loading} />
          <div>
            <Box variant="awsui-key-label">Pending review / staging</Box>
            {loading ? <Spinner size="normal" /> : (
              <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                <Box variant="awsui-value-large">{o?.pending_review ?? '0'}</Box>
                {parseInt(o?.pending_review ?? '0') > 0 && <Badge color="blue">Review</Badge>}
              </SpaceBetween>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">Pending DB sync (approved)</Box>
            {loading ? <Spinner size="normal" /> : (
              <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                <Box variant="awsui-value-large">{o?.pending_sync ?? '0'}</Box>
                {parseInt(o?.pending_sync ?? '0') > 0 && <Badge color="green">Sync</Badge>}
              </SpaceBetween>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">Unresolved geo records</Box>
            {loading ? <Spinner size="normal" /> : (
              <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                <Box variant="awsui-value-large">{o?.unresolved_geo ?? '0'}</Box>
                {parseInt(o?.unresolved_geo ?? '0') > 0 && <Badge color="red">Action</Badge>}
              </SpaceBetween>
            )}
          </div>
        </ColumnLayout>
        <Box margin={{ top: 'm' }}>
          <ColumnLayout columns={4} variant="text-grid">
            <Metric label="Offers scraped (24h)" value={r?.scraped_today ?? '0'} loading={loading} />
            <Metric label="New offers today" value={r?.new_today ?? '0'} loading={loading} />
            <Metric label="Changed offers today" value={r?.changed_today ?? '0'} loading={loading} />
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
                <StatusIndicator type={parseInt(r?.running_jobs ?? '0') > 0 ? 'in-progress' : 'success'}>
                  {r?.running_jobs ?? '0'} active
                </StatusIndicator>
              )}
            </div>
            <div>
              <Box variant="awsui-key-label">Failed runs today</Box>
              {loading ? <Spinner size="normal" /> : (
                <StatusIndicator type={parseInt(r?.failed_today ?? '0') > 0 ? 'error' : 'success'}>
                  {r?.failed_today ?? '0'} failures
                </StatusIndicator>
              )}
            </div>
            <div>
              <Box variant="awsui-key-label">Validation rule failures</Box>
              {loading ? <Spinner size="normal" /> : (
                <StatusIndicator type={parseInt(v?.validation_failures ?? '0') > 0 ? 'warning' : 'success'}>
                  {v?.validation_failures ?? '0'} issues
                </StatusIndicator>
              )}
            </div>
            <div>
              <Box variant="awsui-key-label">LLM validated count</Box>
              {loading ? <Spinner size="normal" /> : <Box variant="awsui-value-large">{o?.llm_scored ?? '0'}</Box>}
            </div>
          </ColumnLayout>
        </Container>

        <Container header={<Header variant="h2" description="Deterministic same-bank candidate matcher">Duplicate Detection</Header>}>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Pending review</Box>
              {loading ? <Spinner size="normal" /> : (
                <StatusIndicator type={(stats?.duplicates?.pending ?? 0) > 0 ? 'warning' : 'success'}>
                  {stats?.duplicates?.pending ?? 0}
                </StatusIndicator>
              )}
            </div>
            <div>
              <Box variant="awsui-key-label">Confirmed duplicates</Box>
              {loading ? <Spinner size="normal" /> : <Box variant="awsui-value-large">{stats?.duplicates?.confirmed ?? 0}</Box>}
            </div>
            <div>
              <Box variant="awsui-key-label">Marked not-duplicate</Box>
              {loading ? <Spinner size="normal" /> : <Box variant="awsui-value-large">{stats?.duplicates?.notDuplicate ?? 0}</Box>}
            </div>
          </ColumnLayout>
          <Box margin={{ top: 'm' }}>
            <Button variant="link" onClick={() => navigate('/duplicates')}>Open duplicate candidate queue</Button>
          </Box>
        </Container>

        <Table
          loading={runsLoading}
          loadingText="Loading runs"
          onRowClick={e => navigate(`/runs/${e.detail.item.id}`)}
          header={
            <Header
              variant="h2"
              actions={<Button variant="link" onClick={() => navigate('/runs')}>View all</Button>}
            >
              Recent scrape runs
            </Header>
          }
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
      </Grid>

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
            id: 'bank', header: 'Bank', width: 120,
            cell: (b: ApiBankSummary) => (
              <Button variant="link" onClick={() => navigate(`/offers?bank=${b.bank}`)}>
                {b.bank.toUpperCase()}
              </Button>
            ),
          },
          {
            id: 'status', header: 'Status', width: 120,
            cell: (b: ApiBankSummary) => {
              const status = b.health_status ?? (parseInt(b.rule_failures) > 0 ? 'Warning' : 'Healthy');
              const indicatorType =
                status === 'Healthy' ? 'success' :
                status === 'Warning' ? 'warning' :
                status === 'Failed' ? 'error' :
                status === 'Running' ? 'in-progress' : 'stopped';
              return <StatusIndicator type={indicatorType}>{status}</StatusIndicator>;
            },
          },
          {
            id: 'last_run', header: 'Last run', width: 140,
            cell: (b: ApiBankSummary) => (
              <Box color="text-body-secondary" fontSize="body-s">
                {b.last_run_at ? new Date(b.last_run_at).toLocaleString() : (b.last_updated ? new Date(b.last_updated).toLocaleDateString() : '—')}
              </Box>
            ),
          },
          {
            id: 'raw', header: 'Raw found', width: 90,
            cell: (b: ApiBankSummary) => b.last_run_found !== undefined ? b.last_run_found : b.total_offers,
          },
          {
            id: 'new', header: 'New', width: 70,
            cell: (b: ApiBankSummary) => b.last_run_new ?? '—',
          },
          {
            id: 'changed', header: 'Changed', width: 80,
            cell: (b: ApiBankSummary) => b.last_run_changed ?? '—',
          },
          {
            id: 'errors', header: 'Errors', width: 80,
            cell: (b: ApiBankSummary) => (
              <Box color={(b.last_run_errors ?? 0) > 0 ? 'text-status-error' : undefined}>
                {b.last_run_errors ?? 0}
              </Box>
            ),
          },
          {
            id: 'offers', header: 'Active / Total', width: 120,
            cell: (b: ApiBankSummary) => `${b.active_offers} / ${b.total_offers}`,
          },
          {
            id: 'actions', header: 'Actions', width: 180,
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
            No bank data found. Trigger a scrape to populate bank records.
          </Box>
        }
        variant="full-page"
        stickyHeader
      />
    </SpaceBetween>
  );
}
