import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as md from '../mock-data';
import type {
  Offer, ScrapeRun, ScrapeJob, Merchant, Branch, DuplicateCandidate,
  ReviewItem, StagingChange, SyncHistory, SystemLog, GeoUnresolved,
  ValidationRule, OfferStatus
} from '../types';

export interface FlashMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  header: string;
  content?: string;
  dismissible?: boolean;
}

interface MockStore {
  offers: Offer[];
  scrapeRuns: ScrapeRun[];
  jobs: ScrapeJob[];
  merchants: Merchant[];
  branches: Branch[];
  duplicates: DuplicateCandidate[];
  reviewItems: ReviewItem[];
  stagingChanges: StagingChange[];
  syncHistory: SyncHistory[];
  logs: SystemLog[];
  geoUnresolved: GeoUnresolved[];
  validationRules: ValidationRule[];
  flashMessages: FlashMessage[];
  approveOffer: (id: string) => void;
  rejectOffer: (id: string) => void;
  updateOfferStatus: (id: string, status: OfferStatus) => void;
  mergeDuplicates: (groupId: string) => void;
  resolveDuplicate: (groupId: string, action: 'Kept Separate' | 'Not Duplicate') => void;
  approveStagingChange: (id: string) => void;
  rejectStagingChange: (id: string) => void;
  approveAllPending: () => void;
  simulateSync: (ids: string[]) => void;
  startScrapeJob: (bank: string, mode: string) => string;
  resolveGeoItem: (id: string, status: string) => void;
  toggleRule: (id: string) => void;
  addFlashMessage: (msg: Omit<FlashMessage, 'id'>) => void;
  dismissFlash: (id: string) => void;
  cancelJob: (id: string) => void;
  retryJob: (id: string) => void;
}

const MockStoreContext = createContext<MockStore | null>(null);

