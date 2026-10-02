import type {
  Offer, RawEvidence, ScrapeRun, ScrapeJob, Merchant, Branch,
  DuplicateCandidate, ReviewItem, StagingChange, SyncHistory,
  SystemLog, AuditEvent, BankerHealth, GeoUnresolved, MapMarker, ValidationRule
} from '../types';

// ─── Offers ────────────────────────────────────────────────────────────────

export const mockOffers: Offer[] = [
  {
    id: 'OFF-10482', bank: 'HNB', merchant: 'Keells Super', title: '20% Savings at Keells Super',
    category: 'Grocery', benefitType: 'Percentage Discount', discount: '20%',
    cardTypes: ['Visa Signature'], eligibility: 'Selected HNB Visa Signature Cards',
    startDate: null, expiryDate: '2026-08-31', terms: 'Valid at selected outlets. Minimum spend LKR 2,500.',
    locations: 'Selected branches', locationCount: 42, locationType: 'CHAIN',
    sourceUrl: 'https://www.hnb.net/personal/cards/credit-cards/offers/grocery',
    sourceType: 'html', sourceRetrievedAt: '2026-08-28T08:31:00Z',
    status: 'Review', qualityScore: 61, llmScore: 61, parserConfidence: 0.82,
    geoConfidence: 0.64, duplicateScore: 0.12, geoStatus: 'Partial',
    duplicateStatus: 'Clear', dbStatus: 'Pending', rawEvidenceId: 'RAW-00192',
    updatedAt: '2026-08-28T08:32:00Z', createdAt: '2026-08-28T08:31:00Z', runId: 'RUN-2841',
  },
  {
    id: 'OFF-10483', bank: 'HNB', merchant: 'Pizza Hut', title: '15% Off at Pizza Hut',
    category: 'Dining', benefitType: 'Percentage Discount', discount: '15%',
    cardTypes: ['Visa', 'Mastercard'], eligibility: 'All HNB Credit Cards',
    startDate: '2026-07-01', expiryDate: '2026-09-30', terms: 'Dine-in only. Not valid with other offers.',
    locations: 'All Pizza Hut outlets', locationCount: 28, locationType: 'CHAIN',
    sourceUrl: 'https://www.hnb.net/personal/cards/credit-cards/offers/dining',
    sourceType: 'html', sourceRetrievedAt: '2026-08-28T08:31:00Z',
    status: 'Active', qualityScore: 92, llmScore: 91, parserConfidence: 0.96,
    geoConfidence: 0.91, duplicateScore: 0.05, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00193',
    updatedAt: '2026-08-27T10:00:00Z', createdAt: '2026-08-20T09:00:00Z', runId: 'RUN-2841',
  },
  {
    id: 'OFF-10484', bank: 'BOC', merchant: 'Cargills Food City', title: '10% Cashback at Cargills',
    category: 'Grocery', benefitType: 'Cashback', discount: '10%',
    cardTypes: ['Visa Platinum', 'Mastercard Gold'], eligibility: 'BOC Platinum & Gold Cards',
    startDate: '2026-08-01', expiryDate: '2026-10-31', terms: 'Cashback credited within 30 days.',
    locations: 'All Cargills outlets island-wide', locationCount: 320, locationType: 'CHAIN',
    sourceUrl: 'https://www.boc.lk/personal/cards/credit-cards/promotions',
    sourceType: 'html', sourceRetrievedAt: '2026-08-28T09:15:00Z',
    status: 'Active', qualityScore: 88, llmScore: 87, parserConfidence: 0.91,
    geoConfidence: 0.95, duplicateScore: 0.08, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00201',
    updatedAt: '2026-08-28T09:16:00Z', createdAt: '2026-08-28T09:15:00Z', runId: 'RUN-2842',
  },
  {
    id: 'OFF-10485', bank: 'SAMPATH', merchant: 'Hilton Colombo', title: '25% Off Dining at Hilton',
    category: 'Dining', benefitType: 'Percentage Discount', discount: '25%',
    cardTypes: ['Visa Infinite', 'Mastercard World'], eligibility: 'Sampath Premium Cards',
    startDate: '2026-08-15', expiryDate: '2026-12-31', terms: 'Reservations required. Valid Sun–Thu.',
    locations: 'Hilton Colombo – Union Place', locationCount: 1, locationType: 'SINGLE',
    sourceUrl: 'https://www.sampath.lk/en/cards/credit-cards/offers',
    sourceType: 'json-api', sourceRetrievedAt: '2026-08-28T07:45:00Z',
    status: 'Active', qualityScore: 95, llmScore: 94, parserConfidence: 0.98,
    geoConfidence: 0.97, duplicateScore: 0.02, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00210',
    updatedAt: '2026-08-28T07:46:00Z', createdAt: '2026-08-28T07:45:00Z', runId: 'RUN-2843',
  },
  {
    id: 'OFF-10486', bank: 'NDB', merchant: 'Arpico Supercentre', title: '12% Discount at Arpico',
    category: 'Shopping', benefitType: 'Percentage Discount', discount: '12%',
    cardTypes: ['Visa', 'Mastercard', 'UnionPay'], eligibility: 'All NDB Credit Cards',
    startDate: '2026-08-01', expiryDate: '2026-08-31', terms: 'Max discount LKR 1,500 per transaction.',
    locations: 'All Arpico outlets', locationCount: 45, locationType: 'CHAIN',
    sourceUrl: 'https://www.ndbbank.com/personal/cards/promotions',
    sourceType: 'headless-browser', sourceRetrievedAt: '2026-08-28T06:55:00Z',
    status: 'Approved', qualityScore: 84, llmScore: 82, parserConfidence: 0.88,
    geoConfidence: 0.87, duplicateScore: 0.15, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Pending', rawEvidenceId: 'RAW-00220',
    updatedAt: '2026-08-28T07:00:00Z', createdAt: '2026-08-28T06:55:00Z', runId: 'RUN-2844',
  },
  {
    id: 'OFF-10487', bank: 'DFCC', merchant: 'Softlogic Glomark', title: '30% Off Electronics at Glomark',
    category: 'Shopping', benefitType: 'Percentage Discount', discount: '30%',
    cardTypes: ['Visa Platinum'], eligibility: 'DFCC Visa Platinum Cards only',
    startDate: '2026-08-20', expiryDate: '2026-09-15', terms: 'Selected items only. While stocks last.',
    locations: 'Selected Glomark outlets', locationCount: 12, locationType: 'LISTED',
    sourceUrl: 'https://www.dfcc.lk/personal/credit-cards/promotions',
    sourceType: 'headless-browser', sourceRetrievedAt: '2026-08-27T14:00:00Z',
    status: 'Review', qualityScore: 58, llmScore: 55, parserConfidence: 0.71,
    geoConfidence: 0.52, duplicateScore: 0.22, geoStatus: 'Unresolved',
    duplicateStatus: 'Candidate', dbStatus: 'Held', rawEvidenceId: 'RAW-00230',
    updatedAt: '2026-08-27T14:05:00Z', createdAt: '2026-08-27T14:00:00Z', runId: 'RUN-2845',
  },
  {
    id: 'OFF-10488', bank: 'SEYLAN', merchant: 'KFC', title: '20% Off at KFC',
    category: 'Dining', benefitType: 'Percentage Discount', discount: '20%',
    cardTypes: ['Visa', 'Mastercard'], eligibility: 'All Seylan Cards',
    startDate: '2026-07-15', expiryDate: '2026-09-30', terms: 'Valid for dine-in and takeaway.',
    locations: 'All KFC outlets island-wide', locationCount: 55, locationType: 'CHAIN',
    sourceUrl: 'https://www.seylanbank.lk/personal/cards/credit-card-offers',
    sourceType: 'html', sourceRetrievedAt: '2026-08-28T10:00:00Z',
    status: 'Active', qualityScore: 90, llmScore: 89, parserConfidence: 0.94,
    geoConfidence: 0.92, duplicateScore: 0.04, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00240',
    updatedAt: '2026-08-28T10:01:00Z', createdAt: '2026-08-28T10:00:00Z', runId: 'RUN-2846',
  },
  {
    id: 'OFF-10489', bank: 'PEOPLES', merchant: 'Keells Super', title: '15% Off at Keells (Peoples Card)',
    category: 'Grocery', benefitType: 'Percentage Discount', discount: '15%',
    cardTypes: ['Visa'], eligibility: 'Peoples Bank Visa Credit Cards',
    startDate: null, expiryDate: '2026-08-31', terms: 'Minimum spend LKR 1,500. Max discount LKR 500.',
    locations: 'All Keells outlets', locationCount: 42, locationType: 'CHAIN',
    sourceUrl: 'https://www.peoplesbank.lk/personal/cards/credit-cards/promotions',
    sourceType: 'html', sourceRetrievedAt: '2026-08-28T09:00:00Z',
    status: 'Review', qualityScore: 67, llmScore: 65, parserConfidence: 0.78,
    geoConfidence: 0.88, duplicateScore: 0.96, geoStatus: 'Resolved',
    duplicateStatus: 'Candidate', dbStatus: 'Held', rawEvidenceId: 'RAW-00250',
    updatedAt: '2026-08-28T09:05:00Z', createdAt: '2026-08-28T09:00:00Z', runId: 'RUN-2847',
  },
  {
    id: 'OFF-10490', bank: 'PABC', merchant: 'Laugfs Supermarket', title: '8% Savings at Laugfs',
    category: 'Grocery', benefitType: 'Percentage Discount', discount: '8%',
    cardTypes: ['Visa', 'Mastercard'], eligibility: 'All Pan Asia Bank Cards',
    startDate: '2026-08-01', expiryDate: '2026-10-31',
    terms: 'Valid on weekends only. Excludes tobacco and liquor.',
    locations: 'All Laugfs outlets', locationCount: 38, locationType: 'CHAIN',
    sourceUrl: 'https://www.panasiabank.lk/personal/cards/card-offers',
    sourceType: 'html', sourceRetrievedAt: '2026-08-28T08:00:00Z',
    status: 'Active', qualityScore: 82, llmScore: 81, parserConfidence: 0.87,
    geoConfidence: 0.83, duplicateScore: 0.06, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00260',
    updatedAt: '2026-08-28T08:01:00Z', createdAt: '2026-08-28T08:00:00Z', runId: 'RUN-2848',
  },
  {
    id: 'OFF-10491', bank: 'SAMPATH', merchant: 'Softlogic Life', title: 'Buy 1 Get 1 on Insurance Plans',
    category: 'Finance', benefitType: 'Free Item', discount: 'BOGO',
    cardTypes: ['Mastercard'], eligibility: 'Sampath Mastercard holders',
    startDate: '2026-08-01', expiryDate: '2026-11-30', terms: 'T&Cs apply. Subject to underwriting.',
    locations: 'Online only', locationCount: 0, locationType: 'ONLINE',
    sourceUrl: 'https://www.sampath.lk/en/cards/credit-cards/offers/insurance',
    sourceType: 'json-api', sourceRetrievedAt: '2026-08-28T07:45:00Z',
    status: 'Active', qualityScore: 79, llmScore: 77, parserConfidence: 0.84,
    geoConfidence: 1.0, duplicateScore: 0.01, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00211',
    updatedAt: '2026-08-28T07:47:00Z', createdAt: '2026-08-28T07:45:00Z', runId: 'RUN-2843',
  },
  {
    id: 'OFF-10492', bank: 'HNB', merchant: 'Amagi Beach Resort', title: 'Special Rate at Amagi Beach',
    category: 'Hotels', benefitType: 'Percentage Discount', discount: '20%',
    cardTypes: ['Visa Signature', 'Visa Infinite'], eligibility: 'HNB World & Signature Cards',
    startDate: '2026-09-01', expiryDate: '2026-12-31', terms: 'Advance booking required 7 days.',
    locations: 'Amagi Beach Resort, Kalpitiya', locationCount: 1, locationType: 'SINGLE',
    sourceUrl: 'https://www.hnb.net/personal/cards/credit-cards/offers/hotels',
    sourceType: 'html', sourceRetrievedAt: '2026-08-28T08:31:00Z',
    status: 'Active', qualityScore: 93, llmScore: 93, parserConfidence: 0.97,
    geoConfidence: 0.94, duplicateScore: 0.03, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00194',
    updatedAt: '2026-08-28T08:32:00Z', createdAt: '2026-08-28T08:31:00Z', runId: 'RUN-2841',
  },
  {
    id: 'OFF-10493', bank: 'NDB', merchant: 'Daraz.lk', title: '5% Extra Off on Daraz',
    category: 'Online Shopping', benefitType: 'Cashback', discount: '5%',
    cardTypes: ['Visa', 'Mastercard', 'UnionPay'], eligibility: 'All NDB Cards',
    startDate: '2026-08-01', expiryDate: '2026-09-30', terms: 'Use promo code NDB5 at checkout.',
    locations: 'Online only', locationCount: 0, locationType: 'ONLINE',
    sourceUrl: 'https://www.ndbbank.com/personal/cards/promotions/online',
    sourceType: 'headless-browser', sourceRetrievedAt: '2026-08-28T06:55:00Z',
    status: 'Active', qualityScore: 88, llmScore: 87, parserConfidence: 0.92,
    geoConfidence: 1.0, duplicateScore: 0.04, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00221',
    updatedAt: '2026-08-28T06:56:00Z', createdAt: '2026-08-28T06:55:00Z', runId: 'RUN-2844',
  },
  {
    id: 'OFF-10494', bank: 'BOC', merchant: 'Keells', title: '10% Off at Keells (BOC)',
    category: 'Grocery', benefitType: 'Percentage Discount', discount: '10%',
    cardTypes: ['Visa', 'Mastercard'], eligibility: 'BOC Credit Cards',
    startDate: null, expiryDate: '2026-08-31', terms: 'Valid at selected Keells outlets.',
    locations: 'Selected Keells outlets', locationCount: 35, locationType: 'LISTED',
    sourceUrl: 'https://www.boc.lk/personal/cards/credit-cards/promotions/grocery',
    sourceType: 'html', sourceRetrievedAt: '2026-08-28T09:15:00Z',
    status: 'Review', qualityScore: 64, llmScore: 62, parserConfidence: 0.74,
    geoConfidence: 0.71, duplicateScore: 0.94, geoStatus: 'Partial',
    duplicateStatus: 'Candidate', dbStatus: 'Held', rawEvidenceId: 'RAW-00202',
    updatedAt: '2026-08-28T09:16:00Z', createdAt: '2026-08-28T09:15:00Z', runId: 'RUN-2842',
  },
  {
    id: 'OFF-10495', bank: 'DFCC', merchant: 'Burger King', title: '25% Off at Burger King',
    category: 'Dining', benefitType: 'Percentage Discount', discount: '25%',
    cardTypes: ['Visa Platinum', 'Mastercard Platinum'], eligibility: 'DFCC Platinum Cards',
    startDate: '2026-08-15', expiryDate: '2026-10-31', terms: 'Valid Mon–Fri. Excludes public holidays.',
    locations: 'All Burger King outlets', locationCount: 18, locationType: 'CHAIN',
    sourceUrl: 'https://www.dfcc.lk/personal/credit-cards/promotions/dining',
    sourceType: 'headless-browser', sourceRetrievedAt: '2026-08-27T14:00:00Z',
    status: 'Active', qualityScore: 89, llmScore: 88, parserConfidence: 0.93,
    geoConfidence: 0.90, duplicateScore: 0.07, geoStatus: 'Resolved',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00231',
    updatedAt: '2026-08-27T14:06:00Z', createdAt: '2026-08-27T14:00:00Z', runId: 'RUN-2845',
  },
  {
    id: 'OFF-10496', bank: 'SEYLAN', merchant: 'Noritake', title: '15% Discount at Noritake',
    category: 'Lifestyle', benefitType: 'Percentage Discount', discount: '15%',
    cardTypes: ['Visa Signature', 'Mastercard Titanium'], eligibility: 'Seylan Premium Cards',
    startDate: '2026-08-01', expiryDate: '2026-12-31', terms: 'Applies to all crockery items.',
    locations: 'Selected Noritake outlets', locationCount: 4, locationType: 'LISTED',
    sourceUrl: 'https://www.seylanbank.lk/personal/cards/credit-card-offers/lifestyle',
    sourceType: 'html', sourceRetrievedAt: '2026-08-28T10:00:00Z',
    status: 'Active', qualityScore: 86, llmScore: 85, parserConfidence: 0.90,
    geoConfidence: 0.68, duplicateScore: 0.05, geoStatus: 'Partial',
    duplicateStatus: 'Clear', dbStatus: 'Synced', rawEvidenceId: 'RAW-00241',
    updatedAt: '2026-08-28T10:02:00Z', createdAt: '2026-08-28T10:00:00Z', runId: 'RUN-2846',
  },
];

