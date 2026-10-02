import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import Table from '@cloudscape-design/components/table';
import { api, type ApiScrapeRun } from '../services/api';
import { useApi } from '../services/use-api';

export default function ErrorsPage() {
  const { data: runsData, loading: runsLoading, error: runsError } = useApi(() => api.runs({ status: 'failed', limit: 100 }), []);
  const { data: validData, loading: validLoading } = useApi(() => api.validation({ passed: false, limit: 100 }), []);

  const failedRuns = runsData?.items ?? [];
  const validFailures = validData?.items ?? [];

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Scrape errors and validation failures from Neon Postgres"
      >
        Errors
      </Header>

      {runsError && <Alert type="error" header="API error">{runsError}</Alert>}

      <Container header={<Header variant="h2">Error summary</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Failed scrape runs</Box>
            {runsLoading ? <Spinner /> : (
              <StatusIndicator type={failedRuns.length > 0 ? 'error' : 'success'}>
                {failedRuns.length}
              </StatusIndicator>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">Validation failures</Box>
            {validLoading ? <Spinner /> : (
              <StatusIndicator type={validFailures.length > 0 ? 'error' : 'success'}>
                {validFailures.length}
              </StatusIndicator>
            )}
          </div>
        </ColumnLayout>
      </Container>

      <Table
        loading={runsLoading}
        loadingText="Loading failed runs"
        header={<Header variant="h2" counter={`(${failedRuns.length})`}>Failed scrape runs</Header>}
        columnDefinitions={[
          {
            id: 'bank', header: 'Bank',
            cell: (r: ApiScrapeRun) => <Box fontWeight="bold">{r.bank.toUpperCase()}</Box>,
          },
          {
            id: 'started_at', header: 'Time',
            cell: (r: ApiScrapeRun) => new Date(r.started_at).toLocaleString(),
          },
          { id: 'mode', header: 'Mode', cell: (r: ApiScrapeRun) => r.mode },
          {
            id: 'error_message', header: 'Error message',
            cell: (r: ApiScrapeRun) => r.error_message ?? '—',
          },
        ]}
        items={failedRuns}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No failed runs.
          </Box>
        }
        variant="embedded"
      />
    </SpaceBetween>
  );
}
