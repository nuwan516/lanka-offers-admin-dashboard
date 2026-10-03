/**
 * Admin API client — calls the Lanka Offers Express API at /api/*.
 * All data comes from Neon Postgres via the backend; no mock data.
 */

const BASE = '/api';

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path, window.location.origin);
  url.pathname = BASE + url.pathname;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString());
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error('API server is not running. Start it with: npm run api (in the LankaOffers directory)');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? res.statusText);
  }
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error('API server is not running. Start it with: npm run api (in the LankaOffers directory)');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error('API server is not running. Start it with: npm run api (in the LankaOffers directory)');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

// ─── Types returned by the API ───────────────────────────────────────────────

export interface ApiOffer {
  id: string;
  unique_id: string;
  bank: string;
  title: string;
  category: string | null;
  card_type: string | null;
  merchant_name: string | null;
  merchant_location: string | null;
  discount_percentage: string | null;
  valid_from: string | null;
  valid_to: string | null;
  llm_score: number | null;
  llm_valid: boolean | null;
  rule_passed: boolean;
  rule_errors: Array<{ field: string; message: string }>;
  rule_warnings: Array<{ field: string; message: string }>;
  db_status: string;
  change_status?: string;
  has_pending_candidate?: boolean;
  pending_lifecycle_status?: string | null;
  geo_status?: string | null;
  created_at: string;
  updated_at: string;
  scrape_run_id: string | null;
  content_hash: string | null;
  geo_locations: Array<Record<string, unknown>>;
  raw_offer?: Record<string, unknown>;
}

export interface ApiScrapeRun {
  id: string;
  bank: string;
  mode: string;
  status: string;
  triggered_by: string;
  started_at: string;
  finished_at: string | null;
  offers_found: number;
  offers_new: number;
  offers_changed: number;
  offers_unchanged: number;
  errors: number;
  error_message: string | null;
}

export interface ApiStats {
  offers: {
    active_offers: string;
    total_offers: string;
    llm_valid: string;
    rule_failed: string;
    llm_scored: string;
    avg_llm_score: string | null;
    banks_with_data: string;
    pending_review?: string;
    pending_sync?: string;
    unresolved_geo?: string;
  };
  runs: {
    running_jobs: string;
    failed_today: string;
    runs_today: string;
    last_run_at: string | null;
    scraped_today?: string;
    new_today?: string;
    changed_today?: string;
  };
  validation: {
    validation_failures: string;
    total_validated: string;
  };
  duplicates: ApiDuplicateStats;
}

export interface ApiDuplicateStats {
  pending: number;
  confirmed: number;
  notDuplicate: number;
  ignored: number;
}

export interface ApiValidationReport {
  id: string;
  offer_id: string;
  unique_id: string;
  passed: boolean;
  rule_errors: Array<{ field: string; message: string }>;
  rule_warnings: Array<{ field: string; message: string }>;
  llm_score: number | null;
  llm_valid: boolean | null;
  llm_provider: string | null;
  llm_model: string | null;
  llm_reasoning: string | null;
  llm_issues: string[];
  created_at: string;
  title: string;
  bank: string;
  merchant_name: string | null;
}

export interface ApiBankSummary {
  bank: string;
  total_offers: string;
  active_offers: string;
  avg_llm_score: string | null;
  rule_failures: string;
  geo_count: string;
  last_updated: string;
  last_run_status?: string | null;
  last_run_at?: string | null;
  last_run_found?: number;
  last_run_new?: number;
  last_run_changed?: number;
  last_run_errors?: number;
  health_status?: 'Healthy' | 'Warning' | 'Failed' | 'Running' | 'Idle';
}

export interface ApiRule {
  id: string;
  field: string;
  description: string;
  severity: 'error' | 'warning';
  group: string;
  enabled: boolean;
  notes: string | null;
  updated_at: string | null;
}

export interface ApiCustomRule {
  id: string;
  name: string;
  description: string | null;
  group_name: string;
  severity: 'error' | 'warning';
  enabled: boolean;
  field_path: string;
  operator: string;
  config: Record<string, unknown>;
  notes: string | null;
  is_builtin: boolean;
  builtin_id: string | null;
  banks: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ApiRuleTestResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  failures: Array<{ unique_id: string; bank: string; title: string; message: string }>;
}

