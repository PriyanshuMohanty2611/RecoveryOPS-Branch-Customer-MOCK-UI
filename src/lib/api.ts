import type {
  NetworkResponse,
  BranchSummary,
  ApiMeta,
  BranchOverviewResponse,
  BranchPerformanceResponse,
  BranchPeersResponse,
  BranchDriversResponse,
  BranchInsightsResponse,
  MetricValue,
  BranchComparisonAIResponse,
  SelectedKpiAIResponse,
  OverallBranchAIResponse,
} from "../types/shared";
import type { CustomerData } from "@/data/customer-nba-data";
import {
  getMockCustomerBranches,
  getMockCustomerWorklist,
  getMockCustomerDetail,
  getMockCustomerOutreachStats,
  getMockCustomerNba,
} from "./mock-customer-fallback";
import {
  getMockNetwork,
  getMockBranches,
  getMockBranchOverview,
  getMockBranchPerformance,
  getMockBranchPeers,
  getMockBranchDrivers,
  getMockBranchInsights,
  getMockBranchComparisonAI,
  getMockSelectedKpiAI,
  getMockOverallBranchAI,
} from "./mock-branch-fallback";

const envApiUrl = (import.meta.env as Record<string, unknown>)["VITE_API_URL"] as
  string | undefined;

const DEFAULT_PROD_API_URL = "https://recoveryops-p-backend-da2x.onrender.com/api";

const isProduction =
  (typeof window !== "undefined" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) ||
  (typeof process !== "undefined" && (process.env?.NODE_ENV === "production" || Boolean(process.env?.VERCEL)));

const API_BASE =
  envApiUrl && envApiUrl !== "/api"
    ? envApiUrl
    : isProduction
    ? DEFAULT_PROD_API_URL
    : "http://localhost:3001/api";

export type {
  NetworkResponse,
  BranchSummary,
  ApiMeta,
  BranchOverviewResponse,
  BranchPerformanceResponse,
  BranchPeersResponse,
  BranchDriversResponse,
  BranchInsightsResponse,
  MetricValue,
  BranchComparisonAIResponse,
  SelectedKpiAIResponse,
  OverallBranchAIResponse,
};

export type CustomerRecord = CustomerData & {
  accountId: number;
  customerId: number;
  riskBucket: string;
  accountStatus: string;
  consent: boolean;
  doNotContact: boolean;
  actionStatus: string;
  paymentContactAttempts?: number | null;
  pastDueAmount?: number | undefined;
  remainingBalance?: number | undefined;
  snapshotDate?: string | null | undefined;
  d30Dpd?: number | null | undefined;
  d30SnapshotDate?: string | null | undefined;
  delta30Dpd?: number | null | undefined;
};

export interface NbaAlternativeArm {
  actionCode: string;
  actionLabel: string;
  channelCode: string;
  channelLabel: string;
  expectedRewardEstLinucb: number;
  ucbDecisionScore: number;
  boundedZ5EstLinucb: number;
  expectedRewardEstCts: number;
  ctsMcShare500: number;
  postStd: number;
}

export interface NbaExplanation {
  "1_engagement_output_influence": string;
  "2_payment_behaviour_signal": string;
  "3_outreach_followup_signal": string;
  "4_excluded_actions_and_rules": string;
  "5_prior_recovery_actions_and_outcomes": string;
}

export interface NbaDecisionRecord {
  decisionId: string;
  recommendationId: string;
  accountId: number;
  decisionType: "APPROVE" | "REJECT" | "OVERRIDE";
  status: "APPROVED" | "EDITED" | "REJECTED";
  selectedAction: string;
  selectedActionLabel: string;
  selectedChannelCode: string;
  selectedChannelLabel: string;
  timingWindow: string | null;
  reason: string | null;
  notes: string | null;
  decidedAt: string;
}