// ─── Raw Evidence ──────────────────────────────────────────────────────────

export const mockRawEvidence: RawEvidence[] = [
  {
    id: 'RAW-00192', bank: 'HNB', sourceType: 'html',
    sourceUrl: 'https://www.hnb.net/personal/cards/credit-cards/offers/grocery',
    retrievedAt: '2026-08-28T08:31:00Z',
    extractedText: '20% savings at Keells Super outlets for selected HNB Visa Signature cards. Offer valid until 31 August 2026. Terms and conditions apply. Minimum spend LKR 2,500.',
    rawHtml: '<div class="offer-card"><h3>20% Savings at Keells Super</h3><p>Valid for selected HNB Visa Signature cardholders at Keells Super outlets. Offer expires 31 August 2026.</p></div>',
    rawJson: undefined,
    pdfText: undefined,
    checksum: 'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    parserStatus: 'Success', linkedOfferId: 'OFF-10482',
    pageTitle: 'HNB Credit Card Offers - Grocery', runId: 'RUN-2841',
  },
  {
    id: 'RAW-00193', bank: 'HNB', sourceType: 'html',
    sourceUrl: 'https://www.hnb.net/personal/cards/credit-cards/offers/dining',
    retrievedAt: '2026-08-28T08:31:00Z',
    extractedText: '15% off at Pizza Hut for all HNB Credit Cards. Valid July 1 – September 30, 2026. Dine-in only.',
    rawHtml: '<div class="offer-card"><h3>15% Off at Pizza Hut</h3><p>Enjoy 15% off for all HNB credit cardholders. Valid Jul 1 to Sep 30, 2026. Dine-in only.</p></div>',
    checksum: 'sha256:b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    parserStatus: 'Success', linkedOfferId: 'OFF-10483',
    pageTitle: 'HNB Credit Card Offers - Dining', runId: 'RUN-2841',
  },
  {
    id: 'RAW-00201', bank: 'BOC', sourceType: 'html',
    sourceUrl: 'https://www.boc.lk/personal/cards/credit-cards/promotions',
    retrievedAt: '2026-08-28T09:15:00Z',
    extractedText: 'Get 10% cashback at Cargills Food City with BOC Platinum and Gold Credit Cards. Valid August 1 to October 31 2026. Cashback credited within 30 days.',
    rawHtml: '<section class="promotion"><h2>10% Cashback at Cargills Food City</h2><p>BOC Platinum &amp; Gold cardholders enjoy 10% cashback island-wide.</p></section>',
    checksum: 'sha256:c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    parserStatus: 'Success', linkedOfferId: 'OFF-10484',
    pageTitle: 'BOC Credit Card Promotions', runId: 'RUN-2842',
  },
  {
    id: 'RAW-00202', bank: 'BOC', sourceType: 'html',
    sourceUrl: 'https://www.boc.lk/personal/cards/credit-cards/promotions/grocery',
    retrievedAt: '2026-08-28T09:15:00Z',
    extractedText: 'BOC credit cardholders enjoy 10% off at selected Keells outlets until 31st August 2026.',
    rawHtml: '<div class="offer"><h3>10% Off Keells</h3><p>For BOC credit cards at selected Keells outlets. Offer ends 31 August 2026.</p></div>',
    checksum: 'sha256:d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    parserStatus: 'Partial', linkedOfferId: 'OFF-10494',
    pageTitle: 'BOC Grocery Offers', runId: 'RUN-2842',
  },
  {
    id: 'RAW-00210', bank: 'SAMPATH', sourceType: 'json-api',
    sourceUrl: 'https://api.sampath.lk/v2/offers?category=dining&type=credit',
    retrievedAt: '2026-08-28T07:45:00Z',
    extractedText: 'Hilton Colombo: 25% dining discount for Sampath Visa Infinite and Mastercard World cardholders. Valid August 15 – December 31 2026. Reservations required. Sun–Thu only.',
    rawJson: '{"id":"sampath-hilton-001","merchant":"Hilton Colombo","discount":25,"type":"percentage","cardTypes":["Visa Infinite","Mastercard World"],"validFrom":"2026-08-15","validTo":"2026-12-31","terms":"Advance reservations required. Valid Sun–Thu."}',
    checksum: 'sha256:e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    parserStatus: 'Success', linkedOfferId: 'OFF-10485',
    pageTitle: 'Sampath Bank Offers API', runId: 'RUN-2843',
  },
  {
    id: 'RAW-00230', bank: 'DFCC', sourceType: 'headless-browser',
    sourceUrl: 'https://www.dfcc.lk/personal/credit-cards/promotions/shopping',
    retrievedAt: '2026-08-27T14:00:00Z',
    extractedText: 'DFCC Visa Platinum cardholders enjoy 30% off at selected Softlogic Glomark outlets. Valid August 20 to September 15 2026. Selected items only.',
    rawHtml: '<div class="promo-block" data-rendered="true"><h2>30% Off Electronics</h2><p>Exclusively for DFCC Visa Platinum. Selected Glomark stores. Aug 20 – Sep 15 2026.</p></div>',
    checksum: 'sha256:f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    parserStatus: 'Partial', linkedOfferId: 'OFF-10487',
    pageTitle: 'DFCC Credit Card Promotions', runId: 'RUN-2845',
  },
];

