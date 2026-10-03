import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Select from '@cloudscape-design/components/select';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Badge from '@cloudscape-design/components/badge';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import PageLayout from '../components/PageLayout';
import { api, type ApiDuplicateCandidate } from '../services/api';
import { useApi } from '../services/use-api';

const CLASSIFICATION_TYPE: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  EXACT_DUPLICATE: 'error', LIKELY_DUPLICATE: 'warning', CROSS_BANK_SIMILAR: 'info', NOT_DUPLICATE: 'success',
};

const STATUS_OPTIONS = [
  { label: 'Pending review', value: 'PENDING' },
  { label: 'Confirmed duplicate', value: 'CONFIRMED_DUPLICATE' },
  { label: 'Not duplicate', value: 'NOT_DUPLICATE' },
  { label: 'Ignored', value: 'IGNORED' },
  { label: 'All', value: '' },
];

function OfferSide({ label, prefix, c }: { label: string; prefix: 'offer' | 'candidate'; c: ApiDuplicateCandidate }) {
  const bank = prefix === 'offer' ? c.offer_bank : c.candidate_bank;
  const title = prefix === 'offer' ? c.offer_title : c.candidate_title;
  const merchant = prefix === 'offer' ? c.offer_merchant : c.candidate_merchant;
  const discount = prefix === 'offer' ? c.offer_discount : c.candidate_discount;
  const cardType = prefix === 'offer' ? c.offer_card_type : c.candidate_card_type;
  const validFrom = prefix === 'offer' ? c.offer_valid_from : c.candidate_valid_from;
  const validTo = prefix === 'offer' ? c.offer_valid_to : c.candidate_valid_to;
  const location = prefix === 'offer' ? c.offer_location : c.candidate_location;
  const status = prefix === 'offer' ? c.offer_status : c.candidate_status;
  const sourceUrl = prefix === 'offer' ? c.offer_source_url : c.candidate_source_url;
  const offerId = prefix === 'offer' ? c.offer_id : c.candidate_offer_id;
  const navigate = useNavigate();

  return (
    <Container header={<Header variant="h3">{label}</Header>}>
      <SpaceBetween size="xs">
        <div><Box variant="awsui-key-label">Bank</Box><Box fontWeight="bold">{bank?.toUpperCase()}</Box></div>
        <div><Box variant="awsui-key-label">Merchant</Box><Box>{merchant ?? '—'}</Box></div>
        <div><Box variant="awsui-key-label">Title</Box><Box>{title}</Box></div>
        <div><Box variant="awsui-key-label">Discount / Benefit</Box><Box>{discount ?? '—'}</Box></div>
        <div><Box variant="awsui-key-label">Card Type</Box><Box>{cardType ?? '—'}</Box></div>
        <div>
          <Box variant="awsui-key-label">Validity Period</Box>
          <Box>{validFrom ? `${new Date(validFrom).toLocaleDateString()} → ${validTo ? new Date(validTo).toLocaleDateString() : 'Ongoing'}` : '—'}</Box>
        </div>
        <div><Box variant="awsui-key-label">Locations / Branches</Box><Box>{location ?? '—'}</Box></div>
        <div><Box variant="awsui-key-label">Lifecycle Status</Box><Box>{status}</Box></div>
        <div><Box variant="awsui-key-label">Source URL</Box><Box fontSize="body-s" color="text-body-secondary">{sourceUrl ?? '—'}</Box></div>
        <Button variant="link" onClick={() => navigate(`/offers/${offerId}/review`)}>Open full offer in review workspace</Button>
      </SpaceBetween>
    </Container>
  );
}

/**
 * Deterministic duplicate review (Part 9). Candidates come from the
 * server-side scorer in `duplicate-detector.ts` (weighted field comparison,
 * no LLM/embeddings) — this page only displays and records the admin
 * decision (Confirm / Not duplicate / Ignore); it never merges or deletes.
 */