export function MockStoreProvider({ children }: { children: React.ReactNode }) {
  const [offers, setOffers] = useState<Offer[]>(md.mockOffers);
  const [scrapeRuns, setScrapeRuns] = useState<ScrapeRun[]>(md.mockScrapeRuns);
  const [jobs, setJobs] = useState<ScrapeJob[]>(md.mockJobs);
  const [merchants] = useState<Merchant[]>(md.mockMerchants);
  const [branches] = useState<Branch[]>(md.mockBranches);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>(md.mockDuplicates);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(md.mockReviewItems);
  const [stagingChanges, setStagingChanges] = useState<StagingChange[]>(md.mockStagingChanges);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>(md.mockSyncHistory);
  const [logs, setLogs] = useState<SystemLog[]>(md.mockLogs);
  const [geoUnresolved, setGeoUnresolved] = useState<GeoUnresolved[]>(md.mockGeoUnresolved);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>(md.mockValidationRules);
  const [flashMessages, setFlashMessages] = useState<FlashMessage[]>([]);
  const idCounter = useRef(100);

  const addFlashMessage = useCallback((msg: Omit<FlashMessage, 'id'>) => {
    const id = `flash-${Date.now()}-${idCounter.current++}`;
    setFlashMessages(prev => [...prev, { ...msg, id, dismissible: true }]);
    setTimeout(() => setFlashMessages(prev => prev.filter(m => m.id !== id)), 5000);
  }, []);

  const dismissFlash = useCallback((id: string) => {
    setFlashMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const approveOffer = useCallback((id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'Approved', dbStatus: 'Pending' } : o));
    setReviewItems(prev => prev.map(r => r.offerId === id ? { ...r, status: 'Resolved' } : r));
    addFlashMessage({ type: 'success', header: `Offer ${id} approved`, content: 'Moved to staging for DB sync.' });
  }, [addFlashMessage]);

  const rejectOffer = useCallback((id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'Disabled' } : o));
    setReviewItems(prev => prev.map(r => r.offerId === id ? { ...r, status: 'Dismissed' } : r));
    addFlashMessage({ type: 'info', header: `Offer ${id} rejected`, content: 'Offer has been disabled.' });
  }, [addFlashMessage]);

  const updateOfferStatus = useCallback((id: string, status: OfferStatus) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }, []);

  const mergeDuplicates = useCallback((groupId: string) => {
    setDuplicates(prev => prev.map(d => d.id === groupId
      ? { ...d, status: 'Merged', resolvedAt: new Date().toISOString(), resolvedBy: 'Admin (Nuwan)' }
      : d
    ));
    addFlashMessage({ type: 'success', header: 'Duplicates merged', content: `Group ${groupId} has been merged.` });
  }, [addFlashMessage]);

  const resolveDuplicate = useCallback((groupId: string, action: 'Kept Separate' | 'Not Duplicate') => {
    setDuplicates(prev => prev.map(d => d.id === groupId
      ? { ...d, status: action, resolvedAt: new Date().toISOString(), resolvedBy: 'Admin (Nuwan)' }
      : d
    ));
    addFlashMessage({ type: 'success', header: `Duplicate resolved`, content: `Marked as "${action}".` });
  }, [addFlashMessage]);

  const approveStagingChange = useCallback((id: string) => {
    setStagingChanges(prev => prev.map(s => s.id === id ? { ...s, reviewStatus: 'Approved' } : s));
  }, []);

  const rejectStagingChange = useCallback((id: string) => {
    setStagingChanges(prev => prev.map(s => s.id === id ? { ...s, reviewStatus: 'Rejected' } : s));
  }, []);

  const approveAllPending = useCallback(() => {
    setStagingChanges(prev => prev.map(s => s.reviewStatus === 'Pending' ? { ...s, reviewStatus: 'Approved' } : s));
    addFlashMessage({ type: 'success', header: 'All pending changes approved' });
  }, [addFlashMessage]);

  const simulateSync = useCallback((ids: string[]) => {
    const now = new Date().toISOString();
    setStagingChanges(prev => prev.filter(s => !ids.includes(s.id)));
    const synced = ids.length;
    setSyncHistory(prev => [{
      id: `SYNC-0${90 + prev.length}`,
      startedAt: now,
      completedAt: now,
      triggeredBy: 'Admin (Nuwan)',
      insertCount: Math.floor(synced * 0.6),
      updateCount: Math.floor(synced * 0.35),
      disableCount: Math.floor(synced * 0.05),
      failedCount: 0,
      status: 'Completed',
    }, ...prev]);
    setOffers(prev => prev.map(o => ({ ...o, dbStatus: o.dbStatus === 'Pending' ? 'Synced' : o.dbStatus })));
    addFlashMessage({ type: 'success', header: `${synced} records synced to production`, content: 'All operations completed successfully.' });
  }, [addFlashMessage]);

  const startScrapeJob = useCallback((bank: string, mode: string): string => {
    const id = `JOB-0${600 + idCounter.current++}`;
    const runId = `RUN-28${50 + idCounter.current}`;
    const now = new Date().toISOString();
    const newJob: ScrapeJob = {
      id, type: 'Scraper', bank: bank as any,
      status: 'Running', startedAt: now, duration: null, progress: 0, runId,
    };
    setJobs(prev => [newJob, ...prev]);
    const newRun: ScrapeRun = {
      id: runId, bank: bank as any, mode,
      startedAt: now, finishedAt: null, status: 'Running',
      triggeredBy: 'Admin (Nuwan)', duration: null,
      pagesCount: 0, rawOffersCount: 0, newCount: 0, changedCount: 0,
      unchangedCount: 0, expiredCount: 0, duplicateCandidates: 0,
      failedCount: 0, errorsCount: 0,
      parserVersion: '2.4.1', validationVersion: '1.3.0', sourceCount: 14,
    };
    setScrapeRuns(prev => [newRun, ...prev]);
    const logMsg: SystemLog = {
      id: `LOG-${Date.now()}`, timestamp: now, level: 'INFO',
      component: 'SCRAPER', bank: bank as any, runId,
      message: `${bank} scraper started – ${mode}`,
    };
    setLogs(prev => [logMsg, ...prev]);

    // Simulate progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.floor(Math.random() * 15) + 5;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        const finished = new Date().toISOString();
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'Completed', progress: 100, duration: '1m 48s' } : j));
        setScrapeRuns(prev => prev.map(r => r.id === runId ? {
          ...r, status: 'Completed', finishedAt: finished, duration: '1m 48s',
          pagesCount: 24, rawOffersCount: 58, newCount: 4, changedCount: 2, unchangedCount: 50, errorsCount: 0,
        } : r));
        addFlashMessage({ type: 'success', header: `${bank} scrape completed`, content: '58 offers processed, 4 new, 2 changed.' });
      } else {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, progress: prog } : j));
      }
    }, 800);

    addFlashMessage({ type: 'info', header: `Scrape job started: ${id}`, content: `${bank} – ${mode}` });
    return id;
  }, [addFlashMessage]);

  const resolveGeoItem = useCallback((id: string, status: string) => {
    setGeoUnresolved(prev => prev.map(g => g.id === id ? { ...g, status: status as any } : g));
    addFlashMessage({ type: 'success', header: 'Location resolved', content: `Geo item ${id} marked as ${status}.` });
  }, [addFlashMessage]);

  const toggleRule = useCallback((id: string) => {
    setValidationRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, []);

  const cancelJob = useCallback((id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'Cancelled' } : j));
    addFlashMessage({ type: 'info', header: `Job ${id} cancelled` });
  }, [addFlashMessage]);

  const retryJob = useCallback((id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'Running', progress: 0, duration: null } : j));
    addFlashMessage({ type: 'info', header: `Job ${id} restarted` });
  }, [addFlashMessage]);

  return (
    <MockStoreContext.Provider value={{
      offers, scrapeRuns, jobs, merchants, branches, duplicates,
      reviewItems, stagingChanges, syncHistory, logs, geoUnresolved,
      validationRules, flashMessages,
      approveOffer, rejectOffer, updateOfferStatus,
      mergeDuplicates, resolveDuplicate,
      approveStagingChange, rejectStagingChange, approveAllPending, simulateSync,
      startScrapeJob, resolveGeoItem, toggleRule,
      addFlashMessage, dismissFlash, cancelJob, retryJob,
    }}>
      {children}
    </MockStoreContext.Provider>
  );
}

export function useMockStore(): MockStore {
  const ctx = useContext(MockStoreContext);
  if (!ctx) throw new Error('useMockStore must be used within MockStoreProvider');
  return ctx;
}