// ─── Scrape Runs ───────────────────────────────────────────────────────────

export const mockScrapeRuns: ScrapeRun[] = [
  {
    id: 'RUN-2841', bank: 'HNB', mode: 'Full Bank Scrape',
    startedAt: '2026-08-28T08:29:00Z', finishedAt: '2026-08-28T08:31:52Z',
    status: 'CompletedWithWarnings', triggeredBy: 'Scheduler',
    duration: '1m 52s', pagesCount: 31, rawOffersCount: 94,
    newCount: 8, changedCount: 4, unchangedCount: 77, expiredCount: 3,
    duplicateCandidates: 4, failedCount: 2, errorsCount: 5,
    parserVersion: '2.4.1', validationVersion: '1.3.0', sourceCount: 14,
  },
  {
    id: 'RUN-2842', bank: 'BOC', mode: 'Full Bank Scrape',
    startedAt: '2026-08-28T08:15:00Z', finishedAt: '2026-08-28T08:30:22Z',
    status: 'Completed', triggeredBy: 'Scheduler',
    duration: '2m 14s', pagesCount: 18, rawOffersCount: 47,
    newCount: 2, changedCount: 1, unchangedCount: 43, expiredCount: 1,
    duplicateCandidates: 2, failedCount: 0, errorsCount: 0,
    parserVersion: '2.4.1', validationVersion: '1.3.0', sourceCount: 13,
  },
  {
    id: 'RUN-2843', bank: 'SAMPATH', mode: 'Full Bank Scrape',
    startedAt: '2026-08-28T08:00:00Z', finishedAt: '2026-08-28T08:10:45Z',
    status: 'CompletedWithWarnings', triggeredBy: 'Scheduler',
    duration: '3m 08s', pagesCount: 24, rawOffersCount: 91,
    newCount: 6, changedCount: 4, unchangedCount: 75, expiredCount: 4,
    duplicateCandidates: 3, failedCount: 3, errorsCount: 7,
    parserVersion: '2.4.1', validationVersion: '1.3.0', sourceCount: 12,
  },
  {
    id: 'RUN-2844', bank: 'NDB', mode: 'Full Bank Scrape',
    startedAt: '2026-08-28T07:50:00Z', finishedAt: '2026-08-28T08:01:31Z',
    status: 'Completed', triggeredBy: 'Scheduler',
    duration: '1m 31s', pagesCount: 20, rawOffersCount: 54,
    newCount: 3, changedCount: 2, unchangedCount: 48, expiredCount: 1,
    duplicateCandidates: 1, failedCount: 0, errorsCount: 0,
    parserVersion: '2.4.0', validationVersion: '1.3.0', sourceCount: 18,
  },
  {
    id: 'RUN-2845', bank: 'DFCC', mode: 'Full Bank Scrape',
    startedAt: '2026-08-28T07:30:00Z', finishedAt: null,
    status: 'Failed', triggeredBy: 'Scheduler',
    duration: null, pagesCount: 0, rawOffersCount: 0,
    newCount: 0, changedCount: 0, unchangedCount: 0, expiredCount: 0,
    duplicateCandidates: 0, failedCount: 1, errorsCount: 1,
    parserVersion: '2.4.1', validationVersion: '1.3.0', sourceCount: 24,
  },
  {
    id: 'RUN-2846', bank: 'SEYLAN', mode: 'Full Bank Scrape',
    startedAt: '2026-08-28T09:45:00Z', finishedAt: '2026-08-28T09:57:30Z',
    status: 'Completed', triggeredBy: 'Admin (Nuwan)',
    duration: '2m 30s', pagesCount: 26, rawOffersCount: 62,
    newCount: 4, changedCount: 2, unchangedCount: 54, expiredCount: 2,
    duplicateCandidates: 1, failedCount: 0, errorsCount: 1,
    parserVersion: '2.4.1', validationVersion: '1.3.0', sourceCount: 24,
  },
  {
    id: 'RUN-2847', bank: 'PEOPLES', mode: 'Latest Offers',
    startedAt: '2026-08-28T08:55:00Z', finishedAt: '2026-08-28T09:02:10Z',
    status: 'Completed', triggeredBy: 'Scheduler',
    duration: '1m 45s', pagesCount: 14, rawOffersCount: 38,
    newCount: 2, changedCount: 1, unchangedCount: 34, expiredCount: 1,
    duplicateCandidates: 2, failedCount: 0, errorsCount: 0,
    parserVersion: '2.4.1', validationVersion: '1.3.0', sourceCount: 12,
  },
  {
    id: 'RUN-2840', bank: 'HNB', mode: 'Re-scrape Failed Records',
    startedAt: '2026-08-27T15:00:00Z', finishedAt: '2026-08-27T15:04:20Z',
    status: 'Completed', triggeredBy: 'Admin (Nuwan)',
    duration: '4m 20s', pagesCount: 8, rawOffersCount: 12,
    newCount: 0, changedCount: 2, unchangedCount: 8, expiredCount: 0,
    duplicateCandidates: 0, failedCount: 2, errorsCount: 2,
    parserVersion: '2.4.1', validationVersion: '1.3.0', sourceCount: 14,
  },
];

