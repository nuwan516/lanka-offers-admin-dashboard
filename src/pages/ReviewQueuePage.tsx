import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Alert from '@cloudscape-design/components/alert';
import Select from '@cloudscape-design/components/select';
import { api, type ApiOffer } from '../services/api';
import { useApi } from '../services/use-api';

const PAGE_SIZE = 15;

// Client-side filter over the fetched admin-scope batch — small dataset,
// avoids adding a bespoke query-param combination per filter.
type ViewFilter = 'all' | 'new' | 'changed' | 'low_confidence' | 'validation_failed' | 'geo_issues' | 'approved' | 'rejected' | 'published';

const VIEWS: Array<{ label: string; value: ViewFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Changed (awaiting review)', value: 'changed' },
  { label: 'Low confidence', value: 'low_confidence' },
  { label: 'Validation failed', value: 'validation_failed' },
  { label: 'Geo issues', value: 'geo_issues' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Published', value: 'published' },
];

const STATUS_TYPE: Record<string, 'success' | 'warning' | 'error' | 'stopped' | 'info' | 'pending'> = {
  DISCOVERED: 'pending', VALIDATED: 'pending', REVIEW_REQUIRED: 'warning',
  APPROVED: 'info', REJECTED: 'error', PUBLISHED: 'success', EXPIRED: 'stopped', DISABLED: 'stopped',
};

function matchesView(o: ApiOffer, view: ViewFilter): boolean {
  switch (view) {
    case 'all': return true;
    case 'new': return o.change_status === 'NEW';
    case 'changed': return Boolean(o.has_pending_candidate) || o.change_status === 'CHANGED';
    case 'low_confidence': return o.llm_score != null && o.llm_score < 70;
    case 'validation_failed': return !o.rule_passed;
    case 'geo_issues': return o.geo_status === 'unresolved' || o.geo_status === 'quota_blocked';
    case 'approved': return o.db_status === 'APPROVED';
    case 'rejected': return o.db_status === 'REJECTED';
    case 'published': return o.db_status === 'PUBLISHED';
    default: return true;
  }
}

export default function ReviewQueuePage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<{ label: string; value: ViewFilter }>({ label: 'Changed (awaiting review)', value: 'changed' });

  const { data, loading, error, refetch } = useApi(
    () => api.offers({ search: search || undefined, limit: 300, offset: 0 }),
    [search]
  );

  const allOffers = data?.items ?? [];
  const filtered = allOffers.filter(o => matchesView(o, view.value));

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = filtered.length;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Offers awaiting review, correction, or approval — from Neon Postgres"
        counter={loading ? undefined : `(${total})`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={refetch}>Refresh</Button>
            <Button variant="primary" onClick={() => navigate('/offers')}>All offers</Button>
          </SpaceBetween>
        }
      >
        Review queue
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}

      <SpaceBetween direction="horizontal" size="s">
        <TextFilter
          filteringText={search}
          filteringPlaceholder="Search title or merchant"
          onChange={e => { setSearch(e.detail.filteringText); setPage(1); }}
        />
        <Select
          selectedOption={view}
          onChange={e => { setView(e.detail.selectedOption as typeof view); setPage(1); }}
          options={VIEWS}
        />
      </SpaceBetween>

      <Table
        loading={loading}
        loadingText="Loading review queue"
        columnDefinitions={[
          { id: 'bank', header: 'Bank', width: 90, cell: (o: ApiOffer) => <Box fontWeight="bold">{o.bank.toUpperCase()}</Box> },
          {
            id: 'title', header: 'Offer',
            cell: (o: ApiOffer) => (
              <Button variant="link" onClick={() => navigate(`/offers/${o.id}/review`)}>{o.title}</Button>
            ),
          },
          { id: 'merchant', header: 'Merchant', cell: (o: ApiOffer) => o.merchant_name ?? '—' },
          { id: 'change', header: 'Change', cell: (o: ApiOffer) => o.has_pending_candidate ? 'CHANGED (staged)' : (o.change_status ?? '—') },
          {
            id: 'rule_passed', header: 'Validation',
            cell: (o: ApiOffer) => (
              <StatusIndicator type={o.rule_passed ? 'success' : 'error'}>
                {o.rule_passed ? 'Passed' : `${o.rule_errors?.length ?? 1} error(s)`}
              </StatusIndicator>
            ),
          },
          {
            id: 'llm_score', header: 'LLM score',
            cell: (o: ApiOffer) => {
              if (o.llm_score == null) return '—';
              const type = o.llm_score >= 80 ? 'success' : o.llm_score >= 60 ? 'warning' : 'error';
              return <StatusIndicator type={type}>{o.llm_score}/100</StatusIndicator>;
            },
          },
          { id: 'geo_status', header: 'Geo', cell: (o: ApiOffer) => o.geo_status ?? '—' },
          {
            id: 'db_status', header: 'Lifecycle',
            cell: (o: ApiOffer) => <StatusIndicator type={STATUS_TYPE[o.db_status] ?? 'info'}>{o.db_status}</StatusIndicator>,
          },
          { id: 'updated_at', header: 'Updated', cell: (o: ApiOffer) => new Date(o.updated_at).toLocaleDateString() },
        ]}
        items={pageItems}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            {error ? 'API unavailable' : 'No items in this view.'}
          </Box>
        }
        header={<Header variant="h2" counter={`(${total})`}>Queue</Header>}
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
