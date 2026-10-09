import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Table from '@cloudscape-design/components/table';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Badge from '@cloudscape-design/components/badge';
import Select from '@cloudscape-design/components/select';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import PageLayout from '../components/PageLayout';
import { api } from '../services/api';
import { useApi } from '../services/use-api';

function classifyLocation(rawLoc?: string | null, title?: string, merchant?: string | null): {
  type: 'ONLINE_ONLY' | 'NATIONWIDE' | 'AMBIGUOUS' | 'UNRESOLVED_SPECIFIC';
  badgeColor: 'blue' | 'green' | 'red' | 'grey';
  label: string;
  notes: string;
} {
  const text = `${rawLoc ?? ''} ${title ?? ''} ${merchant ?? ''}`.toLowerCase();

  // Physical clues must never be overridden by casual website/app mentions
  const hasPhysicalClue =
    /\b(?:hotel|resort|villa|restaurant|café|cafe|hospital|showroom|kandy|colombo|galle|mirissa|dambulla|negombo|jaffna|udawalawa)\b/i.test(text);

  const isExplicitOnline =
    /\b(?:online\s+only|valid\s+(?:only\s+)?online|website\s+only|daraz|uber\s*eats|pickme|promo\s*code)\b/i.test(text) ||
    (/\b(?:mobile\s+app|online)\b/i.test(text) && !hasPhysicalClue);

  if (isExplicitOnline && !hasPhysicalClue) {
    return {
      type: 'ONLINE_ONLY',
      badgeColor: 'blue',
      label: 'Online-Only',
      notes: 'Digital transaction — no physical branch resolution needed.',
    };
  }

  if (text.includes('islandwide') || text.includes('nationwide') || text.includes('all outlets') || text.includes('all branches')) {
    return {
      type: 'NATIONWIDE',
      badgeColor: 'green',
      label: 'Nationwide',
      notes: 'Applies across all Sri Lankan outlets for this merchant.',
    };
  }

  if (text.includes('selected outlet') || text.includes('selected branch') || text.includes('participating') || text.includes('selected colombo')) {
    return {
      type: 'AMBIGUOUS',
      badgeColor: 'red',
      label: 'Ambiguous / Selected Outlets',
      notes: 'Preserve uncertainty: do not infer all branches without explicit list.',
    };
  }

  return {
    type: 'UNRESOLVED_SPECIFIC',
    badgeColor: 'grey',
    label: 'Unresolved Specific',
    notes: 'Specific location mentioned but unmapped to cached geocodes.',
  };
}

const TYPE_FILTER_OPTIONS = [
  { label: 'All Unresolved Locations', value: '' },
  { label: 'Ambiguous / Selected Outlets', value: 'AMBIGUOUS' },
  { label: 'Unresolved Specific', value: 'UNRESOLVED_SPECIFIC' },
  { label: 'Online-Only', value: 'ONLINE_ONLY' },
  { label: 'Nationwide', value: 'NATIONWIDE' },
];

