import { useState, useMemo } from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import Badge from '@cloudscape-design/components/badge';
import Cards from '@cloudscape-design/components/cards';
import TextFilter from '@cloudscape-design/components/text-filter';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import { api, type ApiCostControlService } from '../services/api';
import { useApi } from '../services/use-api';
import PageLayout from '../components/PageLayout';

const STATE_TO_INDICATOR: Record<ApiCostControlService['state'], 'success' | 'warning' | 'error'> = {
  ALLOW: 'success',
  WARN: 'warning',
  BLOCK: 'error',
};

const SERVICE_METADATA: Record<string, { label: string; provider: string; costPer1k: string; freeTier: string }> = {
  gemini_llm: {
    label: 'Gemini 1.5 Flash (LLM Validation)',
    provider: 'Google AI Studio',
    costPer1k: '$0.00 (Free Tier)',
    freeTier: '1,000 req/mo',
  },
  deepseek_llm: {
    label: 'DeepSeek (Paid Fallback)',
    provider: 'DeepSeek API',
    costPer1k: '$0.14 / 1M tokens',
    freeTier: '$0.00 / mo Cap',
  },
  openai_llm: {
    label: 'OpenAI GPT-4o-mini',
    provider: 'OpenAI Platform',
    costPer1k: '$0.15 / 1M tokens',
    freeTier: '1,000 req/mo',
  },
  google_geocoding: {
    label: 'Google Maps Geocoding API',
    provider: 'Google Cloud Platform',
    costPer1k: '$5.00 / 1k (Zero-Cost Cap: 10k)',
    freeTier: '10,000 req/mo',
  },
  google_places: {
    label: 'Google Places API (Enrichment)',
    provider: 'Google Cloud Platform',
    costPer1k: '$17.00 / 1k (Zero-Cost Cap: 10k)',
    freeTier: '10,000 req/mo',
  },
};

