import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Alert from '@cloudscape-design/components/alert';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Spinner from '@cloudscape-design/components/spinner';
import { api, type ApiScrapeRun } from '../services/api';
import { useApi } from '../services/use-api';

function duration(run: ApiScrapeRun): string {
  if (!run.finished_at) return run.status === 'running' ? 'Running…' : '—';
  const ms = new Date(run.finished_at).getTime() - new Date(run.started_at).getTime();
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function JobsPage() {
  const navigate = useNavigate();
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { data: runs, loading: runsLoading, error, refetch: refetchRuns } = useApi(() => api.runs({ limit: 100 }), []);
  const { data: status, loading: statusLoading, refetch: refetchStatus } = useApi(() => api.scrapeStatus(), []);

  async function handleCancel(bank: string) {
    setActionBusy(`cancel-${bank}`);
    setActionMessage(null);
    try {
      const res = await api.cancelScrape(bank);
      setActionMessage({ type: 'success', text: res.message || `Scrape for ${bank.toUpperCase()} cancelled.` });
      await Promise.all([refetchRuns(), refetchStatus()]);
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
      await Promise.all([refetchRuns(), refetchStatus()]);
    } catch (e) {
      setActionMessage({ type: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setActionBusy(null);
    }
  }

  const items = runs?.items ?? [];
  const running = items.filter(r => r.status === 'running');
  const activeJobs = status?.active ?? [];
  const activeGeo = status?.activeGeo ?? [];
  const hasRunning = running.length > 0 || activeJobs.length > 0 || activeGeo.length > 0;

  // Auto-refresh every 8s while jobs are active
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (hasRunning) {
      intervalRef.current = setInterval(() => {
        refetchRuns();
        refetchStatus();
      }, 8000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hasRunning]);

  const today = new Date().toDateString();
  const todayRuns = items.filter(r => new Date(r.started_at).toDateString() === today);
  const successToday = todayRuns.filter(r => r.status === 'completed').length;
  const warningsToday = todayRuns.filter(r => r.status === 'warning').length;
  const failedToday = todayRuns.filter(r => r.status === 'failed').length;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Scraper job history and active status from Neon Postgres"
        counter={runsLoading ? undefined : `(${items.length})`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => { refetchRuns(); refetchStatus(); }} loading={runsLoading || statusLoading}>
              Refresh
            </Button>
            <Button variant="primary" onClick={() => navigate('/run-scraper')}>New job</Button>
          </SpaceBetween>
        }
      >
        Jobs
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

      {hasRunning && (
        <Alert type="info" header="Jobs are running — auto-refreshing every 8 seconds">
          {activeJobs.map(j => `Scrape: ${j.bank.toUpperCase()}`).join(', ')}
          {activeGeo.map(j => `  Geocode: ${j.bank.toUpperCase()}`).join(', ')}
        </Alert>
      )}

      <Container header={<Header variant="h2">Today</Header>}>
        {runsLoading ? <Spinner /> : (
          <ColumnLayout columns={5} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Runs today</Box>
              <Box variant="awsui-value-large">{todayRuns.length}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Completed</Box>
              <StatusIndicator type="success">{successToday}</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Warnings</Box>
              <StatusIndicator type={warningsToday > 0 ? 'warning' : 'success'}>{warningsToday}</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Failed</Box>
              <StatusIndicator type={failedToday > 0 ? 'error' : 'success'}>{failedToday}</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Active right now</Box>
              <StatusIndicator type={activeJobs.length > 0 ? 'in-progress' : 'stopped'}>
                {activeJobs.length + activeGeo.length}
              </StatusIndicator>
            </div>
          </ColumnLayout>
        )}
      </Container>

      {(activeJobs.length > 0 || activeGeo.length > 0) && (
        <Container header={<Header variant="h2">Active processes</Header>}>
          <Table
            header={undefined}
            columnDefinitions={[
              {
                id: 'type', header: 'Type',
                cell: (j: { pid: number; bank: string; startedAt: string; type: string }) => j.type,
              },
              {
                id: 'bank', header: 'Bank',
                cell: (j: { pid: number; bank: string; startedAt: string; type: string }) => (
                  <StatusIndicator type="in-progress">{j.bank.toUpperCase()}</StatusIndicator>
                ),
              },
              {
                id: 'pid', header: 'PID',
                cell: (j: { pid: number; bank: string; startedAt: string; type: string }) => j.pid,
              },
              {
                id: 'started', header: 'Started',
                cell: (j: { pid: number; bank: string; startedAt: string; type: string }) =>
                  new Date(j.startedAt).toLocaleTimeString(),
              },
              {
                id: 'actions', header: 'Actions',
                cell: (j: { pid: number; bank: string; startedAt: string; type: string }) => (
                  j.type === 'Scrape' ? (
                    <Button
                      variant="normal"
                      loading={actionBusy === `cancel-${j.bank}`}
                      onClick={e => {
                        e.stopPropagation();
                        handleCancel(j.bank);
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null
                ),
              },
            ]}
            items={[
              ...activeJobs.map(j => ({ ...j, type: 'Scrape' })),
              ...activeGeo.map(j => ({ ...j, type: 'Geocode' })),
            ]}
            variant="embedded"
          />
        </Container>
      )}

      <Table
        loading={runsLoading}
        loadingText="Loading jobs"
        onRowClick={e => navigate(`/runs/${e.detail.item.id}`)}
        columnDefinitions={[
          {
            id: 'bank', header: 'Bank', width: 90,
            cell: (r: ApiScrapeRun) => <Box fontWeight="bold">{r.bank.toUpperCase()}</Box>,
          },
          {
            id: 'status', header: 'Status', minWidth: 140,
            cell: (r: ApiScrapeRun) => (
              <StatusIndicator type={
                r.status === 'completed' ? 'success' :
                r.status === 'warning' ? 'warning' :
                r.status === 'failed' ? 'error' :
                r.status === 'running' ? 'in-progress' : 'stopped'
              }>{r.status === 'warning' ? 'Warning / Suspicious' : r.status}</StatusIndicator>
            ),
          },
          { id: 'mode', header: 'Mode', cell: (r: ApiScrapeRun) => r.mode },
          { id: 'triggered_by', header: 'Triggered by', cell: (r: ApiScrapeRun) => r.triggered_by },
          {
            id: 'started_at', header: 'Started',
            cell: (r: ApiScrapeRun) => new Date(r.started_at).toLocaleString(),
          },
          { id: 'duration', header: 'Duration', cell: duration },
          { id: 'offers_found', header: 'Found', cell: (r: ApiScrapeRun) => r.offers_found ?? '—' },
          { id: 'offers_new', header: 'New', cell: (r: ApiScrapeRun) => r.offers_new ?? '—' },
          { id: 'offers_changed', header: 'Changed', cell: (r: ApiScrapeRun) => r.offers_changed ?? '—' },
          {
            id: 'errors', header: 'Errors',
            cell: (r: ApiScrapeRun) => r.errors > 0
              ? <StatusIndicator type="error">{r.errors}</StatusIndicator>
              : <StatusIndicator type="success">0</StatusIndicator>,
          },
          {
            id: 'error_msg', header: 'Error / Anomaly',
            cell: (r: ApiScrapeRun) => r.error_message
              ? <Box color={r.status === 'warning' ? 'text-status-warning' : 'text-status-error'} fontSize="body-s">{r.error_message}</Box>
              : null,
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
        items={items}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No jobs found. Start a scraper to create job records.
          </Box>
        }
        header={<Header variant="h2" counter={`(${items.length})`}>Job history</Header>}
        variant="full-page"
        stickyHeader
      />
    </SpaceBetween>
  );
}