export default function GeoUnresolvedPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState(TYPE_FILTER_OPTIONS[0]);

  const { data, loading, error, refetch } = useApi(() => api.offers({ limit: 300 }), []);

  const offers = useMemo(() => data?.items ?? [], [data?.items]);

  // Filter offers where geo is not resolved
  const unresolvedOffers = useMemo(() => {
    return offers.filter(o => !Array.isArray(o.geo_locations) || o.geo_locations.length === 0);
  }, [offers]);

  // Classified offers
  const classified = useMemo(() => {
    return unresolvedOffers.map(o => ({
      offer: o,
      classification: classifyLocation(o.merchant_location, o.title, o.merchant_name),
    }));
  }, [unresolvedOffers]);

  const filtered = useMemo(() => {
    if (!typeFilter.value) return classified;
    return classified.filter(c => c.classification.type === typeFilter.value);
  }, [classified, typeFilter.value]);

  const counts = useMemo(() => {
    let ambiguous = 0;
    let specific = 0;
    let online = 0;
    let nationwide = 0;
    for (const c of classified) {
      if (c.classification.type === 'AMBIGUOUS') ambiguous++;
      else if (c.classification.type === 'UNRESOLVED_SPECIFIC') specific++;
      else if (c.classification.type === 'ONLINE_ONLY') online++;
      else if (c.classification.type === 'NATIONWIDE') nationwide++;
    }
    return { ambiguous, specific, online, nationwide };
  }, [classified]);

  return (
    <PageLayout
      title="Unresolved Geographic Locations"
      description="Offers with unresolved or ambiguous geographic location scope requiring operational attention"
      counter={loading ? undefined : `(${unresolvedOffers.length})`}
      breadcrumbs={[
        { text: 'Geo map', href: '/geo-map' },
        { text: 'Unresolved locations', href: '/geo-unresolved' },
      ]}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={refetch}>Refresh</Button>
          <Button onClick={() => navigate('/geo-map')}>Open Geo Map</Button>
          <Button onClick={() => navigate('/offers')}>All Offers</Button>
        </SpaceBetween>
      }
      error={error}
    >
      <Alert type="info" header="AddressEngine & Governance Rule">
        <strong>Preserve Uncertainty:</strong> Do not assign all Colombo branches when an offer says "selected Colombo outlets". AddressEngine uses a 3-tier cache (Memory → Disk <code>.geo-cache/</code> → Postgres) ensuring zero cost for cached locations.
      </Alert>

      {/* Summary Metrics */}
      <Container header={<Header variant="h2">Resolution Breakdown</Header>}>
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Ambiguous / Selected Outlets</Box>
            <StatusIndicator type={counts.ambiguous > 0 ? 'warning' : 'success'}>
              {counts.ambiguous} offers
            </StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Unresolved Specific</Box>
            <Box variant="awsui-value-large">{counts.specific}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Online-Only</Box>
            <Box variant="awsui-value-large">{counts.online}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Nationwide / Islandwide</Box>
            <Box variant="awsui-value-large">{counts.nationwide}</Box>
          </div>
        </ColumnLayout>
      </Container>

      {/* Filter */}
      <Select
        selectedOption={typeFilter}
        onChange={e => setTypeFilter(e.detail.selectedOption as typeof typeFilter)}
        options={TYPE_FILTER_OPTIONS}
      />

      {/* Unresolved Table */}
      <Table
        loading={loading}
        loadingText="Loading unresolved locations..."
        header={
          <Header variant="h2" counter={`(${filtered.length})`}>
            Location Queue
          </Header>
        }
        columnDefinitions={[
          {
            id: 'bank',
            header: 'Bank',
            width: 100,
            cell: item => <Badge color="blue">{item.offer.bank.toUpperCase()}</Badge>,
          },
          {
            id: 'classification',
            header: 'Scope Classification',
            width: 190,
            cell: item => (
              <Badge color={item.classification.badgeColor}>
                {item.classification.label}
              </Badge>
            ),
          },
          {
            id: 'title',
            header: 'Offer Title',
            cell: item => (
              <Button variant="link" onClick={() => navigate(`/offers/${item.offer.id}/review`)}>
                {item.offer.title}
              </Button>
            ),
          },
          {
            id: 'merchant',
            header: 'Merchant',
            cell: item => item.offer.merchant_name ?? '—',
          },
          {
            id: 'raw_location',
            header: 'Raw Location Evidence',
            cell: item => (
              <SpaceBetween size="xxs">
                <Box fontWeight="bold" fontSize="body-s">
                  {item.offer.merchant_location || '(No location string captured in raw scrape)'}
                </Box>
                <Box fontSize="body-s" color="text-body-secondary">
                  {item.classification.notes}
                </Box>
              </SpaceBetween>
            ),
          },
          {
            id: 'actions',
            header: 'Action',
            width: 140,
            cell: item => (
              <Button onClick={() => navigate(`/offers/${item.offer.id}/review`)}>
                Review Offer
              </Button>
            ),
          },
        ]}
        items={filtered}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No unresolved location offers match the selected scope filter.
          </Box>
        }
        variant="full-page"
        stickyHeader
      />
    </PageLayout>
  );
}