// ─── Jobs ──────────────────────────────────────────────────────────────────

export const mockJobs: ScrapeJob[] = [
  { id: 'JOB-0512', type: 'Scraper', bank: 'HNB', status: 'Completed', startedAt: '2026-08-28T08:29:00Z', duration: '1m 52s', progress: 100, runId: 'RUN-2841' },
  { id: 'JOB-0513', type: 'LLM Validation', bank: 'HNB', status: 'Completed', startedAt: '2026-08-28T08:32:00Z', duration: '45s', progress: 100, runId: 'RUN-2841' },
  { id: 'JOB-0514', type: 'Scraper', bank: 'BOC', status: 'Completed', startedAt: '2026-08-28T08:15:00Z', duration: '2m 14s', progress: 100, runId: 'RUN-2842' },
  { id: 'JOB-0515', type: 'Geo Validation', bank: 'BOC', status: 'Completed', startedAt: '2026-08-28T08:31:00Z', duration: '1m 10s', progress: 100 },
  { id: 'JOB-0516', type: 'Scraper', bank: 'SAMPATH', status: 'CompletedWithWarnings' as any, startedAt: '2026-08-28T08:00:00Z', duration: '3m 08s', progress: 100, runId: 'RUN-2843' },
  { id: 'JOB-0517', type: 'Scraper', bank: 'DFCC', status: 'Failed', startedAt: '2026-08-28T07:30:00Z', duration: null, progress: 12, runId: 'RUN-2845', error: 'Puppeteer navigation timeout after 30s on /promotions/shopping' },
  { id: 'JOB-0518', type: 'Duplicate Detection', bank: 'ALL', status: 'Running', startedAt: '2026-08-28T11:00:00Z', duration: null, progress: 64 },
  { id: 'JOB-0519', type: 'DB Sync', bank: 'ALL', status: 'Queued', startedAt: '2026-08-28T11:05:00Z', duration: null, progress: 0 },
  { id: 'JOB-0520', type: 'Scraper', bank: 'SEYLAN', status: 'Completed', startedAt: '2026-08-28T09:45:00Z', duration: '2m 30s', progress: 100, runId: 'RUN-2846' },
  { id: 'JOB-0521', type: 'LLM Validation', bank: 'SAMPATH', status: 'Running', startedAt: '2026-08-28T11:02:00Z', duration: null, progress: 38 },
];

// ─── Merchants ─────────────────────────────────────────────────────────────

export const mockMerchants: Merchant[] = [
  { id: 'MER-001', canonicalName: 'Keells Super', aliases: ['Keells', 'KEELLS', 'Keells Supermarket', 'John Keells Supermarkets'], branchCount: 42, activeOffersCount: 8, geoStatus: 'Resolved', category: 'Grocery', website: 'https://keells.com', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'MER-002', canonicalName: 'Pizza Hut', aliases: ['Pizza Hut Lanka', 'PH'], branchCount: 28, activeOffersCount: 6, geoStatus: 'Resolved', category: 'Dining', website: 'https://pizzahut.lk', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'MER-003', canonicalName: 'Cargills Food City', aliases: ['Cargills', 'FoodCity', 'Cargills FoodCity'], branchCount: 320, activeOffersCount: 5, geoStatus: 'Resolved', category: 'Grocery', website: 'https://cargillsceylon.com', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'MER-004', canonicalName: 'Hilton Colombo', aliases: ['Hilton', 'Hilton Hotel Colombo'], branchCount: 1, activeOffersCount: 3, geoStatus: 'Resolved', category: 'Hotels', website: 'https://hiltoncolomboresidence.com', createdAt: '2026-01-20T00:00:00Z' },
  { id: 'MER-005', canonicalName: 'KFC', aliases: ['Kentucky Fried Chicken', 'KFC Lanka'], branchCount: 55, activeOffersCount: 7, geoStatus: 'Resolved', category: 'Dining', website: 'https://kfclanka.com', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'MER-006', canonicalName: 'Arpico Supercentre', aliases: ['Arpico', 'ARPICO', 'Richard Pieris Arpico'], branchCount: 45, activeOffersCount: 4, geoStatus: 'Resolved', category: 'Shopping', website: 'https://arpico.com', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'MER-007', canonicalName: 'Softlogic Glomark', aliases: ['Glomark', 'Softlogic Supermarket'], branchCount: 24, activeOffersCount: 2, geoStatus: 'Partial', category: 'Shopping', website: 'https://glomark.lk', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'MER-008', canonicalName: 'Laugfs Supermarket', aliases: ['Laugfs', 'LAUGFS'], branchCount: 38, activeOffersCount: 3, geoStatus: 'Resolved', category: 'Grocery', website: 'https://laugfs.lk', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'MER-009', canonicalName: 'Burger King', aliases: ['BK', 'Burger King Lanka'], branchCount: 18, activeOffersCount: 3, geoStatus: 'Resolved', category: 'Dining', website: 'https://burgerkingleanka.com', createdAt: '2026-02-15T00:00:00Z' },
  { id: 'MER-010', canonicalName: 'Amagi Beach Resort', aliases: ['Amagi Beach', 'Amagi Resort'], branchCount: 1, activeOffersCount: 2, geoStatus: 'Resolved', category: 'Hotels', website: 'https://amagibeach.com', createdAt: '2026-03-01T00:00:00Z' },
  { id: 'MER-011', canonicalName: 'Daraz.lk', aliases: ['Daraz', 'Daraz Lanka'], branchCount: 0, activeOffersCount: 4, geoStatus: 'Resolved', category: 'Online Shopping', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'MER-012', canonicalName: 'Noritake', aliases: ['Noritake Lanka', 'Noritake Ceramics'], branchCount: 4, activeOffersCount: 2, geoStatus: 'Partial', category: 'Lifestyle', createdAt: '2026-04-01T00:00:00Z' },
];

