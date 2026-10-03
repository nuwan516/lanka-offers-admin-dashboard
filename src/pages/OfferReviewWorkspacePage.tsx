import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Grid from '@cloudscape-design/components/grid';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import Spinner from '@cloudscape-design/components/spinner';
import Input from '@cloudscape-design/components/input';
import FormField from '@cloudscape-design/components/form-field';
import Table from '@cloudscape-design/components/table';
import Badge from '@cloudscape-design/components/badge';
import PageLayout from '../components/PageLayout';
import { api } from '../services/api';
import { useApi } from '../services/use-api';

// Dot-path -> label for the small set of fields admins can correct.
const EDITABLE_FIELDS: Array<{ path: string; label: string }> = [
  { path: 'title', label: 'Title' },
  { path: 'category', label: 'Category' },
  { path: 'cardType', label: 'Card type' },
  { path: 'merchant.name', label: 'Merchant name' },
  { path: 'merchant.location', label: 'Merchant location' },
  { path: 'offer.discountPercentage', label: 'Discount (%)' },
  { path: 'transactionRange.min', label: 'Transaction min' },
  { path: 'transactionRange.max', label: 'Transaction max' },
];

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, key) => (cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[key] : undefined), obj);
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

const STATUS_TYPE: Record<string, 'success' | 'warning' | 'error' | 'stopped' | 'info' | 'pending'> = {
  DISCOVERED: 'pending', VALIDATED: 'pending', REVIEW_REQUIRED: 'warning',
  APPROVED: 'info', REJECTED: 'error', PUBLISHED: 'success', EXPIRED: 'stopped', DISABLED: 'stopped',
};

interface ReviewSignal {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  detail?: string;
}

function deriveReviewSignals(data: any): ReviewSignal[] {
  const signals: ReviewSignal[] = [];
  const offer = data.offer;
  const vr = data.validationReport;
  const pending = Boolean(data.pendingCandidate);
  const rulePassed = pending ? (data.pendingValidation?.rulePassed ?? offer.rule_passed) : offer.rule_passed;
  const ruleErrors: any[] = (vr?.rule_errors?.length ? vr.rule_errors : (offer.rule_errors as any[])) ?? [];
  const ruleWarnings: any[] = (vr?.rule_warnings?.length ? vr.rule_warnings : (offer.rule_warnings as any[])) ?? [];
  const llmScore = vr?.llm_score ?? offer.llm_score ?? (pending ? data.pendingValidation?.llmScore : null);
  const llmValid = vr?.llm_valid ?? offer.llm_valid ?? (pending ? data.pendingValidation?.llmValid : null);

  // 1. Rule Failures (High severity)
  if (!rulePassed || ruleErrors.length > 0) {
    for (const err of ruleErrors) {
      signals.push({
        type: 'error',
        category: `Rule Violation: ${err.field || 'General'}`,
        message: err.message || `Failed validation rule on ${err.field}`,
        detail: `Field: ${err.field}`,
      });
    }
  }

  // 2. Duplicate Match
  if (offer.change_status === 'DUPLICATE' || offer.pending_change_status === 'DUPLICATE' || (data.duplicates && data.duplicates.length > 0)) {
    const topDup = data.duplicates?.[0];
    signals.push({
      type: 'warning',
      category: 'Duplicate Match Detected',
      message: topDup
        ? `Matched existing offer with ${topDup.classification?.replace(/_/g, ' ').toLowerCase()} (Score: ${topDup.score}/100)`
        : 'Offer matches an existing offer closely enough to require duplicate verification before publishing',
      detail: topDup ? `Candidate Offer ID: ${topDup.candidate_offer_id}` : undefined,
    });
  }

  // 3. LLM Validation Disagreement / Score
  if (llmScore !== null && llmScore !== undefined && llmScore < 70) {
    signals.push({
      type: 'warning',
      category: 'Low LLM Semantic Confidence',
      message: `Extraction confidence is ${llmScore}/100 — LLM detected potential discrepancies against source text`,
      detail: vr?.llm_reasoning || (vr?.llm_issues?.length ? `Issues: ${vr.llm_issues.join(', ')}` : undefined),
    });
  } else if (llmValid === false) {
    signals.push({
      type: 'error',
      category: 'LLM Semantic Rejection',
      message: 'LLM validator flagged this offer as invalid or unverified against bank raw evidence',
      detail: vr?.llm_reasoning || undefined,
    });
  }

  // 4. Disagreement between Rule Engine and LLM
  if (rulePassed && llmScore !== null && llmScore < 70) {
    signals.push({
      type: 'warning',
      category: 'Validation Disagreement',
      message: `Deterministic rules PASSED, but LLM flagged low confidence (${llmScore}/100) — verify source wording`,
    });
  } else if (!rulePassed && llmValid === true && (llmScore === null || llmScore >= 80)) {
    signals.push({
      type: 'info',
      category: 'Validation Disagreement',
      message: 'Deterministic rules FAILED, but LLM found offer semantically clear — may indicate strict formatting rather than bad data',
    });
  }

  // 5. Unresolved Geo
  if (offer.geo_status === 'unresolved' || (!offer.merchant_location && (!offer.geo_locations || (offer.geo_locations as any[]).length === 0))) {
    signals.push({
      type: 'warning',
      category: 'Geo Unresolved',
      message: 'Merchant location is missing or could not be resolved to GPS coordinates (false precision avoided)',
    });
  }

  // 6. Staged Scraper Candidate Update
  if (pending) {
    signals.push({
      type: 'info',
      category: 'Staged Source Change',
      message: 'A newer scrape found modified content for this already-published offer — review changes before staging into live',
    });
  }

  // 7. Rule Warnings
  if (ruleWarnings.length > 0 && signals.length === 0) {
    for (const w of ruleWarnings) {
      signals.push({
        type: 'warning',
        category: `Rule Warning: ${w.field || 'Quality'}`,
        message: w.message || `Warning on ${w.field}`,
      });
    }
  }

  return signals;
}

