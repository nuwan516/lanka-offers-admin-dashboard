import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import Button from '@cloudscape-design/components/button';
import { api, type ApiCostControlService } from '../services/api';
import { useApi } from '../services/use-api';
import PageLayout from '../components/PageLayout';

const STATE_TO_INDICATOR: Record<ApiCostControlService['state'], 'success' | 'warning' | 'error'> = {
  ALLOW: 'success',
  WARN: 'warning',
  BLOCK: 'error',
};

const SERVICE_LABELS: Record<string, string> = {
  gemini_llm: 'Gemini (LLM validation)',
  deepseek_llm: 'DeepSeek (paid fallback)',
  google_geocoding: 'Google Geocoding API',
  google_places: 'Google Places API',
};

export default function CostControlPage() {
  const { data, loading, error, refetch } = useApi(() => api.costControlStatus(), []);

  return (
    <PageLayout
      title="Cost Control"
      description="Zero-cost control layer — quota usage, LLM provider policy, and kill switches"
      breadcrumbs={[{ text: 'Cost control', href: '/cost-control' }]}
      error={error}
      actions={<Button onClick={refetch} iconName="refresh">Refresh</Button>}
    >

      <Container header={<Header variant="h2">Provider policy</Header>}>
        {loading ? <Spinner /> : (
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">LLM mode</Box>
              <Box variant="awsui-value-large">{data?.policy.llmMode ?? '—'}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Primary provider</Box>
              <Box variant="awsui-value-large">{data?.policy.llmPrimaryProvider ?? '—'}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Paid LLM fallback enabled</Box>
              <StatusIndicator type={data?.policy.allowPaidLlmFallback ? 'warning' : 'success'}>
                {data?.policy.allowPaidLlmFallback ? `YES (${data.policy.llmFallbackProvider})` : 'NO'}
              </StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">LLM validation enabled</Box>
              <StatusIndicator type={data?.policy.llmValidationEnabled ? 'success' : 'stopped'}>
                {data?.policy.llmValidationEnabled ? 'ON' : 'OFF (kill switch)'}
              </StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Geo provider calls</Box>
              <StatusIndicator type={data?.policy.geoProviderCallsEnabled ? 'success' : 'stopped'}>
                {data?.policy.geoProviderCallsEnabled ? 'ON' : 'OFF (kill switch)'}
              </StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Places enrichment</Box>
              <StatusIndicator type={data?.policy.placesEnrichmentEnabled ? 'success' : 'stopped'}>
                {data?.policy.placesEnrichmentEnabled ? 'ON' : 'OFF (kill switch)'}
              </StatusIndicator>
            </div>
          </ColumnLayout>
        )}
      </Container>

      <Table
        header={
          <Header variant="h2" description={`Current billing period: ${data?.periodKey ?? '—'}`}>
            External API usage
          </Header>
        }
        loading={loading}
        columnDefinitions={[
          {
            id: 'service', header: 'Service',
            cell: (s: ApiCostControlService) => SERVICE_LABELS[s.service] ?? s.service,
          },
          {
            id: 'used', header: 'Used / limit',
            cell: (s: ApiCostControlService) => `${s.used} / ${s.limit}`,
          },
          {
            id: 'percentage', header: '% of budget',
            cell: (s: ApiCostControlService) => `${s.percentage}%`,
          },
          {
            id: 'state', header: 'State',
            cell: (s: ApiCostControlService) => (
              <StatusIndicator type={STATE_TO_INDICATOR[s.state]}>{s.state}</StatusIndicator>
            ),
          },
          {
            id: 'reason', header: 'Reason',
            cell: (s: ApiCostControlService) => <Box color="text-body-secondary">{s.reason}</Box>,
          },
        ]}
        items={data?.services ?? []}
        variant="embedded"
      />
    </PageLayout>
  );
}