export default function DuplicateDetectionPage() {
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);
  const [selected, setSelected] = useState<ApiDuplicateCandidate | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeReason, setMergeReason] = useState('Identical promotional campaign across sources');

  const { data, loading, error, refetch } = useApi(
    () => api.duplicates({ status: statusFilter.value || undefined, limit: 100 }),
    [statusFilter.value]
  );

  async function decide(decision: 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'IGNORED') {
    if (!selected) return;
    setBusy(decision);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.reviewDuplicate(selected.id, decision);
      setSelected(null);
      await refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleMerge() {
    if (!selected) return;
    setBusy('MERGE');
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.mergeDuplicates(selected.offer_id, selected.candidate_offer_id, mergeReason);
      setActionSuccess(res.message || 'Duplicate successfully merged into Offer A with raw provenance preserved.');
      setMergeModalOpen(false);
      setSelected(null);
      await refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const items = data?.items ?? [];

  return (
    <PageLayout
      title="Duplicate Review"
      description="Deterministic duplicate candidates — same-bank matches only, never auto-merged or auto-deleted without admin decision"
      breadcrumbs={[{ text: 'Duplicate detection', href: '/duplicates' }]}
      actions={<Button onClick={refetch}>Refresh</Button>}
      error={error}
    >
      {actionError && <Alert type="error" header="Action failed" dismissible onDismiss={() => setActionError(null)}>{actionError}</Alert>}
      {actionSuccess && <Alert type="success" header="Operation succeeded" dismissible onDismiss={() => setActionSuccess(null)}>{actionSuccess}</Alert>}

      <Select selectedOption={statusFilter} onChange={e => setStatusFilter(e.detail.selectedOption as typeof statusFilter)} options={STATUS_OPTIONS} />

      <Table
        loading={loading}
        onRowClick={e => setSelected(e.detail.item)}
        columnDefinitions={[
          { id: 'classification', header: 'Type', cell: (c: ApiDuplicateCandidate) => <StatusIndicator type={CLASSIFICATION_TYPE[c.classification] ?? 'info'}>{c.classification}</StatusIndicator> },
          { id: 'score', header: 'Score', cell: (c: ApiDuplicateCandidate) => `${c.score}/100` },
          { id: 'offer', header: 'Offer A', cell: (c: ApiDuplicateCandidate) => `${c.offer_bank?.toUpperCase()} · ${c.offer_title}` },
          { id: 'candidate', header: 'Offer B', cell: (c: ApiDuplicateCandidate) => `${c.candidate_bank?.toUpperCase()} · ${c.candidate_title}` },
          { id: 'status', header: 'Review status', cell: (c: ApiDuplicateCandidate) => c.status },
          { id: 'created', header: 'Detected', cell: (c: ApiDuplicateCandidate) => new Date(c.created_at).toLocaleString() },
        ]}
        items={items}
        header={<Header variant="h2" counter={`(${items.length})`}>Candidates</Header>}
        empty={<Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>No duplicate candidates.</Box>}
        variant="full-page"
      />

      {selected && (
        <Container
          header={
            <Header
              variant="h2"
              description="Side-by-side comparison of candidate records. Confirming marks the candidate as a duplicate and prevents publishing."
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <StatusIndicator type={CLASSIFICATION_TYPE[selected.classification] ?? 'info'}>
                    {selected.classification}
                  </StatusIndicator>
                  <Badge color={selected.score >= 80 ? 'red' : selected.score >= 50 ? 'blue' : 'grey'}>
                    {selected.score}/100 Match
                  </Badge>
                </SpaceBetween>
              }
            >
              Duplicate Comparison
            </Header>
          }
        >
          <SpaceBetween size="m">
            <ColumnLayout columns={2}>
              <OfferSide label="Offer A (Existing / Canonical)" prefix="offer" c={selected} />
              <OfferSide label="Offer B (Candidate / Incoming)" prefix="candidate" c={selected} />
            </ColumnLayout>

            <Container header={<Header variant="h3">Deterministic Match Signals & Rationale</Header>}>
              <SpaceBetween size="xxs">
                {selected.reasons.map((r, i) => (
                  <Box key={i} fontSize="body-s">
                    <Badge color="blue">Signal</Badge> {r}
                  </Box>
                ))}
              </SpaceBetween>
            </Container>

            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="primary" onClick={() => decide('CONFIRMED_DUPLICATE')} loading={busy === 'CONFIRMED_DUPLICATE'}>
                Confirm duplicate
              </Button>
              <Button onClick={() => setMergeModalOpen(true)} disabled={busy !== null}>
                Merge into Offer A (Preserve Provenance)
              </Button>
              <Button onClick={() => decide('NOT_DUPLICATE')} loading={busy === 'NOT_DUPLICATE'}>
                Not duplicate
              </Button>
              <Button onClick={() => decide('IGNORED')} loading={busy === 'IGNORED'}>
                Ignore
              </Button>
              <Button onClick={() => setSelected(null)}>Close</Button>
            </SpaceBetween>
          </SpaceBetween>
        </Container>
      )}

      <Modal
        visible={mergeModalOpen}
        onDismiss={() => setMergeModalOpen(false)}
        header="Merge Duplicate Offer"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setMergeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleMerge} loading={busy === 'MERGE'}>
                Confirm Merge & Preserve Provenance
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Alert type="warning" header="Irreversible provenance merge">
            Merging will mark Offer B (candidate) as <strong>DISABLED (MERGED)</strong>. Its raw evidence,
            content hash, source URL, and original title will be permanently recorded in Offer A&apos;s audit history.
          </Alert>
          <FormField label="Canonical Target (Will be kept active)">
            <Box fontWeight="bold">{selected?.offer_bank?.toUpperCase()} · {selected?.offer_title}</Box>
            <Box fontSize="body-s" color="text-body-secondary">ID: {selected?.offer_id}</Box>
          </FormField>
          <FormField label="Duplicate Candidate (Will be disabled)">
            <Box fontWeight="bold">{selected?.candidate_bank?.toUpperCase()} · {selected?.candidate_title}</Box>
            <Box fontSize="body-s" color="text-body-secondary">ID: {selected?.candidate_offer_id}</Box>
          </FormField>
          <FormField label="Merge Reason / Audit Note">
            <Input
              value={mergeReason}
              onChange={e => setMergeReason(e.detail.value)}
              placeholder="e.g. Same merchant promo across multiple pages"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </PageLayout>
  );
}
