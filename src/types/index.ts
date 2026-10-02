export type BankId = 'HNB' | 'BOC' | 'SAMPATH' | 'NDB' | 'DFCC' | 'SEYLAN' | 'PABC' | 'PEOPLES' | 'NSB' | 'COMBANK';
export type OfferStatus = 'Draft' | 'Review' | 'Approved' | 'Active' | 'Expired' | 'Disabled' | 'Archived';
export type DbStatus = 'Pending' | 'Synced' | 'Held' | 'Rejected';
export type GeoStatus = 'Resolved' | 'Partial' | 'Unresolved' | 'Online';
export type DuplicateStatus = 'Clear' | 'Candidate' | 'Merged' | 'Confirmed';
export type RunStatus = 'Running' | 'Completed' | 'CompletedWithWarnings' | 'Failed' | 'Scheduled';
export type JobStatus = 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type SourceType = 'json-api' | 'html' | 'headless-browser' | 'pdf' | 'mixed';
export type LocationType = 'SINGLE' | 'LISTED' | 'CHAIN' | 'ONLINE' | 'NONE';
export type BenefitType = 'Percentage Discount' | 'Fixed Discount' | 'Cashback' | 'Installment' | 'Free Item' | 'Points Multiplier';
export type SyncAction = 'INSERT' | 'UPDATE' | 'DISABLE' | 'ARCHIVE' | 'NO_CHANGE';
export type ReviewPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type IssueType = 'Low LLM Score' | 'Missing Fields' | 'Parser Failure' | 'Duplicate Candidate' | 'Geo Unresolved' | 'Source Conflict' | 'Changed Offer' | 'Suspicious Expiry' | 'Eligibility Ambiguous';

export interface Offer {
  id: string;
  bank: BankId;
  merchant: string;
  title: string;
  category: string;
  benefitType: BenefitType;
  discount: string;
  cardTypes: string[];
  eligibility: string;
  startDate: string | null;
  expiryDate: string;
  terms: string;
  locations: string;
  locationCount: number;
  locationType: LocationType;
  sourceUrl: string;
  sourceType: SourceType;
  sourceRetrievedAt: string;
  status: OfferStatus;
  qualityScore: number;
  llmScore: number | null;
  parserConfidence: number;
  geoConfidence: number;
  duplicateScore: number;
  geoStatus: GeoStatus;
  duplicateStatus: DuplicateStatus;
  dbStatus: DbStatus;
  rawEvidenceId: string;
  updatedAt: string;
  createdAt: string;
  runId: string;
}

export interface RawEvidence {
  id: string;
  bank: BankId;
  sourceType: SourceType;
  sourceUrl: string;
  retrievedAt: string;
  rawHtml?: string;
  rawJson?: string;
  extractedText: string;
  pdfText?: string;
  checksum: string;
  parserStatus: 'Success' | 'Partial' | 'Failed';
  linkedOfferId: string | null;
  pageTitle: string;
  runId: string;
}

export interface ScrapeRun {
  id: string;
  bank: BankId;
  mode: string;
  startedAt: string;
  finishedAt: string | null;
  status: RunStatus;
  triggeredBy: string;
  duration: string | null;
  pagesCount: number;
  rawOffersCount: number;
  newCount: number;
  changedCount: number;
  unchangedCount: number;
  expiredCount: number;
  duplicateCandidates: number;
  failedCount: number;
  errorsCount: number;
  parserVersion: string;
  validationVersion: string;
  sourceCount: number;
}

export interface ScrapeJob {
  id: string;
  type: 'Scraper' | 'Parser' | 'LLM Validation' | 'Geo Validation' | 'Duplicate Detection' | 'DB Sync';
  bank: BankId | 'ALL';
  status: JobStatus;
  startedAt: string;
  duration: string | null;
  progress: number;
  runId?: string;
  error?: string;
}

export interface Merchant {
  id: string;
  canonicalName: string;
  aliases: string[];
  branchCount: number;
  activeOffersCount: number;
  geoStatus: GeoStatus;
  category: string;
  website?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  merchantId: string;
  merchantName: string;
  name: string;
  district: string;
  address: string;
  lat: number | null;
  lng: number | null;
  geoConfidence: number;
  placeMatch: string | null;
  status: 'Active' | 'Unverified' | 'Inactive';
  lastVerified: string | null;
}

export interface ValidationResult {
  offerId: string;
  passed: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  llmResult: LlmValidationResult | null;
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'Error' | 'Warning';
}

export interface LlmValidationResult {
  overallScore: number;
  confidence: number;
  fieldConfidence: Record<string, number>;
  issues: string[];
  reasoning: string;
  provider: string;
  model: string;
  promptVersion: string;
  validatedAt: string;
}

export interface DuplicateCandidate {
  id: string;
  offerAId: string;
  offerBId: string;
  offerA: Offer;
  offerB: Offer;
  similarityScore: number;
  signals: DuplicateSignal[];
  status: 'Pending' | 'Merged' | 'Kept Separate' | 'Not Duplicate';
  detectedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface DuplicateSignal {
  name: string;
  score: number;
}

export interface ReviewItem {
  id: string;
  offerId: string;
  offer: Offer;
  priority: ReviewPriority;
  issueType: IssueType;
  issueDescription: string;
  qualityScore: number;
  detectedAt: string;
  status: 'Pending' | 'InProgress' | 'Resolved' | 'Dismissed';
  assignedTo: string | null;
}

export interface StagingChange {
  id: string;
  offerId: string;
  offer: Offer;
  action: SyncAction;
  reason: string;
  reviewStatus: 'Pending' | 'Approved' | 'Rejected';
  changedFields?: string[];
  previousValues?: Record<string, string>;
  createdAt: string;
}

export interface SyncHistory {
  id: string;
  startedAt: string;
  completedAt: string;
  triggeredBy: string;
  insertCount: number;
  updateCount: number;
  disableCount: number;
  failedCount: number;
  status: 'Completed' | 'Failed' | 'Partial';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  component: string;
  bank?: BankId;
  runId?: string;
  offerId?: string;
  rawEvidenceId?: string;
  message: string;
  meta?: Record<string, string>;
}

export interface AuditEvent {
  id: string;
  offerId: string;
  timestamp: string;
  eventType: string;
  description: string;
  actor: string;
  changes?: Record<string, { from: string; to: string }>;
}

export interface BankerHealth {
  bank: BankId;
  status: 'Healthy' | 'Warning' | 'Failed' | 'Idle';
  lastRun: string;
  duration: string;
  rawOffers: number;
  newCount: number;
  changedCount: number;
  failedCount: number;
}

export interface GeoUnresolved {
  id: string;
  offerId: string;
  rawLocation: string;
  merchantName: string;
  issue: string;
  candidates: GeoBranchCandidate[];
  status: 'Pending' | 'Resolved' | 'MarkedUnknown' | 'MarkedNationwide';
}

export interface GeoBranchCandidate {
  name: string;
  address: string;
  lat: number;
  lng: number;
  confidence: number;
}

export interface MapMarker {
  id: string;
  merchantName: string;
  branchName: string;
  district: string;
  lat: number;
  lng: number;
  geoConfidence: number;
  offerCount: number;
  bank: BankId;
  lastVerified: string;
  verified: boolean;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'Error' | 'Warning';
  enabled: boolean;
  triggeredToday: number;
  lastModified: string;
}
