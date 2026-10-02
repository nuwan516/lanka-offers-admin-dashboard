import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Table from '@cloudscape-design/components/table';
import Select from '@cloudscape-design/components/select';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import { api, type ApiOffer } from '../services/api';
import { useApi } from '../services/use-api';

export default function StagingPage() {
  const navigate = useNavigate();
  const [bankFilter, setBankFilter] = useState<any>({ label: 'All banks', value: '' });

  const { data, loading, error, refetch } = useApi(
    () => api.offers({
      bank: bankFilter.value || undefined,
      status: 'REVIEW_REQUIRED',
      limit: 100,
    }),
    [bankFilter.value]
  );

  const offers = data?.items ?? [];

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Offers awaiting review before approval/publish"
        counter={loading ? undefined : `(${offers.length})`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={refetch}>Refresh</Button>
            <Button onClick={() => navigate('/offers')}>All offers</Button>
          </SpaceBetween>
        }
      >
        Staging
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}

      <Select
        selectedOption={bankFilter}
        onChange={e => setBankFilter(e.detail.selectedOption)}
        options={[
          { label: 'All banks', value: '' },
          ...['hnb','boc','sampath','ndb','dfcc','seylan','peoples','pabc','nsb','combank']
            .map(b => ({ label: b.toUpperCase(), value: b })),
        ]}
        placeholder="Filter by bank"
      />

      <Table
        loading={loading}
        loadingText="Loading staged offers"
        columnDefinitions={[
          {
            id: 'bank', header: 'Bank', width: 90,
            cell: (o: ApiOffer) => <Box fontWeight="bold">{o.bank.toUpperCase()}</Box>,
          },
          {
            id: 'title', header: 'Title',
            cell: (o: ApiOffer) => (
              <Button variant="link" onClick={() => navigate(`/offers/${o.id}/review`)}>
                {o.title}
              </Button>
            ),
          },
          { id: 'merchant', header: 'Merchant', cell: (o: ApiOffer) => o.merchant_name ?? '—' },
          { id: 'category', header: 'Category', cell: (o: ApiOffer) => o.category ?? '—' },
          {
            id: 'rule_passed', header: 'Rule validation',
            cell: (o: ApiOffer) => (
              <StatusIndicator type={o.rule_passed ? 'success' : 'error'}>
                {o.rule_passed ? 'Passed' : `${o.rule_errors?.length ?? 1} error(s)`}
              </StatusIndicator>
            ),
          },
          {
            id: 'llm_score', header: 'LLM score',
            cell: (o: ApiOffer) => o.llm_score != null ? `${o.llm_score}/100` : '—',
          },
          {
            id: 'db_status', header: 'Status',
            cell: (o: ApiOffer) => <StatusIndicator type="warning">{o.db_status}</StatusIndicator>,
          },
          {
            id: 'updated_at', header: 'Updated',
            cell: (o: ApiOffer) => new Date(o.updated_at).toLocaleDateString(),
          },
        ]}
        items={offers}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No offers awaiting review.
          </Box>
        }
        header={<Header variant="h2" counter={`(${offers.length})`}>Staged offers</Header>}
        variant="full-page"
        stickyHeader
      />
    </SpaceBetween>
  );
}
