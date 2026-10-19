import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import CloudscapeAppLayout from '@cloudscape-design/components/app-layout';
import SideNavigation, { type SideNavigationProps } from '@cloudscape-design/components/side-navigation';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import HelpPanel from '@cloudscape-design/components/help-panel';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Link from '@cloudscape-design/components/link';
import { api } from '../services/api';
import { useApi } from '../services/use-api';
import { useTheme } from '../hooks/useTheme';

// Grouped by operator workflow: decide on offers first, then manage how data gets in.
const NAV_ITEMS: SideNavigationProps.Item[] = [
  { type: 'link', text: 'Overview', href: '/' },
  { type: 'divider' },
  {
    type: 'section', text: 'Review & publishing', items: [
      { type: 'link', text: 'Review queue', href: '/review-queue' },
      { type: 'link', text: 'Offers', href: '/offers' },
      { type: 'link', text: 'Duplicates', href: '/duplicates' },
      { type: 'link', text: 'Staging', href: '/staging' },
      { type: 'link', text: 'Sync queue', href: '/sync-queue' },
      { type: 'link', text: 'Sync history', href: '/sync-history' },
      { type: 'link', text: 'Sync', href: '/sync' },
    ],
  },
  {
    type: 'section', text: 'Ingestion', items: [
      { type: 'link', text: 'Scrape runs', href: '/runs' },
      { type: 'link', text: 'Run scraper', href: '/run-scraper' },
      { type: 'link', text: 'Schedule', href: '/schedule' },
      { type: 'link', text: 'Jobs', href: '/jobs' },
      { type: 'link', text: 'Raw evidence', href: '/raw-evidence' },
    ],
  },
  {
    type: 'section', text: 'Quality & rules', items: [
      { type: 'link', text: 'Validation', href: '/validation' },
      { type: 'link', text: 'LLM validation', href: '/llm-validation' },
      { type: 'link', text: 'Rules', href: '/rules' },
      { type: 'link', text: 'Bank parser rules', href: '/bank-parser-rules' },
    ],
  },
  {
    type: 'section', text: 'Reference data', items: [
      { type: 'link', text: 'Merchants', href: '/merchants' },
      { type: 'link', text: 'Banks', href: '/branches' },
      { type: 'link', text: 'Geo map', href: '/geo-map' },
      { type: 'link', text: 'Unresolved locations', href: '/geo-unresolved' },
    ],
  },
  {
    type: 'section', text: 'System', items: [
      { type: 'link', text: 'Logs', href: '/logs' },
      { type: 'link', text: 'Errors', href: '/errors' },
      { type: 'link', text: 'Cost & budget tracker', href: '/cost-control' },
      { type: 'link', text: 'Settings', href: '/settings' },
    ],
  },
];

function collectHrefs(items: readonly SideNavigationProps.Item[]): string[] {
  return items.flatMap((item) => {
    if (item.type === 'link') return [item.href];
    if (item.type === 'section') return collectHrefs(item.items);
    return [];
  });
}

const NAV_HREFS = collectHrefs(NAV_ITEMS);

// Detail routes such as /runs/42 or /offers/7/review highlight their parent entry.
function activeNavHref(pathname: string): string {
  if (pathname === '/budget') return '/cost-control';
  const match = NAV_HREFS.filter((h) => h !== '/' && (pathname === h || pathname.startsWith(h + '/')))
    .sort((x, y) => y.length - x.length)[0];
  return match ?? (pathname === '/' ? '/' : pathname);
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);

  const { data: stats } = useApi(() => api.stats(), []);
  const { isDark, toggleTheme } = useTheme();
  const runningJobs = parseInt(stats?.runs.running_jobs ?? '0');

  return (
    <>
      <div id="top-navigation">
        <TopNavigation
          identity={{ href: '/', title: 'Lanka Offers Admin' }}
          utilities={[
            {
              type: 'button',
              text: isDark ? 'Switch to light' : 'Switch to dark',
              iconName: 'light-dark',
              ariaLabel: `Switch to ${isDark ? 'light' : 'dark'} mode`,
              onClick: toggleTheme,
            },
            {
              type: 'button',
              text: runningJobs > 0 ? `${runningJobs} running` : 'No active jobs',
              iconName: 'refresh',
              onClick: () => navigate('/jobs'),
            },
            {
              type: 'menu-dropdown',
              text: 'Admin',
              iconName: 'user-profile',
              items: [
                { id: 'settings', text: 'Settings' },
              ],
              onItemClick: ({ detail }) => {
                if (detail.id === 'settings') navigate('/settings');
              },
            },
          ]}
        />
      </div>
      <CloudscapeAppLayout
        headerSelector="#top-navigation"
        navigation={
          <SideNavigation
            header={{ text: 'Lanka Offers', href: '/' }}
            activeHref={activeNavHref(location.pathname)}
            items={NAV_ITEMS}
            onFollow={e => {
              e.preventDefault();
              navigate(e.detail.href);
            }}
          />
        }
        navigationOpen={navOpen}
        onNavigationChange={e => setNavOpen(e.detail.open)}
        toolsOpen={toolsOpen}
        onToolsChange={e => setToolsOpen(e.detail.open)}
        tools={
          <HelpPanel
            header={<h2>Help & Resources</h2>}
            footer={
              <Box variant="small" color="text-body-secondary">
                Lanka Offers Admin v1.0
              </Box>
            }
          >
            <SpaceBetween size="m">
              <Box>
                <Box variant="h3">Quick links</Box>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '8px' }}>
                    <Link href="#" onClick={() => navigate('/runs')}>Scrape runs</Link>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <Link href="#" onClick={() => navigate('/offers')}>All offers</Link>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <Link href="#" onClick={() => navigate('/duplicates')}>Duplicate detection</Link>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <Link href="#" onClick={() => navigate('/settings')}>Settings</Link>
                  </li>
                </ul>
              </Box>
              <Box>
                <Box variant="h3">Documentation</Box>
                <Box variant="p" color="text-body-secondary">
                  View the architecture documentation for detailed information about the data pipeline.
                </Box>
              </Box>
            </SpaceBetween>
          </HelpPanel>
        }
        content={<Outlet />}
      />
    </>
  );
}
