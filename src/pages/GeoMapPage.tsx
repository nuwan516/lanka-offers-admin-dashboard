import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Select from '@cloudscape-design/components/select';
import Button from '@cloudscape-design/components/button';
import Table from '@cloudscape-design/components/table';
import Alert from '@cloudscape-design/components/alert';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Spinner from '@cloudscape-design/components/spinner';
import Tabs from '@cloudscape-design/components/tabs';
import { api, type ApiOffer } from '../services/api';
import { useApi } from '../services/use-api';
import LKMap, { type MapMarker } from '../components/LKMap';

const BANKS = ['hnb', 'boc', 'sampath', 'ndb', 'dfcc', 'seylan', 'peoples', 'pabc', 'nsb', 'combank'];

// Known Sri Lanka city coordinates for fuzzy-match fallback
const CITY_COORDS: Record<string, [number, number]> = {
  'colombo': [6.9271, 79.8612],
  'kandy': [7.2906, 80.6337],
  'galle': [6.0535, 80.2210],
  'negombo': [7.2096, 79.8356],
  'jaffna': [9.6615, 80.0255],
  'kurunegala': [7.4818, 80.3609],
  'gampaha': [7.0873, 79.9995],
  'kalutara': [6.5854, 79.9607],
  'batticaloa': [7.7102, 81.6924],
  'moratuwa': [6.7730, 79.8820],
  'mount lavinia': [6.8337, 79.8653],
  'dehiwala': [6.8514, 79.8653],
  'nugegoda': [6.8724, 79.8906],
  'battaramulla': [6.9003, 79.9189],
  'kotte': [6.8936, 79.9001],
  'maharagama': [6.8467, 79.9268],
  'kaduwela': [6.9289, 79.9764],
  'malabe': [6.9142, 79.9660],
  'trincomalee': [8.5922, 81.2339],
  'anuradhapura': [8.3114, 80.4037],
  'polonnaruwa': [7.9403, 81.0188],
  'matara': [5.9549, 80.5550],
  'hambantota': [6.1246, 81.1185],
  'ratnapura': [6.7056, 80.3847],
  'badulla': [6.9934, 81.0550],
  'nuwara eliya': [6.9497, 80.7891],
  'matale': [7.4675, 80.6234],
  'kegalle': [7.2561, 80.3464],
  'puttalam': [8.0408, 79.8283],
  'chilaw': [7.5761, 79.7966],
  'wattala': [6.9897, 79.8913],
  'kelaniya': [6.9559, 79.9240],
  'panadura': [6.7133, 79.9034],
  'horana': [6.7228, 80.0624],
  'ja-ela': [7.0734, 79.8909],
  'ragama': [7.0296, 79.9254],
  'kiribathgoda': [6.9793, 79.9499],
  'wennappuwa': [7.3646, 79.8519],
  'aluthgama': [6.4291, 79.9904],
  'bentota': [6.4218, 79.9967],
  'ambalangoda': [6.2357, 80.0536],
  'hikkaduwa': [6.1393, 80.1056],
  'tangalle': [6.0221, 80.7939],
  'ampara': [7.2973, 81.6741],
  'vavuniya': [8.7514, 80.4986],
  'kilinochchi': [9.3803, 80.3993],
  'mannar': [8.9832, 79.9149],
  'embilipitiya': [6.3450, 80.8465],
  'weligama': [5.9766, 80.4277],
  'mirissa': [5.9454, 80.4651],
  'unawatuna': [6.0103, 80.2499],
  'tissamaharama': [6.2863, 81.2888],
  'boralesgamuwa': [6.8412, 79.8997],
  'piliyandala': [6.8006, 79.9251],
  'padukka': [6.8405, 80.1027],
  'avissawella': [6.9489, 80.2167],
  'homagama': [6.8456, 80.0010],
  'athurugiriya': [6.8923, 79.9817],
};

function cityFromText(text: string): [number, number] | null {
  const lower = text.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  return null;
}

function extractGeoMarkers(offers: ApiOffer[]): MapMarker[] {
  const markerMap = new Map<string, MapMarker>();

  for (const o of offers) {
    const locs = Array.isArray(o.geo_locations) ? o.geo_locations : [];
    for (const loc of locs) {
      const lat = (loc as any).lat ?? (loc as any).latitude;
      const lng = (loc as any).lng ?? (loc as any).longitude ?? (loc as any).lon;
      const name = (loc as any).name ?? (loc as any).formattedAddress ?? (loc as any).address ?? 'Unknown';
      if (lat != null && lng != null) {
        const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
        const existing = markerMap.get(key);
        if (existing) { existing.count = (existing.count ?? 1) + 1; }
        else { markerMap.set(key, { lat, lng, label: name, count: 1, bank: o.bank }); }
      }
    }
    // Fallback: merchant_location text → city lookup
    if (locs.length === 0 && o.merchant_location) {
      const coords = cityFromText(o.merchant_location);
      if (coords) {
        const key = `${coords[0].toFixed(3)},${coords[1].toFixed(3)}`;
        const existing = markerMap.get(key);
        if (existing) { existing.count = (existing.count ?? 1) + 1; }
        else { markerMap.set(key, { lat: coords[0], lng: coords[1], label: o.merchant_location, count: 1, bank: o.bank }); }
      }
    }
  }
  return Array.from(markerMap.values());
}

