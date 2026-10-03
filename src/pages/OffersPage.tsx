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
import Badge from '@cloudscape-design/components/badge';
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
            id: 'bank', header: 'Bank', minWidth: 90,
            cell: (o: ApiOffer) => <Box fontWeight="bold">{o.bank.toUpperCase()}</Box>,
          },
          {
            id: 'title', header: 'Title', minWidth: 200,
            cell: (o: ApiOffer) => (
              <Button variant="link" onClick={() => navigate(`/offers/${o.id}/review`)}>
                {o.title}
              </Button>
            ),
          },
          { id: 'merchant', header: 'Merchant', minWidth: 150, cell: (o: ApiOffer) => o.merchant_name ?? '—' },
          { id: 'category', header: 'Category', minWidth: 120, cell: (o: ApiOffer) => o.category ?? '—' },
          { id: 'discount', header: 'Discount', minWidth: 80, cell: (o: ApiOffer) => o.discount_percentage ?? '—' },
          {
            id: 'valid_to', header: 'Expires', minWidth: 110,
            cell: (o: ApiOffer) => o.valid_to ? new Date(o.valid_to).toLocaleDateString() : '—',
          },
          {
            id: 'llm_score', header: 'LLM score', minWidth: 90,
            cell: (o: ApiOffer) => o.llm_score != null ? `${o.llm_score}/100` : '—',
          },
          {
            id: 'rule_passed', header: 'Validation', minWidth: 120,
            cell: (o: ApiOffer) => (
              <StatusIndicator type={o.rule_passed ? 'success' : 'error'}>
                {o.rule_passed ? 'Passed' : `${o.rule_errors?.length ?? 1} error(s)`}
              </StatusIndicator>
            ),
          },
          {
            id: 'db_status', header: 'Status', minWidth: 120,
            cell: (o: ApiOffer) => {
              const statusType = STATUS_TYPE[o.db_status] ?? 'info';
              const badgeColor = statusType === 'success' ? 'green' : statusType === 'warning' ? 'blue' : statusType === 'error' ? 'red' : 'grey';
              return (
                <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                  <StatusIndicator type={statusType}>{o.db_status}</StatusIndicator>
                  <Badge color={badgeColor}>{o.db_status}</Badge>
                </SpaceBetween>
              );
            },
          },
          {
            id: 'updated_at', header: 'Updated', minWidth: 110,
            cell: (o: ApiOffer) => new Date(o.updated_at).toLocaleDateString(),
          },
        ]}
        items={offers}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            {loading ? (
              <Spinner />
            ) : error ? (
              <Box>
                <Box variant="p" color="text-status-error">
                  API unavailable
                </Box>
                <Box variant="small" color="text-body-secondary" padding={{ top: 'xs' }}>
                  Cannot reach the backend API. Ensure the API server is running.
                </Box>
              </Box>
            ) : (
              <Box>
                <Box variant="p">No offers found</Box>
                <Box variant="small" color="text-body-secondary" padding={{ top: 'xs' }}>
                  Run a scraper to import data from banks
                </Box>
                <Box padding={{ top: 's' }}>
                  <Button variant="primary" onClick={() => navigate('/run-scraper')}>
                    Run scraper
                  </Button>
                </Box>
              </Box>
            )}
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
