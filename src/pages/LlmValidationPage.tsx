import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Button from '@cloudscape-design/components/button';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Alert from '@cloudscape-design/components/alert';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import { useNavigate } from 'react-router-dom';
import { api, type ApiValidationReport } from '../services/api';
import { useApi } from '../services/use-api';

export default function LlmValidationPage() {
  const navigate = useNavigate();
  const { data: stats, loading: statsLoading, error } = useApi(() => api.stats(), []);
  const { data: scored, loading: scoredLoading } = useApi(
    () => api.validation({ limit: 100 }), []
  );

  const reports = (scored?.items ?? []).filter(r => r.llm_score != null);
  const total = reports.length;
  const avgScore = total > 0
    ? Math.round(reports.reduce((s, r) => s + (r.llm_score ?? 0), 0) / total)
    : null;
  const highConf = reports.filter(r => (r.llm_score ?? 0) >= 80).length;
  const lowConf = reports.filter(r => (r.llm_score ?? 0) < 60).length;
  const invalid = reports.filter(r => r.llm_valid === false).length;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="LLM-based offer quality scoring — results from Neon Postgres"
        actions={<Button onClick={() => navigate('/validation')}>Rule validation</Button>}
      >
        LLM Validation
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}

      <Container header={<Header variant="h2">Summary</Header>}>
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Offers scored</Box>
            {statsLoading ? <Spinner /> : <Box variant="awsui-value-large">{stats?.offers.llm_scored ?? '0'}</Box>}
          </div>
          <div>
            <Box variant="awsui-key-label">Avg LLM score</Box>
            {statsLoading ? <Spinner /> : <Box variant="awsui-value-large">{avgScore != null ? `${avgScore}/100` : '—'}</Box>}
          </div>
          <div>
            <Box variant="awsui-key-label">High confidence (&ge;80)</Box>
            {scoredLoading ? <Spinner /> : (
              <StatusIndicator type="success">{highConf}</StatusIndicator>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">Low confidence (&lt;60)</Box>
            {scoredLoading ? <Spinner /> : (
              <StatusIndicator type={lowConf > 0 ? 'warning' : 'success'}>{lowConf}</StatusIndicator>
            )}
          </div>
        </ColumnLayout>
      </Container>

      <Container header={<Header variant="h2">Validation status</Header>}>
        <ColumnLayout columns={3} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">LLM valid</Box>
            {statsLoading ? <Spinner /> : (
              <StatusIndicator type="success">{stats?.offers.llm_valid ?? '0'}</StatusIndicator>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">LLM invalid</Box>
            {scoredLoading ? <Spinner /> : (
              <StatusIndicator type={invalid > 0 ? 'error' : 'success'}>{invalid}</StatusIndicator>
            )}
          </div>
          <div>
            <Box variant="awsui-key-label">Not scored</Box>
            {statsLoading ? <Spinner /> : (
              <Box>{
                Math.max(0, parseInt(stats?.offers.total_offers ?? '0') - parseInt(stats?.offers.llm_scored ?? '0'))
              }</Box>
            )}
          </div>
        </ColumnLayout>
      </Container>

      <Table
        loading={scoredLoading}
        loadingText="Loading LLM reports"
        header={<Header variant="h2" counter={`(${reports.length})`}>LLM scored offers</Header>}
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
            id: 'score', header: 'Score',
            cell: (r: ApiValidationReport) => {
              const s = r.llm_score ?? 0;
              const type = s >= 80 ? 'success' : s >= 60 ? 'warning' : 'error';
              return <StatusIndicator type={type}>{r.llm_score}/100</StatusIndicator>;
            },
          },
          {
            id: 'verdict', header: 'Verdict',
            cell: (r: ApiValidationReport) => r.llm_valid != null
              ? <StatusIndicator type={r.llm_valid ? 'success' : 'error'}>{r.llm_valid ? 'Valid' : 'Invalid'}</StatusIndicator>
              : '—',
          },
          { id: 'provider', header: 'Provider', cell: (r: ApiValidationReport) => r.llm_provider ?? '—' },
          { id: 'model', header: 'Model', cell: (r: ApiValidationReport) => r.llm_model ?? '—' },
          {
            id: 'created_at', header: 'Validated',
            cell: (r: ApiValidationReport) => new Date(r.created_at).toLocaleDateString(),
          },
        ]}
        items={reports}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No LLM validation results. Run scraper with <code>--llm</code> flag to enable LLM scoring.
          </Box>
        }
        variant="full-page"
        stickyHeader
      />
    </SpaceBetween>
  );
}
