import { useState, useEffect } from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Toggle from '@cloudscape-design/components/toggle';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Modal from '@cloudscape-design/components/modal';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Table from '@cloudscape-design/components/table';
import Alert from '@cloudscape-design/components/alert';
import PageLayout from '../components/PageLayout';
import { api, type ApiScheduleEntry, type ApiSchedulerStatus } from '../services/api';

const BANK_OPTIONS = ['ALL', 'HNB', 'BOC', 'SAMPATH', 'NDB', 'DFCC', 'SEYLAN', 'PEOPLES', 'PABC', 'NSB', 'COMBANK'].map(
  (b) => ({ label: b, value: b.toLowerCase() })
);

export default function SchedulePage() {
  const [schedulerStatus, setSchedulerStatus] = useState<ApiSchedulerStatus | null>(null);
  const [schedules, setSchedules] = useState<ApiScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [runAlert, setRunAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [newCron, setNewCron] = useState('0 6 * * *');
  const [newDesc, setNewDesc] = useState('');
  const [newBank, setNewBank] = useState<any>({ label: 'ALL', value: 'all' });
  const [actionInProgress, setActionInProgress] = useState(false);

  async function loadScheduleData() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getScheduleStatus();
      setSchedulerStatus(data);
      setSchedules(data.schedules);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScheduleData();
  }, []);

  const enabledCount = schedules.filter((s) => s.enabled).length;

  async function toggleGlobal() {
    if (!schedulerStatus) return;
    const target = !schedulerStatus.enabled;
    try {
      setActionInProgress(true);
      const res = await api.toggleGlobalSchedule(target, 'admin-dashboard');
      setSchedulerStatus((prev) => (prev ? { ...prev, enabled: res.enabled } : null));
      setRunAlert({
        type: 'success',
        message: target
          ? 'Scheduler globally activated. Active cron schedules will run automatically.'
          : 'Scheduler globally paused. Automated executions halted.',
      });
    } catch (err) {
      setRunAlert({
        type: 'error',
        message: `Failed to toggle scheduler: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setActionInProgress(false);
    }
  }

  async function toggleSchedule(id: string) {
    const current = schedules.find((s) => s.id === id);
    if (!current) return;
    const targetState = !current.enabled;

    try {
      const updated = await api.toggleSchedule(id, targetState, 'admin-dashboard');
      setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setRunAlert({
        type: 'error',
        message: `Failed to toggle schedule ${id}: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  async function runNow(s: ApiScheduleEntry) {
    try {
      setActionInProgress(true);
      const res = await api.runScheduleNow(s.id, 'admin-dashboard');
      setRunAlert({
        type: 'success',
        message: `Triggered scrape job for ${s.bank.toUpperCase()} (PID: ${res.pid}, JobId: ${res.jobId})`,
      });
      setSchedules((prev) =>
        prev.map((item) =>
          item.id === s.id ? { ...item, lastRun: new Date().toISOString(), lastStatus: 'running' } : item
        )
      );
    } catch (err) {
      setRunAlert({
        type: 'error',
        message: `Cannot trigger scrape: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setActionInProgress(false);
    }
  }

  function addScheduleLocal() {
    if (!newName.trim()) return;
    const id = `SCH-${String(schedules.length + 1).padStart(3, '0')}`;
    const newEntry: ApiScheduleEntry = {
      id,
      name: newName.trim(),
      cron: newCron,
      description: newDesc.trim() || `${newBank.label} scrape`,
      bank: newBank.value,
      enabled: false,
      timeoutMs: 15 * 60 * 1000,
      lastRun: null,
      nextRun: 'Disabled',
      lastStatus: 'idle',
      retryCount: 0,
      maxRetries: 2,
      backoffMinutes: 5,
    };
    setSchedules((prev) => [...prev, newEntry]);
    setAddModal(false);
    setNewName('');
    setNewCron('0 6 * * *');
    setNewDesc('');
    setNewBank({ label: 'ALL', value: 'all' });
  }

  return (
    <PageLayout
      title="Schedule & Orchestration"
      description="Bank-specific scraper scheduling, concurrency guards, and execution policy"
      counter={`(${enabledCount}/${schedules.length} enabled)`}
      breadcrumbs={[{ text: 'Schedule', href: '/schedule' }]}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button iconName="refresh" onClick={loadScheduleData} loading={loading}>
            Refresh
          </Button>
          <Button
            variant={schedulerStatus?.enabled ? 'normal' : 'primary'}
            onClick={toggleGlobal}
            loading={actionInProgress}
          >
            {schedulerStatus?.enabled ? 'Pause Scheduler' : 'Activate Scheduler'}
          </Button>
          <Button onClick={() => setAddModal(true)}>Add schedule</Button>
        </SpaceBetween>
      }
    >
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {runAlert && (
        <Alert
          type={runAlert.type}
          dismissible
          onDismiss={() => setRunAlert(null)}
        >
          {runAlert.message}
        </Alert>
      )}

      {!schedulerStatus?.enabled && (
        <Alert
          type="info"
          header="Scheduler is in safe idle mode (disabled by default)"
        >
          Automated background scraping is paused by safety policy. You can still trigger individual bank runs on-demand using the <strong>Run now</strong> action, or click <strong>Activate Scheduler</strong> to resume background cron tasks.
        </Alert>
      )}

      <Container header={<Header variant="h2">Orchestration Overview</Header>}>
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Engine State</Box>
            <StatusIndicator type={schedulerStatus?.enabled ? 'success' : 'stopped'}>
              {schedulerStatus?.enabled ? 'Global Active' : 'Global Paused'}
            </StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Active Bank Scrapes</Box>
            <Box variant="awsui-value-large">{schedulerStatus?.activeScrapes ?? 0} / 3 max</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Enabled Schedules</Box>
            <StatusIndicator type={enabledCount > 0 ? 'success' : 'info'}>
              {enabledCount} of {schedules.length}
            </StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Default Policy</Box>
            <Box fontSize="body-s" color="text-body-secondary">
              Disabled by default / Staggered cron / 2x bounded backoff
            </Box>
          </div>
        </ColumnLayout>
      </Container>

      <Table
        loading={loading}
        header={
          <Header
            variant="h2"
            counter={`(${schedules.length})`}
            description="All 10 bank ingestion tasks with source-tailored timeouts and concurrency protection."
          >
            Bank Schedules
          </Header>
        }
        columnDefinitions={[
          {
            id: 'enabled',
            header: 'Enabled',
            width: 80,
            cell: (s: ApiScheduleEntry) => (
              <Toggle checked={s.enabled} onChange={() => toggleSchedule(s.id)} />
            ),
          },
          {
            id: 'name',
            header: 'Schedule',
            cell: (s: ApiScheduleEntry) => (
              <SpaceBetween size="xxs">
                <Box fontWeight="bold">{s.name}</Box>
                <Box color="text-body-secondary" fontSize="body-s">
                  {s.description}
                </Box>
              </SpaceBetween>
            ),
          },
          {
            id: 'bank',
            header: 'Bank',
            width: 100,
            cell: (s: ApiScheduleEntry) => (
              <Box fontWeight="bold">{s.bank.toUpperCase()}</Box>
            ),
          },
          {
            id: 'cron',
            header: 'Cron Expression',
            width: 130,
            cell: (s: ApiScheduleEntry) => (
              <span style={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' }}>
                {s.cron}
              </span>
            ),
          },
          {
            id: 'timeout',
            header: 'Timeout',
            width: 110,
            cell: (s: ApiScheduleEntry) => `${Math.round(s.timeoutMs / 60000)} min`,
          },
          {
            id: 'lastStatus',
            header: 'Last Status',
            width: 110,
            cell: (s: ApiScheduleEntry) => {
              if (s.lastStatus === 'running') return <StatusIndicator type="in-progress">Running</StatusIndicator>;
              if (s.lastStatus === 'success') return <StatusIndicator type="success">Success</StatusIndicator>;
              if (s.lastStatus === 'failed') return <StatusIndicator type="error">Failed</StatusIndicator>;
              return <StatusIndicator type="stopped">Idle</StatusIndicator>;
            },
          },
          {
            id: 'actions',
            header: 'Actions',
            width: 120,
            cell: (s: ApiScheduleEntry) => (
              <Button
                variant="inline-link"
                disabled={actionInProgress}
                onClick={() => runNow(s)}
              >
                Run now
              </Button>
            ),
          },
        ]}
        items={schedules}
        variant="full-page"
        stickyHeader
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'xxl' }}>
            No schedules configured.
          </Box>
        }
      />

      <Modal
        visible={addModal}
        onDismiss={() => setAddModal(false)}
        header="Add Bank Schedule"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setAddModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!newName.trim()}
                onClick={addScheduleLocal}
              >
                Add schedule
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Schedule name">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.detail.value)}
              placeholder="e.g. Seylan High Frequency"
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.detail.value)}
              placeholder="What does this schedule do?"
            />
          </FormField>
          <FormField
            label="Cron expression"
            description="Standard cron format: minute hour day month weekday"
          >
            <Input
              value={newCron}
              onChange={(e) => setNewCron(e.detail.value)}
              placeholder="0 6 * * *"
            />
          </FormField>
          <FormField label="Bank">
            <Select
              selectedOption={newBank}
              onChange={(e) => setNewBank(e.detail.selectedOption)}
              options={BANK_OPTIONS}
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </PageLayout>
  );
}
