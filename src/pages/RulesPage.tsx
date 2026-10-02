import { useState } from 'react';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import Table from '@cloudscape-design/components/table';
import Button from '@cloudscape-design/components/button';
import Tabs from '@cloudscape-design/components/tabs';
import Toggle from '@cloudscape-design/components/toggle';
import Select from '@cloudscape-design/components/select';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Textarea from '@cloudscape-design/components/textarea';
import Input from '@cloudscape-design/components/input';
import Badge from '@cloudscape-design/components/badge';
import { useNavigate } from 'react-router-dom';
import { api, type ApiBacktestResult, type ApiCustomRule, type ApiRuleTestResult } from '../services/api';
import { useApi } from '../services/use-api';

// ─── Operator catalogue ───────────────────────────────────────────────────────

const OPERATORS = [
  { value: 'required',              label: 'required',              hint: 'Value must exist (not null/undefined)' },
  { value: 'not_empty',             label: 'not_empty',             hint: 'String must be non-empty after trim' },
  { value: 'min',                   label: 'min',                   hint: 'Number ≥ min' },
  { value: 'max',                   label: 'max',                   hint: 'Number ≤ max' },
  { value: 'between',               label: 'between',               hint: 'Number between min and max (inclusive)' },
  { value: 'matches',               label: 'matches',               hint: 'String matches a regex pattern' },
  { value: 'min_length',            label: 'min_length',            hint: 'String length ≥ length' },
  { value: 'max_length',            label: 'max_length',            hint: 'String length ≤ length' },
  { value: 'not_expired',           label: 'not_expired',           hint: 'Date string (YYYY-MM-DD) must not be in the past' },
  { value: 'lte_field',             label: 'lte_field',             hint: 'Value ≤ value at another field path (dates or numbers)' },
  { value: 'gte_field',             label: 'gte_field',             hint: 'Value ≥ value at another field path' },
  { value: 'array_any_not_expired', label: 'array_any_not_expired', hint: 'Array: at least one element\'s date field is not expired' },
  { value: 'has_value',             label: 'has_value',             hint: 'At least one of a list of fields must have a value' },
];

const OPERATOR_OPTIONS = OPERATORS.map(o => ({ label: o.label, value: o.value, description: o.hint }));

const COMMON_FIELDS = [
  'uniqueId', 'source', 'title', 'category', 'cardType', 'scrapedAt', 'contentHash',
  'merchant.name', 'merchant.location',
  'offer.discountPercentage',
  'transactionRange.min', 'transactionRange.max',
  'validityPeriods[0].validFrom', 'validityPeriods[0].validTo',
  'validityPeriods',
];

const GROUPS = ['Required fields', 'Dates', 'Offer quality', 'Merchant', 'Transaction range', 'Integrity', 'Custom'];

const SEVERITY_OPTIONS = [
  { label: 'error', value: 'error' },
  { label: 'warning', value: 'warning' },
];

// ─── Dynamic config fields ────────────────────────────────────────────────────

