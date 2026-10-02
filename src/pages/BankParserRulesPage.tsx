import { useState, useCallback } from 'react';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Tabs from '@cloudscape-design/components/tabs';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Toggle from '@cloudscape-design/components/toggle';
import Alert from '@cloudscape-design/components/alert';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Badge from '@cloudscape-design/components/badge';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import { api } from '../services/api';
import type {
  ApiBankParserRule,
  ApiBankParserTestResult,
  ApiParserBacktestResult,
  ApiGoldenCase,
  ApiGoldenRunResult,
  ApiGoldenTestResultItem,
} from '../services/api';
import { useApi } from '../services/use-api';


const BANKS = ['hnb', 'boc', 'sampath', 'ndb', 'dfcc', 'seylan', 'peoples', 'pabc', 'nsb', 'combank'] as const;
type BankName = typeof BANKS[number];

const BANK_LABELS: Record<BankName, string> = {
  hnb: 'HNB', boc: 'BOC', sampath: 'Sampath', ndb: 'NDB', dfcc: 'DFCC',
  seylan: 'Seylan', peoples: "People's", pabc: 'PABC', nsb: 'NSB', combank: 'COMBANK',
};

const BANK_SOURCE_TYPE: Record<BankName, string> = {
  hnb: 'JSON API + HTML text', sampath: 'JSON API', ndb: 'HTML',
  boc: 'HTML', dfcc: 'HTML', seylan: 'HTML', peoples: 'HTML',
  pabc: 'HTML', nsb: 'HTML', combank: 'HTML',
};

const FIELD_OPTIONS = [
  { label: 'merchant_name — merchant name extraction', value: 'merchant_name' },
  { label: 'discount_pct — discount percentage', value: 'discount_pct' },
  { label: 'transaction_min — minimum spend', value: 'transaction_min' },
  { label: 'transaction_max — maximum spend', value: 'transaction_max' },
  { label: 'card_types — eligible card types', value: 'card_types' },
  { label: 'booking_required — detect booking requirement', value: 'booking_required' },
  { label: 'installment_rate — installment interest rate', value: 'installment_rate' },
];

const getFieldLabel = (f: string) => FIELD_OPTIONS.find(o => o.value === f)?.label.split(' — ')[0] ?? f;

const RULE_TYPE_OPTIONS = [
  { label: 'regex', value: 'regex', description: 'Run a regular expression; extract a capture group' },
  { label: 'field_map', value: 'field_map', description: 'Read a named key directly from the raw JSON' },
  { label: 'keyword_list', value: 'keyword_list', description: 'Detect any of a comma-separated list of keywords' },
  { label: 'constant', value: 'constant', description: 'Always return a fixed string value' },
];

const RULE_TYPE_BADGE: Record<string, 'blue' | 'green' | 'grey' | 'red'> = {
  regex: 'blue', field_map: 'green', keyword_list: 'grey', constant: 'red',
};

interface EditState {
  id?: string;
  bank: string;
  field: string;
  rule_type: string;
  pattern: string;
  flags: string;
  capture_group: string;
  enabled: boolean;
  notes: string;
  /** Evaluation order — lower number = higher priority. Default 100. */
  priority: string;
  /** Dot-path into raw_offer JSON to use as input, e.g. "promotion_details" */
  source_path: string;
}


function emptyEdit(bank: string): EditState {
  return {
    bank, field: 'merchant_name', rule_type: 'regex',
    pattern: '', flags: 'i', capture_group: '1', enabled: true, notes: '',
    priority: '100', source_path: '',
  };
}


interface TestPanelProps {
  result: ApiBankParserTestResult;
  onDismiss: () => void;
}

interface BacktestPanelProps {
  result: ApiParserBacktestResult;
  onDismiss: () => void;
}

