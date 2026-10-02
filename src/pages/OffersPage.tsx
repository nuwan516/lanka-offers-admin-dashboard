import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Alert from '@cloudscape-design/components/alert';
import Spinner from '@cloudscape-design/components/spinner';
import { api, type ApiOffer } from '../services/api';
import { useApi } from '../services/use-api';

const PAGE_SIZE = 15;

const STATUS_TYPE: Record<string, 'success' | 'warning' | 'error' | 'stopped' | 'info' | 'pending'> = {
  DISCOVERED: 'pending', VALIDATED: 'pending', REVIEW_REQUIRED: 'warning',
  APPROVED: 'info', REJECTED: 'error', PUBLISHED: 'success', EXPIRED: 'stopped', DISABLED: 'stopped',
};

const BANKS = ['HNB', 'BOC', 'SAMPATH', 'NDB', 'DFCC', 'SEYLAN', 'PEOPLES', 'PABC', 'NSB', 'COMBANK'];

export default function OffersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBank = searchParams.get('bank') ?? '';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [bankFilter, setBankFilter] = useState<any>(
    initialBank
      ? { label: initialBank.toUpperCase(), value: initialBank }
      : { label: 'All banks', value: '' }
  );
  const [statusFilter, setStatusFilter] = useState<any>({ label: 'All statuses', value: '' });

  const { data, loading, error, refetch } = useApi(
    () => api.offers({
      bank: bankFilter.value || undefined,
      status: statusFilter.value || undefined,
      search: search || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [page, search, bankFilter.value, statusFilter.value]
  );

  const offers = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="All scraped offers from Neon Postgres"
        counter={loading ? undefined : `(${total})`}
        actions={<Button onClick={refetch}>Refresh</Button>}
      >
        Offers
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}

      <SpaceBetween direction="horizontal" size="s">
        <TextFilter
          filteringText={search}
          filteringPlaceholder="Search title or merchant"
          countText={loading ? undefined : `${total} matches`}
          onChange={e => { setSearch(e.detail.filteringText); setPage(1); }}
        />
        <Select
          selectedOption={bankFilter}
          onChange={e => { setBankFilter(e.detail.selectedOption); setPage(1); }}
          options={[{ label: 'All banks', value: '' }, ...BANKS.map(b => ({ label: b, value: b.toLowerCase() }))]}
          placeholder="Bank"
        />
        <Select
          selectedOption={statusFilter}
          onChange={e => { setStatusFilter(e.detail.selectedOption); setPage(1); }}
          options={[
            { label: 'All statuses', value: '' },
            { label: 'Discovered', value: 'DISCOVERED' },
            { label: 'Review required', value: 'REVIEW_REQUIRED' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Published', value: 'PUBLISHED' },
            { label: 'Expired', value: 'EXPIRED' },
            { label: 'Disabled', value: 'DISABLED' },
          ]}
          placeholder="Status"
        />
      </SpaceBetween>

      <Table
        loading={loading}
        loadingText="Loading offers"
        columnDefinitions={[
          {
            id: 'bank', header: 'Bank', width: 80,
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
          { id: 'discount', header: 'Discount', cell: (o: ApiOffer) => o.discount_percentage ?? '—' },
          {
            id: 'valid_to', header: 'Expires',
            cell: (o: ApiOffer) => o.valid_to ? new Date(o.valid_to).toLocaleDateString() : '—',
          },
          {
            id: 'llm_score', header: 'LLM score',
            cell: (o: ApiOffer) => o.llm_score != null ? `${o.llm_score}/100` : '—',
          },
          {
            id: 'rule_passed', header: 'Validation',
            cell: (o: ApiOffer) => (
              <StatusIndicator type={o.rule_passed ? 'success' : 'error'}>
                {o.rule_passed ? 'Passed' : `${o.rule_errors?.length ?? 1} error(s)`}
              </StatusIndicator>
            ),
          },
          {
            id: 'db_status', header: 'Status',
            cell: (o: ApiOffer) => (
              <StatusIndicator type={STATUS_TYPE[o.db_status] ?? 'info'}>{o.db_status}</StatusIndicator>
            ),
          },
          {
            id: 'updated_at', header: 'Updated',
            cell: (o: ApiOffer) => new Date(o.updated_at).toLocaleDateString(),
          },
        ]}
        items={offers}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            {loading ? <Spinner /> : error ? 'API unavailable' : 'No offers found. Run a scraper to import data.'}
          </Box>
        }
        header={<Header variant="h2" counter={`(${total})`}>Offer list</Header>}
        pagination={
          <Pagination
            currentPageIndex={page}
            pagesCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            onChange={e => setPage(e.detail.currentPageIndex)}
          />
        }
        variant="full-page"
        stickyHeader
      />
    </SpaceBetween>
  );
}