// ─── Branches ─────────────────────────────────────────────────────────────

export const mockBranches: Branch[] = [
  { id: 'BR-001', merchantId: 'MER-001', merchantName: 'Keells Super', name: 'Keells Super – Rajagiriya', district: 'Colombo', address: 'No. 5, Rajagiriya Road, Rajagiriya', lat: 6.9069, lng: 79.8996, geoConfidence: 0.95, placeMatch: 'ChIJ...kl1', status: 'Active', lastVerified: '2026-08-20' },
  { id: 'BR-002', merchantId: 'MER-001', merchantName: 'Keells Super', name: 'Keells Super – Nugegoda', district: 'Colombo', address: 'High Level Road, Nugegoda', lat: 6.8696, lng: 79.8997, geoConfidence: 0.92, placeMatch: 'ChIJ...km2', status: 'Active', lastVerified: '2026-08-20' },
  { id: 'BR-003', merchantId: 'MER-002', merchantName: 'Pizza Hut', name: 'Pizza Hut – Union Place', district: 'Colombo', address: '38, Union Place, Colombo 2', lat: 6.9210, lng: 79.8600, geoConfidence: 0.97, placeMatch: 'ChIJ...pz1', status: 'Active', lastVerified: '2026-08-22' },
  { id: 'BR-004', merchantId: 'MER-002', merchantName: 'Pizza Hut', name: 'Pizza Hut – Kandy', district: 'Kandy', address: 'Dalada Veediya, Kandy', lat: 7.2906, lng: 80.6337, geoConfidence: 0.91, placeMatch: 'ChIJ...pz2', status: 'Active', lastVerified: '2026-08-22' },
  { id: 'BR-005', merchantId: 'MER-005', merchantName: 'KFC', name: 'KFC – Galle Road', district: 'Colombo', address: 'Galle Road, Colombo 4', lat: 6.8800, lng: 79.8557, geoConfidence: 0.98, placeMatch: 'ChIJ...kfc1', status: 'Active', lastVerified: '2026-08-25' },
  { id: 'BR-006', merchantId: 'MER-007', merchantName: 'Softlogic Glomark', name: 'Glomark – Nugegoda', district: 'Colombo', address: 'High Level Road, Nugegoda', lat: null, lng: null, geoConfidence: 0.52, placeMatch: null, status: 'Unverified', lastVerified: null },
  { id: 'BR-007', merchantId: 'MER-004', merchantName: 'Hilton Colombo', name: 'Hilton Colombo', district: 'Colombo', address: '2, Sir Chittampalam A. Gardiner Mawatha, Colombo 2', lat: 6.9218, lng: 79.8412, geoConfidence: 0.99, placeMatch: 'ChIJ...hlt1', status: 'Active', lastVerified: '2026-08-15' },
  { id: 'BR-008', merchantId: 'MER-010', merchantName: 'Amagi Beach Resort', name: 'Amagi Beach Resort – Kalpitiya', district: 'Puttalam', address: 'Kalpitiya Peninsula, Puttalam', lat: 8.2300, lng: 79.7600, geoConfidence: 0.94, placeMatch: 'ChIJ...amb1', status: 'Active', lastVerified: '2026-08-10' },
];

// ─── Duplicate Candidates ──────────────────────────────────────────────────

export const mockDuplicates: DuplicateCandidate[] = [
  {
    id: 'DUP-482', offerAId: 'OFF-10482', offerBId: 'OFF-10489',
    offerA: mockOffers[0], offerB: mockOffers[7],
    similarityScore: 0.96,
    signals: [
      { name: 'Merchant Similarity', score: 0.98 },
      { name: 'Benefit Similarity', score: 1.00 },
      { name: 'Card Type Similarity', score: 0.94 },
      { name: 'Date Similarity', score: 1.00 },
      { name: 'Source Overlap', score: 0.85 },
    ],
    status: 'Pending', detectedAt: '2026-08-28T09:00:00Z', resolvedAt: null, resolvedBy: null,
  },
  {
    id: 'DUP-483', offerAId: 'OFF-10484', offerBId: 'OFF-10494',
    offerA: mockOffers[2], offerB: mockOffers[12],
    similarityScore: 0.91,
    signals: [
      { name: 'Merchant Similarity', score: 0.88 },
      { name: 'Benefit Similarity', score: 0.92 },
      { name: 'Card Type Similarity', score: 0.85 },
      { name: 'Date Similarity', score: 0.95 },
      { name: 'Source Overlap', score: 0.90 },
    ],
    status: 'Pending', detectedAt: '2026-08-28T09:01:00Z', resolvedAt: null, resolvedBy: null,
  },
  {
    id: 'DUP-481', offerAId: 'OFF-10483', offerBId: 'OFF-10488',
    offerA: mockOffers[1], offerB: mockOffers[6],
    similarityScore: 0.78,
    signals: [
      { name: 'Merchant Similarity', score: 0.72 },
      { name: 'Benefit Similarity', score: 0.88 },
      { name: 'Card Type Similarity', score: 0.80 },
      { name: 'Date Similarity', score: 0.70 },
      { name: 'Source Overlap', score: 0.65 },
    ],
    status: 'Pending', detectedAt: '2026-08-28T09:02:00Z', resolvedAt: null, resolvedBy: null,
  },
  {
    id: 'DUP-480', offerAId: 'OFF-10485', offerBId: 'OFF-10491',
    offerA: mockOffers[3], offerB: mockOffers[9],
    similarityScore: 0.82,
    signals: [
      { name: 'Merchant Similarity', score: 0.75 },
      { name: 'Benefit Similarity', score: 0.90 },
      { name: 'Card Type Similarity', score: 0.88 },
      { name: 'Date Similarity', score: 0.78 },
      { name: 'Source Overlap', score: 0.80 },
    ],
    status: 'Kept Separate', detectedAt: '2026-08-27T10:00:00Z', resolvedAt: '2026-08-27T11:00:00Z', resolvedBy: 'Admin (Nuwan)',
  },
];

// ─── Review Items ──────────────────────────────────────────────────────────