function BacktestPanel({ result, onDismiss }: BacktestPanelProps) {
  const totalSamples = result.byField.reduce((acc, f) => acc + f.samples, 0);
  const totalMatched = result.byField.reduce((acc, f) => acc + f.matched, 0);
  const totalUnchanged = result.byField.reduce((acc, f) => acc + f.unchanged, 0);
  const totalChanged = result.byField.reduce((acc, f) => acc + f.changed, 0);
  const totalNewValues = result.byField.reduce((acc, f) => acc + f.newValues, 0);
  const totalNewNulls = result.byField.reduce((acc, f) => acc + f.newNulls, 0);
  const totalErrors = result.byField.reduce((acc, f) => acc + f.errors, 0);

  const coveragePct = totalSamples > 0 ? Math.round((totalMatched / totalSamples) * 100) : 0;

  const fieldsWithCandidates = result.byField.filter(f => f.regressionCandidates && f.regressionCandidates.length > 0);

  return (
    <Container
      header={
        <Header
          variant="h3"
          actions={<Button variant="link" onClick={onDismiss}>Dismiss</Button>}
          description="Compares extracted values against current normalized database values. Categorized into unchanged, changed, new values, new nulls, and errors."
        >
          Backtest — {result.bank.toUpperCase()} ({result.offersScanned} offers, {result.rulesEvaluated} rules)
        </Header>
      }
    >
      <SpaceBetween size="l">
        <ColumnLayout columns={6} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Offers scanned</Box>
            <Box variant="awsui-value-large">{result.offersScanned}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Overall coverage</Box>
            <StatusIndicator type={coveragePct >= 80 ? 'success' : coveragePct >= 40 ? 'warning' : 'error'}>
              {coveragePct}% ({totalMatched}/{totalSamples})
            </StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Unchanged</Box>
            <StatusIndicator type="success">{totalUnchanged}</StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Changed</Box>
            <StatusIndicator type={totalChanged > 0 ? 'warning' : 'stopped'}>{totalChanged}</StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">New values</Box>
            <StatusIndicator type={totalNewValues > 0 ? 'info' : 'stopped'}>{totalNewValues}</StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">New nulls / Errors</Box>
            <StatusIndicator type={(totalNewNulls > 0 || totalErrors > 0) ? 'error' : 'stopped'}>
              {totalNewNulls} nulls / {totalErrors} err
            </StatusIndicator>
          </div>
        </ColumnLayout>

        <Table
          variant="embedded"
          columnDefinitions={[
            {
              id: 'field', header: 'Field', width: 150,
              cell: (r) => <Box fontWeight="bold">{r.field}</Box>,
            },
            {
              id: 'samples', header: 'Samples', width: 90,
              cell: (r) => r.samples,
            },
            {
              id: 'coverage', header: 'Coverage', width: 140,
              cell: (r) => {
                const pct = r.samples > 0 ? Math.round((r.matched / r.samples) * 100) : 0;
                return (
                  <StatusIndicator type={pct >= 80 ? 'success' : pct >= 40 ? 'warning' : 'error'}>
                    {r.matched}/{r.samples} ({pct}%)
                  </StatusIndicator>
                );
              },
            },
            {
              id: 'unchanged', header: 'Unchanged', width: 100,
              cell: (r) => <Box color={r.unchanged > 0 ? 'text-status-success' : 'inherit'}>{r.unchanged}</Box>,
            },
            {
              id: 'changed', header: 'Changed', width: 100,
              cell: (r) => r.changed > 0 ? (
                <StatusIndicator type="warning">{r.changed}</StatusIndicator>
              ) : <Box color="text-status-inactive">0</Box>,
            },
            {
              id: 'newValues', header: 'New values', width: 100,
              cell: (r) => r.newValues > 0 ? (
                <StatusIndicator type="info">{r.newValues}</StatusIndicator>
              ) : <Box color="text-status-inactive">0</Box>,
            },
            {
              id: 'newNulls', header: 'New nulls', width: 100,
              cell: (r) => r.newNulls > 0 ? (
                <StatusIndicator type="error">{r.newNulls}</StatusIndicator>
              ) : <Box color="text-status-inactive">0</Box>,
            },
            {
              id: 'errors', header: 'Errors', width: 90,
              cell: (r) => r.errors > 0 ? (
                <StatusIndicator type="error">{r.errors}</StatusIndicator>
              ) : <Box color="text-status-inactive">0</Box>,
            },
          ]}
          items={result.byField}
          empty={<Box textAlign="center" padding={{ vertical: 'l' }}>No enabled rules for this bank.</Box>}
        />

        {fieldsWithCandidates.length > 0 && (
          <SpaceBetween size="m">
            <Header variant="h3" description="Offers where the rule produced a different value, returned null, or failed execution.">
              Regression Candidates & Review Samples ({fieldsWithCandidates.reduce((acc, f) => acc + f.regressionCandidates.length, 0)} total)
            </Header>

            {fieldsWithCandidates.map((f) => (
              <ExpandableSection
                key={f.field}
                headerText={`${f.field} (${f.regressionCandidates.length} samples: ${f.changed} changed, ${f.newNulls} new null, ${f.errors} errors)`}
                defaultExpanded={f.errors > 0 || f.newNulls > 0}
              >
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    {
                      id: 'classification', header: 'Status', width: 140,
                      cell: (c) => (
                        <Badge color={c.classification === 'ERROR' ? 'red' : c.classification === 'NEW_NULL' ? 'red' : 'blue'}>
                          {c.classification === 'CHANGED' ? 'REVIEW_CHANGE' : c.classification}
                        </Badge>
                      ),
                    },
                    {
                      id: 'title', header: 'Offer title', width: 260,
                      cell: (c) => <Box fontSize="body-s">{c.title.substring(0, 75)}</Box>,
                    },
                    {
                      id: 'rawSourceValue', header: 'Raw source value', width: 220,
                      cell: (c) => c.rawSourceValue ? (
                        <code style={{ fontSize: 11, wordBreak: 'break-all' }}>{c.rawSourceValue.substring(0, 100)}</code>
                      ) : <Box color="text-status-inactive">—</Box>,
                    },
                    {
                      id: 'currentValue', header: 'Current DB value', width: 150,
                      cell: (c) => c.currentValue !== null ? (
                        <code style={{ fontSize: 11 }}>{c.currentValue}</code>
                      ) : <Box color="text-status-inactive">null</Box>,
                    },
                    {
                      id: 'ruleResult', header: 'Rule result', width: 150,
                      cell: (c) => c.ruleResult !== null ? (
                        <code style={{ fontSize: 11, fontWeight: 'bold', color: c.classification === 'CHANGED' ? '#b26b00' : 'inherit' }}>
                          {c.ruleResult}
                        </code>
                      ) : <Box color="text-status-inactive">null</Box>,
                    },
                    {
                      id: 'ruleInfo', header: 'Rule ID', width: 130,
                      cell: (c) => <Box fontSize="body-s" color="text-body-secondary">{c.ruleId.substring(0, 8)} (v{c.ruleVersion})</Box>,
                    },
                  ]}
                  items={f.regressionCandidates}
                  empty={<Box textAlign="center">No candidates found.</Box>}
                />
              </ExpandableSection>
            ))}
          </SpaceBetween>
        )}
      </SpaceBetween>
    </Container>
  );
}