export interface ApiBankParserRule {
  id: string;
  bank: string;
  field: string;
  rule_type: 'regex' | 'field_map' | 'keyword_list' | 'constant';
  pattern: string | null;
  flags: string;
  capture_group: number;
  enabled: boolean;
  notes: string | null;
  is_builtin: boolean;
  /** Evaluation order — lower number runs first. Default 100. */
  priority: number;
  /** Dot-separated path into raw_offer JSON to use as input text, e.g. "promotion_details" */
  source_path: string | null;
  /** Optional category filter — rule only applies to offers in this category */
  category: string | null;
  /** Source type hint, e.g. "json_api", "html" */
  source_type: string | null;
  /** "active" | "disabled" | "draft" */
  status: string;
  /** Auto-incremented on every save — useful for audit trails */
  version: number;
  created_at: string;
  updated_at: string;
}


export interface ApiBankParserTestResult {
  total: number;
  matched: number;
  unmatched: number;
  results: Array<{ unique_id: string; title: string; extracted: string | null; matched: boolean; trace?: unknown }>;
}

export interface ApiRegressionCandidate {
  uniqueId: string;
  title: string;
  rawSourceValue: string | null;
  currentValue: string | null;
  ruleResult: string | null;
  ruleId: string;
  ruleVersion: number;
  classification: 'CHANGED' | 'NEW_NULL' | 'ERROR';
}

export interface ApiBacktestFieldSummary {
  field: string;
  ruleId: string;
  samples: number;
  matched: number;
  unchanged: number;
  changed: number;
  newValues: number;
  newNulls: number;
  noMatch: number;
  errors: number;
  regressionCandidates: ApiRegressionCandidate[];
}

export interface ApiParserBacktestResult {
  bank: string;
  offersScanned: number;
  rulesEvaluated: number;
  byField: ApiBacktestFieldSummary[];
}

export interface ApiGoldenCase {
  id: string;
  bank: string;
  offer_id: string | null;
  offer_unique_id: string | null;
  offer_title: string | null;
  title?: string | null;
  field: string;
  expected_value: string;
  raw_snippet: string | null;
  notes: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiGoldenTestResultItem {
  caseId: string;
  bank: string;
  field: string;
  offerTitle: string;
  expected: string;
  actual: string | null;
  status: 'PASS' | 'FAIL';
  whichRuleRan: string;
  ruleVersion: number;
  sourcePath: string | null;
  inputValue: string | null;
  regexMatched: boolean;
  capture: string | null;
  usedFallback: boolean;
  error?: string;
}

export interface ApiGoldenRunResult {
  bank: string;
  field: string;
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  cases: ApiGoldenTestResultItem[];
}



async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error('API server is not running. Start it with: npm run api (in the LankaOffers directory)');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

export type OfferReviewAction =
  | 'APPROVE' | 'APPROVE_WITH_CORRECTIONS' | 'REJECT' | 'SEND_BACK' | 'DISABLE' | 'PUBLISH' | 'UNPUBLISH';

export interface ApiReviewHistoryEntry {
  id: string;
  offer_id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  changes_json: Record<string, unknown>;
  reason: string | null;
  actor: string;
  created_at: string;
}

export interface ApiFieldDiffEntry {
  field: string;
  publishedValue: unknown;
  candidateValue: unknown;
  finalValue: unknown;
  candidateChanged: boolean;
  manuallyOverridden: boolean;
}

export interface ApiOfferReview {
  offer: ApiOffer & Record<string, unknown>;
  rawOffer: Record<string, unknown>;
  pendingCandidate: Record<string, unknown> | null;
  pendingValidation: { rulePassed: boolean; ruleErrors: unknown[]; ruleWarnings: unknown[]; llmScore: number | null; llmValid: boolean | null } | null;
  validationReport?: ApiValidationReport | null;
  manualOverride: Record<string, unknown>;
  effectiveOffer: Record<string, unknown>;
  diff: ApiFieldDiffEntry[];
  duplicates: ApiDuplicateCandidate[];
  history: ApiReviewHistoryEntry[];
}

export type DuplicateClassification = 'NOT_DUPLICATE' | 'LIKELY_DUPLICATE' | 'EXACT_DUPLICATE' | 'CROSS_BANK_SIMILAR';
export type DuplicateReviewStatus = 'PENDING' | 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'IGNORED';

export interface ApiDuplicateCandidate {
  id: string;
  offer_id: string;
  candidate_offer_id: string;
  score: number;
  classification: DuplicateClassification;
  reasons: string[];
  status: DuplicateReviewStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  offer_bank?: string;
  offer_title?: string;
  offer_merchant?: string | null;
  offer_discount?: string | null;
  offer_status?: string;
  offer_source_url?: string | null;
  offer_card_type?: string | null;
  offer_valid_from?: string | null;
  offer_valid_to?: string | null;
  offer_location?: string | null;
  candidate_bank?: string;
  candidate_title?: string;
  candidate_merchant?: string | null;
  candidate_discount?: string | null;
  candidate_status?: string;
  candidate_source_url?: string | null;
  candidate_card_type?: string | null;
  candidate_valid_from?: string | null;
  candidate_valid_to?: string | null;
  candidate_location?: string | null;
}

export interface ApiLogEntry {
  ts: string;
  level: string;
  bank: string;
  tag?: string;
  message: string;
  data?: Record<string, unknown>;
  pid?: number;
}

export interface ApiSyncPreview {
  approvedReady: number;
  reviewRequired: number;
  rejected: number;
  alreadyPublished: number;
  changedExisting: number;
}

export interface ApiSyncResult {
  offerId: string;
  outcome: 'published' | 'unchanged' | 'failed' | 'skipped';
  reason?: string;
}

export interface ApiBulkSyncSummary {
  syncRunId: string;
  published: number;
  updated: number;
  unchanged: number;
  failed: number;
  results: ApiSyncResult[];
}

export interface ApiSyncRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  approved_count: number;
  published_count: number;
  updated_count: number;
  unchanged_count: number;
  failed_count: number;
  triggered_by: string;
}

