import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Table from '@cloudscape-design/components/table';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Button from '@cloudscape-design/components/button';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import Badge from '@cloudscape-design/components/badge';
import Select from '@cloudscape-design/components/select';
import { api, type ApiOffer, type ApiBulkSyncSummary } from '../services/api';
import { useApi } from '../services/use-api';
import PageLayout from '../components/PageLayout';

const BANK_OPTIONS = [
  { label: 'All banks', value: '' },
  { label: 'HNB', value: 'hnb' },
  { label: 'BOC', value: 'boc' },
  { label: 'Sampath', value: 'sampath' },
  { label: 'NDB', value: 'ndb' },
  { label: 'DFCC', value: 'dfcc' },
  { label: 'Seylan', value: 'seylan' },
  { label: 'People\'s Bank', value: 'peoples' },
  { label: 'Pan Asia (PABC)', value: 'pabc' },
  { label: 'NSB', value: 'nsb' },
  { label: 'Commercial Bank', value: 'combank' },
];

export default function SyncQueuePage() {
  const navigate = useNavigate();
  const [bankFilter, setBankFilter] = useState(BANK_OPTIONS[0]);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch approved offers awaiting DB sync / publish
  const {
    data: offersData,
    loading: offersLoading,
    error: offersError,
    refetch: refetchOffers,
  } = useApi(
    () =>
      api.offers({
        bank: bankFilter.value || undefined,
        status: 'APPROVED',
        limit: 200,
      }),
    [bankFilter.value]
  );

  // Sync preview statistics
  const {
    data: preview,
    loading: previewLoading,
    refetch: refetchPreview,
  } = useApi(() => api.syncPreview(), []);

  const items = offersData?.items ?? [];

  async function syncSingleOffer(id: string) {
    setBusyOfferId(id);
    setActionError(null);
    setSyncFeedback(null);
    try {
      const res = await api.syncOffer(id);
      setSyncFeedback(`Offer ${id} synced: ${res.outcome}`);
      await Promise.all([refetchOffers(), refetchPreview()]);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyOfferId(null);
    }
  }

  async function syncAllApproved() {
    setBulkBusy(true);
    setActionError(null);
    setSyncFeedback(null);
    try {
      const summary: ApiBulkSyncSummary = await api.bulkSync();
      setSyncFeedback(
        `Bulk sync complete: Published ${summary.published}, Updated ${summary.updated}, Unchanged ${summary.unchanged}, Failed ${summary.failed}`
      );
      await Promise.all([refetchOffers(), refetchPreview()]);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <PageLayout
      title="Database Sync Queue"
      description="Approved offers and staged candidates awaiting production database publish / synchronization"
      breadcrumbs={[{ text: 'Sync queue', href: '/sync-queue' }]}
      error={offersError}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => { refetchOffers(); refetchPreview(); }}>Refresh</Button>
          <Button onClick={() => navigate('/sync')}>Sync Preview &amp; History</Button>
          <Button
            variant="primary"
            onClick={syncAllApproved}
            loading={bulkBusy}
            disabled={items.length === 0}
          >
            Sync All Approved ({items.length})
          </Button>
        </SpaceBetween>
      }
    >
      {actionError && (
        <Alert type="error" header="Sync error" dismissible onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {syncFeedback && (
        <Alert type="success" header="Sync action completed" dismissible onDismiss={() => setSyncFeedback(null)}>
          {syncFeedback}
        </Alert>
      )}

      {/* Sync Queue Summary */}
      <Container header={<Header variant="h2">Publish & Staging Queue Status</Header>}>
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Approved & Ready to Sync</Box>
            {offersLoading ? <Spinner /> : <Box variant="awsui-value-large">{items.length}</Box>}
          </div>
          <div>
            <Box variant="awsui-key-label">Total Ready Across All Banks</Box>
            {previewLoading ? <Spinner /> : <Box variant="awsui-value-large">{preview?.approvedReady ?? 0}</Box>}
          </div>
          <div>
            <Box variant="awsui-key-label">Staged Candidate Updates</Box>
            {previewLoading ? <Spinner /> : <Box variant="awsui-value-large">{preview?.changedExisting ?? 0}</Box>}
          </div>
          <div>
            <Box variant="awsui-key-label">Already Published</Box>
            {previewLoading ? <Spinner /> : <Box variant="awsui-value-large">{preview?.alreadyPublished ?? 0}</Box>}
          </div>
        </ColumnLayout>
      </Container>

      {/* Filter */}
      <Select
        selectedOption={bankFilter}
        onChange={e => setBankFilter(e.detail.selectedOption as typeof bankFilter)}
        options={BANK_OPTIONS}
        placeholder="Filter by bank"
      />

      {/* Sync Queue Table */}
      <Table
        loading={offersLoading}
        loadingText="Loading approved offers in sync queue..."
        header={
          <Header variant="h2" counter={`(${items.length})`}>
            Approved Offers Pending Publish
          </Header>
        }
        columnDefinitions={[
          {
            id: 'bank',
            header: 'Bank',
            width: 100,
            cell: (o: ApiOffer) => <Badge color="blue">{o.bank.toUpperCase()}</Badge>,
          },
          {
            id: 'planned_op',
            header: 'Planned Operation',
            width: 140,
            cell: (o: ApiOffer) => {
              const isUpdate = (o as any).has_pending_candidate || o.change_status === 'CHANGED';
              return (
                <Badge color={isUpdate ? 'blue' : 'green'}>
                  {isUpdate ? 'UPDATE' : 'INSERT'}
                </Badge>
              );
            },
          },
          {
            id: 'title',
            header: 'Offer Title',
            cell: (o: ApiOffer) => (
              <Button variant="link" onClick={() => navigate(`/offers/${o.id}/review`)}>
                {o.title}
              </Button>
            ),
          },
          {
            id: 'merchant',
            header: 'Merchant',
            cell: (o: ApiOffer) => o.merchant_name ?? '—',
          },
          {
            id: 'category',
            header: 'Category',
            cell: (o: ApiOffer) => o.category ?? '—',
          },
          {
            id: 'lifecycle',
            header: 'Lifecycle Status',
            cell: (o: ApiOffer) => <StatusIndicator type="success">{o.db_status}</StatusIndicator>,
          },
          {
            id: 'updated_at',
            header: 'Approved Date',
            cell: (o: ApiOffer) => new Date(o.updated_at).toLocaleString(),
          },
          {
            id: 'actions',
            header: 'Actions',
            width: 180,
            cell: (o: ApiOffer) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="primary"
                  onClick={() => syncSingleOffer(o.id)}
                  loading={busyOfferId === o.id}
                >
                  Publish Sync
                </Button>
                <Button onClick={() => navigate(`/offers/${o.id}/review`)}>Review</Button>
              </SpaceBetween>
            ),
          },
        ]}
        items={items}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No offers currently approved for database sync. Review and approve offers in the Review Queue.
          </Box>
        }
        variant="full-page"
        stickyHeader
      />
    </PageLayout>
  );
}
