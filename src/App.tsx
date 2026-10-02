import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import OverviewPage from './pages/OverviewPage';
import ScrapeRunsPage from './pages/ScrapeRunsPage';
import ScrapeRunDetailPage from './pages/ScrapeRunDetailPage';
import RunScraperPage from './pages/RunScraperPage';
import OffersPage from './pages/OffersPage';
import OfferReviewWorkspacePage from './pages/OfferReviewWorkspacePage';
import RawEvidencePage from './pages/RawEvidencePage';
import MerchantsPage from './pages/MerchantsPage';
import BranchesPage from './pages/BranchesPage';
import DuplicateDetectionPage from './pages/DuplicateDetectionPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import LlmValidationPage from './pages/LlmValidationPage';
import RulesPage from './pages/RulesPage';
import GeoMapPage from './pages/GeoMapPage';
import GeoUnresolvedPage from './pages/GeoUnresolvedPage';
import StagingPage from './pages/StagingPage';
import SyncQueuePage from './pages/SyncQueuePage';
import SyncHistoryPage from './pages/SyncHistoryPage';
import JobsPage from './pages/JobsPage';
import LogsPage from './pages/LogsPage';
import ErrorsPage from './pages/ErrorsPage';
import SettingsPage from './pages/SettingsPage';
import CostControlPage from './pages/CostControlPage';
import SyncPage from './pages/SyncPage';
import SchedulePage from './pages/SchedulePage';
import ValidationPage from './pages/ValidationPage';
import BankParserRulesPage from './pages/BankParserRulesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
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
        <Route path="sync" element={<SyncPage />} />
      </Route>
    </Routes>
  );
}