export default function GeoMapPage() {
  const navigate = useNavigate();
  const [bankFilter, setBankFilter] = useState<any>({ label: 'All banks', value: '' });
  const { data, loading, error, refetch } = useApi(
    () => api.offers({ bank: bankFilter.value || undefined, limit: 500 }),
    [bankFilter.value]
  );

  const offers = data?.items ?? [];
  const markers = useMemo(() => extractGeoMarkers(offers), [offers]);
  const withGeo = offers.filter(o => Array.isArray(o.geo_locations) && o.geo_locations.length > 0);
  const withCity = offers.filter(o => !o.geo_locations?.length && o.merchant_location && cityFromText(o.merchant_location));
  const unresolved = offers.filter(o => !o.geo_locations?.length && (!o.merchant_location || !cityFromText(o.merchant_location)));

  const merchantLocationRows = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of offers) {
      if (o.merchant_location) map.set(o.merchant_location, (map.get(o.merchant_location) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([location, count]) => ({ location, count }));
  }, [offers]);

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Geographic distribution of bank offers — OpenStreetMap"
        counter={loading ? undefined : `(${markers.length} mapped locations)`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={refetch}>Refresh</Button>
            <Button onClick={() => navigate('/geo-unresolved')}>Unresolved</Button>
          </SpaceBetween>
        }
      >
        Geo map
      </Header>

      {error && <Alert type="error" header="API error">{error}</Alert>}

      <Select
        selectedOption={bankFilter}
        onChange={e => setBankFilter(e.detail.selectedOption)}
        options={[{ label: 'All banks', value: '' }, ...BANKS.map(b => ({ label: b.toUpperCase(), value: b }))]}
        placeholder="Filter by bank"
      />

      <Container header={<Header variant="h2">Coverage</Header>}>
        {loading ? <Spinner /> : (
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Total offers</Box>
              <Box variant="awsui-value-large">{offers.length}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Geocoded (lat/lng)</Box>
              <StatusIndicator type={withGeo.length > 0 ? 'success' : 'warning'}>{withGeo.length}</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Mapped by city name</Box>
              <StatusIndicator type={withCity.length > 0 ? 'info' : 'stopped'}>{withCity.length}</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Unresolved</Box>
              <StatusIndicator type={unresolved.length > 0 ? 'warning' : 'success'}>{unresolved.length}</StatusIndicator>
            </div>
          </ColumnLayout>
        )}
      </Container>

      <Container header={<Header variant="h2">Map</Header>}>
        {loading ? (
          <Box textAlign="center" padding="xl"><Spinner size="large" /></Box>
        ) : markers.length === 0 ? (
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No locations to plot. Run a scraper then run geocoding to populate location data.
          </Box>
        ) : (
          <LKMap markers={markers} height={520} />
        )}
      </Container>

      <Tabs
        tabs={[
          {
            id: 'locations',
            label: `Merchant locations (${merchantLocationRows.length})`,
            content: (
              <Table
                loading={loading}
                header={<Header variant="h2" description="Merchant location text scraped from bank websites">Merchant locations</Header>}
                columnDefinitions={[
                  { id: 'location', header: 'Location text', cell: (r: { location: string; count: number }) => r.location },
                  {
                    id: 'mapped', header: 'On map',
                    cell: (r: { location: string; count: number }) =>
                      cityFromText(r.location)
                        ? <StatusIndicator type="success">Yes</StatusIndicator>
                        : <StatusIndicator type="warning">No</StatusIndicator>,
                  },
                  { id: 'count', header: 'Offers', cell: (r: { location: string; count: number }) => r.count },
                ]}
                items={merchantLocationRows}
                empty={<Box textAlign="center" color="inherit">No merchant location data.</Box>}
                variant="full-page"
                stickyHeader
              />
            ),
          },
          {
            id: 'unresolved',
            label: `Unresolved (${unresolved.length})`,
            content: (
              <Table
                loading={loading}
                header={<Header variant="h2" description="Offers that could not be mapped to any location">Unresolved offers</Header>}
                columnDefinitions={[
                  { id: 'bank', header: 'Bank', cell: (o: ApiOffer) => <Box fontWeight="bold">{o.bank.toUpperCase()}</Box> },
                  {
                    id: 'title', header: 'Offer',
                    cell: (o: ApiOffer) => (
                      <Button variant="link" onClick={() => navigate(`/offers/${o.id}/review`)}>{o.title}</Button>
                    ),
                  },
                  { id: 'merchant', header: 'Merchant', cell: (o: ApiOffer) => o.merchant_name ?? '—' },
                  { id: 'location', header: 'Location text', cell: (o: ApiOffer) => o.merchant_location ?? <Box color="text-status-error">none</Box> },
                ]}
                items={unresolved}
                empty={<Box textAlign="center" color="inherit">All offers have resolvable locations.</Box>}
                variant="full-page"
                stickyHeader
              />
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}
