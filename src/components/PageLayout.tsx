/**
 * PageLayout – shared page wrapper for all Admin Dashboard pages.
 *
 * Provides:
 *  - Consistent top-level SpaceBetween "l" wrapper
 *  - A standardised h1 Header with breadcrumb slot, description, counter, and action bar
 *  - Optional BreadcrumbGroup rendered above the header
 *  - Consistent error Alert rendering
 *
 * Usage:
 *   <PageLayout
 *     title="Offers"
 *     description="All scraped offers from Neon Postgres"
 *     breadcrumbs={[{ text: 'Offers', href: '/offers' }]}
 *     counter={`(${total})`}
 *     actions={<Button variant="primary">New run</Button>}
 *     error={error}
 *   >
 *     {children}
 *   </PageLayout>
 */

import React from 'react';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Header from '@cloudscape-design/components/header';
import Alert from '@cloudscape-design/components/alert';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import { useNavigate } from 'react-router-dom';

export interface PageBreadcrumb {
  text: string;
  href: string;
}

interface PageLayoutProps {
  /** Page title — rendered as an h1 Header */
  title: string;
  /** Subtitle shown below the title */
  description?: string;
  /** Counter string, e.g. "(42)" */
  counter?: string;
  /** Action buttons rendered in the top-right of the header */
  actions?: React.ReactNode;
  /** Breadcrumb trail — do not include "Lanka Offers" home; it is prepended automatically */
  breadcrumbs?: PageBreadcrumb[];
  /** If set, an error Alert is rendered below the header */
  error?: string | null;
  /** Page content */
  children: React.ReactNode;
  /** Info badge / link shown inside the header */
  info?: React.ReactNode;
}

export default function PageLayout({
  title,
  description,
  counter,
  actions,
  breadcrumbs,
  error,
  children,
  info,
}: PageLayoutProps) {
  const navigate = useNavigate();

  // Always prepend the home crumb
  const crumbs: PageBreadcrumb[] = [
    { text: 'Lanka Offers', href: '/' },
    ...(breadcrumbs ?? []),
  ];

  return (
    <SpaceBetween size="l">
      {/* Breadcrumbs — only show when there is at least one page crumb beyond home */}
      {crumbs.length > 1 && (
        <BreadcrumbGroup
          items={crumbs}
          onFollow={e => {
            e.preventDefault();
            navigate(e.detail.href);
          }}
        />
      )}

      {/* Page-level h1 header */}
      <Header
        variant="h1"
        description={description}
        counter={counter}
        actions={actions}
        info={info}
      >
        {title}
      </Header>

      {/* Global error alert */}
      {error && (
        <Alert type="error" header="Error">
          {error}
        </Alert>
      )}

      {/* Page body */}
      {children}
    </SpaceBetween>
  );
}
