import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Table from '@cloudscape-design/components/table';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Button from '@cloudscape-design/components/button';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Select from '@cloudscape-design/components/select';
import Input from '@cloudscape-design/components/input';
import FormField from '@cloudscape-design/components/form-field';
import Badge from '@cloudscape-design/components/badge';
import { api } from '../services/api';
import { useApi } from '../services/use-api';
import { mockBranches } from '../mock-data';
import type { Branch } from '../types';
import PageLayout from '../components/PageLayout';

export default function BranchesPage() {
  const navigate = useNavigate();
  const [districtFilter, setDistrictFilter] = useState({ label: 'All Districts', value: '' });
  const [search, setSearch] = useState('');

  const { data: offersData, loading, error, refetch } = useApi(
    () => api.offers({ limit: 300 }),
    []
  );

  // Extract branches from live offers with geocoded data, fallback to mockBranches if none
  const branches: Branch[] = useMemo(() => {
    const liveBranches: Branch[] = [];
    let count = 0;
    const offers = offersData?.items ?? [];

    for (const o of offers) {
      if (Array.isArray(o.geo_locations) && o.geo_locations.length > 0) {
        for (const rawG of o.geo_locations as Array<Record<string, unknown>>) {
          count++;
          const g = rawG as { name?: string; district?: string; address?: string; lat?: number; lng?: number; confidence?: number };
          liveBranches.push({
            id: `BR-LIVE-${count}`,
            merchantId: o.merchant_name ?? 'UNKNOWN',
            merchantName: o.merchant_name ?? 'Unknown Merchant',
            name: String(g.name ?? `${o.merchant_name ?? 'Branch'} (${g.district ?? 'Outlets'})`),
            district: String(g.district ?? 'Colombo'),
            address: String(g.address ?? (o.merchant_location || 'Sri Lanka')),
            lat: typeof g.lat === 'number' ? g.lat : null,
            lng: typeof g.lng === 'number' ? g.lng : null,
            geoConfidence: typeof g.confidence === 'number' ? g.confidence : 0.9,
            placeMatch: null,
            status: typeof g.lat === 'number' ? 'Active' : 'Unverified',
            lastVerified: o.updated_at ? o.updated_at.slice(0, 10) : null,
          });
        }
      }
    }

    if (liveBranches.length > 0) return liveBranches;
    return mockBranches;
  }, [offersData]);

  // District options
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of branches) {
      if (b.district) set.add(b.district);
    }
    return [
      { label: 'All Districts', value: '' },
      ...Array.from(set).sort().map(d => ({ label: d, value: d })),
    ];
  }, [branches]);

  // Filtered branches
  const filtered = useMemo(() => {
    return branches.filter(b => {
      if (districtFilter.value && b.district !== districtFilter.value) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          b.name.toLowerCase().includes(q) ||
          b.merchantName.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [branches, districtFilter.value, search]);

  const activeCount = branches.filter(b => b.status === 'Active').length;
  const unverifiedCount = branches.filter(b => b.status !== 'Active').length;

  return (
    <PageLayout
      title="Merchant Branches"
      description="Physical retail branches and geocoded merchant locations in Sri Lanka"
      counter={loading ? undefined : `(${branches.length})`}
      breadcrumbs={[{ text: 'Banks', href: '/branches' }]}
      error={error}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={refetch}>Refresh</Button>
          <Button variant="primary" onClick={() => navigate('/geo-map')}>Open Interactive Geo Map</Button>
        </SpaceBetween>
      }
    >

      {/* Summary Metrics */}
      <Container header={<Header variant="h2">Branch Network Summary</Header>}>
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Total Branches</Box>
            <Box variant="awsui-value-large">{branches.length}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Active / Geocoded</Box>
            <StatusIndicator type="success">{activeCount}</StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Unverified / Missing Coords</Box>
            <StatusIndicator type={unverifiedCount > 0 ? 'warning' : 'success'}>
              {unverifiedCount}
            </StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Districts Represented</Box>
            <Box variant="awsui-value-large">{districtOptions.length - 1}</Box>
          </div>
        </ColumnLayout>
      </Container>

      {/* Filters */}
      <ColumnLayout columns={2}>
        <FormField label="District Filter">
          <Select
            selectedOption={districtFilter}
            onChange={e => setDistrictFilter(e.detail.selectedOption as typeof districtFilter)}
            options={districtOptions}
          />
        </FormField>
        <FormField label="Search Branches">
          <Input
            value={search}
            onChange={e => setSearch(e.detail.value)}
            placeholder="Search by branch name, merchant, or address..."
          />
        </FormField>
      </ColumnLayout>

      {/* Table */}
      <Table
        loading={loading}
        loadingText="Loading merchant branches..."
        header={
          <Header variant="h2" counter={`(${filtered.length})`}>
            Branches List
          </Header>
        }
        columnDefinitions={[
          {
            id: 'name',
            header: 'Branch Name',
            cell: (b: Branch) => <Box fontWeight="bold">{b.name}</Box>,
          },
          {
            id: 'merchant',
            header: 'Merchant',
            cell: (b: Branch) => b.merchantName,
          },
          {
            id: 'district',
            header: 'District',
            width: 130,
            cell: (b: Branch) => <Badge color="blue">{b.district}</Badge>,
          },
          {
            id: 'address',
            header: 'Address',
            cell: (b: Branch) => (
              <Box fontSize="body-s" color="text-body-secondary">
                {b.address}
              </Box>
            ),
          },
          {
            id: 'coords',
            header: 'Coordinates',
            width: 160,
            cell: (b: Branch) =>
              b.lat != null && b.lng != null ? (
                <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                </span>
              ) : (
                <Box fontSize="body-s" color="text-status-warning">
                  Unmapped
                </Box>
              ),
          },
          {
            id: 'confidence',
            header: 'Confidence',
            width: 120,
            cell: (b: Branch) => (
              <Badge color={b.geoConfidence >= 0.8 ? 'green' : 'blue'}>
                {Math.round(b.geoConfidence * 100)}%
              </Badge>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            width: 120,
            cell: (b: Branch) => (
              <StatusIndicator type={b.status === 'Active' ? 'success' : 'stopped'}>
                {b.status}
              </StatusIndicator>
            ),
          },
          {
            id: 'actions',
            header: 'Action',
            width: 120,
            cell: (b: Branch) => (
              <Button
                variant="link"
                onClick={() => navigate('/geo-map')}
                disabled={b.lat == null}
              >
                View on map
              </Button>
            ),
          },
        ]}
        items={filtered}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No branches found matching search or district filter.
          </Box>
        }
        variant="full-page"
        stickyHeader
      />
    </PageLayout>
  );
}
