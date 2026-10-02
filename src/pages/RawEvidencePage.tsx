import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Table from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import { api, type ApiOffer } from '../services/api';
import { useApi } from '../services/use-api';

const PAGE_SIZE = 10;

export default function RawEvidencePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error } = useApi(
    () => api.offers({ search: search || undefined, limit: 100 }),
    [search]
  );

  const offers = (data?.items ?? []).filter(o => o.raw_offer);
  const pageItems = offers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Raw scraped offer data from Neon Postgres (raw_offer JSONB column)"
        counter={loading ? undefined : `(${offers.length})`}
        actions={<Button onClick={() => navigate('/offers')}>All offers</Button>}
      >
        Raw evidence
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}

      <TextFilter
        filteringText={search}
        filteringPlaceholder="Search title or merchant"
        onChange={e => { setSearch(e.detail.filteringText); setPage(1); }}
      />

      <Table
        loading={loading}
        loadingText="Loading raw evidence"
        columnDefinitions={[
          {
            id: 'bank', header: 'Bank', width: 90,
            cell: (o: ApiOffer) => <Box fontWeight="bold">{o.bank.toUpperCase()}</Box>,
          },
          {
            id: 'title', header: 'Offer',
            cell: (o: ApiOffer) => (
              <Button variant="link" onClick={() => navigate(`/offers/${o.id}/review`)}>
                {o.title}
              </Button>
            ),
          },
          { id: 'merchant', header: 'Merchant', cell: (o: ApiOffer) => o.merchant_name ?? '—' },
          {
            id: 'raw_offer', header: 'Raw data',
            cell: (o: ApiOffer) => o.raw_offer ? (
              <ExpandableSection headerText="View JSON" variant="default">
                <pre style={{ fontSize: 11, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(o.raw_offer, null, 2)}
                </pre>
              </ExpandableSection>
            ) : '—',
          },
          {
            id: 'updated_at', header: 'Updated',
            cell: (o: ApiOffer) => new Date(o.updated_at).toLocaleDateString(),
          },
        ]}
        items={pageItems}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No raw evidence data available. Note: raw_offer is stored only when the scraper populates it.
          </Box>
        }
        header={<Header variant="h2" counter={`(${offers.length})`}>Raw offer evidence</Header>}
        pagination={
          <Pagination
            currentPageIndex={page}
            pagesCount={Math.max(1, Math.ceil(offers.length / PAGE_SIZE))}
            onChange={e => setPage(e.detail.currentPageIndex)}
          />
        }
        variant="full-page"
        stickyHeader
      />
    </SpaceBetween>
  );
}
