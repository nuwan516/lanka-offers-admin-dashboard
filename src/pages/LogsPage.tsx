import { useState } from 'react';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import Tabs from '@cloudscape-design/components/tabs';
import Select from '@cloudscape-design/components/select';
import Input from '@cloudscape-design/components/input';
import FormField from '@cloudscape-design/components/form-field';
import Badge from '@cloudscape-design/components/badge';
import Button from '@cloudscape-design/components/button';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import PageLayout from '../components/PageLayout';
import { api, type ApiScrapeRun, type ApiLogEntry } from '../services/api';
import { useApi } from '../services/use-api';

const BANK_OPTIONS = [
  { label: 'All banks', value: '' },
  { label: 'HNB', value: 'hnb' },
  { label: 'BOC', value: 'boc' },
  { label: 'Sampath', value: 'sampath' },
  { label: 'NDB', value: 'ndb' },
  { label: 'DFCC', value: 'dfcc' },
  { label: 'Seylan', value: 'seylan' },
  { label: 'People\'s Bank', value: 'peoples' },
  { label: 'Pan Asia (PABC)', value: 'pabc' },
  { label: 'NSB', value: 'nsb' },
  { label: 'Commercial Bank', value: 'combank' },
];

const LEVEL_OPTIONS = [
  { label: 'All levels', value: '' },
  { label: 'ERROR', value: 'error' },
  { label: 'WARN', value: 'warn' },
  { label: 'INFO', value: 'info' },
  { label: 'SUCCESS', value: 'success' },
  { label: 'DEBUG', value: 'debug' },
];

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [bankFilter, setBankFilter] = useState(BANK_OPTIONS[0]);
  const [levelFilter, setLevelFilter] = useState(LEVEL_OPTIONS[0]);
  const [tagFilter, setTagFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Structured logs query
  const {
    data: logData,
    loading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useApi(
    () =>
      api.logs({
        bank: bankFilter.value || undefined,
        level: levelFilter.value || undefined,
        tag: tagFilter.trim() || undefined,
        search: searchFilter.trim() || undefined,
        limit: 100,
      }),
    [bankFilter.value, levelFilter.value, tagFilter, searchFilter]
  );

  // Scrape runs query
  const {
    data: runData,
    loading: runsLoading,
    error: runsError,
    refetch: refetchRuns,
  } = useApi(() => api.runs({ limit: 50 }), []);

  const logs = logData?.items ?? [];
  const runs = runData?.items ?? [];
  const failedRuns = runs.filter(r => r.status === 'failed');

  const errorLogsCount = logs.filter(l => l.level === 'error').length;
  const warnLogsCount = logs.filter(l => l.level === 'warn').length;

  return (
    <PageLayout
      title="Operational Logs"
      description="Structured operational pipeline events and scrape run history"
      breadcrumbs={[{ text: 'Logs', href: '/logs' }]}
      actions={
        <Button
          onClick={() => {
            refetchLogs();
            refetchRuns();
          }}
        >
          Refresh
        </Button>
      }
      error={logsError || runsError}
    >
      <Tabs
        activeTabId={activeTab}
        onChange={e => setActiveTab(e.detail.activeTabId)}
        tabs={[
          {
            id: 'pipeline',
            label: `Pipeline Events (${logs.length})`,
            content: (
              <SpaceBetween size="m">
                {/* Metric Summary */}
                <Container>
                  <ColumnLayout columns={4} variant="text-grid">
                    <div>
                      <Box variant="awsui-key-label">Total Events Loaded</Box>
                      {logsLoading ? <Spinner /> : <Box variant="awsui-value-large">{logs.length}</Box>}
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Errors Detected</Box>
                      {logsLoading ? (
                        <Spinner />
                      ) : (
                        <StatusIndicator type={errorLogsCount > 0 ? 'error' : 'success'}>
                          {errorLogsCount}
                        </StatusIndicator>
                      )}
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Warnings</Box>
                      {logsLoading ? (
                        <Spinner />
                      ) : (
                        <StatusIndicator type={warnLogsCount > 0 ? 'warning' : 'info'}>
                          {warnLogsCount}
                        </StatusIndicator>
                      )}
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Bank Filter</Box>
                      <Box variant="awsui-value-large">{bankFilter.label}</Box>
                    </div>
                  </ColumnLayout>
                </Container>

                {/* Filters */}
                <Container header={<Header variant="h2">Event Filters</Header>}>
                  <ColumnLayout columns={4}>
                    <FormField label="Bank">
                      <Select
                        selectedOption={bankFilter}
                        onChange={e => setBankFilter(e.detail.selectedOption as typeof bankFilter)}
                        options={BANK_OPTIONS}
                      />
                    </FormField>
                    <FormField label="Severity / Level">
                      <Select
                        selectedOption={levelFilter}
                        onChange={e => setLevelFilter(e.detail.selectedOption as typeof levelFilter)}
                        options={LEVEL_OPTIONS}
                      />
                    </FormField>
                    <FormField label="Component / Tag">
                      <Input
                        value={tagFilter}
                        onChange={e => setTagFilter(e.detail.value)}
                        placeholder="e.g. PARSER, GEO, LLM"
                      />
                    </FormField>
                    <FormField label="Search Log Text">
                      <Input
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.detail.value)}
                        placeholder="Keywords, IDs, URLs..."
                      />
                    </FormField>
                  </ColumnLayout>
                </Container>

                {/* Structured Logs Table */}
                <Table
                  loading={logsLoading}
                  loadingText="Ingesting structured log events..."
                  header={
                    <Header
                      variant="h2"
                      counter={`(${logs.length})`}
                      actions={
                        <Button onClick={refetchLogs} loading={logsLoading}>
                          Refresh logs
                        </Button>
                      }
                    >
                      Structured Log Stream
                    </Header>
                  }
                  columnDefinitions={[
                    {
                      id: 'timestamp',
                      header: 'Timestamp',
                      width: 170,
                      cell: (l: ApiLogEntry) => (
                        <Box fontSize="body-s" color="text-body-secondary">
                          {new Date(l.ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                        </Box>
                      ),
                    },
                    {
                      id: 'level',
                      header: 'Level',
                      width: 100,
                      cell: (l: ApiLogEntry) => {
                        const lvl = (l.level ?? 'info').toLowerCase();
                        const color =
                          lvl === 'error'
                            ? 'red'
                            : lvl === 'warn'
                            ? 'blue'
                            : lvl === 'success'
                            ? 'green'
                            : 'grey';
                        return <Badge color={color}>{(l.level ?? 'info').toUpperCase()}</Badge>;
                      },
                    },
                    {
                      id: 'bank',
                      header: 'Bank',
                      width: 100,
                      cell: (l: ApiLogEntry) =>
                        l.bank ? <Badge color="blue">{l.bank.toUpperCase()}</Badge> : <Box color="text-body-secondary">—</Box>,
                    },
                    {
                      id: 'tag',
                      header: 'Component',
                      width: 140,
                      cell: (l: ApiLogEntry) => (
                        <Box fontWeight="bold" fontSize="body-s">
                          [{l.tag ?? 'SYSTEM'}]
                        </Box>
                      ),
                    },
                    {
                      id: 'message',
                      header: 'Message & Context',
                      cell: (l: ApiLogEntry) => (
                        <SpaceBetween size="xxs">
                          <div style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-word' }}>
                            {l.message}
                          </div>
                          {l.data && Object.keys(l.data).length > 0 && (
                            <ExpandableSection headerText="Context Data">
                              <pre style={{ fontSize: 13, margin: 0, padding: '8px 12px', background: 'var(--code-bg)', color: 'var(--code-text)', border: '1px solid var(--code-border)', borderRadius: 4, overflowX: 'auto' }}>
                                {JSON.stringify(l.data, null, 2)}
                              </pre>
                            </ExpandableSection>
                          )}
                        </SpaceBetween>
                      ),
                    },
                  ]}
                  items={logs}
                  empty={
                    <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
                      No structured log events match the current criteria. Run a scraper or check active bank filters.
                    </Box>
                  }
                  variant="embedded"
                />
              </SpaceBetween>
            ),
          },
          {
            id: 'runs',
            label: `Scrape Run History (${runs.length})`,
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h2">Run Statistics</Header>}>
                  <ColumnLayout columns={3} variant="text-grid">
                    <div>
                      <Box variant="awsui-key-label">Total Scrape Runs</Box>
                      {runsLoading ? <Spinner /> : <Box variant="awsui-value-large">{runs.length}</Box>}
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Failed Runs</Box>
                      {runsLoading ? (
                        <Spinner />
                      ) : (
                        <StatusIndicator type={failedRuns.length > 0 ? 'error' : 'success'}>
                          {failedRuns.length}
                        </StatusIndicator>
                      )}
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Success Rate</Box>
                      {runsLoading ? (
                        <Spinner />
                      ) : (
                        <Box variant="awsui-value-large">
                          {runs.length > 0
                            ? `${Math.round(((runs.length - failedRuns.length) / runs.length) * 100)}%`
                            : '—'}
                        </Box>
                      )}
                    </div>
                  </ColumnLayout>
                </Container>

                {failedRuns.length > 0 && (
                  <Table
                    loading={runsLoading}
                    loadingText="Loading error runs..."
                    header={<Header variant="h2" counter={`(${failedRuns.length})`}>Failed Scrape Runs</Header>}
                    columnDefinitions={[
                      {
                        id: 'bank',
                        header: 'Bank',
                        cell: (r: ApiScrapeRun) => <Box fontWeight="bold">{r.bank.toUpperCase()}</Box>,
                      },
                      {
                        id: 'started_at',
                        header: 'Time',
                        cell: (r: ApiScrapeRun) => new Date(r.started_at).toLocaleString(),
                      },
                      { id: 'mode', header: 'Mode', cell: (r: ApiScrapeRun) => r.mode },
                      {
                        id: 'error_message',
                        header: 'Error Diagnosis',
                        cell: (r: ApiScrapeRun) => (
                          <StatusIndicator type="error">{r.error_message ?? 'Scrape process failed'}</StatusIndicator>
                        ),
                      },
                    ]}
                    items={failedRuns}
                    variant="embedded"
                  />
                )}

                <Table
                  loading={runsLoading}
                  loadingText="Loading run history..."
                  header={<Header variant="h2" counter={`(${runs.length})`}>All Scrape Runs</Header>}
                  columnDefinitions={[
                    {
                      id: 'bank',
                      header: 'Bank',
                      cell: (r: ApiScrapeRun) => <Box fontWeight="bold">{r.bank.toUpperCase()}</Box>,
                    },
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
                    {
                      id: 'started_at',
                      header: 'Started',
                      cell: (r: ApiScrapeRun) => new Date(r.started_at).toLocaleString(),
                    },
                    {
                      id: 'offers_found',
                      header: 'Offers Found',
                      cell: (r: ApiScrapeRun) => r.offers_found ?? '—',
                    },
                    { id: 'triggered_by', header: 'Triggered By', cell: (r: ApiScrapeRun) => r.triggered_by },
                    {
                      id: 'error_message',
                      header: 'Diagnosis',
                      cell: (r: ApiScrapeRun) =>
                        r.error_message ? (
                          <StatusIndicator type="error">{r.error_message.slice(0, 80)}</StatusIndicator>
                        ) : (
                          <StatusIndicator type="success">Clean</StatusIndicator>
                        ),
                    },
                  ]}
                  items={runs}
                  empty={
                    <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
                      No scrape runs found. Trigger a scrape to generate execution runs.
                    </Box>
                  }
                  variant="full-page"
                  stickyHeader
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
    </PageLayout>
  );
}