export default function OfferReviewWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => api.offerReview(id!), [id]);

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => { setDraft({}); }, [id]);

  const candidate = data?.pendingCandidate ?? data?.rawOffer ?? null;
  const effective = useMemo(() => {
    if (!candidate) return null;
    const merged = JSON.parse(JSON.stringify(candidate));
    for (const [path, value] of Object.entries({ ...(data?.manualOverride ?? {}), ...draft })) {
      const parts = path.split('.');
      let cur = merged;
      for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = cur[parts[i]] ?? {}; cur = cur[parts[i]]; }
      cur[parts[parts.length - 1]] = value;
    }
    return merged;
  }, [candidate, data?.manualOverride, draft]);

  const reviewSignals = useMemo(() => {
    if (!data) return [];
    return deriveReviewSignals(data);
  }, [data]);

  function fieldValue(path: string): string {
    if (path in draft) return draft[path];
    const override = data?.manualOverride?.[path];
    if (override !== undefined) return String(override);
    return fmt(getPath(candidate, path));
  }

  async function runAction(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setActionError(null);
    try {
      await fn();
      await refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('Concurrent modification conflict')) {
        setActionError('Conflict detected: This offer was updated concurrently by another operator or background scrape. The latest data has been reloaded.');
        await refetch();
      } else {
        setActionError(msg);
      }
    } finally {
      setBusy(null);
    }
  }

  async function saveDraft() {
    if (!id || Object.keys(draft).length === 0) return;
    await runAction('save', () => api.saveOfferCorrection(id, draft, undefined, data?.offer?.updated_at));
    setDraft({});
  }

  async function approve(withCorrections: boolean) {
    if (!id) return;
    await runAction('approve', () =>
      api.transitionOffer(
        id,
        withCorrections ? 'APPROVE_WITH_CORRECTIONS' : 'APPROVE',
        undefined,
        withCorrections ? draft : undefined,
        data?.offer?.updated_at
      )
    );
    if (withCorrections) setDraft({});
  }

  async function reject() {
    if (!id) return;
    await runAction('reject', () => api.transitionOffer(id, 'REJECT', undefined, undefined, data?.offer?.updated_at));
  }

  async function sendBack() {
    if (!id) return;
    await runAction('sendback', () => api.transitionOffer(id, 'SEND_BACK', undefined, undefined, data?.offer?.updated_at));
  }

  async function disable() {
    if (!id) return;
    await runAction('disable', () => api.transitionOffer(id, 'DISABLE', undefined, undefined, data?.offer?.updated_at));
  }

  async function publishSync() {
    if (!id) return;
    await runAction('publish', () => api.syncOffer(id));
  }

  async function revalidateRules() {
    if (!id) return;
    await runAction('revalidate', () => api.revalidate({ offerId: id }));
  }

  if (loading) return <Box padding="xl" textAlign="center"><Spinner size="large" /></Box>;
  if (error || !data) {
    return (
      <Alert type="error" header="Offer not found">
        {error ?? 'The offer could not be loaded.'}
        <br />
        <Button variant="link" onClick={() => navigate('/offers')}>Back to offers</Button>
      </Alert>
    );
  }

  const offer = data.offer;
  const status = String(offer.db_status);
  const hasPending = Boolean(data.pendingCandidate);
  const validation = hasPending ? data.pendingValidation : null;
  // A staged candidate on an already-PUBLISHED offer is reviewed against
  // its own pending_lifecycle_status, not the live db_status (the backend
  // transition logic mirrors this — see offer-workflow-repository.ts).
  const reviewStatus = hasPending ? String(offer.pending_lifecycle_status ?? 'REVIEW_REQUIRED') : status;

  return (
    <PageLayout
      title={String(offer.title)}
      description={`${String(offer.bank).toUpperCase()} · ${offer.unique_id} · source: ${String(offer.source_url ?? 'n/a')}`}
      breadcrumbs={[
        { text: 'Review queue', href: '/review-queue' },
        { text: String(offer.title ?? offer.unique_id), href: '#' },
      ]}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <StatusIndicator type={STATUS_TYPE[status] ?? 'info'}>{status}</StatusIndicator>
          <Button onClick={() => navigate('/review-queue')}>Back to queue</Button>
        </SpaceBetween>
      }
    >
      {actionError && (
        <Alert type="error" header="Action failed" dismissible onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Review Explainability & Diagnostic Signals */}
      {reviewSignals.length > 0 ? (
        <Container header={<Header variant="h2" description="Direct signals explaining why human review was triggered for this offer">Why is this in review?</Header>}>
          <SpaceBetween size="xs">
            {reviewSignals.map((sig, idx) => (
              <Alert key={idx} type={sig.type} header={sig.category}>
                <SpaceBetween size="xxs">
                  <Box>{sig.message}</Box>
                  {sig.detail && <Box fontSize="body-s" color="text-body-secondary">{sig.detail}</Box>}
                </SpaceBetween>
              </Alert>
            ))}
          </SpaceBetween>
        </Container>
      ) : (
        <Alert type="success" header="Quality Check Passed">
          No automated quality flags, validation errors, or duplicate conflicts detected.
        </Alert>
      )}

      <Container>
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={saveDraft} loading={busy === 'save'} disabled={Object.keys(draft).length === 0}>Save draft</Button>
          <Button variant="primary" onClick={() => approve(Object.keys(draft).length > 0)} loading={busy === 'approve'}
            disabled={!['DISCOVERED', 'VALIDATED', 'REVIEW_REQUIRED'].includes(reviewStatus)}>
            {Object.keys(draft).length > 0 ? 'Approve with corrections' : 'Approve'}
          </Button>
          <Button onClick={reject} loading={busy === 'reject'}
            disabled={!['DISCOVERED', 'VALIDATED', 'REVIEW_REQUIRED', 'APPROVED'].includes(reviewStatus)}>
            Reject
          </Button>
          <Button onClick={sendBack} loading={busy === 'sendback'} disabled={!['APPROVED', 'REJECTED'].includes(reviewStatus)}>
            Send back to review
          </Button>
          <Button onClick={publishSync} loading={busy === 'publish'}
            disabled={hasPending ? reviewStatus !== 'APPROVED' : status !== 'APPROVED'}>
            Publish / Sync
          </Button>
          <Button onClick={revalidateRules} loading={busy === 'revalidate'}>
            Revalidate rules
          </Button>
          <Button onClick={disable} loading={busy === 'disable'}>Disable</Button>
        </SpaceBetween>
      </Container>

      <Grid gridDefinition={[{ colspan: { default: 12, m: 4 } }, { colspan: { default: 12, m: 4 } }, { colspan: { default: 12, m: 4 } }]}>
        {/* LEFT — raw evidence */}
        <Container header={<Header variant="h2">Raw evidence</Header>}>
          <SpaceBetween size="s">
            <div><Box variant="awsui-key-label">Source URL</Box><Box fontSize="body-s">{String(offer.source_url ?? '—')}</Box></div>
            <div><Box variant="awsui-key-label">Retrieved at</Box><Box fontSize="body-s">{String((data.rawOffer as Record<string, unknown>)?.scrapedAt ?? '—')}</Box></div>
            <div><Box variant="awsui-key-label">Content hash</Box><Box fontSize="body-s">{String(offer.content_hash ?? '—').slice(0, 24)}…</Box></div>
            {Boolean((data.rawOffer as Record<string, unknown>)?.rawHtml) && (
              <ExpandableSection headerText="Raw HTML">
                <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 400, overflowY: 'auto' }}>
                  {String((data.rawOffer as Record<string, unknown>).rawHtml)}
                </pre>
              </ExpandableSection>
            )}
            <ExpandableSection headerText="Full scraped/normalized JSON">
              <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 400, overflowY: 'auto' }}>
                {JSON.stringify(data.rawOffer, null, 2)}
              </pre>
            </ExpandableSection>
          </SpaceBetween>
        </Container>

        {/* CENTER — normalized candidate (editable) */}
        <Container header={<Header variant="h2" description={hasPending ? 'Newer scraped candidate awaiting review' : 'Currently stored candidate'}>Normalized candidate</Header>}>
          <SpaceBetween size="s">
            {EDITABLE_FIELDS.map(f => (
              <FormField key={f.path} label={f.label}>
                <Input value={fieldValue(f.path)} onChange={e => setDraft(d => ({ ...d, [f.path]: e.detail.value }))} />
              </FormField>
            ))}
          </SpaceBetween>
        </Container>

        {/* RIGHT — effective / final offer */}
        <Container header={<Header variant="h2">Final effective offer</Header>}>
          <SpaceBetween size="s">
            {EDITABLE_FIELDS.map(f => {
              const rawVal = fmt(getPath(data.rawOffer, f.path));
              const finalVal = fmt(getPath(effective, f.path));
              const changed = rawVal !== finalVal;
              return (
                <div key={f.path}>
                  <Box variant="awsui-key-label">{f.label}</Box>
                  <Box fontWeight={changed ? 'bold' : undefined} color={changed ? 'text-status-info' : undefined}>{finalVal}</Box>
                  {changed && <Box fontSize="body-s" color="text-body-secondary">was: {rawVal}</Box>}
                </div>
              );
            })}
          </SpaceBetween>
        </Container>
      </Grid>

      {data.diff.length > 0 && (
        <Container header={<Header variant="h2" description="Published vs. scraped candidate vs. final effective value — unchanged fields are hidden">Field changes</Header>}>
          <Table
            columnDefinitions={[
              { id: 'field', header: 'Field', cell: d => d.field },
              { id: 'published', header: 'Published', cell: d => hasPending ? fmt(d.publishedValue) : '—' },
              { id: 'scraped', header: 'Scraped', cell: d => (
                <Box fontWeight={d.candidateChanged ? 'bold' : undefined}>{fmt(d.candidateValue)}</Box>
              ) },
              { id: 'final', header: 'Final', cell: d => (
                <SpaceBetween direction="horizontal" size="xxs">
                  <Box fontWeight={d.manuallyOverridden ? 'bold' : undefined}>{fmt(d.finalValue)}</Box>
                  {d.manuallyOverridden && <StatusIndicator type="info">overridden</StatusIndicator>}
                  {!d.manuallyOverridden && d.candidateChanged && <StatusIndicator type="warning">scraper change</StatusIndicator>}
                </SpaceBetween>
              ) },
            ]}
            items={data.diff}
            variant="embedded"
          />
        </Container>
      )}

      {data.duplicates.length > 0 && (
        <Container header={<Header variant="h2" description="Deterministic same-bank matches — review before this offer can publish">Possible duplicates</Header>}>
          <Table
            columnDefinitions={[
              { id: 'classification', header: 'Type', cell: d => d.classification },
              { id: 'score', header: 'Score', cell: d => `${d.score}/100` },
              { id: 'status', header: 'Review status', cell: d => d.status },
            ]}
            items={data.duplicates}
            variant="embedded"
          />
          <Box padding={{ top: 's' }}>
            <Button onClick={() => navigate('/duplicates')}>Open duplicate review</Button>
          </Box>
        </Container>
      )}

      <Grid gridDefinition={[{ colspan: { default: 12, m: 6 } }, { colspan: { default: 12, m: 6 } }]}>
        <Container
          header={
            <Header
              variant="h2"
              description="Deterministic rule engine, LLM semantic validation, and geo resolution status"
              actions={
                <StatusIndicator type={(validation?.rulePassed ?? offer.rule_passed) ? 'success' : 'error'}>
                  {(validation?.rulePassed ?? offer.rule_passed) ? 'Rules Passed' : 'Rules Failed'}
                </StatusIndicator>
              }
            >
              Validation & Confidence Diagnostics
            </Header>
          }
        >
          <SpaceBetween size="m">
            {/* Deterministic Rule Engine */}
            <div>
              <Box variant="awsui-key-label">Deterministic Rule Engine {hasPending ? '(pending candidate)' : ''}</Box>
              {data.validationReport?.rule_errors && data.validationReport.rule_errors.length > 0 ? (
                <SpaceBetween size="xxs">
                  {data.validationReport.rule_errors.map((err, i) => (
                    <Box key={i} fontSize="body-s" color="text-status-error">
                      <Badge color="red">{err.field || 'rule'}</Badge> {err.message}
                    </Box>
                  ))}
                </SpaceBetween>
              ) : (validation?.rulePassed ?? offer.rule_passed) ? (
                <Box fontSize="body-s" color="text-status-success">✓ All deterministic rules satisfied</Box>
              ) : (
                <Box fontSize="body-s" color="text-status-error">Rule validation failed</Box>
              )}

              {data.validationReport?.rule_warnings && data.validationReport.rule_warnings.length > 0 && (
                <Box margin={{ top: 'xs' }}>
                  <SpaceBetween size="xxs">
                    {data.validationReport.rule_warnings.map((warn, i) => (
                      <Box key={i} fontSize="body-s" color="text-status-warning">
                        <Badge color="blue">{warn.field || 'warning'}</Badge> {warn.message}
                      </Box>
                    ))}
                  </SpaceBetween>
                </Box>
              )}
            </div>

            {/* LLM Validation */}
            <div>
              <Box variant="awsui-key-label">LLM Validation & Confidence</Box>
              <SpaceBetween direction="horizontal" size="xs">
                <Box fontSize="heading-m" fontWeight="bold">
                  {(validation?.llmScore ?? offer.llm_score) != null
                    ? `${validation?.llmScore ?? offer.llm_score}/100`
                    : 'Not scored'}
                </Box>
                {data.validationReport?.llm_provider && (
                  <Badge color="grey">{data.validationReport.llm_provider}{data.validationReport.llm_model ? ` / ${data.validationReport.llm_model}` : ''}</Badge>
                )}
              </SpaceBetween>

              {(validation?.llmScore ?? offer.llm_score) != null && Number(validation?.llmScore ?? offer.llm_score) < 70 && (
                <Box margin={{ top: 'xs' }}>
                  <Alert type="warning" header="Low Confidence Assessment">
                    Score is below the 70-point threshold. Inspect ambiguity reasons below before approval.
                  </Alert>
                </Box>
              )}

              {data.validationReport?.llm_reasoning && (
                <Box margin={{ top: 'xs' }}>
                  <ExpandableSection headerText="LLM Evaluation Rationale" defaultExpanded={Number(validation?.llmScore ?? offer.llm_score) < 70}>
                    <Box fontSize="body-s" color="text-body-secondary" padding="xs">
                      {data.validationReport.llm_reasoning}
                    </Box>
                  </ExpandableSection>
                </Box>
              )}

              {data.validationReport?.llm_issues && data.validationReport.llm_issues.length > 0 && (
                <Box margin={{ top: 'xs' }}>
                  <Box variant="awsui-key-label">Detected Ambiguities / Issues</Box>
                  <SpaceBetween size="xxs">
                    {data.validationReport.llm_issues.map((iss, i) => (
                      <Box key={i} fontSize="body-s" color="text-status-warning">• {iss}</Box>
                    ))}
                  </SpaceBetween>
                </Box>
              )}
            </div>

            {/* Geo Scope & Status */}
            <div>
              <Box variant="awsui-key-label">Geo Location & Resolution</Box>
              <SpaceBetween direction="horizontal" size="xs">
                <StatusIndicator type={offer.geo_status === 'resolved' ? 'success' : offer.geo_status === 'ambiguous' ? 'warning' : 'stopped'}>
                  {String(offer.geo_status ?? 'unresolved')}
                </StatusIndicator>
                {offer.merchant_location && (
                  <Box fontSize="body-s" color="text-body-secondary">"{String(offer.merchant_location)}"</Box>
                )}
              </SpaceBetween>
              {offer.geo_status !== 'resolved' && (
                <Box margin={{ top: 'xxs' }}>
                  <Button variant="link" onClick={() => navigate('/geo-unresolved')}>Open unresolved geo queue</Button>
                </Box>
              )}
            </div>
          </SpaceBetween>
        </Container>

        <Container header={<Header variant="h2">Review history</Header>}>
          <Table
            columnDefinitions={[
              { id: 'action', header: 'Action', cell: h => h.action },
              { id: 'transition', header: 'Transition', cell: h => `${h.from_status ?? '—'} → ${h.to_status ?? '—'}` },
              { id: 'at', header: 'When', cell: h => new Date(h.created_at).toLocaleString() },
            ]}
            items={data.history}
            variant="embedded"
            empty={<Box textAlign="center" color="inherit">No review actions yet.</Box>}
          />
        </Container>
      </Grid>
    </PageLayout>
  );
}
