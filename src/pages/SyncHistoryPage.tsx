import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Table from '@cloudscape-design/components/table';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import { api, type ApiScrapeRun } from '../services/api';
import { useApi } from '../services/use-api';

function duration(run: ApiScrapeRun): string {
  if (!run.finished_at) return '—';
  const ms = new Date(run.finished_at).getTime() - new Date(run.started_at).getTime();
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function SyncHistoryPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => api.runs({ status: 'completed', limit: 100 }), []);
  const runs = data?.items ?? [];

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Completed scrape runs from Neon Postgres"
        counter={loading ? undefined : `(${runs.length})`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={refetch}>Refresh</Button>
            <Button onClick={() => navigate('/runs')}>All runs</Button>
          </SpaceBetween>
        }
      >
        Sync history
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}

      <Table
        loading={loading}
        loadingText="Loading sync history"
        onRowClick={e => navigate(`/runs/${e.detail.item.id}`)}
        columnDefinitions={[
          {
            id: 'bank', header: 'Bank', width: 90,
            cell: (r: ApiScrapeRun) => <Box fontWeight="bold">{r.bank.toUpperCase()}</Box>,
          },
          {
            id: 'started_at', header: 'Started',
            cell: (r: ApiScrapeRun) => new Date(r.started_at).toLocaleString(),
          },
          { id: 'duration', header: 'Duration', cell: duration },
          { id: 'offers_found', header: 'Found', cell: (r: ApiScrapeRun) => r.offers_found ?? '—' },
          { id: 'offers_new', header: 'New', cell: (r: ApiScrapeRun) => r.offers_new ?? '—' },
          { id: 'offers_changed', header: 'Changed', cell: (r: ApiScrapeRun) => r.offers_changed ?? '—' },
          { id: 'offers_unchanged', header: 'Unchanged', cell: (r: ApiScrapeRun) => r.offers_unchanged ?? '—' },
          {
            id: 'status', header: 'Status',
            cell: (r: ApiScrapeRun) => <StatusIndicator type="success">{r.status}</StatusIndicator>,
          },
          { id: 'triggered_by', header: 'Triggered by', cell: (r: ApiScrapeRun) => r.triggered_by },
        ]}
        items={runs}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No completed sync runs. Run a scraper to generate history.
          </Box>
        }
        header={<Header variant="h2" counter={`(${runs.length})`}>Completed runs</Header>}
        variant="full-page"
        stickyHeader
      />
    </SpaceBetween>
  );
}
