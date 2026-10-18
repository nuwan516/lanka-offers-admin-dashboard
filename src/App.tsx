import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Spinner } from '@cloudscape-design/components';
import AppLayout from './layouts/AppLayout';
import OverviewPage from './pages/OverviewPage';

// Route-level code splitting for production performance
const ScrapeRunsPage = lazy(() => import('./pages/ScrapeRunsPage'));
const ScrapeRunDetailPage = lazy(() => import('./pages/ScrapeRunDetailPage'));
const RunScraperPage = lazy(() => import('./pages/RunScraperPage'));
const OffersPage = lazy(() => import('./pages/OffersPage'));
const OfferReviewWorkspacePage = lazy(() => import('./pages/OfferReviewWorkspacePage'));
const RawEvidencePage = lazy(() => import('./pages/RawEvidencePage'));
const MerchantsPage = lazy(() => import('./pages/MerchantsPage'));
const BranchesPage = lazy(() => import('./pages/BranchesPage'));
const DuplicateDetectionPage = lazy(() => import('./pages/DuplicateDetectionPage'));
const ReviewQueuePage = lazy(() => import('./pages/ReviewQueuePage'));
const LlmValidationPage = lazy(() => import('./pages/LlmValidationPage'));
const RulesPage = lazy(() => import('./pages/RulesPage'));
const BankParserRulesPage = lazy(() => import('./pages/BankParserRulesPage'));
const GeoMapPage = lazy(() => import('./pages/GeoMapPage'));
const GeoUnresolvedPage = lazy(() => import('./pages/GeoUnresolvedPage'));
const StagingPage = lazy(() => import('./pages/StagingPage'));
const SyncQueuePage = lazy(() => import('./pages/SyncQueuePage'));
const SyncHistoryPage = lazy(() => import('./pages/SyncHistoryPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const LogsPage = lazy(() => import('./pages/LogsPage'));
const ErrorsPage = lazy(() => import('./pages/ErrorsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CostControlPage = lazy(() => import('./pages/CostControlPage'));
const SyncPage = lazy(() => import('./pages/SyncPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const ValidationPage = lazy(() => import('./pages/ValidationPage'));

function RouteLoading() {
  return (
    <Box padding="xxl" textAlign="center">
      <Spinner size="large" />
    </Box>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route
          path="*"
          element={
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="runs" element={<ScrapeRunsPage />} />
                <Route path="runs/:id" element={<ScrapeRunDetailPage />} />
                <Route path="run-scraper" element={<RunScraperPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="offers" element={<OffersPage />} />
                <Route path="offers/:id/review" element={<OfferReviewWorkspacePage />} />
                <Route path="raw-evidence" element={<RawEvidencePage />} />
                <Route path="merchants" element={<MerchantsPage />} />
                <Route path="branches" element={<BranchesPage />} />
                <Route path="duplicates" element={<DuplicateDetectionPage />} />
                <Route path="review-queue" element={<ReviewQueuePage />} />
                <Route path="validation" element={<ValidationPage />} />
                <Route path="llm-validation" element={<LlmValidationPage />} />
                <Route path="rules" element={<RulesPage />} />
                <Route path="bank-parser-rules" element={<BankParserRulesPage />} />
                <Route path="geo-map" element={<GeoMapPage />} />
                <Route path="geo-unresolved" element={<GeoUnresolvedPage />} />
                <Route path="staging" element={<StagingPage />} />
                <Route path="sync-queue" element={<SyncQueuePage />} />
                <Route path="sync-history" element={<SyncHistoryPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="logs" element={<LogsPage />} />
                <Route path="errors" element={<ErrorsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="cost-control" element={<CostControlPage />} />
                <Route path="budget" element={<CostControlPage />} />
                <Route path="sync" element={<SyncPage />} />
              </Routes>
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
