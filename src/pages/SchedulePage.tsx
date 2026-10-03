import { useState } from 'react';
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

interface ScheduleEntry {
  id: string;
  name: string;
  cron: string;
  description: string;
  bank: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
}

const INITIAL_SCHEDULES: ScheduleEntry[] = [
  { id: 'SCH-001', name: 'HNB Full Scrape',        cron: '0 6 * * *',    description: 'Daily full bank scrape at 6:00 AM',                    bank: 'HNB',     enabled: true,  lastRun: '2026-08-28 06:00', nextRun: '2026-08-29 06:00' },
  { id: 'SCH-002', name: 'BOC Full Scrape',         cron: '30 6 * * *',   description: 'Daily full bank scrape at 6:30 AM',                    bank: 'BOC',     enabled: true,  lastRun: '2026-08-28 06:30', nextRun: '2026-08-29 06:30' },
  { id: 'SCH-003', name: 'SAMPATH Full Scrape',     cron: '0 7 * * *',    description: 'Daily full bank scrape at 7:00 AM',                    bank: 'SAMPATH', enabled: true,  lastRun: '2026-08-28 07:00', nextRun: '2026-08-29 07:00' },
  { id: 'SCH-004', name: 'NDB Full Scrape',         cron: '30 7 * * *',   description: 'Daily full bank scrape at 7:30 AM',                    bank: 'NDB',     enabled: true,  lastRun: '2026-08-28 07:30', nextRun: '2026-08-29 07:30' },
  { id: 'SCH-005', name: 'DFCC Full Scrape',        cron: '0 8 * * *',    description: 'Daily full bank scrape at 8:00 AM',                    bank: 'DFCC',    enabled: false, lastRun: '2026-08-27 08:00', nextRun: 'Disabled' },
  { id: 'SCH-006', name: 'SEYLAN Full Scrape',      cron: '30 8 * * *',   description: 'Daily full bank scrape at 8:30 AM',                    bank: 'SEYLAN',  enabled: true,  lastRun: '2026-08-28 08:30', nextRun: '2026-08-29 08:30' },
  { id: 'SCH-007', name: 'Nightly DB Sync',         cron: '0 23 * * *',   description: 'Push approved staging changes to production',          bank: 'ALL',     enabled: true,  lastRun: '2026-08-27 23:00', nextRun: '2026-08-28 23:00' },
  { id: 'SCH-008', name: 'Duplicate Detection',     cron: '0 */4 * * *',  description: 'Run duplicate detection every 4 hours',                bank: 'ALL',     enabled: true,  lastRun: '2026-08-28 08:00', nextRun: '2026-08-28 12:00' },
  { id: 'SCH-009', name: 'LLM Validation Batch',   cron: '30 */6 * * *', description: 'LLM validate newly scraped offers every 6 hours',      bank: 'ALL',     enabled: true,  lastRun: '2026-08-28 06:30', nextRun: '2026-08-28 12:30' },
  { id: 'SCH-010', name: 'Geo Resolution Batch',   cron: '15 */6 * * *', description: 'Re-attempt geo resolution for unresolved items',       bank: 'ALL',     enabled: true,  lastRun: '2026-08-28 06:15', nextRun: '2026-08-28 12:15' },
];

