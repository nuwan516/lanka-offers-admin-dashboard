import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import CloudscapeAppLayout from '@cloudscape-design/components/app-layout';
import SideNavigation, { type SideNavigationProps } from '@cloudscape-design/components/side-navigation';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import { api } from '../services/api';
import { useApi } from '../services/use-api';

const NAV_ITEMS: SideNavigationProps.Item[] = [
  { type: 'link', text: 'Overview', href: '/' },
  { type: 'divider' },
  {
    type: 'section', text: 'Scraping', items: [
      { type: 'link', text: 'Scrape runs', href: '/runs' },
      { type: 'link', text: 'Run scraper', href: '/run-scraper' },
      { type: 'link', text: 'Schedule', href: '/schedule' },
    ],
  },
  {
    type: 'section', text: 'Data', items: [
      { type: 'link', text: 'Offers', href: '/offers' },
      { type: 'link', text: 'Merchants', href: '/merchants' },
      { type: 'link', text: 'Banks', href: '/branches' },
      { type: 'link', text: 'Raw evidence', href: '/raw-evidence' },
      { type: 'link', text: 'Duplicates', href: '/duplicates' },
    ],
  },
  {
    type: 'section', text: 'Quality', items: [
      { type: 'link', text: 'Review queue', href: '/review-queue' },
      { type: 'link', text: 'Validation', href: '/validation' },
      { type: 'link', text: 'LLM validation', href: '/llm-validation' },
      { type: 'link', text: 'Rules', href: '/rules' },
      { type: 'link', text: 'Bank parser rules', href: '/bank-parser-rules' },
      { type: 'link', text: 'Sync', href: '/sync' },
    ],
  },
  {
    type: 'section', text: 'Geo', items: [
      { type: 'link', text: 'Geo map', href: '/geo-map' },
      { type: 'link', text: 'Unresolved locations', href: '/geo-unresolved' },
    ],
  },
  {
    type: 'section', text: 'Pipeline', items: [
      { type: 'link', text: 'Staging', href: '/staging' },
      { type: 'link', text: 'Sync queue', href: '/sync-queue' },
      { type: 'link', text: 'Sync history', href: '/sync-history' },
    ],
  },
  {
    type: 'section', text: 'System', items: [
      { type: 'link', text: 'Jobs', href: '/jobs' },
      { type: 'link', text: 'Logs', href: '/logs' },
      { type: 'link', text: 'Errors', href: '/errors' },
      { type: 'link', text: 'Cost control', href: '/cost-control' },
      { type: 'link', text: 'Settings', href: '/settings' },
    ],
  },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(true);

  const { data: stats } = useApi(() => api.stats(), []);
  const runningJobs = parseInt(stats?.runs.running_jobs ?? '0');

  return (
    <>
      <div id="top-navigation">
        <TopNavigation
          identity={{ href: '/', title: 'Lanka Offers Admin' }}
          utilities={[
            {
              type: 'button',
              text: runningJobs > 0 ? `${runningJobs} running` : 'No active jobs',
              iconName: 'refresh',
              onClick: () => navigate('/jobs'),
            },
            {
              type: 'menu-dropdown',
              text: 'Nuwan',
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
            activeHref={location.pathname}
            items={NAV_ITEMS}
            onFollow={e => {
              e.preventDefault();
              navigate(e.detail.href);
            }}
          />
        }
        navigationOpen={navOpen}
        onNavigationChange={e => setNavOpen(e.detail.open)}
        toolsHide
        content={<Outlet />}
      />
    </>
  );
}
