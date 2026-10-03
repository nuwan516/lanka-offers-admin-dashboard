import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Alert from '@cloudscape-design/components/alert';
import Spinner from '@cloudscape-design/components/spinner';
import Table from '@cloudscape-design/components/table';
import PageLayout from '../components/PageLayout';
import { api, type ApiOffer } from '../services/api';
import { useApi } from '../services/use-api';

function runStatusType(status: string) {
  if (status === 'completed') return 'success' as const;
  if (status === 'failed') return 'error' as const;
  if (status === 'running') return 'in-progress' as const;
  return 'stopped' as const;
}

function kv(label: string, value: string | number | null | undefined) {
  return (
    <div>
      <Box variant="awsui-key-label">{label}</Box>
      <div>{value ?? '—'}</div>
    </div>
  );
}

export default function ScrapeRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useApi(() => api.run(id!), [id]);
  const [revalidating, setRevalidating] = useState(false);
  const [revalidateResult, setRevalidateResult] = useState<{ total: number; passed: number; failed: number } | null>(null);
  const [revalidateError, setRevalidateError] = useState<string | null>(null);

  const run = data?.run;
  const offers = data?.offers ?? [];

  const durationStr = (() => {
    if (!run) return '—';
    if (!run.finished_at) return run.status === 'running' ? 'Running…' : '—';
    const ms = new Date(run.finished_at).getTime() - new Date(run.started_at).getTime();
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  })();

  async function runRevalidate() {
    if (!run) return;
    setRevalidating(true);
    setRevalidateError(null);
    try {
      const result = await api.revalidate(run.bank);
      setRevalidateResult(result);
    } catch (e) {
      setRevalidateError(e instanceof Error ? e.message : String(e));
    } finally {
      setRevalidating(false);
    }
  }

  // Build the DB status explanation
  function dbStatusSummary() {
    if (!run || run.status !== 'completed') return null;
    const found = run.offers_found ?? 0;
    const newCount = run.offers_new ?? 0;
    const changed = run.offers_changed ?? 0;
    const unchanged = run.offers_unchanged ?? 0;
    const savedTotal = newCount + changed + unchanged;

    let detail = '';
    if (newCount === 0 && unchanged > 0) {
      detail = `All ${unchanged} offers already existed in Neon Postgres and were updated in place (no content change detected — content hashes matched).`;
    } else if (newCount > 0 && unchanged === 0) {
      detail = `${newCount} new offers were inserted into Neon Postgres.`;
    } else {
      detail = `${newCount} new, ${changed} changed, ${unchanged} unchanged — all upserted into Neon Postgres.`;
    }

    return (
      <Alert
        type="success"
        header={`${found} offers found — ${savedTotal} saved to Neon Postgres`}
      >
        <SpaceBetween size="s">
          <Box>{detail}</Box>
          <Box color="text-body-secondary">
            "0 new" does not mean the DB was skipped — it means all scraped offers already had records in the database
            and were re-confirmed. Every offer from this run is stored and accessible in the offers table.
          </Box>
        </SpaceBetween>
      </Alert>
    );
  }

  return (
    <PageLayout
      title={run ? `Run ${run.id.slice(0, 8)}` : (id ? `Run ${id.slice(0, 8)}` : 'Scrape Run Details')}
      description={run ? `${run.bank.toUpperCase()} — ${run.mode}` : undefined}
      breadcrumbs={[
        { text: 'Scrape runs', href: '/runs' },
        { text: run ? `${run.bank.toUpperCase()} run ${run.id.slice(0, 8)}` : (id ?? ''), href: '' },
      ]}
      actions={
        run ? (
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => navigate('/runs')}>All runs</Button>
            <Button onClick={() => navigate(`/offers?bank=${run.bank}`)}>
              View {run.bank.toUpperCase()} offers
            </Button>
            <Button variant="primary" loading={revalidating} onClick={runRevalidate}>
              Run re-validation
            </Button>
          </SpaceBetween>
        ) : undefined
      }
      error={error}
    >
      {loading && <Spinner size="large" />}

      {run && (
        <>
          {/* DB state explanation */}
          {dbStatusSummary()}

          {revalidateResult && (
            <Alert type="success" header="Re-validation complete" dismissible onDismiss={() => setRevalidateResult(null)}>
              Processed {revalidateResult.total} {run.bank.toUpperCase()} offers — {revalidateResult.passed} passed, {revalidateResult.failed} failed.
              Neon Postgres updated.
            </Alert>
          )}
          {revalidateError && (
            <Alert type="error" header="Re-validation failed" dismissible onDismiss={() => setRevalidateError(null)}>
              {revalidateError}
            </Alert>
          )}

          <Container header={<Header variant="h2">Run details</Header>}>
            <ColumnLayout columns={4} variant="text-grid">
              {kv('Bank', run.bank.toUpperCase())}
              {kv('Mode', run.mode)}
              <div>
                <Box variant="awsui-key-label">Status</Box>
                <StatusIndicator type={runStatusType(run.status)}>{run.status}</StatusIndicator>
              </div>
              {kv('Triggered by', run.triggered_by)}
              {kv('Started', new Date(run.started_at).toLocaleString())}
              {kv('Finished', run.finished_at ? new Date(run.finished_at).toLocaleString() : '—')}
              {kv('Duration', durationStr)}
              {kv('Offers found', run.offers_found)}
              <div>
                <Box variant="awsui-key-label">New to DB</Box>
                <Box>{run.offers_new ?? '—'}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Content changed</Box>
                <Box>{run.offers_changed ?? '—'}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Unchanged (upserted)</Box>
                <Box>{run.offers_unchanged ?? '—'}</Box>
              </div>
              {kv('Scraper errors', run.errors)}
            </ColumnLayout>
            {run.error_message && (
              <Box padding={{ top: 'm' }}>
                <Alert type="error" header="Error">{run.error_message}</Alert>
              </Box>
            )}
          </Container>

          <Container header={<Header variant="h2" description="All offers from this run are stored in Neon Postgres — you can validate, edit status, or view the map.">Next steps</Header>}>
            <SpaceBetween direction="horizontal" size="s">
              <Button onClick={() => navigate(`/offers?bank=${run.bank}`)}>
                Browse {run.bank.toUpperCase()} offers
              </Button>
              <Button onClick={() => navigate('/geo')}>View geo map</Button>
              <Button onClick={() => navigate('/rules')}>Manage rules</Button>
              <Button variant="primary" loading={revalidating} onClick={runRevalidate}>
                Run re-validation on {run.bank.toUpperCase()}
              </Button>
            </SpaceBetween>
          </Container>

          <Table
            header={
              <Header
                variant="h2"
                counter={`(${offers.length})`}
                description={offers.length === 0
                  ? 'No offers are linked to this run ID yet — they may have been scraped before run-ID tracking was added.'
                  : undefined}
                actions={
                  <Button onClick={() => navigate(`/offers?bank=${run.bank}`)}>
                    View all {run.bank.toUpperCase()} offers
                  </Button>
                }
              >
                Offers from this run
              </Header>
            }
            columnDefinitions={[
              {
                id: 'title', header: 'Title',
                cell: (o: ApiOffer) => (
                  <Button variant="link" onClick={() => navigate(`/offers/${o.id}/review`)}>
                    {o.title}
                  </Button>
                ),
              },
              { id: 'bank', header: 'Bank', width: 80, cell: (o: ApiOffer) => o.bank.toUpperCase() },
              { id: 'merchant', header: 'Merchant', cell: (o: ApiOffer) => o.merchant_name ?? '—' },
              {
                id: 'llm_score', header: 'LLM score', width: 90,
                cell: (o: ApiOffer) => o.llm_score != null ? `${o.llm_score}/100` : '—',
              },
              {
                id: 'rule_passed', header: 'Rules', width: 90,
                cell: (o: ApiOffer) => (
                  <StatusIndicator type={o.rule_passed ? 'success' : 'error'}>
                    {o.rule_passed ? 'Passed' : 'Failed'}
                  </StatusIndicator>
                ),
              },
              {
                id: 'db_status', header: 'DB status', width: 90,
                cell: (o: ApiOffer) => (
                  <StatusIndicator type={o.db_status === 'PUBLISHED' ? 'success' : o.db_status === 'REJECTED' ? 'error' : 'stopped'}>
                    {o.db_status}
                  </StatusIndicator>
                ),
              },
            ]}
            items={offers}
            empty={
              <Box textAlign="center" color="inherit" padding={{ vertical: 'l' }}>
                No offers are linked to this run. All {run.offers_found ?? 0} offers are still in Neon Postgres — view them via{' '}
                <Button variant="link" onClick={() => navigate(`/offers?bank=${run.bank}`)}>
                  {run.bank.toUpperCase()} offers
                </Button>.
              </Box>
            }
            variant="full-page"
            stickyHeader
          />
        </>
      )}
    </PageLayout>
  );
}