const BANK_OPTIONS = ['ALL','HNB','BOC','SAMPATH','NDB','DFCC','SEYLAN','PEOPLES','PABC','NSB','COMBANK']
  .map(b => ({ label: b, value: b }));

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(INITIAL_SCHEDULES);
  const [addModal, setAddModal] = useState(false);
  const [runAlert, setRunAlert] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newCron, setNewCron] = useState('0 6 * * *');
  const [newDesc, setNewDesc] = useState('');
  const [newBank, setNewBank] = useState<any>({ label: 'ALL', value: 'ALL' });

  const enabled = schedules.filter(s => s.enabled).length;

  function toggleSchedule(id: string) {
    setSchedules(prev => prev.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled, nextRun: !s.enabled ? 'Pending schedule' : 'Disabled' } : s
    ));
  }

  function runNow(s: ScheduleEntry) {
    setRunAlert(`Triggered: ${s.name} (${s.bank})`);
    setTimeout(() => setRunAlert(null), 4000);
  }

  function addSchedule() {
    if (!newName.trim()) return;
    const id = `SCH-${String(schedules.length + 1).padStart(3, '0')}`;
    setSchedules(prev => [...prev, {
      id, name: newName.trim(), cron: newCron, description: newDesc.trim() || `${newBank.label} scrape`,
      bank: newBank.value, enabled: true, lastRun: 'Never', nextRun: 'Pending',
    }]);
    setAddModal(false);
    setNewName(''); setNewCron('0 6 * * *'); setNewDesc('');
    setNewBank({ label: 'ALL', value: 'ALL' });
  }

  return (
    <PageLayout
      title="Schedule"
      description="Cron-based schedules for all pipeline automation tasks"
      counter={`(${enabled}/${schedules.length} active)`}
      breadcrumbs={[{ text: 'Schedule', href: '/schedule' }]}
      actions={<Button variant="primary" onClick={() => setAddModal(true)}>Add schedule</Button>}
    >

      {runAlert && (
        <Alert type="success" dismissible onDismiss={() => setRunAlert(null)}>{runAlert}</Alert>
      )}

      <Container header={<Header variant="h2">Summary</Header>}>
        <ColumnLayout columns={3} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Active</Box>
            <StatusIndicator type="success">{enabled}</StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Paused</Box>
            <StatusIndicator type="stopped">{schedules.length - enabled}</StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Total</Box>
            <Box variant="awsui-value-large">{schedules.length}</Box>
          </div>
        </ColumnLayout>
      </Container>

      <Table
        header={
          <Header
            variant="h2"
            counter={`(${schedules.length})`}
            description="Toggle schedules on/off or run them immediately."
          >
            Schedules
          </Header>
        }
        columnDefinitions={[
          {
            id: 'enabled', header: 'Enabled', width: 80,
            cell: (s: ScheduleEntry) => (
              <Toggle checked={s.enabled} onChange={() => toggleSchedule(s.id)} />
            ),
          },
          {
            id: 'name', header: 'Schedule',
            cell: (s: ScheduleEntry) => (
              <SpaceBetween size="xxs">
                <Box fontWeight="bold">{s.name}</Box>
                <Box color="text-body-secondary" fontSize="body-s">{s.description}</Box>
              </SpaceBetween>
            ),
          },
          {
            id: 'cron', header: 'Cron', width: 130,
            cell: (s: ScheduleEntry) => (
              <span style={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' }}>{s.cron}</span>
            ),
          },
          {
            id: 'bank', header: 'Bank', width: 95,
            cell: (s: ScheduleEntry) => s.bank,
          },
          {
            id: 'nextRun', header: 'Next run', width: 155,
            cell: (s: ScheduleEntry) => s.enabled
              ? <Box fontSize="body-s">{s.nextRun}</Box>
              : <StatusIndicator type="stopped">Paused</StatusIndicator>,
          },
          {
            id: 'status', header: 'Status', width: 95,
            cell: (s: ScheduleEntry) => (
              <StatusIndicator type={s.enabled ? 'success' : 'stopped'}>
                {s.enabled ? 'Active' : 'Paused'}
              </StatusIndicator>
            ),
          },
          {
            id: 'actions', header: '',
            cell: (s: ScheduleEntry) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link">Edit</Button>
                <Button variant="link" onClick={() => runNow(s)}>Run now</Button>
              </SpaceBetween>
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
        header="Add schedule"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setAddModal(false)}>Cancel</Button>
              <Button variant="primary" disabled={!newName.trim()} onClick={addSchedule}>Add schedule</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Schedule name">
            <Input value={newName} onChange={e => setNewName(e.detail.value)} placeholder="e.g. PABC Daily Scrape" />
          </FormField>
          <FormField label="Description">
            <Input value={newDesc} onChange={e => setNewDesc(e.detail.value)} placeholder="What does this schedule do?" />
          </FormField>
          <FormField label="Cron expression" description="Standard cron: minute hour day month weekday">
            <Input value={newCron} onChange={e => setNewCron(e.detail.value)} placeholder="0 6 * * *" />
          </FormField>
          <FormField label="Bank">
            <Select
              selectedOption={newBank}
              onChange={e => setNewBank(e.detail.selectedOption)}
              options={BANK_OPTIONS}
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </PageLayout>
  );
}