function TestPanel({ result, onDismiss }: TestPanelProps) {
  const pct = result.total > 0 ? Math.round((result.matched / result.total) * 100) : 0;
  return (
    <Container
      header={
        <Header
          variant="h3"
          actions={<Button variant="link" onClick={onDismiss}>Dismiss</Button>}
        >
          Test results — {result.matched}/{result.total} matched ({pct}%)
        </Header>
      }
    >
      <SpaceBetween size="m">
        <ColumnLayout columns={3} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Total offers tested</Box>
            <Box variant="awsui-value-large">{result.total}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Matched</Box>
            <StatusIndicator type="success">{result.matched}</StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">No match</Box>
            <StatusIndicator type={result.unmatched > 0 ? 'warning' : 'success'}>{result.unmatched}</StatusIndicator>
          </div>
        </ColumnLayout>

        <Table
          variant="embedded"
          columnDefinitions={[
            {
              id: 'status', header: '', width: 30,
              cell: (r) => <StatusIndicator type={r.matched ? 'success' : 'stopped'}>{''}</StatusIndicator>,
            },
            {
              id: 'title', header: 'Offer title', width: 320,
              cell: (r) => <Box fontSize="body-s">{r.title.substring(0, 80)}</Box>,
            },
            {
              id: 'extracted', header: 'Extracted value',
              cell: (r) => r.extracted
                ? <code style={{ fontSize: 12 }}>{r.extracted.substring(0, 120)}</code>
                : <Box color="text-status-inactive">no match</Box>,
            },
          ]}
          items={result.results}
          empty={<Box textAlign="center" padding={{ vertical: 'l' }}>No offers found for this bank in the database.</Box>}
        />
      </SpaceBetween>
    </Container>
  );
}

interface GoldenCasesSectionProps {
  bank: BankName;
}