export interface ApiCostControlService {
  service: string;
  used: number;
  limit: number;
  percentage: number;
  state: 'ALLOW' | 'WARN' | 'BLOCK';
  enabled: boolean;
  reason: string;
}

export interface ApiCostControlStatus {
  services: ApiCostControlService[];
  policy: {
    llmMode: string;
    llmPrimaryProvider: string;
    llmFallbackProvider: string | null;
    allowPaidLlmFallback: boolean;
    llmValidationEnabled: boolean;
    geoProviderCallsEnabled: boolean;
    placesEnrichmentEnabled: boolean;
  };
  periodKey: string | null;
}

export interface ApiGeoStats {
  totalOffers: number;
  offersWithGeom: number;
  offersWithoutGeom: number;
  coveragePercent: number;
  byBank: Array<{ bank: string; total: number; withGeom: number; coveragePercent: number }>;
  byLocationScope: Array<{ scope: string; count: number; withGeom: number }>;
}

export interface ApiNearbyOffer {
  id: string;
  bank: string;
  title: string;
  merchant_name: string | null;
  discount_percentage: string | null;
  valid_to: string | null;
  location_scope: string | null;
  geo_locations: Array<Record<string, unknown>>;
  distance_km: number;
  geom: string | null;
}

export interface ApiBacktestResult {
  errors: Array<{ field: string; message: string; hit_count: string }>;
  warnings: Array<{ field: string; message: string; hit_count: string }>;
  byBank: Array<{ bank: string; total: string; passed: string; failed: string }>;
  summary: { total: string; passed: string; failed: string };
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const api = {
  health: () =>
    get<{ status: string; db: string; ts: string }>('/health'),

  stats: () =>
    get<ApiStats>('/stats'),

  // The Admin app is trusted, so it always requests `scope=admin` to see
  // every lifecycle state (staging/review/approved/etc). The public Flutter
  // app never sends this and only ever gets PUBLISHED offers back.
  offers: (filters?: { bank?: string; status?: string; limit?: number; offset?: number; search?: string }) =>
    get<{ items: ApiOffer[]; total: number; limit: number; offset: number }>('/offers', { ...filters, scope: 'admin' } as any),

  offer: (id: string) =>
    get<ApiOffer>(`/offers/${id}`, { scope: 'admin' }),

  updateOfferStatus: (id: string, status: string) =>
    patch<{ id: string; db_status: string }>(`/offers/${id}`, { db_status: status }),

  offerReview: (id: string) =>
    get<ApiOfferReview>(`/offers/${id}/review`),

  offerHistory: (id: string) =>
    get<{ items: ApiReviewHistoryEntry[] }>(`/offers/${id}/history`),

  saveOfferCorrection: (id: string, override: Record<string, unknown>, reason?: string, expectedUpdatedAt?: string) =>
    post<{ manualOverride: Record<string, unknown>; rulePassed: boolean; ruleErrors: unknown[] }>(
      `/offers/${id}/correction`, { override, reason, expectedUpdatedAt }
    ),

  transitionOffer: (id: string, action: OfferReviewAction, reason?: string, correction?: Record<string, unknown>, expectedUpdatedAt?: string) =>
    post<{ id: string; fromStatus: string; toStatus: string }>(`/offers/${id}/transition`, { action, reason, correction, expectedUpdatedAt }),

  syncOffer: (id: string) =>
    post<{ offerId: string; outcome: string; reason?: string }>(`/sync/${id}`),

  bulkSync: () =>
    post<ApiBulkSyncSummary>('/sync'),

  syncPreview: () =>
    get<ApiSyncPreview>('/sync/preview'),

  syncRuns: (limit?: number) =>
    get<{ items: ApiSyncRun[] }>('/sync/runs', limit ? { limit } : undefined),

  duplicates: (filters?: { bank?: string; classification?: string; status?: string; minimum_score?: number; limit?: number; offset?: number }) =>
    get<{ items: ApiDuplicateCandidate[] }>('/duplicates', filters as any),

  duplicateStats: () =>
    get<ApiDuplicateStats>('/duplicates/stats'),

  duplicate: (id: string) =>
    get<{ id: string; offer: Record<string, unknown>; candidate_offer: Record<string, unknown> } & ApiDuplicateCandidate>(`/duplicates/${id}`),

  reviewDuplicate: (id: string, decision: DuplicateReviewStatus, reason?: string) =>
    post<{ id: string; status: DuplicateReviewStatus; offerId: string; offerNewStatus: string }>(`/duplicates/${id}/review`, { decision, reason }),

  mergeDuplicates: (canonicalOfferId: string, duplicateOfferId: string, reason?: string) =>
    post<{ success: boolean; canonicalOfferId: string; duplicateOfferId: string; action: string; message: string }>('/duplicates/merge', { canonicalOfferId, duplicateOfferId, reason }),

  runs: (filters?: { bank?: string; status?: string; limit?: number }) =>
    get<{ items: ApiScrapeRun[]; total: number }>('/runs', filters as any),

  run: (id: string) =>
    get<{ run: ApiScrapeRun; offers: ApiOffer[] }>(`/runs/${id}`),

  validation: (filters?: { passed?: boolean; limit?: number }) =>
    get<{ items: ApiValidationReport[] }>('/validation', {
      ...filters,
      passed: filters?.passed !== undefined ? String(filters.passed) as any : undefined,
    }),

  banks: () =>
    get<{ items: ApiBankSummary[] }>('/banks'),

  rules: () =>
    get<{ items: ApiRule[]; total: number }>('/rules'),

  updateRule: (id: string, changes: { enabled?: boolean; severity?: string; notes?: string }) =>
    patch_fn<ApiRule>(`/rules/${id}`, changes),

  backtest: () =>
    get<ApiBacktestResult>('/backtest'),

  revalidate: (params?: string | { bank?: string; offerId?: string }) => {
    const p = typeof params === 'string' ? { bank: params } : params;
    return post<{ total: number; passed: number; failed: number; errors: number }>('/revalidate', p);
  },

  triggerScrape: (bank: string, options?: { cache?: boolean; llm?: boolean; noValidate?: boolean; skipDetails?: boolean; concurrency?: number; maxCategories?: number }) =>
    post<{ message: string; pid: number; bank: string; startedAt: string }>(`/scrape/${bank}`, options),

  cancelScrape: (bank: string) =>
    post<{ message: string; cancelled: boolean; pid: number; bank: string }>(`/scrape/${bank}/cancel`),

  retryScrape: (bank: string, options?: { cache?: boolean; llm?: boolean; noValidate?: boolean; skipDetails?: boolean; concurrency?: number; maxCategories?: number }) =>
    post<{ message: string; pid: number; bank: string; startedAt: string; retry: boolean }>(`/scrape/${bank}/retry`, options),

  logs: (params?: { bank?: string; level?: string; tag?: string; search?: string; limit?: number }) =>
    get<{ items: ApiLogEntry[]; total: number }>('/logs', params),

  scrapeStatus: () =>
    get<{ active: Array<{ pid: number; bank: string; startedAt: string }>; activeGeo: Array<{ pid: number; bank: string; startedAt: string }> }>('/scrape/status'),

  triggerGeocode: (bank: string) =>
    post<{ message: string; pid: number; bank: string; startedAt: string }>(`/geocode/${bank}`),

  customRules: () =>
    get<{ items: ApiCustomRule[]; total: number }>('/custom-rules'),

  createCustomRule: (rule: Omit<ApiCustomRule, 'id' | 'created_at' | 'updated_at'>) =>
    post<ApiCustomRule>('/custom-rules', rule),

  updateCustomRule: (id: string, changes: Partial<Omit<ApiCustomRule, 'id' | 'created_at' | 'updated_at'>>) =>
    put<ApiCustomRule>(`/custom-rules/${id}`, changes),

  deleteCustomRule: (id: string) =>
    del<{ deleted: string }>(`/custom-rules/${id}`),

  testCustomRule: (id: string, bank?: string, limit?: number) =>
    post<ApiRuleTestResult>(`/custom-rules/${id}/test${bank ? `?bank=${bank}&limit=${limit ?? 50}` : `?limit=${limit ?? 50}`}`),

  bankParserRules: (bank?: string) =>
    get<{ items: ApiBankParserRule[]; total: number }>('/bank-parser-rules', bank ? { bank } : undefined),

  createBankParserRule: (rule: Omit<ApiBankParserRule, 'id' | 'is_builtin' | 'created_at' | 'updated_at' | 'category' | 'source_type' | 'status' | 'version'> & {
    category?: string | null;
    source_type?: string | null;
    status?: string;
    version?: number;
  }) =>
    post<ApiBankParserRule>('/bank-parser-rules', rule),

  updateBankParserRule: (id: string, changes: Partial<Omit<ApiBankParserRule, 'id' | 'bank' | 'is_builtin' | 'created_at' | 'updated_at'>>) =>
    put<ApiBankParserRule>(`/bank-parser-rules/${id}`, changes),

  deleteBankParserRule: (id: string) =>
    del<{ deleted: string }>(`/bank-parser-rules/${id}`),

  testBankParserRule: (id: string, limit?: number, trace?: boolean) =>
    post<ApiBankParserTestResult>(`/bank-parser-rules/${id}/test?limit=${limit ?? 20}${trace ? '&trace=true' : ''}`),

  bankParserBacktest: (bank: string, limit?: number) =>
    post<ApiParserBacktestResult>('/bank-parser-rules/backtest', { bank, limit: limit ?? 30 }),

  goldenCases: (params?: string | { bank?: string; field?: string; enabled?: boolean }) => {
    const p = typeof params === 'string' ? { bank: params } : params;
    return get<{ items: ApiGoldenCase[]; total: number }>('/parser-golden-cases', {
      bank: p?.bank,
      field: p?.field,
      enabled: p?.enabled !== undefined ? String(p?.enabled) : undefined,
    });
  },

  createGoldenCase: (body: {
    bank: string;
    field: string;
    expectedValue: string;
    offerId?: string;
    offerUniqueId?: string;
    offerTitle?: string;
    rawSnippet?: string;
    notes?: string;
    enabled?: boolean;
  }) => post<ApiGoldenCase>('/parser-golden-cases', body),

  updateGoldenCase: (id: string, changes: {
    expectedValue?: string;
    notes?: string;
    enabled?: boolean;
    field?: string;
    offerUniqueId?: string;
    offerTitle?: string;
    rawSnippet?: string;
  }) => put<ApiGoldenCase>(`/parser-golden-cases/${id}`, changes),

  deleteGoldenCase: (id: string) =>
    del<{ success: boolean; id: string }>(`/parser-golden-cases/${id}`),

  runGoldenCases: (body?: { bank?: string; field?: string }) =>
    post<ApiGoldenRunResult>('/parser-golden-cases/run', body ?? {}),

  costControlStatus: () =>
    get<ApiCostControlStatus>('/cost-control/status'),

  geoNearby: (params: { lat: number; lng: number; radius?: number; limit?: number }) =>
    get<{ items: ApiNearbyOffer[]; total: number }>('/geo/nearby', params),

  geoStats: () =>
    get<ApiGeoStats>('/geo/stats'),

  geoBackfill: (bank?: string) =>
    post<{ message: string; processed: number; updated: number }>('/geo/backfill', bank ? { bank } : {}),
};


// Named to avoid collision with the `patch` helper above
function patch_fn<T>(path: string, body: unknown): Promise<T> {
  return patch<T>(path, body);
}