export const mockReviewItems: ReviewItem[] = [
  { id: 'REV-001', offerId: 'OFF-10482', offer: mockOffers[0], priority: 'High', issueType: 'Low LLM Score', issueDescription: 'Start date not found in source. Card eligibility ambiguous.', qualityScore: 61, detectedAt: '2026-08-28T08:35:00Z', status: 'Pending', assignedTo: null },
  { id: 'REV-002', offerId: 'OFF-10487', offer: mockOffers[5], priority: 'Critical', issueType: 'Geo Unresolved', issueDescription: 'Location "Selected Glomark outlets" cannot be resolved to specific branches.', qualityScore: 58, detectedAt: '2026-08-27T14:10:00Z', status: 'Pending', assignedTo: null },
  { id: 'REV-003', offerId: 'OFF-10489', offer: mockOffers[7], priority: 'High', issueType: 'Duplicate Candidate', issueDescription: 'Possible duplicate of OFF-10482 (HNB Keells offer). Similarity: 96%.', qualityScore: 67, detectedAt: '2026-08-28T09:05:00Z', status: 'Pending', assignedTo: null },
  { id: 'REV-004', offerId: 'OFF-10494', offer: mockOffers[12], priority: 'High', issueType: 'Duplicate Candidate', issueDescription: 'Possible duplicate of OFF-10484 (BOC Cargills offer). Similarity: 91%.', qualityScore: 64, detectedAt: '2026-08-28T09:06:00Z', status: 'Pending', assignedTo: null },
  { id: 'REV-005', offerId: 'OFF-10486', offer: mockOffers[4], priority: 'Medium', issueType: 'Missing Fields', issueDescription: 'Start date missing from source. Parser confidence below threshold.', qualityScore: 84, detectedAt: '2026-08-28T07:10:00Z', status: 'Pending', assignedTo: null },
  { id: 'REV-006', offerId: 'OFF-10490', offer: mockOffers[8], priority: 'Low', issueType: 'Eligibility Ambiguous', issueDescription: 'Terms say weekends only but offer listing does not specify days.', qualityScore: 82, detectedAt: '2026-08-28T08:05:00Z', status: 'Pending', assignedTo: null },
  { id: 'REV-007', offerId: 'OFF-10492', offer: mockOffers[10], priority: 'Medium', issueType: 'Changed Offer', issueDescription: 'Expiry date changed from 2026-09-30 to 2026-12-31 since last scrape.', qualityScore: 93, detectedAt: '2026-08-28T08:35:00Z', status: 'Pending', assignedTo: null },
  { id: 'REV-008', offerId: 'OFF-10496', offer: mockOffers[14], priority: 'Low', issueType: 'Geo Unresolved', issueDescription: 'Only 4 branches listed but addresses not fully resolved in geo system.', qualityScore: 86, detectedAt: '2026-08-28T10:05:00Z', status: 'Pending', assignedTo: null },
];

// ─── Staging Changes ───────────────────────────────────────────────────────

export const mockStagingChanges: StagingChange[] = [
  { id: 'STG-001', offerId: 'OFF-10483', offer: mockOffers[1], action: 'UPDATE', reason: 'Expiry date updated by source', reviewStatus: 'Approved', changedFields: ['expiryDate'], previousValues: { expiryDate: '2026-08-31' }, createdAt: '2026-08-28T09:30:00Z' },
  { id: 'STG-002', offerId: 'OFF-10484', offer: mockOffers[2], action: 'INSERT', reason: 'New offer discovered', reviewStatus: 'Approved', createdAt: '2026-08-28T09:31:00Z' },
  { id: 'STG-003', offerId: 'OFF-10485', offer: mockOffers[3], action: 'INSERT', reason: 'New offer discovered', reviewStatus: 'Approved', createdAt: '2026-08-28T09:32:00Z' },
  { id: 'STG-004', offerId: 'OFF-10486', offer: mockOffers[4], action: 'INSERT', reason: 'New offer discovered', reviewStatus: 'Pending', createdAt: '2026-08-28T09:33:00Z' },
  { id: 'STG-005', offerId: 'OFF-10488', offer: mockOffers[6], action: 'UPDATE', reason: 'Card type eligibility expanded', reviewStatus: 'Approved', changedFields: ['cardTypes'], previousValues: { cardTypes: 'Visa' }, createdAt: '2026-08-28T09:34:00Z' },
  { id: 'STG-006', offerId: 'OFF-10490', offer: mockOffers[8], action: 'INSERT', reason: 'New offer discovered', reviewStatus: 'Approved', createdAt: '2026-08-28T09:35:00Z' },
  { id: 'STG-007', offerId: 'OFF-10491', offer: mockOffers[9], action: 'INSERT', reason: 'New offer discovered', reviewStatus: 'Pending', createdAt: '2026-08-28T09:36:00Z' },
  { id: 'STG-008', offerId: 'OFF-10492', offer: mockOffers[10], action: 'UPDATE', reason: 'Expiry date extended by merchant', reviewStatus: 'Approved', changedFields: ['expiryDate'], previousValues: { expiryDate: '2026-09-30' }, createdAt: '2026-08-28T09:37:00Z' },
  { id: 'STG-009', offerId: 'OFF-10493', offer: mockOffers[11], action: 'INSERT', reason: 'New offer discovered', reviewStatus: 'Approved', createdAt: '2026-08-28T09:38:00Z' },
  { id: 'STG-010', offerId: 'OFF-10495', offer: mockOffers[13], action: 'INSERT', reason: 'New offer discovered', reviewStatus: 'Approved', createdAt: '2026-08-28T09:39:00Z' },
  { id: 'STG-011', offerId: 'OFF-10496', offer: mockOffers[14], action: 'INSERT', reason: 'New offer discovered', reviewStatus: 'Pending', createdAt: '2026-08-28T09:40:00Z' },
  { id: 'STG-012', offerId: 'OFF-10483', offer: mockOffers[1], action: 'NO_CHANGE', reason: 'Offer unchanged since last sync', reviewStatus: 'Approved', createdAt: '2026-08-28T09:41:00Z' },
];

// ─── Sync History ─────────────────────────────────────────────────────────

export const mockSyncHistory: SyncHistory[] = [
  { id: 'SYNC-081', startedAt: '2026-08-27T23:00:00Z', completedAt: '2026-08-27T23:01:45Z', triggeredBy: 'Scheduler', insertCount: 18, updateCount: 9, disableCount: 2, failedCount: 0, status: 'Completed' },
  { id: 'SYNC-080', startedAt: '2026-08-26T23:00:00Z', completedAt: '2026-08-26T23:02:10Z', triggeredBy: 'Scheduler', insertCount: 12, updateCount: 5, disableCount: 1, failedCount: 1, status: 'Partial' },
  { id: 'SYNC-079', startedAt: '2026-08-25T22:00:00Z', completedAt: '2026-08-25T22:01:20Z', triggeredBy: 'Admin (Nuwan)', insertCount: 7, updateCount: 3, disableCount: 0, failedCount: 0, status: 'Completed' },
  { id: 'SYNC-078', startedAt: '2026-08-24T23:00:00Z', completedAt: '2026-08-24T23:00:05Z', triggeredBy: 'Scheduler', insertCount: 0, updateCount: 0, disableCount: 0, failedCount: 4, status: 'Failed' },
  { id: 'SYNC-077', startedAt: '2026-08-23T23:00:00Z', completedAt: '2026-08-23T23:01:55Z', triggeredBy: 'Scheduler', insertCount: 22, updateCount: 11, disableCount: 3, failedCount: 0, status: 'Completed' },
  { id: 'SYNC-076', startedAt: '2026-08-22T23:00:00Z', completedAt: '2026-08-22T23:01:30Z', triggeredBy: 'Scheduler', insertCount: 15, updateCount: 6, disableCount: 1, failedCount: 0, status: 'Completed' },
];

// ─── Logs ─────────────────────────────────────────────────────────────────