export interface NbaFeedbackRecord {
  feedbackEventId: string;
  recommendationId: string;
  customerId: number;
  accountId: number;
  recommendedAction: string;
  selectedAction: string;
  selectedActionLabel: string;
  selectedChannelCode: string;
  actionMatchFlag: boolean;
  executionTs: string;
  executionStatus: string;
  customerResponse: Record<string, unknown>;
  respondedFlag: number;
  connectedFlag: number;
  paymentAmount: number;
  paymentDate: string | null;
  paymentCompletionStatus: string;
  obligationBase: number;
  windowCloseTs: string;
  windowDays: number;
  validationStatus: string;
  statusReason: string;
  calculatedReward: number | null;
  costUsed: number | null;
  timingWindow: string | null;
  ptpAgreed: boolean;
  ptpAmount: number | null;
  ptpDate: string | null;
  ptpMode: string | null;
  notTakenReason: string | null;
  rescheduleDate: string | null;
  notes: string | null;
  maturedTs: string | null;
  createdUtc: string;
  originalValidationStatus?: string;
}

export interface NbaRecommendation {
  recommendationId: string;
  customerId: number;
  customerCode: string;
  customerName: string;
  accountId: number;
  accountNumber: string;
  accountStatus: string;
  timestamp: string;
  snapshotDate: string;
  rawEventHorizonDate: string;
  unloggedGapDays: number;
  modelVersion: string;
  primaryAlgorithm: string;
  segment: string;
  productType: string;
  daysPastDue: number;
  dpdBucket: string;
  pastDueAmount: number;
  currentDueAmount: number;
  remainingBalance: number;
  recommendedAction: string;
  recommendedActionLabel: string;
  recommendedChannelCode: string;
  recommendedChannelLabel: string;
  isSingleMutuallyExclusiveAction: boolean;
  expectedRewardEstimate: number;
  ucbDecisionScore: number;
  boundedZ5RewardEstimate: number;
  boundedZ5TopAction: string;
  ctsShadowRewardEstimate: number;
  ctsShadowGreedyAction: string;
  ctsMcChoiceShare: number;
  postStd: number;
  oodMaxAbsZ: number;
  oodTopFeature: string;
  oodDriftFlag: boolean;
  isCalibratedProbability: boolean;
  rewardEstimateDisclaimer: string;
  humanReviewRequired: boolean;
  humanReviewNote: string;
  singleActionRule: string;
  eligibilityStatus: "ELIGIBLE_ACTIVE" | "SUPPRESSED_HOLD_FALLBACK";
  nEligibleActiveArms: number;
  eligibleArms: string[];
  alternativeEligibleActions: NbaAlternativeArm[];
  excludedArms: Record<string, string[]>;
  upstreamEngagement: string | null;
  upstreamOutreach: string | null;
  upstreamPayment: string | null;
  upstreamContactTime: string | null;
  explanation: NbaExplanation;
  latestDecision: NbaDecisionRecord | null;
  latestFeedback: NbaFeedbackRecord | null;
}

export interface CustomerNbaPortfolio {
  customerCode: string;
  customerId: number;
  customerName: string;
  defaultAccountId: number;
  accounts: NbaRecommendation[];
}

export interface NbaDecisionPayload {
  recommendationId: string;
  decisionType: "APPROVE" | "REJECT" | "OVERRIDE";
  selectedAction?: string | undefined;
  timingWindow?: string | undefined;
  reason?: string | undefined;
  notes?: string | undefined;
}

export interface NbaFeedbackPayload {
  feedbackEventId: string;
  recommendationId: string;
  customerId: number;
  accountId: number;
  selectedAction: string;
  executionTs: string;
  executionStatus: "EXECUTED" | "SKIPPED" | "DEFERRED" | "FAILED_ATTEMPT" | "CANCELLED";
  asOfTs?: string | undefined;
  paymentAmount: number;
  paymentDate?: string | null | undefined;
  respondedFlag: 0 | 1;
  connectedFlag: 0 | 1;
  sourceTable?: string | undefined;
  attributedPaymentId?: string | undefined;
  pastDueAmount?: number | undefined;
  currentDueAmount?: number | undefined;
  timingWindow?: string | undefined;
  ptpAgreed?: boolean | undefined;
  ptpAmount?: number | undefined;
  ptpDate?: string | undefined;
  ptpMode?: string | undefined;
  notTakenReason?: string | undefined;
  rescheduleDate?: string | undefined;
  notes?: string | undefined;
  customerResponse?: Record<string, unknown> | undefined;
}

