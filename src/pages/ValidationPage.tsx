import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Button from '@cloudscape-design/components/button';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import { useNavigate } from 'react-router-dom';
import { api, type ApiValidationReport } from '../services/api';
import { useApi } from '../services/use-api';
import PageLayout from '../components/PageLayout';

export default function ValidationPage() {
  const navigate = useNavigate();
  const { data: stats, loading: statsLoading } = useApi(() => api.stats(), []);
  const { data: vData, loading: vLoading, error } = useApi(
    () => api.validation({ limit: 50 }), []
  );
  const { data: failedData, loading: failedLoading } = useApi(
    () => api.validation({ passed: false, limit: 50 }), []
  );

  const reports = vData?.items ?? [];
  const failed = failedData?.items ?? [];
  const v = stats?.validation;
  const total = parseInt(v?.total_validated ?? '0');
  const failures = parseInt(v?.validation_failures ?? '0');
  const passRate = total > 0 ? Math.round(((total - failures) / total) * 100) : null;

  return (
    <PageLayout
      title="Validation"
      description="Rule-based and LLM validation results from Neon Postgres"
      breadcrumbs={[{ text: 'Validation', href: '/validation' }]}
      error={error}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => navigate('/rules')}>Manage rules</Button>
          <Button onClick={() => navigate('/llm-validation')}>LLM details</Button>
        </SpaceBetween>
      }
    >

      <Container header={<Header variant="h2">Summary</Header>}>
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Total validated</Box>
            {statsLoading ? <Spinner /> : <Box variant="awsui-value-large">{v?.total_validated ?? '0'}</Box>}
          </div>
          <div>
            <Box variant="awsui-key-label">Passed</Box>
            {statsLoading ? <Spinner /> : (
              <StatusIndicator type={failures === 0 ? 'success' : 'warning'}>
                {total - failures}
              </StatusIndicator>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">Failed</Box>
            {statsLoading ? <Spinner /> : (
              <StatusIndicator type={failures > 0 ? 'error' : 'success'}>
                {failures}
              </StatusIndicator>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">Pass rate</Box>
            {statsLoading ? <Spinner /> : <Box variant="awsui-value-large">{passRate != null ? `${passRate}%` : '—'}</Box>}
          </div>
        </ColumnLayout>
      </Container>

      {failed.length > 0 && (
        <Container header={<Header variant="h2">Failed validations</Header>}>
          <Table
            loading={failedLoading}
            loadingText="Loading failures"
            columnDefinitions={[
              {
                id: 'title', header: 'Offer',
                cell: (r: ApiValidationReport) => (
                  <Button variant="link" onClick={() => navigate(`/offers/${r.offer_id}/review`)}>
                    {r.title}
                  </Button>
                ),
              },
              { id: 'bank', header: 'Bank', cell: (r: ApiValidationReport) => r.bank.toUpperCase() },
              { id: 'merchant', header: 'Merchant', cell: (r: ApiValidationReport) => r.merchant_name ?? '—' },
              {
                id: 'errors', header: 'Errors',
                cell: (r: ApiValidationReport) => (
                  <SpaceBetween size="xxs">
                    {(r.rule_errors ?? []).map((e, i) => (
                      <StatusIndicator key={i} type="error">{e.field}: {e.message}</StatusIndicator>
                    ))}
                  </SpaceBetween>
                ),
              },
              {
                id: 'llm', header: 'LLM score',
                cell: (r: ApiValidationReport) => r.llm_score != null ? `${r.llm_score}/100` : '—',
              },
              {
                id: 'created_at', header: 'Validated',
                cell: (r: ApiValidationReport) => new Date(r.created_at).toLocaleDateString(),
              },
            ]}
            items={failed}
            empty={<Box textAlign="center" color="inherit">No failures.</Box>}
            variant="embedded"
          />
        </Container>
      )}

      <Table
        loading={vLoading}
        loadingText="Loading reports"
        header={<Header variant="h2" counter={`(${reports.length})`}>Validation reports</Header>}
        columnDefinitions={[
          {
            id: 'title', header: 'Offer',
            cell: (r: ApiValidationReport) => (
              <Button variant="link" onClick={() => navigate(`/offers/${r.offer_id}/review`)}>
                {r.title}
              </Button>
            ),
          },
          { id: 'bank', header: 'Bank', cell: (r: ApiValidationReport) => r.bank.toUpperCase() },
          {
            id: 'passed', header: 'Result',
            cell: (r: ApiValidationReport) => (
              <StatusIndicator type={r.passed ? 'success' : 'error'}>
                {r.passed ? 'Passed' : 'Failed'}
              </StatusIndicator>
            ),
          },
          {
            id: 'llm_score', header: 'LLM score',
            cell: (r: ApiValidationReport) => r.llm_score != null ? `${r.llm_score}/100` : '—',
          },
          {
            id: 'llm_valid', header: 'LLM verdict',
            cell: (r: ApiValidationReport) => r.llm_valid != null
              ? <StatusIndicator type={r.llm_valid ? 'success' : 'error'}>{r.llm_valid ? 'Valid' : 'Invalid'}</StatusIndicator>
              : '—',
          },
          { id: 'llm_provider', header: 'Provider', cell: (r: ApiValidationReport) => r.llm_provider ?? '—' },
          {
            id: 'created_at', header: 'Validated',
            cell: (r: ApiValidationReport) => new Date(r.created_at).toLocaleDateString(),
          },
        ]}
        items={reports}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No validation reports. Run a scraper with validation to populate.
          </Box>
        }
        variant="full-page"
        stickyHeader
      />
    </PageLayout>
  );
}