export const mockLogs: SystemLog[] = [
  { id: 'LOG-0001', timestamp: '2026-08-28T11:42:01Z', level: 'INFO', component: 'SCRAPER', bank: 'HNB', runId: 'RUN-2841', message: 'HNB scraper started – Full Bank Scrape mode' },
  { id: 'LOG-0002', timestamp: '2026-08-28T11:42:02Z', level: 'INFO', component: 'FETCHER', bank: 'HNB', runId: 'RUN-2841', message: 'GET /personal/cards/credit-cards/offers – 200 OK (312ms)' },
  { id: 'LOG-0003', timestamp: '2026-08-28T11:42:04Z', level: 'INFO', component: 'PARSER', bank: 'HNB', runId: 'RUN-2841', message: 'Found 92 offer cards in HTML' },
  { id: 'LOG-0004', timestamp: '2026-08-28T11:42:06Z', level: 'WARN', component: 'PARSER', bank: 'HNB', runId: 'RUN-2841', offerId: 'OFF-10482', rawEvidenceId: 'RAW-00192', message: 'Merchant confidence low (0.44) for RAW-00192' },
  { id: 'LOG-0005', timestamp: '2026-08-28T11:42:08Z', level: 'INFO', component: 'NORMALIZER', bank: 'HNB', runId: 'RUN-2841', message: 'Normalized 92 offers – 8 new, 4 changed, 77 unchanged' },
  { id: 'LOG-0006', timestamp: '2026-08-28T11:42:10Z', level: 'INFO', component: 'RULE_ENGINE', bank: 'HNB', runId: 'RUN-2841', message: 'Rule validation complete – 90 passed, 2 failed' },
  { id: 'LOG-0007', timestamp: '2026-08-28T11:42:12Z', level: 'WARN', component: 'RULE_ENGINE', bank: 'HNB', runId: 'RUN-2841', offerId: 'OFF-10482', message: 'Rule FAIL: start_date_missing for OFF-10482' },
  { id: 'LOG-0008', timestamp: '2026-08-28T11:42:15Z', level: 'INFO', component: 'DUPLICATE_ENGINE', bank: 'HNB', runId: 'RUN-2841', message: 'Duplicate detection complete – 4 candidates found' },
  { id: 'LOG-0009', timestamp: '2026-08-28T11:42:20Z', level: 'INFO', component: 'LLM', bank: 'HNB', runId: 'RUN-2841', message: 'LLM validation started – 12 offers sampled' },
  { id: 'LOG-0010', timestamp: '2026-08-28T11:42:35Z', level: 'WARN', component: 'LLM', bank: 'HNB', runId: 'RUN-2841', offerId: 'OFF-10482', message: 'LLM score 61/100 for OFF-10482 – routed to review queue' },
  { id: 'LOG-0011', timestamp: '2026-08-28T11:42:40Z', level: 'ERROR', component: 'FETCHER', bank: 'DFCC', runId: 'RUN-2845', message: 'Puppeteer navigation timeout after 30s on /promotions/shopping' },
  { id: 'LOG-0012', timestamp: '2026-08-28T11:42:41Z', level: 'FATAL', component: 'SCRAPER', bank: 'DFCC', runId: 'RUN-2845', message: 'Scraper aborted – unrecoverable navigation error' },
  { id: 'LOG-0013', timestamp: '2026-08-28T11:42:45Z', level: 'INFO', component: 'GEO', bank: 'BOC', message: 'Geocoding complete – 45 resolved, 2 partial, 0 failed' },
  { id: 'LOG-0014', timestamp: '2026-08-28T11:43:00Z', level: 'INFO', component: 'DB_SYNC', message: 'Staging sync complete – 18 INSERT, 9 UPDATE, 2 DISABLE' },
  { id: 'LOG-0015', timestamp: '2026-08-28T11:43:10Z', level: 'WARN', component: 'GEO', bank: 'SEYLAN', message: 'Location "selected Colombo outlets" cannot be mapped – queued for manual review' },
  { id: 'LOG-0016', timestamp: '2026-08-28T11:30:00Z', level: 'INFO', component: 'SCRAPER', bank: 'BOC', runId: 'RUN-2842', message: 'BOC scraper started – Full Bank Scrape mode' },
  { id: 'LOG-0017', timestamp: '2026-08-28T11:15:00Z', level: 'INFO', component: 'SCRAPER', bank: 'SAMPATH', runId: 'RUN-2843', message: 'Sampath scraper started – Full Bank Scrape mode' },
  { id: 'LOG-0018', timestamp: '2026-08-28T11:15:30Z', level: 'WARN', component: 'FETCHER', bank: 'SAMPATH', runId: 'RUN-2843', message: 'Rate limit warning – slowing request pace (429 detected)' },
  { id: 'LOG-0019', timestamp: '2026-08-28T10:55:00Z', level: 'INFO', component: 'SCRAPER', bank: 'NDB', runId: 'RUN-2844', message: 'NDB scraper started – headless browser mode' },
  { id: 'LOG-0020', timestamp: '2026-08-28T11:42:50Z', level: 'INFO', component: 'API', message: 'Consumer API: served 1,842 active offers (cache hit)' },
];

// ─── Banker Health ─────────────────────────────────────────────────────────

export const mockBankerHealth: BankerHealth[] = [
  { bank: 'HNB', status: 'Healthy', lastRun: '11:42 AM', duration: '1m 52s', rawOffers: 94, newCount: 8, changedCount: 4, failedCount: 0 },
  { bank: 'BOC', status: 'Healthy', lastRun: '11:30 AM', duration: '2m 14s', rawOffers: 47, newCount: 2, changedCount: 1, failedCount: 0 },
  { bank: 'SAMPATH', status: 'Warning', lastRun: '11:15 AM', duration: '3m 08s', rawOffers: 91, newCount: 6, changedCount: 4, failedCount: 3 },
  { bank: 'NDB', status: 'Healthy', lastRun: '10:55 AM', duration: '1m 31s', rawOffers: 54, newCount: 3, changedCount: 2, failedCount: 0 },
  { bank: 'DFCC', status: 'Failed', lastRun: '10:40 AM', duration: '--', rawOffers: 0, newCount: 0, changedCount: 0, failedCount: 1 },
  { bank: 'SEYLAN', status: 'Healthy', lastRun: '09:57 AM', duration: '2m 30s', rawOffers: 62, newCount: 4, changedCount: 2, failedCount: 0 },
  { bank: 'PEOPLES', status: 'Healthy', lastRun: '09:02 AM', duration: '1m 45s', rawOffers: 38, newCount: 2, changedCount: 1, failedCount: 0 },
  { bank: 'PABC', status: 'Idle', lastRun: '08:00 AM', duration: '1m 12s', rawOffers: 22, newCount: 1, changedCount: 0, failedCount: 0 },
  { bank: 'NSB', status: 'Idle', lastRun: '07:30 AM', duration: '0m 55s', rawOffers: 15, newCount: 0, changedCount: 0, failedCount: 0 },
  { bank: 'COMBANK', status: 'Healthy', lastRun: '08:30 AM', duration: '1m 20s', rawOffers: 33, newCount: 2, changedCount: 1, failedCount: 0 },
];

// ─── Geo Unresolved ────────────────────────────────────────────────────────

export const mockGeoUnresolved: GeoUnresolved[] = [
  {
    id: 'GEO-001', offerId: 'OFF-10487', rawLocation: 'Selected Glomark outlets',
    merchantName: 'Softlogic Glomark', issue: 'Exact branches cannot be confidently determined from vague location text.',
    candidates: [
      { name: 'Glomark – Nugegoda', address: 'High Level Road, Nugegoda', lat: 6.8696, lng: 79.8997, confidence: 0.72 },
      { name: 'Glomark – Rajagiriya', address: 'Rajagiriya Road, Rajagiriya', lat: 6.9069, lng: 79.8996, confidence: 0.68 },
      { name: 'Glomark – Kandy', address: 'Dalada Veediya, Kandy', lat: 7.2906, lng: 80.6337, confidence: 0.55 },
    ],
    status: 'Pending',
  },
  {
    id: 'GEO-002', offerId: 'OFF-10482', rawLocation: 'Selected Colombo outlets',
    merchantName: 'Keells Super', issue: 'Location too vague – "Selected Colombo outlets" maps to 18 possible branches.',
    candidates: [
      { name: 'Keells – Rajagiriya', address: 'Rajagiriya Road', lat: 6.9069, lng: 79.8996, confidence: 0.81 },
      { name: 'Keells – Nugegoda', address: 'High Level Road, Nugegoda', lat: 6.8696, lng: 79.8997, confidence: 0.78 },
      { name: 'Keells – Battaramulla', address: 'Battaramulla Road', lat: 6.8998, lng: 79.9252, confidence: 0.74 },
    ],
    status: 'Pending',
  },
  {
    id: 'GEO-003', offerId: 'OFF-10496', rawLocation: 'Selected Noritake outlets',
    merchantName: 'Noritake', issue: 'Noritake has only 4 branches island-wide but source does not specify which.',
    candidates: [
      { name: 'Noritake – Colombo 7', address: 'Bauddhaloka Mawatha, Colombo 7', lat: 6.9064, lng: 79.8706, confidence: 0.88 },
      { name: 'Noritake – Kandy', address: 'Dalada Veediya, Kandy', lat: 7.2906, lng: 80.6337, confidence: 0.82 },
    ],
    status: 'Pending',
  },
  {
    id: 'GEO-004', offerId: 'OFF-10494', rawLocation: 'Selected Keells outlets (Colombo district)',
    merchantName: 'Keells Super', issue: 'District specified but branch list not confirmed.',
    candidates: [
      { name: 'Keells – Rajagiriya', address: 'Rajagiriya', lat: 6.9069, lng: 79.8996, confidence: 0.85 },
      { name: 'Keells – Borella', address: 'Borella', lat: 6.9200, lng: 79.8789, confidence: 0.80 },
    ],
    status: 'Pending',
  },
];