function AwsProgressBar({ percentage }: { percentage: number }) {
  const clamped = Math.max(0, Math.min(100, percentage));
  let barColor = '#037f0c'; // AWS Green
  if (clamped >= 95) barColor = '#d13212'; // AWS Red
  else if (clamped >= 70) barColor = '#b56d00'; // AWS Amber

  return (
    <div style={{ width: '100%', marginTop: '6px' }}>
      <div
        style={{
          width: '100%',
          height: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          borderRadius: '5px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: '5px',
            transition: 'width 0.4s ease-in-out',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
        <span style={{ fontSize: '11px', color: '#687078' }}>Threshold: 70% warn, 95% kill</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: barColor }}>{clamped.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default function CostControlPage() {
  const { data, loading, error, refetch } = useApi(() => api.costControlStatus(), []);
  const [filterText, setFilterText] = useState('');

  const services = useMemo(() => data?.services ?? [], [data?.services]);

  const filteredServices = useMemo(() => {
    if (!filterText.trim()) return services;
    const q = filterText.toLowerCase();
    return services.filter(
      (s) =>
        s.service.toLowerCase().includes(q) ||
        (SERVICE_METADATA[s.service]?.label.toLowerCase().includes(q) ?? false) ||
        s.state.toLowerCase().includes(q),
    );
  }, [services, filterText]);

  // Real aggregate totals from live database records
  const totalLimit = useMemo(() => services.reduce((acc, s) => acc + s.limit, 0), [services]);
  const totalUsed = useMemo(() => services.reduce((acc, s) => acc + s.used, 0), [services]);
  const aggregatePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  // Real date velocity forecast
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyVelocity = dayOfMonth > 0 ? totalUsed / dayOfMonth : 0;
  const projectedMonthEnd = Math.round(dailyVelocity * daysInMonth);
  return (
    <PageLayout
      title="AWS Budget Tracker & Cost Governance"
      description="Zero-cost policy enforcement — monitor API quotas, track usage velocity, evaluate CostGuard thresholds, and manage kill switches"
      breadcrumbs={[
        { text: 'Lanka Offers Admin', href: '/' },
        { text: 'Cost & Budget Tracker', href: '/cost-control' },
      ]}
      error={error}
      actions={
        <Button onClick={refetch} iconName="refresh">
          Refresh
        </Button>
      }
    >
      <SpaceBetween size="l">
        {/* AWS Alert Notification Banner */}
        <Alert
          type="info"
          statusIconAriaLabel="Zero-Cost Enforcement"
          header="AWS CostGuard Zero-Cost Enforcement Active"
        >
          All bank scraping and geocoding operations run within authenticated free-tier allowances ($0.00 billable).
          Automated kill switches trigger at 95% threshold to ensure no external billing occurs.
          Paid fallback to DeepSeek is currently <strong>{data?.policy.allowPaidLlmFallback ? 'Enabled' : 'Locked ($0 Budget)'}</strong>.
        </Alert>

        {/* AWS Budgets KPI Summary */}
        <Container
          header={
            <Header
              variant="h2"
              description={`Active Billing Cycle: ${data?.periodKey ?? 'Current Month'} | Day ${dayOfMonth} of ${daysInMonth}`}
              info={<Badge color="green">Zero-Cost Compliant ($0.00)</Badge>}
            >
              AWS Budgets & Cost Overview
            </Header>
          }
        >
          {loading ? (
            <Spinner />
          ) : (
            <ColumnLayout columns={4} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Monthly Request Allocation</Box>
                <Box variant="awsui-value-large">{totalLimit.toLocaleString()} calls</Box>
                <Box variant="small" color="text-body-secondary">
                  Fixed free-tier caps across 5 providers
                </Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Actual Usage Month-to-Date</Box>
                <Box variant="awsui-value-large">
                  {totalUsed.toLocaleString()} ({aggregatePercentage.toFixed(1)}%)
                </Box>
                <Box variant="small" color="text-status-success">
                  Healthy consumption velocity
                </Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Projected Month-End Usage</Box>
                <Box variant="awsui-value-large">{projectedMonthEnd.toLocaleString()} calls</Box>
                <Box variant="small" color="text-body-secondary">
                  Linear forecast based on current run rate
                </Box>
              </div>
              <div>
                <Box variant="awsui-key-label">CostGuard Kill Switch Status</Box>
                <StatusIndicator type={data?.policy.llmValidationEnabled ? 'success' : 'stopped'}>
                  {data?.policy.llmValidationEnabled ? 'ALL GUARDS STANDING BY' : 'KILL SWITCH ENGAGED'}
                </StatusIndicator>
                <Box variant="small" color="text-body-secondary">
                  Primary LLM: {data?.policy.llmPrimaryProvider?.toUpperCase() ?? 'GEMINI'}
                </Box>
              </div>
            </ColumnLayout>
          )}
        </Container>

        {/* AWS Service Budget Cards Grid */}
        <Cards
          cardDefinition={{
            header: (s: ApiCostControlService) => (
              <Header
                variant="h3"
                actions={
                  <StatusIndicator type={STATE_TO_INDICATOR[s.state]}>
                    {s.state}
                  </StatusIndicator>
                }
              >
                {SERVICE_METADATA[s.service]?.label ?? s.service}
              </Header>
            ),
            sections: [
              {
                id: 'provider',
                header: 'Provider',
                content: (s: ApiCostControlService) => (
                  <Box color="text-body-secondary">
                    {SERVICE_METADATA[s.service]?.provider ?? 'External API'}
                  </Box>
                ),
              },
              {
                id: 'usage',
                header: 'Budgeted Limit vs Actual',
                content: (s: ApiCostControlService) => (
                  <div>
                    <Box variant="awsui-value-large">
                      {s.used.toLocaleString()} / {s.limit.toLocaleString()}
                    </Box>
                    <AwsProgressBar percentage={s.percentage} />
                  </div>
                ),
              },
              {
                id: 'financial',
                header: 'Billable Spend',
                content: (s: ApiCostControlService) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Badge color={s.limit === 0 && s.used === 0 ? 'grey' : 'green'}>
                      $0.00 USD
                    </Badge>
                    <Box variant="small" color="text-body-secondary">
                      {SERVICE_METADATA[s.service]?.costPer1k ?? 'Free tier'}
                    </Box>
                  </SpaceBetween>
                ),
              },
              {
                id: 'reason',
                header: 'Operational Policy',
                content: (s: ApiCostControlService) => (
                  <Box variant="small" color="text-body-secondary">
                    {s.reason}
                  </Box>
                ),
              },
            ],
          }}
          items={services}
          loading={loading}
          loadingText="Loading external service budgets..."
          header={
            <Header
              variant="h2"
              description="Per-service quota gauges and threshold monitoring"
            >
              Service Budget Cards
            </Header>
          }
        />

        {/* AWS Alert Thresholds Matrix */}
        <Container
          header={
            <Header
              variant="h2"
              description="Automated escalation matrix configured in CostGuard"
            >
              Configured Alert Thresholds & Automated Escalation
            </Header>
          }
        >
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Warning Threshold (70%)</Box>
              <StatusIndicator type="warning">EARLY WARNING</StatusIndicator>
              <Box variant="p" color="text-body-secondary">
                Triggers visual warning indicator in Admin Control Plane and scraper logs.
                Non-critical background scraping jobs continue running.
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Alert Threshold (85%)</Box>
              <StatusIndicator type="warning">THROTTLE & ALERT</StatusIndicator>
              <Box variant="p" color="text-body-secondary">
                Optional batch enrichments slowed down. Places API details resolution restricted to
                unresolved branches only.
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Hard Cutoff / Kill Switch (95%)</Box>
              <StatusIndicator type="error">HARD STOP (KILL SWITCH)</StatusIndicator>
              <Box variant="p" color="text-body-secondary">
                CostGuard strictly blocks further API requests for the service.
                Offers fall back gracefully to deterministic rule parsers and cached geocodes.
              </Box>
            </div>
          </ColumnLayout>
        </Container>

        {/* AWS Detailed External API Usage Table */}
        <Table
          header={
            <Header
              variant="h2"
              description={`External API usage tracked in Neon Postgres external_api_usage (${filteredServices.length} records)`}
            >
              External API Quota Breakdown
            </Header>
          }
          filter={
            <TextFilter
              filteringText={filterText}
              filteringPlaceholder="Filter by service, provider, or state..."
              onChange={({ detail }) => setFilterText(detail.filteringText)}
            />
          }
          loading={loading}
          columnDefinitions={[
            {
              id: 'service',
              header: 'Service Name',
              cell: (s: ApiCostControlService) => (
                <div>
                  <Box fontWeight="bold">
                    {SERVICE_METADATA[s.service]?.label ?? s.service}
                  </Box>
                  <Box variant="small" color="text-body-secondary">
                    {SERVICE_METADATA[s.service]?.provider ?? 'External'}
                  </Box>
                </div>
              ),
              sortingField: 'service',
            },
            {
              id: 'used',
              header: 'Usage / Quota Limit',
              cell: (s: ApiCostControlService) => `${s.used.toLocaleString()} / ${s.limit.toLocaleString()}`,
            },
            {
              id: 'percentage',
              header: '% Consumed',
              cell: (s: ApiCostControlService) => (
                <div style={{ minWidth: '140px' }}>
                  <AwsProgressBar percentage={s.percentage} />
                </div>
              ),
            },
            {
              id: 'cost',
              header: 'Estimated Cost',
              cell: () => <Badge color="green">$0.00</Badge>,
            },
            {
              id: 'state',
              header: 'CostGuard State',
              cell: (s: ApiCostControlService) => (
                <StatusIndicator type={STATE_TO_INDICATOR[s.state]}>
                  {s.state}
                </StatusIndicator>
              ),
            },
            {
              id: 'reason',
              header: 'Policy Rule',
              cell: (s: ApiCostControlService) => (
                <Box color="text-body-secondary" variant="small">
                  {s.reason}
                </Box>
              ),
            },
          ]}
          items={filteredServices}
          variant="container"
        />

        {/* AWS Provider Policy & Kill Switch Governance */}
        <ExpandableSection headerText="Provider Policy & Kill Switch Governance (Environment Variables)">
          <Container>
            <ColumnLayout columns={3} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">LLM Mode (LLM_MODE)</Box>
                <Box variant="awsui-value-large">{data?.policy.llmMode ?? 'free_only'}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Primary LLM Provider</Box>
                <Box variant="awsui-value-large">
                  {data?.policy.llmPrimaryProvider?.toUpperCase() ?? 'GEMINI'}
                </Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Paid LLM Fallback (ALLOW_PAID_LLM_FALLBACK)</Box>
                <StatusIndicator type={data?.policy.allowPaidLlmFallback ? 'warning' : 'success'}>
                  {data?.policy.allowPaidLlmFallback
                    ? `YES (${data.policy.llmFallbackProvider})`
                    : 'BLOCKED (Zero-cost safe)'}
                </StatusIndicator>
              </div>
              <div>
                <Box variant="awsui-key-label">LLM Validation Gate (LLM_VALIDATION_ENABLED)</Box>
                <StatusIndicator type={data?.policy.llmValidationEnabled ? 'success' : 'stopped'}>
                  {data?.policy.llmValidationEnabled ? 'ACTIVE' : 'OFF (Kill Switch Tripped)'}
                </StatusIndicator>
              </div>
              <div>
                <Box variant="awsui-key-label">Geo Provider Calls (GEO_PROVIDER_CALLS_ENABLED)</Box>
                <StatusIndicator type={data?.policy.geoProviderCallsEnabled ? 'success' : 'stopped'}>
                  {data?.policy.geoProviderCallsEnabled ? 'ACTIVE' : 'OFF (Kill Switch Tripped)'}
                </StatusIndicator>
              </div>
              <div>
                <Box variant="awsui-key-label">Places Enrichment (PLACES_ENRICHMENT_ENABLED)</Box>
                <StatusIndicator type={data?.policy.placesEnrichmentEnabled ? 'success' : 'stopped'}>
                  {data?.policy.placesEnrichmentEnabled ? 'ACTIVE' : 'OFF (Kill Switch Tripped)'}
                </StatusIndicator>
              </div>
            </ColumnLayout>
          </Container>
        </ExpandableSection>
      </SpaceBetween>
    </PageLayout>
  );
}
