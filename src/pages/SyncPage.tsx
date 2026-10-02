import { useState } from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import { api, type ApiBulkSyncSummary } from '../services/api';
import { useApi } from '../services/use-api';

export default function SyncPage() {
  const { data: preview, loading, error, refetch } = useApi(() => api.syncPreview(), []);
  const { data: runs, refetch: refetchRuns } = useApi(() => api.syncRuns(10), []);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<ApiBulkSyncSummary | null>(null);

  async function runSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      const summary = await api.bulkSync();
      setLastSummary(summary);
      await Promise.all([refetch(), refetchRuns()]);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Preview and run the DB sync/publish step — only APPROVED offers are ever synced"
        actions={<Button onClick={() => { refetch(); refetchRuns(); }}>Refresh</Button>}
      >
        Sync
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}
      {syncError && <Alert type="error" header="Sync failed" dismissible onDismiss={() => setSyncError(null)}>{syncError}</Alert>}

      <Container header={<Header variant="h2">Sync preview (read-only)</Header>}>
        {loading ? <Spinner /> : (
          <ColumnLayout columns={5} variant="text-grid">
            <div><Box variant="awsui-key-label">Approved, ready</Box><Box variant="awsui-value-large">{preview?.approvedReady ?? 0}</Box></div>
            <div><Box variant="awsui-key-label">Review required (skipped)</Box><Box variant="awsui-value-large">{preview?.reviewRequired ?? 0}</Box></div>
            <div><Box variant="awsui-key-label">Rejected (skipped)</Box><Box variant="awsui-value-large">{preview?.rejected ?? 0}</Box></div>
            <div><Box variant="awsui-key-label">Already published</Box><Box variant="awsui-value-large">{preview?.alreadyPublished ?? 0}</Box></div>
            <div><Box variant="awsui-key-label">Changed existing (staged)</Box><Box variant="awsui-value-large">{preview?.changedExisting ?? 0}</Box></div>
          </ColumnLayout>
        )}
      </Container>

      <Container header={<Header variant="h2">Run sync</Header>}>
        <SpaceBetween size="m">
          <Button variant="primary" onClick={runSync} loading={syncing} disabled={(preview?.approvedReady ?? 0) === 0}>
            Sync all approved offers ({preview?.approvedReady ?? 0})
          </Button>
          {lastSummary && (
            <ColumnLayout columns={4} variant="text-grid">
              <div><Box variant="awsui-key-label">Published</Box><StatusIndicator type="success">{lastSummary.published}</StatusIndicator></div>
              <div><Box variant="awsui-key-label">Updated</Box><StatusIndicator type="info">{lastSummary.updated}</StatusIndicator></div>
              <div><Box variant="awsui-key-label">Unchanged</Box><Box>{lastSummary.unchanged}</Box></div>
              <div><Box variant="awsui-key-label">Failed</Box><StatusIndicator type={lastSummary.failed > 0 ? 'error' : 'success'}>{lastSummary.failed}</StatusIndicator></div>
            </ColumnLayout>
          )}
        </SpaceBetween>
      </Container>

      <Table
        header={<Header variant="h2">Recent sync runs</Header>}
        columnDefinitions={[
          { id: 'started', header: 'Started', cell: r => new Date(r.started_at).toLocaleString() },
          { id: 'status', header: 'Status', cell: r => <StatusIndicator type={r.status === 'completed' ? 'success' : r.status === 'failed' ? 'error' : 'in-progress'}>{r.status}</StatusIndicator> },
          { id: 'published', header: 'Published', cell: r => r.published_count },
          { id: 'updated', header: 'Updated', cell: r => r.updated_count },
          { id: 'unchanged', header: 'Unchanged', cell: r => r.unchanged_count },
          { id: 'failed', header: 'Failed', cell: r => r.failed_count },
          { id: 'triggered_by', header: 'Triggered by', cell: r => r.triggered_by },
        ]}
        items={runs?.items ?? []}
        variant="embedded"
        empty={<Box textAlign="center" color="inherit">No sync runs yet.</Box>}
      />
    </SpaceBetween>
  );
}