function GoldenCasesSection({ bank }: GoldenCasesSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  const { data, loading } = useApi(() => api.goldenCases(bank), [bank, refreshKey]);
  const cases: ApiGoldenCase[] = data?.items ?? [];

  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<ApiGoldenRunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<{
    id?: string;
    bank: string;
    field: string;
    expected_value: string;
    offer_unique_id: string;
    offer_title: string;
    notes: string;
    enabled: boolean;
  }>({
    bank,
    field: 'discount_pct',
    expected_value: '',
    offer_unique_id: '',
    offer_title: '',
    notes: '',
    enabled: true,
  });

  const [deleteTarget, setDeleteTarget] = useState<ApiGoldenCase | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setRunError(null);
    try {
      const res = await api.runGoldenCases({ bank });
      setRunResult(res);
    } catch (err: any) {
      setRunError(err?.message || 'Failed to execute golden tests');
    } finally {
      setRunning(false);
    }
  };

  const openAdd = () => {
    setEditingCase({
      bank,
      field: 'discount_pct',
      expected_value: '',
      offer_unique_id: '',
      offer_title: '',
      notes: '',
      enabled: true,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (c: ApiGoldenCase) => {
    setEditingCase({
      id: c.id,
      bank: c.bank,
      field: c.field,
      expected_value: typeof c.expected_value === 'object' ? JSON.stringify(c.expected_value) : String(c.expected_value ?? ''),
      offer_unique_id: c.offer_unique_id ?? '',
      offer_title: c.offer_title ?? '',
      notes: c.notes ?? '',
      enabled: c.enabled,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingCase.field) {
      setSaveError('Field is required');
      return;
    }
    if (editingCase.expected_value === undefined || editingCase.expected_value === '') {
      setSaveError('Expected value is required');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      let parsedExpected: any = editingCase.expected_value;
      if (['discount_pct', 'transaction_min', 'transaction_max', 'installment_rate'].includes(editingCase.field)) {
        const num = parseFloat(editingCase.expected_value.replace(/[%$,]/g, '').trim());
        if (!isNaN(num)) parsedExpected = num;
      } else if (editingCase.field === 'booking_required') {
        if (editingCase.expected_value.toLowerCase() === 'true') parsedExpected = true;
        if (editingCase.expected_value.toLowerCase() === 'false') parsedExpected = false;
      }

      if (editingCase.id) {
        await api.updateGoldenCase(editingCase.id, {
          field: editingCase.field,
          expectedValue: parsedExpected,
          offerUniqueId: editingCase.offer_unique_id || undefined,
          offerTitle: editingCase.offer_title || undefined,
          notes: editingCase.notes || undefined,
          enabled: editingCase.enabled,
        });
      } else {
        await api.createGoldenCase({
          bank,
          field: editingCase.field,
          expectedValue: parsedExpected,
          offerUniqueId: editingCase.offer_unique_id || undefined,
          offerTitle: editingCase.offer_title || undefined,
          notes: editingCase.notes || undefined,
          enabled: editingCase.enabled,
        });
      }
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save golden case');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteGoldenCase(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete golden case');
    }
  };

  const statusMap = new Map<string, ApiGoldenTestResultItem>();
  if (runResult?.cases) {
    for (const item of runResult.cases) {
      statusMap.set(item.caseId, item);
    }
  }

  const failedCases = runResult?.cases.filter(c => c.status === 'FAIL') ?? [];

  return (
    <Container
      header={
        <Header
          variant="h3"
          counter={`(${cases.length})`}
          description="Golden Cases define verified ground-truth expectations. Run Golden Tests to ensure current dynamic rules correctly extract these values."
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                loading={running}
                disabled={cases.length === 0}
                onClick={handleRun}
              >
                Run Golden Tests
              </Button>
              <Button variant="primary" onClick={openAdd}>
                Add Golden Case
              </Button>
            </SpaceBetween>
          }
        >
          {BANK_LABELS[bank]} Golden Cases
        </Header>
      }
    >
      <SpaceBetween size="m">
        {runError && (
          <Alert type="error" dismissible onDismiss={() => setRunError(null)}>
            {runError}
          </Alert>
        )}

        {runResult && (
          <Container
            header={
              <Header
                variant="h3"
                actions={<Button variant="link" onClick={() => setRunResult(null)}>Dismiss</Button>}
                description="Deterministic correctness assertion against saved golden values"
              >
                Golden Test Results — {BANK_LABELS[bank]}
              </Header>
            }
          >
            <SpaceBetween size="m">
              <ColumnLayout columns={4} variant="text-grid">
                <div>
                  <Box variant="awsui-key-label">Total</Box>
                  <Box variant="awsui-value-large">{runResult.total}</Box>
                </div>
                <div>
                  <Box variant="awsui-key-label">Passed</Box>
                  <StatusIndicator type="success">{runResult.passed}</StatusIndicator>
                </div>
                <div>
                  <Box variant="awsui-key-label">Failed</Box>
                  <StatusIndicator type={runResult.failed > 0 ? 'error' : 'stopped'}>{runResult.failed}</StatusIndicator>
                </div>
                <div>
                  <Box variant="awsui-key-label">Pass rate</Box>
                  <StatusIndicator type={runResult.passRate >= 90 ? 'success' : runResult.passRate >= 60 ? 'warning' : 'error'}>
                    {runResult.passRate.toFixed(1)}%
                  </StatusIndicator>
                </div>
              </ColumnLayout>

              {failedCases.length > 0 && (
                <Alert type="error" header={`${failedCases.length} Golden Case(s) Failed`}>
                  <SpaceBetween size="s">
                    {failedCases.map(fc => (
                      <Container key={fc.caseId} variant="stacked">
                        <SpaceBetween size="xs">
                          <Box>
                            <strong>Offer:</strong> {fc.offerTitle || fc.caseId}
                          </Box>
                          <Box>
                            <strong>Field:</strong> <code>{fc.field}</code> |{' '}
                            <strong>Expected:</strong> <code style={{ color: 'green' }}>{JSON.stringify(fc.expected)}</code> |{' '}
                            <strong>Actual:</strong> <code style={{ color: 'red' }}>{JSON.stringify(fc.actual)}</code> |{' '}
                            <strong>Rule ID:</strong> <code>{fc.whichRuleRan ?? 'fallback/none'}</code>
                          </Box>
                          <ExpandableSection headerText="Execution trace details">
                            <Box fontSize="body-s">
                              <div><strong>Rule evaluated:</strong> {fc.whichRuleRan} (v{fc.ruleVersion})</div>
                              <div><strong>Source path:</strong> {fc.sourcePath || '(entire raw JSON)'}</div>
                              <div><strong>Input text read:</strong> <code>{fc.inputValue ? fc.inputValue.substring(0, 200) : '(empty)'}</code></div>
                              <div><strong>Regex matched:</strong> {fc.regexMatched ? 'Yes' : 'No'}</div>
                              <div><strong>Captured value:</strong> {fc.capture ?? '(none)'}</div>
                              <div><strong>Used fallback:</strong> {fc.usedFallback ? 'Yes' : 'No'}</div>
                              {fc.error && <div><strong>Error:</strong> <span style={{ color: 'red' }}>{fc.error}</span></div>}
                            </Box>
                          </ExpandableSection>
                        </SpaceBetween>
                      </Container>
                    ))}
                  </SpaceBetween>
                </Alert>
              )}
            </SpaceBetween>
          </Container>
        )}

        <Table
          variant="embedded"
          loading={loading}
          columnDefinitions={[
            {
              id: 'offer',
              header: 'Offer title / Reference',
              width: 260,
              cell: (c: ApiGoldenCase) => (
                <Box>
                  <Box fontWeight="bold" fontSize="body-s">
                    {c.offer_title || c.offer_unique_id || '(Any offer matching bank)'}
                  </Box>
                  {c.offer_unique_id && (
                    <Box color="text-body-secondary" fontSize="body-s">
                      <code>{c.offer_unique_id}</code>
                    </Box>
                  )}
                </Box>
              ),
            },
            {
              id: 'field',
              header: 'Field',
              width: 140,
              cell: (c: ApiGoldenCase) => <Box fontWeight="bold">{getFieldLabel(c.field)}</Box>,
            },
            {
              id: 'expected',
              header: 'Expected value',
              width: 160,
              cell: (c: ApiGoldenCase) => (
                <code style={{ fontSize: 12 }}>{JSON.stringify(c.expected_value)}</code>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              width: 110,
              cell: (c: ApiGoldenCase) => {
                const testItem = statusMap.get(c.id);
                if (testItem) {
                  return (
                    <Badge color={testItem.status === 'PASS' ? 'green' : 'red'}>
                      {testItem.status}
                    </Badge>
                  );
                }
                return (
                  <StatusIndicator type={c.enabled ? 'success' : 'stopped'}>
                    {c.enabled ? 'Enabled' : 'Disabled'}
                  </StatusIndicator>
                );
              },
            },
            {
              id: 'notes',
              header: 'Notes',
              cell: (c: ApiGoldenCase) => (
                <Box color="text-body-secondary" fontSize="body-s">
                  {c.notes || '—'}
                </Box>
              ),
            },
            {
              id: 'actions',
              header: '',
              width: 140,
              cell: (c: ApiGoldenCase) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => openEdit(c)}>
                    Edit
                  </Button>
                  <Button variant="link" onClick={() => setDeleteTarget(c)}>
                    Delete
                  </Button>
                </SpaceBetween>
              ),
            },
          ]}
          items={cases}
          empty={
            <Box textAlign="center" padding={{ vertical: 'm' }} color="inherit">
              No golden cases defined for {BANK_LABELS[bank]}. Click "Add Golden Case" to mark an offer expectation.
            </Box>
          }
        />

        {/* Add / Edit Modal */}
        <Modal
          visible={modalOpen}
          onDismiss={() => setModalOpen(false)}
          header={editingCase.id ? 'Edit Golden Case' : `Add Golden Case for ${BANK_LABELS[bank]}`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" loading={saving} onClick={handleSave}>
                  {editingCase.id ? 'Save changes' : 'Create case'}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            {saveError && <Alert type="error">{saveError}</Alert>}

            <FormField
              label="Offer Unique ID or Title"
              description="e.g. Unique ID from raw offers table, or title reference. Leave blank to match the first offer from this bank."
            >
              <Input
                value={editingCase.offer_unique_id}
                onChange={e => setEditingCase(s => ({ ...s, offer_unique_id: e.detail.value }))}
                placeholder="e.g. hnb_offer_123 or title excerpt"
              />
            </FormField>

            <FormField label="Field" description="The parser field being verified">
              <Select
                selectedOption={
                  FIELD_OPTIONS.find(o => o.value === editingCase.field) ?? {
                    label: editingCase.field,
                    value: editingCase.field,
                  }
                }
                onChange={e => setEditingCase(s => ({ ...s, field: e.detail.selectedOption.value! }))}
                options={FIELD_OPTIONS}
              />
            </FormField>

            <FormField
              label="Expected Value"
              description='Exact expected extracted value (e.g. "20", "Sampath Bank", "true")'
            >
              <Input
                value={editingCase.expected_value}
                onChange={e => setEditingCase(s => ({ ...s, expected_value: e.detail.value }))}
                placeholder='e.g. 20'
              />
            </FormField>

            <FormField label="Notes / Reason" description="Why this expectation is canonical">
              <Input
                value={editingCase.notes}
                onChange={e => setEditingCase(s => ({ ...s, notes: e.detail.value }))}
                placeholder="e.g. 20% discount explicitly specified in promo text"
              />
            </FormField>

            <Toggle
              checked={editingCase.enabled}
              onChange={e => setEditingCase(s => ({ ...s, enabled: e.detail.checked }))}
            >
              {editingCase.enabled ? 'Enabled in golden test suite' : 'Disabled'}
            </Toggle>
          </SpaceBetween>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={!!deleteTarget}
          onDismiss={() => setDeleteTarget(null)}
          header="Delete Golden Case"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleDelete}>
                  Delete
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Box>
            Are you sure you want to delete this golden case for{' '}
            <strong>{deleteTarget ? getFieldLabel(deleteTarget.field) : ''}</strong>? This action cannot be undone.
          </Box>
        </Modal>
      </SpaceBetween>
    </Container>
  );
}