// ─── Map Markers ───────────────────────────────────────────────────────────

export const mockMapMarkers: MapMarker[] = [
  { id: 'MM-001', merchantName: 'Pizza Hut', branchName: 'Pizza Hut – Union Place', district: 'Colombo', lat: 6.9210, lng: 79.8600, geoConfidence: 0.97, offerCount: 4, bank: 'HNB', lastVerified: '2026-08-22', verified: true },
  { id: 'MM-002', merchantName: 'Pizza Hut', branchName: 'Pizza Hut – Kandy', district: 'Kandy', lat: 7.2906, lng: 80.6337, geoConfidence: 0.91, offerCount: 2, bank: 'HNB', lastVerified: '2026-08-22', verified: true },
  { id: 'MM-003', merchantName: 'KFC', branchName: 'KFC – Galle Road', district: 'Colombo', lat: 6.8800, lng: 79.8557, geoConfidence: 0.98, offerCount: 6, bank: 'SEYLAN', lastVerified: '2026-08-25', verified: true },
  { id: 'MM-004', merchantName: 'Keells Super', branchName: 'Keells – Rajagiriya', district: 'Colombo', lat: 6.9069, lng: 79.8996, geoConfidence: 0.95, offerCount: 3, bank: 'HNB', lastVerified: '2026-08-20', verified: true },
  { id: 'MM-005', merchantName: 'Hilton Colombo', branchName: 'Hilton Colombo', district: 'Colombo', lat: 6.9218, lng: 79.8412, geoConfidence: 0.99, offerCount: 3, bank: 'SAMPATH', lastVerified: '2026-08-15', verified: true },
  { id: 'MM-006', merchantName: 'Glomark', branchName: 'Glomark – Nugegoda', district: 'Colombo', lat: 6.8696, lng: 79.8997, geoConfidence: 0.52, offerCount: 1, bank: 'DFCC', lastVerified: '2026-08-20', verified: false },
  { id: 'MM-007', merchantName: 'Amagi Beach Resort', branchName: 'Amagi – Kalpitiya', district: 'Puttalam', lat: 8.2300, lng: 79.7600, geoConfidence: 0.94, offerCount: 2, bank: 'HNB', lastVerified: '2026-08-10', verified: true },
  { id: 'MM-008', merchantName: 'Cargills Food City', branchName: 'Cargills – Kandy', district: 'Kandy', lat: 7.2900, lng: 80.6350, geoConfidence: 0.96, offerCount: 5, bank: 'BOC', lastVerified: '2026-08-18', verified: true },
  { id: 'MM-009', merchantName: 'Burger King', branchName: 'BK – Galle', district: 'Galle', lat: 6.0535, lng: 80.2210, geoConfidence: 0.90, offerCount: 2, bank: 'DFCC', lastVerified: '2026-08-12', verified: true },
  { id: 'MM-010', merchantName: 'KFC', branchName: 'KFC – Jaffna', district: 'Jaffna', lat: 9.6615, lng: 80.0255, geoConfidence: 0.88, offerCount: 1, bank: 'SEYLAN', lastVerified: '2026-08-20', verified: true },
];

// ─── Validation Rules ──────────────────────────────────────────────────────

export const mockValidationRules: ValidationRule[] = [
  { id: 'RULE-001', name: 'Merchant Required', description: 'Offer must have a non-empty merchant name', severity: 'Error', enabled: true, triggeredToday: 0, lastModified: '2026-07-01' },
  { id: 'RULE-002', name: 'Source URL Required', description: 'Offer must include a valid source URL', severity: 'Error', enabled: true, triggeredToday: 2, lastModified: '2026-07-01' },
  { id: 'RULE-003', name: 'Expiry Before Start', description: 'Expiry date must not precede start date', severity: 'Error', enabled: true, triggeredToday: 0, lastModified: '2026-07-01' },
  { id: 'RULE-004', name: 'Discount Range', description: 'Percentage discount must be between 1 and 100', severity: 'Error', enabled: true, triggeredToday: 1, lastModified: '2026-07-15' },
  { id: 'RULE-005', name: 'Bank Must Be Known', description: 'Bank must match a configured known bank ID', severity: 'Error', enabled: true, triggeredToday: 0, lastModified: '2026-07-01' },
  { id: 'RULE-006', name: 'Start Date Missing', description: 'Offer without a start date is flagged for review', severity: 'Warning', enabled: true, triggeredToday: 7, lastModified: '2026-08-01' },
  { id: 'RULE-007', name: 'Expiry In Past', description: 'Offer expiry date is before today – likely expired', severity: 'Error', enabled: true, triggeredToday: 3, lastModified: '2026-07-01' },
  { id: 'RULE-008', name: 'Duplicate Score High', description: 'Duplicate similarity above 0.9 triggers review queue', severity: 'Warning', enabled: true, triggeredToday: 4, lastModified: '2026-08-10' },
  { id: 'RULE-009', name: 'Card Type Known', description: 'Card types must match known alias list', severity: 'Warning', enabled: true, triggeredToday: 2, lastModified: '2026-08-01' },
  { id: 'RULE-010', name: 'Content Hash Verified', description: 'Parsed content hash must match raw evidence hash', severity: 'Error', enabled: true, triggeredToday: 0, lastModified: '2026-07-01' },
  { id: 'RULE-011', name: 'LLM Score Low', description: 'LLM score below 70 routes offer to critical review', severity: 'Warning', enabled: true, triggeredToday: 5, lastModified: '2026-08-15' },
  { id: 'RULE-012', name: 'Merchant Address Check', description: 'At least one verifiable address required for non-online offers', severity: 'Warning', enabled: false, triggeredToday: 0, lastModified: '2026-08-20' },
];

// ─── Audit Events ──────────────────────────────────────────────────────────

export const mockAuditEvents: AuditEvent[] = [
  { id: 'AUD-001', offerId: 'OFF-10482', timestamp: '2026-08-28T08:31:00Z', eventType: 'Scraped', description: 'Scraped from HNB website', actor: 'Scraper (RUN-2841)' },
  { id: 'AUD-002', offerId: 'OFF-10482', timestamp: '2026-08-28T08:31:30Z', eventType: 'Normalized', description: 'Normalized by parser v2.4.1', actor: 'Parser' },
  { id: 'AUD-003', offerId: 'OFF-10482', timestamp: '2026-08-28T08:32:00Z', eventType: 'Rule Validation', description: 'Rule validation: 1 error (start_date_missing), 2 warnings', actor: 'Rule Engine' },
  { id: 'AUD-004', offerId: 'OFF-10482', timestamp: '2026-08-28T08:32:30Z', eventType: 'LLM Validation', description: 'LLM score: 61/100 – routed to review queue', actor: 'LLM (gemini-1.5-pro)', changes: { llmScore: { from: 'N/A', to: '61' } } },
  { id: 'AUD-005', offerId: 'OFF-10482', timestamp: '2026-08-28T08:35:00Z', eventType: 'Review Queued', description: 'Added to review queue – Low LLM Score (61)', actor: 'System' },
];