function ConfigFields({ operator, config, onChange }: {
  operator: string;
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const noConfig = ['required', 'not_empty', 'not_expired'];
  if (noConfig.includes(operator) || !operator) {
    return <Box color="text-body-secondary" fontSize="body-s">No extra configuration for this operator.</Box>;
  }
  if (operator === 'min' || operator === 'max') {
    const key = operator;
    return (
      <FormField label={operator === 'min' ? 'Minimum value' : 'Maximum value'}>
        <Input type="number" value={String(config[key] ?? '')}
          onChange={e => onChange({ ...config, [key]: e.detail.value === '' ? undefined : Number(e.detail.value) })}
          placeholder="e.g. 0"
        />
      </FormField>
    );
  }
  if (operator === 'between') {
    return (
      <ColumnLayout columns={2}>
        <FormField label="Minimum">
          <Input type="number" value={String(config.min ?? '')}
            onChange={e => onChange({ ...config, min: e.detail.value === '' ? undefined : Number(e.detail.value) })}
          />
        </FormField>
        <FormField label="Maximum">
          <Input type="number" value={String(config.max ?? '')}
            onChange={e => onChange({ ...config, max: e.detail.value === '' ? undefined : Number(e.detail.value) })}
          />
        </FormField>
      </ColumnLayout>
    );
  }
  if (operator === 'matches') {
    return (
      <FormField label="Regex pattern" description="JavaScript RegExp without the slashes — e.g. ^\\d{4}-\\d{2}-\\d{2}$">
        <Input value={String(config.pattern ?? '')}
          onChange={e => onChange({ ...config, pattern: e.detail.value })}
          placeholder="^\d{4}-\d{2}-\d{2}$"
        />
      </FormField>
    );
  }
  if (operator === 'min_length' || operator === 'max_length') {
    return (
      <FormField label={operator === 'min_length' ? 'Minimum length' : 'Maximum length'}>
        <Input type="number" value={String(config.length ?? '')}
          onChange={e => onChange({ ...config, length: e.detail.value === '' ? undefined : Number(e.detail.value) })}
          placeholder="e.g. 3"
        />
      </FormField>
    );
  }
  if (operator === 'lte_field' || operator === 'gte_field') {
    return (
      <FormField label="Other field path" description="Dot-notation path to compare against">
        <Input value={String(config.other_field ?? '')}
          onChange={e => onChange({ ...config, other_field: e.detail.value })}
          placeholder="e.g. transactionRange.max"
        />
      </FormField>
    );
  }
  if (operator === 'array_any_not_expired') {
    return (
      <FormField label="Date field name" description="The field within each array element that holds the date (YYYY-MM-DD)">
        <Input value={String(config.date_field ?? '')}
          onChange={e => onChange({ ...config, date_field: e.detail.value })}
          placeholder="e.g. validTo"
        />
      </FormField>
    );
  }
  if (operator === 'has_value') {
    return (
      <FormField label="Field paths (comma-separated)" description="At least one must have a non-empty value">
        <Input
          value={Array.isArray(config.fields) ? (config.fields as string[]).join(', ') : String(config.fields ?? '')}
          onChange={e => onChange({ ...config, fields: e.detail.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="e.g. merchant.location, merchant.addresses[0]"
        />
      </FormField>
    );
  }
  return null;
}

// ─── Rule form ────────────────────────────────────────────────────────────────

const ALL_BANKS = ['hnb', 'boc', 'sampath', 'peoples', 'ndb', 'seylan', 'dfcc', 'pabc', 'nsb', 'combank'];

interface RuleForm {
  name: string; description: string; group_name: string;
  severity: 'error' | 'warning'; field_path: string;
  operator: string; config: Record<string, unknown>; notes: string;
  banks: string[] | null;
}

const BLANK: RuleForm = {
  name: '', description: '', group_name: 'Custom', severity: 'warning',
  field_path: '', operator: 'required', config: {}, notes: '', banks: null,
};

function toForm(r: ApiCustomRule): RuleForm {
  return { name: r.name, description: r.description ?? '', group_name: r.group_name,
    severity: r.severity, field_path: r.field_path, operator: r.operator,
    config: r.config ?? {}, notes: r.notes ?? '', banks: r.banks ?? null };
}

// ─── Rule modal ───────────────────────────────────────────────────────────────

function RuleModal({ initial, editingRule, onSave, onCancel, saving, saveError }: {
  initial: RuleForm; editingRule: ApiCustomRule | null;
  onSave: (f: RuleForm) => void; onCancel: () => void;
  saving: boolean; saveError: string | null;
}) {
  const [form, setForm] = useState<RuleForm>(initial);
  const isBuiltin = editingRule?.is_builtin ?? false;

  return (
    <Modal
      visible
      size="large"
      header={editingRule ? (isBuiltin ? 'Edit built-in rule' : 'Edit custom rule') : 'Create rule'}
      onDismiss={onCancel}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={() => onSave(form)}>
              {editingRule ? 'Save changes' : 'Create rule'}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {saveError && <Alert type="error">{saveError}</Alert>}
        {isBuiltin && (
          <Alert type="info">
            This is a built-in rule. Editing its field path or operator changes how validation works globally.
          </Alert>
        )}

        <ColumnLayout columns={2}>
          <FormField label="Rule name">
            <Input value={form.name} onChange={e => setForm(s => ({ ...s, name: e.detail.value }))}
              placeholder="e.g. Title minimum length"
            />
          </FormField>
          <FormField label="Group">
            <Select
              selectedOption={{ label: form.group_name, value: form.group_name }}
              onChange={e => setForm(s => ({ ...s, group_name: e.detail.selectedOption.value! }))}
              options={GROUPS.map(g => ({ label: g, value: g }))}
            />
          </FormField>
        </ColumnLayout>

        <FormField label="Description">
          <Input value={form.description} onChange={e => setForm(s => ({ ...s, description: e.detail.value }))}
            placeholder="What does this rule check?"
          />
        </FormField>

        <ColumnLayout columns={2}>
          <FormField label="Severity">
            <Select
              selectedOption={{ label: form.severity, value: form.severity }}
              onChange={e => setForm(s => ({ ...s, severity: e.detail.selectedOption.value as 'error' | 'warning' }))}
              options={SEVERITY_OPTIONS}
            />
          </FormField>
          <FormField label="Operator">
            <Select
              selectedOption={OPERATOR_OPTIONS.find(o => o.value === form.operator) ?? OPERATOR_OPTIONS[0]}
              onChange={e => setForm(s => ({ ...s, operator: e.detail.selectedOption.value!, config: {} }))}
              options={OPERATOR_OPTIONS}
            />
          </FormField>
        </ColumnLayout>

        <FormField
          label="Field path"
          description="Dot-notation path into the raw offer JSON"
        >
          <SpaceBetween size="xxs">
            <Input value={form.field_path} onChange={e => setForm(s => ({ ...s, field_path: e.detail.value }))}
              placeholder="e.g. merchant.name"
            />
            <Box color="text-body-secondary" fontSize="body-s">
              Common:{' '}
              {COMMON_FIELDS.map((f, i) => (
                <span key={f}>
                  {i > 0 && ', '}
                  <Button variant="link" onClick={() => setForm(s => ({ ...s, field_path: f }))}>{f}</Button>
                </span>
              ))}
            </Box>
          </SpaceBetween>
        </FormField>

        <Container header={<Header variant="h3" description="Parameters for the selected operator">Operator config</Header>}>
          <ConfigFields operator={form.operator} config={form.config} onChange={c => setForm(s => ({ ...s, config: c }))} />
        </Container>

        <FormField label="Notes">
          <Textarea value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.detail.value }))}
            placeholder="Why does this rule exist? Any edge cases?" rows={2}
          />
        </FormField>

        <FormField
          label="Bank scope"
          description="Leave all unselected to apply to every bank. Select specific banks to restrict the rule."
        >
          <SpaceBetween size="xs">
            <Box color="text-body-secondary" fontSize="body-s">
              {form.banks === null ? 'All banks (universal)' : `Scoped to: ${form.banks.join(', ')}`}
            </Box>
            <SpaceBetween direction="horizontal" size="xs">
              {ALL_BANKS.map(bank => {
                const active = form.banks?.includes(bank) ?? false;
                return (
                  <Button
                    key={bank}
                    variant={active ? 'primary' : 'normal'}
                    onClick={() => setForm(s => {
                      const current = s.banks ?? [];
                      const next = active
                        ? current.filter(b => b !== bank)
                        : [...current, bank];
                      return { ...s, banks: next.length === 0 ? null : next };
                    })}
                  >
                    {bank.toUpperCase()}
                  </Button>
                );
              })}
              {form.banks !== null && (
                <Button variant="link" onClick={() => setForm(s => ({ ...s, banks: null }))}>Clear (all banks)</Button>
              )}
            </SpaceBetween>
          </SpaceBetween>
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}

// ─── Test result ──────────────────────────────────────────────────────────────

function TestPanel({ result, onClose }: { result: ApiRuleTestResult; onClose: () => void }) {
  const rate = result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
  return (
    <Container header={<Header variant="h3" actions={<Button variant="link" onClick={onClose}>Close</Button>}>Test result — {result.total} offers sampled</Header>}>
      <SpaceBetween size="m">
        <ColumnLayout columns={4} variant="text-grid">
          <div><Box variant="awsui-key-label">Passed</Box><StatusIndicator type="success">{result.passed}</StatusIndicator></div>
          <div><Box variant="awsui-key-label">Failed</Box><StatusIndicator type={result.failed > 0 ? 'error' : 'success'}>{result.failed}</StatusIndicator></div>
          <div><Box variant="awsui-key-label">Skipped (out of scope)</Box><Box>{result.skipped ?? 0}</Box></div>
          <div><Box variant="awsui-key-label">Pass rate</Box><Box variant="awsui-value-large">{rate}%</Box></div>
        </ColumnLayout>
        {result.failures.length > 0 && (
          <Table
            header={<Header variant="h3">Sample failures (first {result.failures.length})</Header>}
            columnDefinitions={[
              { id: 'bank', header: 'Bank', width: 70, cell: (r: ApiRuleTestResult['failures'][0]) => r.bank.toUpperCase() },
              { id: 'title', header: 'Title', cell: (r: ApiRuleTestResult['failures'][0]) => r.title },
              { id: 'msg', header: 'Reason', cell: (r: ApiRuleTestResult['failures'][0]) => <Box color="text-status-error" fontSize="body-s">{r.message}</Box> },
            ]}
            items={result.failures}
            variant="embedded"
          />
        )}
      </SpaceBetween>
    </Container>
  );
}

// ─── Inline operator summary ──────────────────────────────────────────────────

function opSummary(rule: ApiCustomRule): string {
  const c = rule.config as any;
  switch (rule.operator) {
    case 'required':              return 'must exist';
    case 'not_empty':             return 'must not be empty';
    case 'min':                   return `≥ ${c.min}`;
    case 'max':                   return `≤ ${c.max}`;
    case 'between':               return `${c.min} – ${c.max}`;
    case 'matches':               return `/${c.pattern}/`;
    case 'min_length':            return `length ≥ ${c.length}`;
    case 'max_length':            return `length ≤ ${c.length}`;
    case 'not_expired':           return 'not expired';
    case 'lte_field':             return `≤ ${c.other_field}`;
    case 'gte_field':             return `≥ ${c.other_field}`;
    case 'array_any_not_expired': return `any [].${c.date_field} not expired`;
    case 'has_value':             return `any of [${(c.fields ?? []).join(', ')}]`;
    default:                      return rule.operator;
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RulesPage() {
  const navigate = useNavigate();
  const [backtestKey, setBacktestKey] = useState(0);
  const [modal, setModal] = useState<{ form: RuleForm; editing: ApiCustomRule | null } | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ApiCustomRule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [testResult, setTestResult] = useState<ApiRuleTestResult | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [revalidating, setRevalidating] = useState(false);
  const [revalidateResult, setRevalidateResult] = useState<{ total: number; passed: number; failed: number } | null>(null);
  const [bankFilter, setBankFilter] = useState<any>({ label: 'All banks', value: '' });

  const BANKS = ['hnb', 'boc', 'sampath', 'ndb', 'dfcc', 'seylan', 'peoples', 'pabc', 'nsb', 'combank'];

  const { data: rulesData, loading: rulesLoading, error: rulesError, refetch: refetchRules } = useApi(() => api.customRules(), []);
  const { data: backtest, loading: backtestLoading, error: backtestError } = useApi(() => api.backtest(), [backtestKey]);

  const allRules = rulesData?.items ?? [];
  const builtinRules = allRules.filter(r => r.is_builtin);
  const customRules = allRules.filter(r => !r.is_builtin);

  const total = parseInt(backtest?.summary.total ?? '0');
  const passed = parseInt(backtest?.summary.passed ?? '0');
  const failed = parseInt(backtest?.summary.failed ?? '0');
  const passRate = total > 0 ? Math.round((passed / total) * 100) : null;

  async function toggleRule(rule: ApiCustomRule) {
    setGlobalError(null);
    try {
      await api.updateCustomRule(rule.id, { enabled: !rule.enabled });
      refetchRules();
    } catch (e) { setGlobalError(e instanceof Error ? e.message : String(e)); }
  }

  async function saveRule(form: RuleForm) {
    if (!form.name.trim() || !form.field_path.trim() || !form.operator) {
      setModalError('Name, field path, and operator are required.'); return;
    }
    setModalSaving(true);
    setModalError(null);
    try {
      if (modal?.editing) {
        await api.updateCustomRule(modal.editing.id, {
          name: form.name, description: form.description || null, group_name: form.group_name,
          severity: form.severity, field_path: form.field_path, operator: form.operator,
          config: form.config, notes: form.notes || null, banks: form.banks,
        });
      } else {
        await api.createCustomRule({
          name: form.name, description: form.description || null, group_name: form.group_name,
          severity: form.severity, enabled: true, field_path: form.field_path,
          operator: form.operator, config: form.config, notes: form.notes || null,
          is_builtin: false, builtin_id: null, banks: form.banks,
        });
      }
      setModal(null);
      refetchRules();
    } catch (e) { setModalError(e instanceof Error ? e.message : String(e)); }
    finally { setModalSaving(false); }
  }

  async function deleteRule(rule: ApiCustomRule) {
    setDeleting(true);
    try {
      await api.deleteCustomRule(rule.id);
      setDeleteConfirm(null);
      refetchRules();
    } catch (e) { setGlobalError(e instanceof Error ? e.message : String(e)); }
    finally { setDeleting(false); }
  }

  async function testRule(rule: ApiCustomRule) {
    setTesting(rule.id);
    setTestResult(null);
    try {
      const result = await api.testCustomRule(rule.id, undefined, 100);
      setTestResult(result);
    } catch (e) { setGlobalError(e instanceof Error ? e.message : String(e)); }
    finally { setTesting(null); }
  }

  async function runRevalidate() {
    setRevalidating(true);
    setRevalidateResult(null);
    try {
      const result = await api.revalidate(bankFilter.value || undefined);
      setRevalidateResult(result);
      setBacktestKey(k => k + 1);
    } catch (e) { setGlobalError(e instanceof Error ? e.message : String(e)); }
    finally { setRevalidating(false); }
  }

  // Shared column definitions used by both tables
  function ruleColumns(showDelete: boolean) {
    return [
      {
        id: 'enabled', header: 'On', width: 60,
        cell: (r: ApiCustomRule) => <Toggle checked={r.enabled} onChange={() => toggleRule(r)} />,
      },
      {
        id: 'severity', header: 'Severity', width: 95,
        cell: (r: ApiCustomRule) => (
          <StatusIndicator type={r.severity === 'error' ? 'error' : 'warning'}>{r.severity}</StatusIndicator>
        ),
      },
      {
        id: 'group', header: 'Group', width: 155,
        cell: (r: ApiCustomRule) => r.group_name,
      },
      {
        id: 'name', header: 'Name', width: 200,
        cell: (r: ApiCustomRule) => <Box fontWeight="bold">{r.name}</Box>,
      },
      {
        id: 'rule', header: 'Field path → operator → condition',
        cell: (r: ApiCustomRule) => (
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {r.field_path}
            <span style={{ color: '#687078', margin: '0 6px' }}>→</span>
            {r.operator}
            <span style={{ color: '#687078', margin: '0 6px' }}>→</span>
            {opSummary(r)}
          </span>
        ),
      },
      {
        id: 'banks', header: 'Banks', width: 140,
        cell: (r: ApiCustomRule) => r.banks === null
          ? <Box color="text-body-secondary" fontSize="body-s">All</Box>
          : <SpaceBetween direction="horizontal" size="xxs">{r.banks.map(b => <Badge key={b}>{b.toUpperCase()}</Badge>)}</SpaceBetween>,
      },
      {
        id: 'actions', header: '', width: showDelete ? 165 : 120,
        cell: (r: ApiCustomRule) => (
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" loading={testing === r.id} onClick={() => testRule(r)}>Test</Button>
            <Button variant="link" onClick={() => { setModalError(null); setModal({ form: toForm(r), editing: r }); }}>Edit</Button>
            {showDelete && (
              <Button variant="link" onClick={() => setDeleteConfirm(r)}>Delete</Button>
            )}
          </SpaceBetween>
        ),
      },
    ];
  }

  const anyError = rulesError ?? backtestError ?? globalError;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description={`${builtinRules.length} built-in + ${customRules.length} custom rules — all configurable, all stored in Neon Postgres`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => navigate('/validation')}>Validation reports</Button>
            <Button loading={backtestLoading} onClick={() => setBacktestKey(k => k + 1)}>Refresh backtest</Button>
          </SpaceBetween>
        }
      >
        Rules
      </Header>

      {anyError && (
        <Alert type="error" header="Error" dismissible onDismiss={() => setGlobalError(null)}>{anyError}</Alert>
      )}
      {revalidateResult && (
        <Alert type="success" header="Re-validation complete" dismissible onDismiss={() => setRevalidateResult(null)}>
          Processed {revalidateResult.total} offers — {revalidateResult.passed} passed, {revalidateResult.failed} failed. Neon Postgres updated.
        </Alert>
      )}

      <Container header={<Header variant="h2">Backtest — current rule results across all offers in DB</Header>}>
        {backtestLoading ? <Spinner /> : (
          <ColumnLayout columns={4} variant="text-grid">
            <div><Box variant="awsui-key-label">Total offers</Box><Box variant="awsui-value-large">{total}</Box></div>
            <div><Box variant="awsui-key-label">Passed</Box><StatusIndicator type="success">{passed}</StatusIndicator></div>
            <div><Box variant="awsui-key-label">Failed</Box><StatusIndicator type={failed > 0 ? 'error' : 'success'}>{failed}</StatusIndicator></div>
            <div><Box variant="awsui-key-label">Pass rate</Box><Box variant="awsui-value-large">{passRate != null ? `${passRate}%` : '—'}</Box></div>
          </ColumnLayout>
        )}
      </Container>

      <Container header={<Header variant="h2">Re-run validation</Header>}>
        <SpaceBetween size="s">
          <Box color="text-body-secondary">
            Applies all enabled rules to stored offers and updates rule_passed, rule_errors, rule_warnings in Neon Postgres.
          </Box>
          <SpaceBetween direction="horizontal" size="s">
            <Select
              selectedOption={bankFilter}
              onChange={e => setBankFilter(e.detail.selectedOption)}
              options={[{ label: 'All banks', value: '' }, ...BANKS.map(b => ({ label: b.toUpperCase(), value: b }))]}
            />
            <Button variant="primary" loading={revalidating} onClick={runRevalidate}>
              {revalidating ? 'Re-validating…' : 'Run re-validation'}
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      </Container>

      <Tabs
        tabs={[
          // ─── Custom rules (user-created) ──────────────────────────────────
          {
            id: 'custom',
            label: `Custom rules (${customRules.length})`,
            content: (
              <SpaceBetween size="m">
                <Table
                  loading={rulesLoading}
                  header={
                    <Header
                      variant="h2"
                      counter={`(${customRules.length})`}
                      description="Rules you create through the UI — stored in Neon Postgres, no code required."
                      actions={
                        <Button variant="primary" iconName="add-plus"
                          onClick={() => { setModalError(null); setModal({ form: BLANK, editing: null }); }}
                        >
                          Create rule
                        </Button>
                      }
                    >
                      Custom rules
                    </Header>
                  }
                  columnDefinitions={ruleColumns(true)}
                  items={customRules}
                  empty={
                    <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
                      No custom rules.{' '}
                      <Button variant="link" onClick={() => { setModalError(null); setModal({ form: BLANK, editing: null }); }}>
                        Create the first one
                      </Button>
                    </Box>
                  }
                  variant="full-page"
                  stickyHeader
                />
                {testResult && <TestPanel result={testResult} onClose={() => setTestResult(null)} />}
              </SpaceBetween>
            ),
          },

          // ─── Built-in rules (seeded from BUILTIN_RULE_SEED) ───────────────
          {
            id: 'builtin',
            label: `Built-in rules (${builtinRules.length})`,
            content: (
              <SpaceBetween size="m">
                <Alert type="info">
                  These 16 rules are seeded from the system definition into Neon Postgres on startup.
                  You can toggle them on/off, adjust severity, or change field path and operator — all without touching code.
                </Alert>
                <Table
                  loading={rulesLoading}
                  header={
                    <Header
                      variant="h2"
                      counter={`(${builtinRules.length})`}
                      description="System rules — editable in the DB, never locked to code."
                    >
                      Built-in rules
                    </Header>
                  }
                  columnDefinitions={ruleColumns(false)}
                  items={builtinRules}
                  empty={<Box textAlign="center" color="inherit">Restart the API server to seed built-in rules.</Box>}
                  variant="full-page"
                  stickyHeader
                />
                {testResult && <TestPanel result={testResult} onClose={() => setTestResult(null)} />}
              </SpaceBetween>
            ),
          },

          // ─── By bank ──────────────────────────────────────────────────────
          {
            id: 'byBank',
            label: 'By bank',
            content: (
              <Table
                loading={backtestLoading}
                header={<Header variant="h2" description="Pass/fail per bank from last backtest">Results by bank</Header>}
                columnDefinitions={[
                  {
                    id: 'bank', header: 'Bank',
                    cell: (r: ApiBacktestResult['byBank'][0]) => (
                      <Button variant="link" onClick={() => navigate(`/offers?bank=${r.bank}`)}>{r.bank.toUpperCase()}</Button>
                    ),
                  },
                  { id: 'total', header: 'Total', cell: (r: ApiBacktestResult['byBank'][0]) => r.total },
                  { id: 'passed', header: 'Passed', cell: (r: ApiBacktestResult['byBank'][0]) => <StatusIndicator type="success">{r.passed}</StatusIndicator> },
                  {
                    id: 'failed', header: 'Failed',
                    cell: (r: ApiBacktestResult['byBank'][0]) => (
                      <StatusIndicator type={parseInt(r.failed) > 0 ? 'error' : 'success'}>{r.failed}</StatusIndicator>
                    ),
                  },
                  {
                    id: 'passRate', header: 'Pass rate',
                    cell: (r: ApiBacktestResult['byBank'][0]) => {
                      const t = parseInt(r.total), p = parseInt(r.passed);
                      return t > 0 ? `${Math.round((p / t) * 100)}%` : '—';
                    },
                  },
                  {
                    id: 'actions', header: '',
                    cell: (r: ApiBacktestResult['byBank'][0]) => (
                      <Button variant="link" onClick={() => navigate(`/offers?bank=${r.bank}`)}>View offers</Button>
                    ),
                  },
                ]}
                items={backtest?.byBank ?? []}
                empty={<Box textAlign="center" color="inherit">Run re-validation to populate.</Box>}
                variant="full-page"
                stickyHeader
              />
            ),
          },

          // ─── Error hits ───────────────────────────────────────────────────
          {
            id: 'errors',
            label: `Error hits (${backtest?.errors.length ?? 0})`,
            content: (
              <Table
                loading={backtestLoading}
                header={<Header variant="h2">Rule error hits across all offers</Header>}
                columnDefinitions={[
                  { id: 'field', header: 'Field', width: 240, cell: (r: { field: string; message: string; hit_count: string }) => <Box fontWeight="bold">{r.field}</Box> },
                  { id: 'message', header: 'Message', cell: (r: { field: string; message: string; hit_count: string }) => r.message },
                  { id: 'count', header: 'Hits', width: 100, cell: (r: { field: string; message: string; hit_count: string }) => <Badge color="red">{r.hit_count}</Badge> },
                ]}
                items={backtest?.errors ?? []}
                empty={<Box textAlign="center" color="inherit">No rule errors in DB. Run re-validation.</Box>}
                variant="full-page"
                stickyHeader
              />
            ),
          },

          // ─── Warning hits ─────────────────────────────────────────────────
          {
            id: 'warnings',
            label: `Warning hits (${backtest?.warnings.length ?? 0})`,
            content: (
              <Table
                loading={backtestLoading}
                header={<Header variant="h2">Rule warning hits across all offers</Header>}
                columnDefinitions={[
                  { id: 'field', header: 'Field', width: 240, cell: (r: { field: string; message: string; hit_count: string }) => <Box fontWeight="bold">{r.field}</Box> },
                  { id: 'message', header: 'Message', cell: (r: { field: string; message: string; hit_count: string }) => r.message },
                  { id: 'count', header: 'Hits', width: 100, cell: (r: { field: string; message: string; hit_count: string }) => <Badge color="severity-medium">{r.hit_count}</Badge> },
                ]}
                items={backtest?.warnings ?? []}
                empty={<Box textAlign="center" color="inherit">No rule warnings in DB. Run re-validation.</Box>}
                variant="full-page"
                stickyHeader
              />
            ),
          },
        ]}
      />

      {/* Create / edit modal */}
      {modal && (
        <RuleModal
          initial={modal.form}
          editingRule={modal.editing}
          onSave={saveRule}
          onCancel={() => setModal(null)}
          saving={modalSaving}
          saveError={modalError}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal
          visible
          header="Delete rule"
          onDismiss={() => setDeleteConfirm(null)}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button variant="primary" loading={deleting} onClick={() => deleteRule(deleteConfirm)}>Delete</Button>
              </SpaceBetween>
            </Box>
          }
        >
          Delete rule <Box display="inline" fontWeight="bold">"{deleteConfirm.name}"</Box>?
          This cannot be undone. Re-validation will no longer apply this check.
        </Modal>
      )}
    </SpaceBetween>
  );
}
