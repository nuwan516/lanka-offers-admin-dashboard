import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Table from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Alert from '@cloudscape-design/components/alert';
import Button from '@cloudscape-design/components/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ApiOffer } from '../services/api';
import { useApi } from '../services/use-api';

interface MerchantRow {
  name: string;
  bank: string;
  offers: number;
  passed: number;
  avgLlm: number | null;
  lastUpdated: string;
}

function groupByMerchant(offers: ApiOffer[]): MerchantRow[] {
  const map = new Map<string, ApiOffer[]>();
  for (const o of offers) {
    const key = (o.merchant_name ?? 'Unknown').toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(o);
  }
  const rows: MerchantRow[] = [];
  for (const [, group] of map) {
    const scores = group.filter(o => o.llm_score != null).map(o => o.llm_score!);
    rows.push({
      name: group[0].merchant_name ?? 'Unknown',
      bank: group[0].bank.toUpperCase(),
      offers: group.length,
      passed: group.filter(o => o.rule_passed).length,
      avgLlm: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      lastUpdated: group.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0].updated_at,
    });
  }
  return rows.sort((a, b) => b.offers - a.offers);
}

export default function MerchantsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useApi(() => api.offers({ limit: 500 }), []);

  const allOffers = data?.items ?? [];
  const merchants = groupByMerchant(allOffers)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Merchant aggregation from offer data in Neon Postgres"
        counter={loading ? undefined : `(${merchants.length})`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={refetch}>Refresh</Button>
            <Button onClick={() => navigate('/offers')}>All offers</Button>
          </SpaceBetween>
        }
      >
        Merchants
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}

      <TextFilter
        filteringText={search}
        filteringPlaceholder="Filter merchants"
        onChange={e => setSearch(e.detail.filteringText)}
      />

      <Table
        loading={loading}
        loadingText="Loading merchants"
        columnDefinitions={[
          { id: 'name', header: 'Merchant', cell: (m: MerchantRow) => m.name },
          { id: 'bank', header: 'Bank', cell: (m: MerchantRow) => m.bank },
          { id: 'offers', header: 'Offers', cell: (m: MerchantRow) => m.offers },
          {
            id: 'passed', header: 'Rule pass rate',
            cell: (m: MerchantRow) => {
              const rate = Math.round((m.passed / m.offers) * 100);
              return <StatusIndicator type={rate === 100 ? 'success' : rate >= 80 ? 'warning' : 'error'}>{rate}%</StatusIndicator>;
            },
          },
          {
            id: 'avgLlm', header: 'Avg LLM score',
            cell: (m: MerchantRow) => m.avgLlm != null ? `${m.avgLlm}/100` : '—',
          },
          {
            id: 'lastUpdated', header: 'Last updated',
            cell: (m: MerchantRow) => new Date(m.lastUpdated).toLocaleDateString(),
          },
        ]}
        items={merchants}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No merchant data. Run a scraper to populate offers.
          </Box>
        }
        header={<Header variant="h2" counter={`(${merchants.length})`}>Merchant list</Header>}
        variant="full-page"
        stickyHeader
      />
    </SpaceBetween>
  );
}