export interface OutcomeTriggerPayload {
  accountId?: number | undefined;
  channel: string;
  outcome: string;
  amountPaid?: number | undefined;
  ptpAgreed?: boolean | undefined;
  ptpAmount?: number | undefined;
  ptpDate?: string | undefined;
  notes?: string | undefined;
  timestamp?: string | undefined;
}

export interface OutcomeTriggerResult {
  customerCode: string;
  accountId: number | null;
  nba: { status: string; feedbackEventId?: string };
  engagement: { status: string; eventId?: number; eventType?: string; reason?: string };
  payment: { status: string; transactionId?: number };
  promise: { status: string; ptpId?: number; reason?: string };
  outreach: { status: string; contactEventId?: number };
  triggeredAt: string;
}

export interface CustomerBranch {
  code: string;
  displayCode: string;
  name: string;
  region: string;
  manager: string;
  customers: number;
  dpdAmount: number;
  recoveredAmount: number;
  accounts: CustomerRecord[];
}

export type TimelineEventKind = "CONTACT" | "MESSAGE" | "PAYMENT" | "PROMISE" | "DECISION";

export interface CustomerTimelineItemDetails {
  paymentAmount?: number | undefined;
  paymentStatus?: string | undefined;
  appliedDueDate?: string | null | undefined;
  messageTemplate?: string | undefined;
  messageStage?: string | undefined;
  ptpAmount?: number | undefined;
  ptpDate?: string | null | undefined;
  ptpStatus?: string | undefined;
  ptpMode?: string | null | undefined;
  disposition?: string | undefined;
  reaction?: string | undefined;
  commitment?: string | undefined;
  notes?: string | undefined;
}

export interface CustomerTimelineItem {
  title: string;
  category: string;
  time: string;
  status: string;
  tone: string;
  eventId?: string;
  sourceTable?: string;
  kind?: TimelineEventKind;
  occurredAt?: string;
  channelCode?: string | null;
  channelName?: string;
  amount?: number | null;
  messageRef?: string | null;
  isLatest?: boolean;
  details?: CustomerTimelineItemDetails | undefined;
}

export interface TimelineNextAction {
  nextContactDate: string | null;
  channelCode: string | null;
  channelName: string | null;
  cadence: string | null;
  actionStatus: string | null;
}