interface BankTabProps {
  bank: BankName;
  rules: ApiBankParserRule[];
  loading: boolean;
  onRefresh: () => void;
}

function BankTab({ bank, rules, loading, onRefresh }: BankTabProps) {
  const [editModal, setEditModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(emptyEdit(bank));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ApiBankParserTestResult | null>(null);
  const [testRuleId, setTestRuleId] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [backtesting, setBacktesting] = useState(false);
  const [backtestResult, setBacktestResult] = useState<ApiParserBacktestResult | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);


  function openAdd() {
    setEditState(emptyEdit(bank));
    setSaveError(null);
    setEditModal(true);
  }

  function openEdit(r: ApiBankParserRule) {
    setEditState({
      id: r.id, bank: r.bank, field: r.field, rule_type: r.rule_type,
      pattern: r.pattern ?? '', flags: r.flags,
      capture_group: String(r.capture_group ?? 1),
      enabled: r.enabled, notes: r.notes ?? '',
      priority: String(r.priority ?? 100),
      source_path: r.source_path ?? '',
    });
    setSaveError(null);
    setEditModal(true);
  }


  async function save() {
    setSaving(true); setSaveError(null);
    try {
      const payload = {
        bank: editState.bank,
        field: editState.field,
        rule_type: editState.rule_type as ApiBankParserRule['rule_type'],
        pattern: editState.pattern || null,
        flags: editState.flags,
        capture_group: parseInt(editState.capture_group) || 1,
        enabled: editState.enabled,
        notes: editState.notes || null,
        priority: parseInt(editState.priority) || 100,
        source_path: editState.source_path || null,
      };
      if (editState.id) {
        await api.updateBankParserRule(editState.id, payload);
      } else {
        await api.createBankParserRule(payload);
      }
      setEditModal(false);
      onRefresh();
    } catch (e: any) {
      setSaveError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }


  async function confirmDelete() {
    if (!deleteId) return;
    try { await api.deleteBankParserRule(deleteId); onRefresh(); }
    catch { /* ignore */ }
    finally { setDeleteId(null); }
  }

  async function runTest(r: ApiBankParserRule) {
    setTestingId(r.id);
    setTestRuleId(r.id);
    setTestResult(null);
    setTestError(null);
    try {
      const result = await api.testBankParserRule(r.id, 20);
      setTestResult(result);
    } catch (e: any) {
      setTestError(e.message ?? 'Test failed');
    } finally {
      setTestingId(null);
    }
  }

  async function runBacktest() {
    setBacktesting(true);
    setBacktestResult(null);
    setBacktestError(null);
    try {
      const result = await api.bankParserBacktest(bank, 30);
      setBacktestResult(result);
    } catch (e: any) {
      setBacktestError(e.message ?? 'Backtest failed');
    } finally {
      setBacktesting(false);
    }
  }



  const fieldLabel = (f: string) => FIELD_OPTIONS.find(o => o.value === f)?.label.split(' — ')[0] ?? f;

  const patternCell = (r: ApiBankParserRule) => {
    if (!r.pattern) return <Box color="text-status-inactive">—</Box>;
    if (r.rule_type === 'regex') {
      return (
        <Box>
          <code style={{ fontSize: 12, wordBreak: 'break-all' }}>/{r.pattern}/{r.flags}</code>
          {r.capture_group > 0 && <Box color="text-body-secondary" fontSize="body-s">group {r.capture_group}</Box>}
        </Box>
      );
    }
    if (r.rule_type === 'keyword_list') {
      return (
        <SpaceBetween direction="horizontal" size="xxs">
          {r.pattern.split(',').map(k => k.trim()).filter(Boolean).map(k => (
            <Badge key={k} color="grey">{k}</Badge>
          ))}
        </SpaceBetween>
      );
    }
    return <code style={{ fontSize: 12 }}>{r.pattern}</code>;
  };

  return (
    <SpaceBetween size="m">
      <Alert type="info" header={`Source type: ${BANK_SOURCE_TYPE[bank]}`}>
        Rules below control how the {BANK_LABELS[bank]} parser extracts each field from raw scraped data.
        Click <strong>Test</strong> to run a rule against the 20 most recent {BANK_LABELS[bank]} offers in the database.
        Click <strong>Backtest</strong> to evaluate ALL active rules against the last 30 offers at once.
      </Alert>

      {backtestError && (
        <Alert type="error" dismissible onDismiss={() => setBacktestError(null)}>{backtestError}</Alert>
      )}
      {backtestResult && (
        <BacktestPanel result={backtestResult} onDismiss={() => setBacktestResult(null)} />
      )}


      {testError && (
        <Alert type="error" dismissible onDismiss={() => setTestError(null)}>{testError}</Alert>
      )}

      {testResult && testRuleId && (
        <TestPanel result={testResult} onDismiss={() => { setTestResult(null); setTestRuleId(null); }} />
      )}

      <Table
        loading={loading}
        header={
          <Header
            variant="h3"
            counter={`(${rules.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button loading={backtesting} onClick={runBacktest}>Backtest all rules</Button>
                <Button variant="primary" onClick={openAdd}>Add rule</Button>
              </SpaceBetween>
            }
          >
            {BANK_LABELS[bank]} parser rules
          </Header>
        }

        columnDefinitions={[
          {
            id: 'field', header: 'Field', width: 160,
            cell: (r: ApiBankParserRule) => <Box fontWeight="bold">{fieldLabel(r.field)}</Box>,
          },
          {
            id: 'priority', header: 'Priority', width: 80,
            cell: (r: ApiBankParserRule) => <Box color="text-body-secondary" fontSize="body-s">{r.priority ?? 100}</Box>,
          },
          {
            id: 'type', header: 'Type', width: 110,
            cell: (r: ApiBankParserRule) => (
              <Badge color={RULE_TYPE_BADGE[r.rule_type] ?? 'grey'}>{r.rule_type}</Badge>
            ),
          },

          {
            id: 'pattern', header: 'Pattern / keywords / field',
            cell: patternCell,
          },
          {
            id: 'enabled', header: 'Enabled', width: 100,
            cell: (r: ApiBankParserRule) => (
              <StatusIndicator type={r.enabled ? 'success' : 'stopped'}>
                {r.enabled ? 'Enabled' : 'Disabled'}
              </StatusIndicator>
            ),
          },
          {
            id: 'source', header: 'Source', width: 100,
            cell: (r: ApiBankParserRule) => r.is_builtin
              ? <Box color="text-body-secondary" fontSize="body-s">Built-in</Box>
              : <Badge color="blue">Custom</Badge>,
          },
          {
            id: 'actions', header: '',
            cell: (r: ApiBankParserRule) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  loading={testingId === r.id}
                  onClick={() => runTest(r)}
                >
                  Test
                </Button>
                <Button variant="link" onClick={() => openEdit(r)}>Edit</Button>
                {!r.is_builtin && (
                  <Button variant="link" onClick={() => setDeleteId(r.id)}>Delete</Button>
                )}
              </SpaceBetween>
            ),
          },
        ]}
        items={rules}
        empty={
          <Box textAlign="center" padding={{ vertical: 'xxl' }} color="inherit">
            No parser rules configured for {BANK_LABELS[bank]}. Add one to get started.
          </Box>
        }
      />

      {rules.some(r => r.notes) && (
        <ExpandableSection headerText="Rule notes">
          <SpaceBetween size="s">
            {rules.filter(r => r.notes).map(r => (
              <Box key={r.id} fontSize="body-s">
                <strong>{fieldLabel(r.field)}</strong> — {r.notes}
              </Box>
            ))}
          </SpaceBetween>
        </ExpandableSection>
      )}

      {/* ── Golden Cases (Ground Truth Verification) ── */}
      <GoldenCasesSection bank={bank} />

      {/* ── Edit / Add modal ── */}
      <Modal
        visible={editModal}
        onDismiss={() => setEditModal(false)}
        size="large"
        header={editState.id ? `Edit rule — ${fieldLabel(editState.field)}` : `Add parser rule for ${BANK_LABELS[bank]}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setEditModal(false)}>Cancel</Button>
              <Button variant="primary" loading={saving} onClick={save}>
                {editState.id ? 'Save changes' : 'Add rule'}
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          {saveError && <Alert type="error">{saveError}</Alert>}

          <ColumnLayout columns={2}>
            <FormField label="Field" description="Which offer field this rule extracts">
              <Select
                selectedOption={FIELD_OPTIONS.find(o => o.value === editState.field) ?? { label: editState.field, value: editState.field }}
                onChange={e => setEditState(s => ({ ...s, field: e.detail.selectedOption.value! }))}
                options={FIELD_OPTIONS}
              />
            </FormField>
            <FormField label="Rule type">
              <Select
                selectedOption={RULE_TYPE_OPTIONS.find(o => o.value === editState.rule_type) ?? { label: editState.rule_type, value: editState.rule_type }}
                onChange={e => setEditState(s => ({ ...s, rule_type: e.detail.selectedOption.value! }))}
                options={RULE_TYPE_OPTIONS}
              />
            </FormField>
          </ColumnLayout>

          <FormField
            label={
              editState.rule_type === 'field_map' ? 'Field name in raw JSON' :
              editState.rule_type === 'keyword_list' ? 'Keywords (comma-separated)' :
              editState.rule_type === 'constant' ? 'Constant value' : 'Regex pattern'
            }
            description={
              editState.rule_type === 'regex' ? 'JavaScript regex without delimiters, e.g. (\\d+(?:\\.\\d+)?)\\s*%' :
              editState.rule_type === 'field_map' ? 'Top-level key in the raw_offer JSON, e.g. company_name or short_discount' :
              editState.rule_type === 'keyword_list' ? 'Comma-separated keywords to detect, e.g. credit,debit,visa,master' :
              'Fixed string always returned — useful for constant identifiers'
            }
          >
            <Input
              value={editState.pattern}
              onChange={e => setEditState(s => ({ ...s, pattern: e.detail.value }))}
              placeholder={
                editState.rule_type === 'regex' ? '(\\d+(?:\\.\\d+)?)\\s*%\\s*(?:off|discount)' :
                editState.rule_type === 'field_map' ? 'company_name' :
                editState.rule_type === 'keyword_list' ? 'credit,debit,visa,master' : 'constant value'
              }
            />
          </FormField>

          {editState.rule_type === 'regex' && (
            <ColumnLayout columns={2}>
              <FormField label="Regex flags" description="i = ignore case, g = global, m = multiline">
                <Input
                  value={editState.flags}
                  onChange={e => setEditState(s => ({ ...s, flags: e.detail.value }))}
                  placeholder="i"
                />
              </FormField>
              <FormField label="Capture group" description="Which group to extract (1 = first group, 0 = full match)">
                <Input
                  value={editState.capture_group}
                  onChange={e => setEditState(s => ({ ...s, capture_group: e.detail.value }))}
                  type="number"
                />
              </FormField>
            </ColumnLayout>
          )}

          <FormField label="Notes" description="Optional explanation of what this rule does and why">
            <Input
              value={editState.notes}
              onChange={e => setEditState(s => ({ ...s, notes: e.detail.value }))}
              placeholder="e.g. Extracts discount % from BOC offer value field"
            />
          </FormField>

          <ColumnLayout columns={2}>
            <FormField
              label="Priority"
              description="Evaluation order — lower runs first. Multiple rules for the same field are tried in priority order until one matches."
            >
              <Input
                type="number"
                value={editState.priority}
                onChange={e => setEditState(s => ({ ...s, priority: e.detail.value }))}
                placeholder="100"
              />
            </FormField>
            <FormField
              label="Source path"
              description='Dot-path into raw_offer JSON to use as input, e.g. "promotion_details" or "offer.description". Leave blank to match against the full JSON string.'
            >
              <Input
                value={editState.source_path}
                onChange={e => setEditState(s => ({ ...s, source_path: e.detail.value }))}
                placeholder="promotion_details"
              />
            </FormField>
          </ColumnLayout>

          <Toggle
            checked={editState.enabled}
            onChange={e => setEditState(s => ({ ...s, enabled: e.detail.checked }))}
          >
            {editState.enabled ? 'Enabled — rule is active' : 'Disabled — rule is skipped'}
          </Toggle>
        </SpaceBetween>
      </Modal>

      {/* ── Delete confirmation ── */}
      <Modal
        visible={!!deleteId}
        onDismiss={() => setDeleteId(null)}
        header="Delete custom rule"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="primary" onClick={confirmDelete}>Delete</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Box>This custom parser rule will be permanently deleted. Built-in rules cannot be deleted — disable them instead.</Box>
      </Modal>
    </SpaceBetween>
  );
}

export default function BankParserRulesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const { data, loading, error } = useApi(() => api.bankParserRules(), [refreshKey]);
  const allRules = data?.items ?? [];

  if (error) {
    return (
      <SpaceBetween size="l">
        <Header variant="h1">Bank Parser Rules</Header>
        <Alert type="error" header="Could not load rules">
          {error}. Make sure the API server is running: <code>npm run api</code> in the LankaOffers directory.
        </Alert>
      </SpaceBetween>
    );
  }

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="View and edit the extraction rules used by each bank's offer parser. Changes affect future re-parses. Use Test to verify a pattern against real scraped data."
        counter={data ? `(${allRules.length} rules across ${BANKS.length} banks)` : undefined}
      >
        Bank Parser Rules
      </Header>

      <Tabs
        tabs={BANKS.map(bank => ({
          id: bank,
          label: `${BANK_LABELS[bank]} (${allRules.filter(r => r.bank === bank).length})`,
          content: (
            <BankTab
              key={bank}
              bank={bank}
              rules={allRules.filter(r => r.bank === bank)}
              loading={loading}
              onRefresh={refresh}
            />
          ),
        }))}
      />
    </SpaceBetween>
  );
}
