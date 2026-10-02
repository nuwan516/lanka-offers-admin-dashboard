import { useState } from 'react';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Tabs from '@cloudscape-design/components/tabs';
import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Toggle from '@cloudscape-design/components/toggle';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Alert from '@cloudscape-design/components/alert';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';

const BANKS = ['HNB', 'BOC', 'SAMPATH', 'NDB', 'DFCC', 'SEYLAN', 'PEOPLES', 'PABC', 'NSB', 'COMBANK'];

const ALERT_TRIGGERS = [
  { id: 'scraper_failure',   label: 'Scraper failure',         enabled: true  },
  { id: 'llm_score_drop',    label: 'LLM score drop > 10%',    enabled: true  },
  { id: 'db_sync_failure',   label: 'DB sync failure',          enabled: true  },
  { id: 'new_review_item',   label: 'New critical review item', enabled: false },
  { id: 'daily_summary',     label: 'Daily summary',            enabled: true  },
];

export default function SettingsPage() {
  const [env, setEnv] = useState<any>({ label: 'Production', value: 'production' });
  const [scrapeTimeout, setScrapeTimeout] = useState('30');
  const [concurrency, setConcurrency]     = useState('3');
  const [retryLimit, setRetryLimit]       = useState('3');
  const [llmModel, setLlmModel]           = useState<any>({ label: 'gemini-1.5-pro', value: 'gemini-1.5-pro' });
  const [llmTemp, setLlmTemp]             = useState('0.2');
  const [autoApprove, setAutoApprove]     = useState('85');
  const [reviewThreshold, setReviewThreshold] = useState('70');
  const [geoProvider, setGeoProvider]     = useState<any>({ label: 'Google Maps API', value: 'google' });
  const [geoConfidence, setGeoConfidence] = useState('0.7');
  const [emailNotifs, setEmailNotifs]     = useState(true);
  const [slackNotifs, setSlackNotifs]     = useState(false);
  const [failureAlerts, setFailureAlerts] = useState(true);
  const [adminEmail, setAdminEmail]       = useState('admin@lankaoffers.lk');
  const [bankEnabled, setBankEnabled]     = useState<Record<string, boolean>>(
    Object.fromEntries(BANKS.map(b => [b, b !== 'DFCC']))
  );
  const [alerts, setAlerts]               = useState(ALERT_TRIGGERS);

  function toggleAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="System-wide configuration for the Lanka Offers pipeline">
        Settings
      </Header>

      <Tabs
        tabs={[
          // ─── General ──────────────────────────────────────────────────────
          {
            id: 'general',
            label: 'General',
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h2">Environment</Header>}>
                  <SpaceBetween size="m">
                    <FormField label="Active environment">
                      <Select
                        selectedOption={env}
                        onChange={e => setEnv(e.detail.selectedOption)}
                        options={[
                          { label: 'Production', value: 'production' },
                          { label: 'Staging', value: 'staging' },
                          { label: 'Development', value: 'development' },
                        ]}
                      />
                    </FormField>
                    <Alert type="warning">
                      You are configuring <strong>{env.label}</strong>.
                      Changes here affect live scraping and database operations.
                    </Alert>
                  </SpaceBetween>
                </Container>

                <Container header={<Header variant="h2">Database</Header>}>
                  <SpaceBetween size="m">
                    <ColumnLayout columns={2}>
                      <FormField label="Neon project ID" description="Neon Postgres project">
                        <Input value="shiny-frost-69896486" readOnly />
                      </FormField>
                      <FormField label="Neon branch" description="Active database branch">
                        <Input value="br-morning-truth-b3mvnc8z" readOnly />
                      </FormField>
                      <FormField label="Pool size">
                        <Input value="10" />
                      </FormField>
                    </ColumnLayout>
                  </SpaceBetween>
                </Container>

                <Button variant="primary">Save general settings</Button>
              </SpaceBetween>
            ),
          },

          // ─── Scraping ─────────────────────────────────────────────────────
          {
            id: 'scraping',
            label: 'Scraping',
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h2">Scraper behaviour</Header>}>
                  <ColumnLayout columns={2}>
                    <FormField label="Navigation timeout (s)" description="Puppeteer page navigation timeout">
                      <Input value={scrapeTimeout} onChange={e => setScrapeTimeout(e.detail.value)} />
                    </FormField>
                    <FormField label="Concurrency" description="Max parallel scrapers">
                      <Input value={concurrency} onChange={e => setConcurrency(e.detail.value)} />
                    </FormField>
                    <FormField label="Retry limit" description="Auto-retry attempts on failure">
                      <Input value={retryLimit} onChange={e => setRetryLimit(e.detail.value)} />
                    </FormField>
                    <FormField label="Rate limit delay (ms)" description="Delay between requests">
                      <Input value="500" />
                    </FormField>
                  </ColumnLayout>
                </Container>

                <Table
                  header={
                    <Header variant="h2" description="Enable or disable scraping per bank">
                      Bank configuration
                    </Header>
                  }
                  columnDefinitions={[
                    {
                      id: 'bank', header: 'Bank',
                      cell: (b: string) => <Box fontWeight="bold">{b}</Box>,
                    },
                    {
                      id: 'enabled', header: 'Scraping enabled', width: 160,
                      cell: (b: string) => (
                        <Toggle
                          checked={bankEnabled[b] ?? true}
                          onChange={() => setBankEnabled(p => ({ ...p, [b]: !p[b] }))}
                        />
                      ),
                    },
                  ]}
                  items={BANKS}
                  variant="embedded"
                />

                <Button variant="primary">Save scraping settings</Button>
              </SpaceBetween>
            ),
          },

          // ─── LLM ─────────────────────────────────────────────────────────
          {
            id: 'llm',
            label: 'LLM',
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h2">LLM provider</Header>}>
                  <SpaceBetween size="m">
                    <ColumnLayout columns={2}>
                      <FormField label="Model">
                        <Select
                          selectedOption={llmModel}
                          onChange={e => setLlmModel(e.detail.selectedOption)}
                          options={[
                            { label: 'gemini-1.5-pro', value: 'gemini-1.5-pro' },
                            { label: 'gemini-1.5-flash', value: 'gemini-1.5-flash' },
                            { label: 'claude-sonnet-4-6', value: 'claude-sonnet-4-6' },
                            { label: 'gpt-4o', value: 'gpt-4o' },
                          ]}
                        />
                      </FormField>
                      <FormField label="Temperature" description="0 = deterministic, 1 = creative">
                        <Input value={llmTemp} onChange={e => setLlmTemp(e.detail.value)} />
                      </FormField>
                    </ColumnLayout>
                    <FormField label="API key" description="Stored in environment variable GOOGLE_AI_API_KEY">
                      <Input value="•••••••••••••••••" type="search" />
                    </FormField>
                  </SpaceBetween>
                </Container>

                <Container header={<Header variant="h2">Scoring thresholds</Header>}>
                  <ColumnLayout columns={2}>
                    <FormField label="Auto-approve threshold" description="Offers above this score skip review">
                      <Input value={autoApprove} onChange={e => setAutoApprove(e.detail.value)} />
                    </FormField>
                    <FormField label="Review threshold" description="Offers below this go to review queue">
                      <Input value={reviewThreshold} onChange={e => setReviewThreshold(e.detail.value)} />
                    </FormField>
                  </ColumnLayout>
                </Container>

                <Button variant="primary">Save LLM settings</Button>
              </SpaceBetween>
            ),
          },

          // ─── Geocoding ────────────────────────────────────────────────────
          {
            id: 'geocoding',
            label: 'Geocoding',
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h2">Geo provider</Header>}>
                  <SpaceBetween size="m">
                    <FormField label="Provider">
                      <Select
                        selectedOption={geoProvider}
                        onChange={e => setGeoProvider(e.detail.selectedOption)}
                        options={[
                          { label: 'Google Maps API', value: 'google' },
                          { label: 'OpenStreetMap Nominatim', value: 'osm' },
                          { label: 'Mapbox', value: 'mapbox' },
                        ]}
                      />
                    </FormField>
                    <ColumnLayout columns={2}>
                      <FormField label="API key">
                        <Input value="•••••••••••••••••" type="search" />
                      </FormField>
                      <FormField label="Min confidence threshold" description="Items below this go to manual review">
                        <Input value={geoConfidence} onChange={e => setGeoConfidence(e.detail.value)} />
                      </FormField>
                    </ColumnLayout>
                  </SpaceBetween>
                </Container>

                <Button variant="primary">Save geocoding settings</Button>
              </SpaceBetween>
            ),
          },

          // ─── Notifications ────────────────────────────────────────────────
          {
            id: 'notifications',
            label: 'Notifications',
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h2">Channels</Header>}>
                  <SpaceBetween size="m">
                    <FormField label="Admin email">
                      <Input value={adminEmail} onChange={e => setAdminEmail(e.detail.value)} />
                    </FormField>
                    <ColumnLayout columns={3} variant="text-grid">
                      <div>
                        <Box variant="awsui-key-label">Email notifications</Box>
                        <Toggle checked={emailNotifs} onChange={() => setEmailNotifs(p => !p)} />
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Slack notifications</Box>
                        <Toggle checked={slackNotifs} onChange={() => setSlackNotifs(p => !p)} />
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Failure alerts</Box>
                        <Toggle checked={failureAlerts} onChange={() => setFailureAlerts(p => !p)} />
                      </div>
                    </ColumnLayout>
                  </SpaceBetween>
                </Container>

                <Table
                  header={<Header variant="h2" description="Choose which events trigger notifications">Alert triggers</Header>}
                  columnDefinitions={[
                    {
                      id: 'label', header: 'Event',
                      cell: (t: typeof ALERT_TRIGGERS[0]) => t.label,
                    },
                    {
                      id: 'enabled', header: 'Enabled', width: 120,
                      cell: (t: typeof ALERT_TRIGGERS[0]) => (
                        <Toggle
                          checked={alerts.find(a => a.id === t.id)?.enabled ?? false}
                          onChange={() => toggleAlert(t.id)}
                        />
                      ),
                    },
                  ]}
                  items={alerts}
                  variant="embedded"
                />

                <Button variant="primary">Save notification settings</Button>
              </SpaceBetween>
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}