export interface CustomerTimelineResponse {
  data: CustomerTimelineItem[];
  nextAction: TimelineNextAction | null;
  meta: ApiMeta & { total?: number; accountScoped?: boolean };
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function fetchJson<T>(
  path: string,
  arg2?: (() => T) | RequestInit,
  arg3?: RequestInit,
): Promise<T> {
  const fallback = typeof arg2 === "function" ? arg2 : undefined;
  const init = typeof arg2 === "object" && arg2 !== null ? arg2 : arg3;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      if (fallback) return fallback();
      const text = await res.text().catch(() => "Unknown error");
      throw new Error(`API ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (fallback) {
      return fallback();
    }
    throw err;
  }
}

export const api = {
  getNetwork: (asOfDate?: string) =>
    fetchJson<NetworkResponse>(`/analytics/network${buildQuery({ as_of_date: asOfDate })}`, () =>
      getMockNetwork(asOfDate),
    ),
  getBranches: (asOfDate?: string) =>
    fetchJson<{ data: BranchSummary[]; meta: ApiMeta }>(
      `/branches${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranches(asOfDate),
    ),
  getBranchOverview: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchOverviewResponse>(
      `/branches/${branchId}/overview${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchOverview(branchId, asOfDate),
    ),
  getBranchPerformance: (
    branchId: number,
    asOfDate?: string,
    fromDate?: string,
    toDate?: string,
    months?: number,
  ) =>
    fetchJson<BranchPerformanceResponse>(
      `/branches/${branchId}/performance${buildQuery({
        as_of_date: asOfDate,
        from_date: fromDate,
        to_date: toDate,
        months: months ? String(months) : undefined,
      })}`,
      () => getMockBranchPerformance(branchId, asOfDate),
    ),
  getBranchPeers: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchPeersResponse>(
      `/branches/${branchId}/peers${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchPeers(branchId, asOfDate),
    ),
  getBranchDrivers: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchDriversResponse>(
      `/branches/${branchId}/drivers${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchDrivers(branchId, asOfDate),
    ),
  getBranchInsights: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchInsightsResponse>(
      `/branches/${branchId}/insights${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchInsights(asOfDate),
    ),
  getBranchComparisonAI: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchComparisonAIResponse>(
      `/branches/${branchId}/ai-insights/comparison${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchComparisonAI(branchId),
    ),
  getSelectedKpiAI: (branchId: number, kpi: string, asOfDate?: string) =>
    fetchJson<SelectedKpiAIResponse>(
      `/branches/${branchId}/ai-insights/kpi${buildQuery({ kpi, as_of_date: asOfDate })}`,
      () => getMockSelectedKpiAI(branchId, kpi),
    ),
  getOverallBranchAI: (branchId: number, asOfDate?: string) =>
    fetchJson<OverallBranchAIResponse>(
      `/branches/${branchId}/ai-insights/overall${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockOverallBranchAI(branchId),
    ),
  syncRefresh: async () => {
    try {
      const res = await fetch(`${API_BASE}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Refresh failed: ${res.status}`);
      }
      return (await res.json()) as {
        status: string;
        message: string;
        refreshedAt: string;
        asOfDate: string;
        batchesSynced: number;
      };
    } catch {
      return {
        status: "ok",
        message: "Refreshed demo snapshots successfully",
        refreshedAt: new Date().toISOString(),
        asOfDate: "2026-11-03",
        batchesSynced: 1,
      };
    }
  },
  getRefreshStatus: () =>
    fetchJson<{
      status: string;
      lastRefreshedAt: string | null;
      asOfDate: string;
    }>("/refresh", () => ({
      status: "idle",
      lastRefreshedAt: new Date().toISOString(),
      asOfDate: "2026-11-03",
    })),
  getCustomerBranches: (asOfDate?: string) =>
    fetchJson<{ data: CustomerBranch[]; meta: ApiMeta }>(
      `/customer-branches${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockCustomerBranches(asOfDate),
    ),
  getCustomerWorklist: (branchId?: string, query?: string, asOfDate?: string) =>
    fetchJson<{ data: CustomerRecord[]; meta: ApiMeta & { total: number } }>(
      `/customer-worklist${buildQuery({ branch_id: branchId, q: query, as_of_date: asOfDate })}`,
      () => getMockCustomerWorklist(branchId, query, asOfDate),
    ),
  getCustomerDetail: (customerCode: string) =>
    fetchJson<{ data: { customer: CustomerRecord; accounts: CustomerRecord[] }; meta: ApiMeta }>(
      `/customers/${customerCode}`,
      () => getMockCustomerDetail(customerCode),
    ),
  getCustomerTimeline: (customerCode: string, accountId?: number | null) =>
    fetchJson<CustomerTimelineResponse>(
      `/customers/${customerCode}/timeline${buildQuery({
        account_id: accountId != null ? String(accountId) : undefined,
      })}`,
    ),
  recordCustomerOutcome: (customerCode: string, payload: Record<string, unknown>) =>
    fetchJson<{ data: Record<string, unknown>; meta: ApiMeta }>(
      `/customers/${customerCode}/outcomes`,
      undefined,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  recordCollectorAction: (
    customerCode: string,
    payload: { accountId?: number | null; actionType: string; notes?: string | null },
  ) =>
    fetchJson<{ data: Record<string, unknown>; meta: ApiMeta }>(
      `/customers/${customerCode}/collector-actions`,
      undefined,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  getCustomerOutreachStats: (customerCode: string, accountId?: number | null) =>
    fetchJson<{ data: CustomerOutreachStats; meta: ApiMeta }>(
      `/customers/${customerCode}/outreach-stats${buildQuery({
        account_id: accountId != null ? String(accountId) : undefined,
      })}`,
      () => getMockCustomerOutreachStats(customerCode),
    ),
  getAccountPaymentModel: (accountId: number, asOfDate?: string) =>
    fetchJson<{ data: Record<string, unknown>; meta: ApiMeta }>(
      `/accounts/${accountId}/payment-model${buildQuery({ as_of_date: asOfDate })}`,
    ),
  getCustomerNba: (customerCode: string) =>
    fetchJson<{ data: CustomerNbaPortfolio; meta: ApiMeta }>(`/customers/${customerCode}/nba`, () =>
      getMockCustomerNba(customerCode),
    ),
  getAccountNba: (accountId: number) =>
    fetchJson<{ data: NbaRecommendation; meta: ApiMeta }>(`/accounts/${accountId}/nba`),
  submitNbaDecision: (accountId: number, payload: NbaDecisionPayload) =>
    fetchJson<{ data: NbaDecisionRecord; meta: ApiMeta }>(`/accounts/${accountId}/nba/decision`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitNbaFeedback: (accountId: number, payload: NbaFeedbackPayload) =>
    fetchJson<{ data: NbaFeedbackRecord; meta: ApiMeta }>(`/accounts/${accountId}/nba/feedback`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  triggerOutcomeUpdate: (customerCode: string, payload: OutcomeTriggerPayload) =>
    fetchJson<{ data: OutcomeTriggerResult; meta: ApiMeta }>(
      `/customers/${customerCode}/outcome-trigger`,
      undefined,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
};

export interface ChannelStatItem {
  channelCode: string;
  channelName: string;
  totalRecordedAttempts: number;
  invalidAttempts: number;
  undeliveredAttempts: number;
  totalValidAttempts: number;
  successfulContacts: number;
  totalValidDeliveredAttempts: number;
  customerResponses: number;
  csr: number | null;
  responseRate: number | null;
  affinityScore: number | null;
  isEligible: boolean;
  restrictionReason: string | null;
  dataStatus: string;
}

export interface CustomerOutreachStats {
  customerCode: string;
  customerName: string;
  recommendationStatus: string;
  recommendedChannel: string | null;
  recommendedChannelCode: string | null;
  recommendationReason: string;
  recommendedCsr: number | null;
  recommendedResponseRate: number | null;
  recommendedAffinityScore: number | null;
  channels: ChannelStatItem[];
  evaluatedAt: string;
}

export function formatMetricValue(m: MetricValue | undefined): string {
  if (!m || m.value == null || m.availability !== "available") return "—";
  switch (m.unit) {
    case "percent":
      return `${(m.value * 100).toFixed(1)}%`;
    case "currency":
      return `$${(m.value / 1000).toFixed(1)}K`;
    case "count":
      return Math.round(m.value).toLocaleString();
    case "days":
      return `${Math.round(m.value)}d`;
    default:
      return `${m.value}`;
  }
}

export function getMetric(
  metrics: Record<string, MetricValue> | undefined,
  code: string,
): MetricValue | undefined {
  return metrics?.[code];
}

export function getMetricValue(
  metrics: Record<string, MetricValue> | undefined,
  code: string,
): number | null {
  return getMetric(metrics, code)?.value ?? null;
}
