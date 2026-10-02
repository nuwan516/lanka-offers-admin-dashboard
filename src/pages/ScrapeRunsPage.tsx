import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Alert from '@cloudscape-design/components/alert';
import { api, type ApiScrapeRun } from '../services/api';
import { useApi } from '../services/use-api';

const BANKS = ['HNB', 'BOC', 'SAMPATH', 'NDB', 'DFCC', 'SEYLAN', 'PEOPLES', 'PABC', 'NSB', 'COMBANK'];

function runStatusType(status: string) {
  if (status === 'completed') return 'success';
  if (status === 'warning') return 'warning';
  if (status === 'failed') return 'error';
  if (status === 'running') return 'in-progress';
  return 'stopped';
}

function duration(run: ApiScrapeRun): string {
  if (!run.finished_at) return run.status === 'running' ? 'Running…' : '—';
  const ms = new Date(run.finished_at).getTime() - new Date(run.started_at).getTime();
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function ScrapeRunsPage() {
  const navigate = useNavigate();
  const [bankFilter, setBankFilter] = useState<any>({ label: 'All banks', value: '' });
  const [statusFilter, setStatusFilter] = useState<any>({ label: 'All statuses', value: '' });
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, loading, error, refetch } = useApi(
    () => api.runs({
      bank: bankFilter.value || undefined,
      status: statusFilter.value || undefined,
      limit: 100,
    }),
    [bankFilter.value, statusFilter.value]
  );

  async function handleCancel(bank: string) {
    setActionBusy(`cancel-${bank}`);
    setActionMessage(null);
    try {
      const res = await api.cancelScrape(bank);
      setActionMessage({ type: 'success', text: res.message || `Scrape for ${bank.toUpperCase()} cancelled.` });
      await refetch();
    } catch (e) {
      setActionMessage({ type: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRetry(bank: string) {
    setActionBusy(`retry-${bank}`);
    setActionMessage(null);
    try {
      const res = await api.retryScrape(bank);
      setActionMessage({ type: 'success', text: res.message || `Scrape for ${bank.toUpperCase()} restarted.` });
      await refetch();
    } catch (e) {
      setActionMessage({ type: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setActionBusy(null);
    }
  }

  const runs = data?.items ?? [];

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="History of all scraper executions"
        counter={loading ? undefined : `(${runs.length})`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={refetch}>Refresh</Button>
            <Button variant="primary" onClick={() => navigate('/run-scraper')}>New run</Button>
          </SpaceBetween>
        }
      >
        Scrape runs
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}
      {actionMessage && (
        <Alert
          type={actionMessage.type}
          dismissible
          onDismiss={() => setActionMessage(null)}
          header={actionMessage.type === 'success' ? 'Action completed' : 'Action failed'}
        >
          {actionMessage.text}
        </Alert>
      )}

      <SpaceBetween direction="horizontal" size="s">
        <Select
          selectedOption={bankFilter}
          onChange={e => setBankFilter(e.detail.selectedOption)}
          options={[{ label: 'All banks', value: '' }, ...BANKS.map(b => ({ label: b, value: b.toLowerCase() }))]}
          placeholder="Bank"
        />
        <Select
          selectedOption={statusFilter}
          onChange={e => setStatusFilter(e.detail.selectedOption)}
          options={[
            { label: 'All statuses', value: '' },
            { label: 'Completed', value: 'completed' },
            { label: 'Warning / Suspicious', value: 'warning' },
            { label: 'Running', value: 'running' },
            { label: 'Failed', value: 'failed' },
          ]}
          placeholder="Status"
        />
      </SpaceBetween>

      <Table
        loading={loading}
        loadingText="Loading runs"
        onRowClick={e => navigate(`/runs/${e.detail.item.id}`)}
        columnDefinitions={[
          {
            id: 'bank', header: 'Bank', width: 100,
            cell: (r: ApiScrapeRun) => <Box fontWeight="bold">{r.bank.toUpperCase()}</Box>,
          },
          {
            id: 'status', header: 'Status', minWidth: 160,
            cell: (r: ApiScrapeRun) => (
              <SpaceBetween size="xxs">
                <StatusIndicator type={runStatusType(r.status)}>
                  {r.status === 'warning' ? 'Warning / Suspicious' : r.status}
                </StatusIndicator>
                {r.status === 'warning' && r.error_message && (
                  <Box variant="small" color="text-status-warning">
                    {r.error_message}
                  </Box>
                )}
              </SpaceBetween>
            ),
          },
          { id: 'mode', header: 'Mode', cell: (r: ApiScrapeRun) => r.mode },
          { id: 'triggered_by', header: 'Triggered by', cell: (r: ApiScrapeRun) => r.triggered_by },
          {
            id: 'started_at', header: 'Started',
            cell: (r: ApiScrapeRun) => new Date(r.started_at).toLocaleString(),
          },
          { id: 'duration', header: 'Duration', cell: duration },
          {
            id: 'offers_found', header: 'Found',
            cell: (r: ApiScrapeRun) => r.offers_found ?? '—',
          },
          {
            id: 'offers_new', header: 'New',
            cell: (r: ApiScrapeRun) => r.offers_new ?? '—',
          },
          {
            id: 'errors', header: 'Errors',
            cell: (r: ApiScrapeRun) => r.errors > 0
              ? <StatusIndicator type="error">{r.errors}</StatusIndicator>
              : <StatusIndicator type="success">0</StatusIndicator>,
          },
          {
            id: 'actions', header: 'Actions',
            cell: (r: ApiScrapeRun) => (
              <SpaceBetween direction="horizontal" size="xxs">
                {r.status === 'running' && (
                  <Button
                    variant="normal"
                    loading={actionBusy === `cancel-${r.bank}`}
                    onClick={e => {
                      e.stopPropagation();
                      handleCancel(r.bank);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                {r.status === 'failed' && (
                  <Button
                    variant="normal"
                    loading={actionBusy === `retry-${r.bank}`}
                    onClick={e => {
                      e.stopPropagation();
                      handleRetry(r.bank);
                    }}
                  >
                    Retry
                  </Button>
                )}
              </SpaceBetween>
            ),
          },
        ]}
        items={runs}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            {error ? 'API unavailable' : 'No scrape runs found. Start a scraper to create records.'}
          </Box>
        }
        header={<Header variant="h2" counter={`(${runs.length})`}>Run history</Header>}
        variant="full-page"
        stickyHeader
      />
    </SpaceBetween>
  );
}
