import type {
  ApiMeta,
  BranchSummary,
  BranchOverviewResponse,
  BranchPerformanceResponse,
  BranchPeersResponse,
  BranchDriversResponse,
  BranchInsightsResponse,
  MetricValue,
  NetworkResponse,
  BranchComparisonAIResponse,
  SelectedKpiAIResponse,
  OverallBranchAIResponse,
} from "../types/shared";

const DEFAULT_META: ApiMeta = {
  asOfDate: "2026-11-03",
  source: "mock_demo_dataset",
  isDemo: true,
  period: { start: "2026-10-01", end: "2026-11-03" },
};

function createMetric(code: string, name: string, value: number, unit: string): MetricValue {
  return {
    metricCode: code,
    name,
    value,
    unit,
    availability: "available",
    source: "mock_demo",
    definitionVersion: 1,
  };
}

export const MOCK_BRANCHES_DATA: BranchSummary[] = [
  {
    id: 1,
    sourceBranchCode: "B001",
    name: "Main Street Branch",
    region: "Northeast",
    metrics: {
      collection_efficiency: createMetric(
        "collection_efficiency",
        "Collection Efficiency",
        0.884,
        "percent",
      ),
      avg_days_to_resolve: createMetric(
        "avg_days_to_resolve",
        "Average Days to Resolution",
        17.5,
        "days",
      ),
      ptp_kept_rate: createMetric("ptp_kept_rate", "PTP Kept %", 0.792, "percent"),
      contact_rate: createMetric("contact_rate", "Contact Rate", 0.814, "percent"),
      dpd_30_plus_concentration: createMetric(
        "dpd_30_plus_concentration",
        "30+ DPD Portfolio Concentration",
        0.125,
        "percent",
      ),
    },
  },
  {
    id: 2,
    sourceBranchCode: "B002",
    name: "Oakwood Branch",
    region: "Midwest",
    metrics: {
      collection_efficiency: createMetric(
        "collection_efficiency",
        "Collection Efficiency",
        0.842,
        "percent",
      ),
      avg_days_to_resolve: createMetric(
        "avg_days_to_resolve",
        "Average Days to Resolution",
        19.8,
        "days",
      ),
      ptp_kept_rate: createMetric("ptp_kept_rate", "PTP Kept %", 0.745, "percent"),
      contact_rate: createMetric("contact_rate", "Contact Rate", 0.781, "percent"),
      dpd_30_plus_concentration: createMetric(
        "dpd_30_plus_concentration",
        "30+ DPD Portfolio Concentration",
        0.152,
        "percent",
      ),
    },
  },
  {
    id: 3,
    sourceBranchCode: "B003",
    name: "Pine Valley Branch",
    region: "Southeast",
    metrics: {
      collection_efficiency: createMetric(
        "collection_efficiency",
        "Collection Efficiency",
        0.798,
        "percent",
      ),
      avg_days_to_resolve: createMetric(
        "avg_days_to_resolve",
        "Average Days to Resolution",
        22.4,
        "days",
      ),
      ptp_kept_rate: createMetric("ptp_kept_rate", "PTP Kept %", 0.712, "percent"),
      contact_rate: createMetric("contact_rate", "Contact Rate", 0.738, "percent"),
      dpd_30_plus_concentration: createMetric(
        "dpd_30_plus_concentration",
        "30+ DPD Portfolio Concentration",
        0.178,
        "percent",
      ),
    },
  },
  {
    id: 4,
    sourceBranchCode: "B004",
    name: "Riverfront Branch",
    region: "Southwest",
    metrics: {
      collection_efficiency: createMetric(
        "collection_efficiency",
        "Collection Efficiency",
        0.765,
        "percent",
      ),
      avg_days_to_resolve: createMetric(
        "avg_days_to_resolve",
        "Average Days to Resolution",
        24.6,
        "days",
      ),
      ptp_kept_rate: createMetric("ptp_kept_rate", "PTP Kept %", 0.678, "percent"),
      contact_rate: createMetric("contact_rate", "Contact Rate", 0.704, "percent"),
      dpd_30_plus_concentration: createMetric(
        "dpd_30_plus_concentration",
        "30+ DPD Portfolio Concentration",
        0.201,
        "percent",
      ),
    },
  },
  {
    id: 5,
    sourceBranchCode: "B005",
    name: "Hilltop Branch",
    region: "West",
    metrics: {
      collection_efficiency: createMetric(
        "collection_efficiency",
        "Collection Efficiency",
        0.856,
        "percent",
      ),
      avg_days_to_resolve: createMetric(
        "avg_days_to_resolve",
        "Average Days to Resolution",
        18.2,
        "days",
      ),
      ptp_kept_rate: createMetric("ptp_kept_rate", "PTP Kept %", 0.768, "percent"),
      contact_rate: createMetric("contact_rate", "Contact Rate", 0.795, "percent"),
      dpd_30_plus_concentration: createMetric(
        "dpd_30_plus_concentration",
        "30+ DPD Portfolio Concentration",
        0.138,
        "percent",
      ),
    },
  },
  {
    id: 6,
    sourceBranchCode: "B006",
    name: "Lakeside Branch",
    region: "Northwest",
    metrics: {
      collection_efficiency: createMetric(
        "collection_efficiency",
        "Collection Efficiency",
        0.731,
        "percent",
      ),
      avg_days_to_resolve: createMetric(
        "avg_days_to_resolve",
        "Average Days to Resolution",
        27.8,
        "days",
      ),
      ptp_kept_rate: createMetric("ptp_kept_rate", "PTP Kept %", 0.635, "percent"),
      contact_rate: createMetric("contact_rate", "Contact Rate", 0.669, "percent"),
      dpd_30_plus_concentration: createMetric(
        "dpd_30_plus_concentration",
        "30+ DPD Portfolio Concentration",
        0.226,
        "percent",
      ),
    },
  },
  {
    id: 7,
    sourceBranchCode: "B007",
    name: "Downtown Branch",
    region: "Northeast",
    metrics: {
      collection_efficiency: createMetric(
        "collection_efficiency",
        "Collection Efficiency",
        0.819,
        "percent",
      ),
      avg_days_to_resolve: createMetric(
        "avg_days_to_resolve",
        "Average Days to Resolution",
        21.0,
        "days",
      ),
      ptp_kept_rate: createMetric("ptp_kept_rate", "PTP Kept %", 0.731, "percent"),
      contact_rate: createMetric("contact_rate", "Contact Rate", 0.756, "percent"),
      dpd_30_plus_concentration: createMetric(
        "dpd_30_plus_concentration",
        "30+ DPD Portfolio Concentration",
        0.165,
        "percent",
      ),
    },
  },
];

export const MOCK_NETWORK_AVERAGES: Record<string, number | null> = {
  collection_efficiency: 0.814,
  avg_days_to_resolve: 21.6,
  ptp_kept_rate: 0.732,
  contact_rate: 0.751,
  dpd_30_plus_concentration: 0.169,
};

export function getMockNetwork(asOfDate?: string): NetworkResponse {
  return {
    data: {
      branches: MOCK_BRANCHES_DATA,
      networkAverages: MOCK_NETWORK_AVERAGES,
    },
    meta: {
      ...DEFAULT_META,
      asOfDate: asOfDate || DEFAULT_META.asOfDate,
    },
  };
}

export function getMockBranches(asOfDate?: string): { data: BranchSummary[]; meta: ApiMeta } {
  return {
    data: MOCK_BRANCHES_DATA,
    meta: {
      ...DEFAULT_META,
      asOfDate: asOfDate || DEFAULT_META.asOfDate,
    },
  };
}

export function getMockBranchOverview(branchId: number, asOfDate?: string): BranchOverviewResponse {
  const branch = MOCK_BRANCHES_DATA.find((b) => b.id === branchId) ?? MOCK_BRANCHES_DATA[0];
  return {
    data: {
      branch: {
        id: branch.id,
        sourceBranchCode: branch.sourceBranchCode,
        name: branch.name,
        region: branch.region,
      },
      metrics: branch.metrics,
    },
    meta: {
      ...DEFAULT_META,
      asOfDate: asOfDate || DEFAULT_META.asOfDate,
    },
  };
}

export function getMockBranchPerformance(
  branchId: number,
  asOfDate?: string,
): BranchPerformanceResponse {
  const branch = MOCK_BRANCHES_DATA.find((b) => b.id === branchId) ?? MOCK_BRANCHES_DATA[0];
  return {
    data: {
      branch: {
        id: branch.id,
        sourceBranchCode: branch.sourceBranchCode,
        name: branch.name,
        region: branch.region,
      },
      dpdDistribution: [
        { bucket: "1-30 DPD", accountCount: 420, balance: 1250000, portfolioShare: 0.45 },
        { bucket: "31-60 DPD", accountCount: 230, balance: 750000, portfolioShare: 0.28 },
        { bucket: "61-90 DPD", accountCount: 115, balance: 420000, portfolioShare: 0.16 },
        { bucket: "90+ DPD", accountCount: 75, balance: 310000, portfolioShare: 0.11 },
      ],
      trends: {
        collection_efficiency: [
          { period: "Aug 2026", value: 0.78 },
          { period: "Sep 2026", value: 0.81 },
          { period: "Oct 2026", value: 0.85 },
          { period: "Nov 2026", value: 0.88 },
        ],
      },
      outcomes: branch.metrics,
      comparisonPeriods: [
        { label: "Current Period", start: "2026-10-01", end: "2026-11-03" },
        { label: "Prior Period", start: "2026-09-01", end: "2026-09-30" },
      ],
      monthlyKpis: {
        "Nov 2026": Object.values(branch.metrics),
      },
    },
    meta: {
      ...DEFAULT_META,
      asOfDate: asOfDate || DEFAULT_META.asOfDate,
    },
  };
}

export function getMockBranchPeers(branchId: number, asOfDate?: string): BranchPeersResponse {
  const branch = MOCK_BRANCHES_DATA.find((b) => b.id === branchId) ?? MOCK_BRANCHES_DATA[0];
  const peers = MOCK_BRANCHES_DATA.filter((b) => b.id !== branch.id);
  return {
    data: {
      branch: {
        id: branch.id,
        sourceBranchCode: branch.sourceBranchCode,
        name: branch.name,
        region: branch.region,
      },
      peers,
      networkAverages: MOCK_NETWORK_AVERAGES,
    },
    meta: {
      ...DEFAULT_META,
      asOfDate: asOfDate || DEFAULT_META.asOfDate,
    },
  };
}

export function getMockBranchDrivers(branchId: number, asOfDate?: string): BranchDriversResponse {
  const branch = MOCK_BRANCHES_DATA.find((b) => b.id === branchId) ?? MOCK_BRANCHES_DATA[0];
  return {
    data: {
      branch: {
        id: branch.id,
        sourceBranchCode: branch.sourceBranchCode,
        name: branch.name,
        region: branch.region,
      },
      drivers: [
        {
          segmentType: "Channel",
          segmentValue: "Direct Phone Call",
          metricCode: "collection_efficiency",
          branchValue: 0.84,
          networkValue: 0.76,
          delta: 0.08,
          unit: "percent",
          accountCount: 312,
        },
        {
          segmentType: "Channel",
          segmentValue: "Digital WhatsApp Outreach",
          metricCode: "contact_rate",
          branchValue: 0.79,
          networkValue: 0.69,
          delta: 0.1,
          unit: "percent",
          accountCount: 540,
        },
        {
          segmentType: "DPD Cohort",
          segmentValue: "Early Delinquency (1-30 DPD)",
          metricCode: "ptp_kept_rate",
          branchValue: 0.82,
          networkValue: 0.74,
          delta: 0.08,
          unit: "percent",
          accountCount: 220,
        },
      ],
      rootCauseDrivers: [
        {
          metricCode: "collection_efficiency",
          name: "Collection Efficiency",
          value: 0.884,
          unit: "percent",
          availability: "available",
          contributingSegments: [
            { segmentType: "Channel", segmentValue: "Phone Call", impact: 0.35 },
            { segmentType: "Channel", segmentValue: "Field Visit", impact: 0.28 },
          ],
        },
      ],
    },
    meta: {
      ...DEFAULT_META,
      asOfDate: asOfDate || DEFAULT_META.asOfDate,
    },
  };
}

export function getMockBranchInsights(asOfDate?: string): BranchInsightsResponse {
  return {
    data: [
      {
        id: 1,
        narrative:
          "Collection efficiency outperformed peer network average by +7.0 pts driven by early contact cadence on Days 1-3.",
        evidence: [
          {
            metricCode: "collection_efficiency",
            branchValue: 0.884,
            networkValue: 0.814,
            delta: 0.07,
            unit: "percent",
          },
        ],
        modelVersion: "v1.2",
        generatedAt: "2026-11-03T10:00:00Z",
      },
      {
        id: 2,
        narrative:
          "Borrower contact rate is healthy across early delinquency cohorts, minimizing rollover into 60+ DPD buckets.",
        evidence: [
          {
            metricCode: "contact_rate",
            branchValue: 0.814,
            networkValue: 0.751,
            delta: 0.063,
            unit: "percent",
          },
        ],
        modelVersion: "v1.2",
        generatedAt: "2026-11-03T10:00:00Z",
      },
    ],
    meta: {
      ...DEFAULT_META,
      asOfDate: asOfDate || DEFAULT_META.asOfDate,
    },
  };
}

export function getMockBranchComparisonAI(branchId: number): BranchComparisonAIResponse {
  return {
    data: {
      narrative:
        "Branch performance is strong in early outreach and recovery resolution velocity compared to network benchmarks.",
      strengths: [
        "Faster average days to resolution (17.5d vs 21.6d network avg)",
        "Above average PTP fulfillment rate (79.2% vs 73.2%)",
        "Higher direct customer contactability via blended digital channels",
      ],
      weaknesses: [
        "High concentration in older 90+ DPD recovery bucket",
        "Field visit scheduling latency on non-responsive borrowers",
      ],
      recommendations: [
        "Accelerate field visit dispatch for accounts reaching 30 DPD without PTP",
        "Leverage automated SMS payment links to lock in same-day fulfillment",
      ],
      evidence: [
        {
          metricCode: "collection_efficiency",
          branchValue: 0.884,
          benchmarkValue: 0.814,
          delta: 0.07,
          unit: "percent",
          source: "internal_kpi",
        },
      ],
    },
    meta: DEFAULT_META,
    ai: {
      insightType: "branch_comparison",
      status: "ai",
      modelVersion: "gpt-4o-recovery-v2",
      generatedAt: "2026-11-03T10:00:00Z",
      sourceDataVersion: "batch_2026_11_03",
    },
  };
}

export function getMockSelectedKpiAI(branchId: number, kpiCode?: string): SelectedKpiAIResponse {
  return {
    data: {
      metricCode: kpiCode || "collection_efficiency",
      narrative: `Current metric performance is favorable, tracking above target baseline across primary loan portfolios.`,
      performanceDirection: "favorable",
      coreVariance: "+7.0 pts vs Network Peer Average",
      frontlineDriver: "Early contact frequency on delinquent accounts within first 5 days.",
      priorityAction: "Maintain proactive outreach cadence and incentivize early PTP fulfillment.",
      cohortFocus: "1-30 DPD Early Delinquency segment",
      recommendation: "Replicate early-call scripts across junior collection officers.",
      evidence: [
        {
          metricCode: kpiCode || "collection_efficiency",
          branchValue: 0.884,
          benchmarkValue: 0.814,
          delta: 0.07,
          unit: "percent",
          source: "internal_kpi",
        },
      ],
    },
    meta: DEFAULT_META,
    ai: {
      insightType: "selected_kpi",
      status: "ai",
      modelVersion: "gpt-4o-recovery-v2",
      generatedAt: "2026-11-03T10:00:00Z",
      sourceDataVersion: "batch_2026_11_03",
    },
  };
}

export function getMockOverallBranchAI(branchId: number): OverallBranchAIResponse {
  return {
    data: {
      narrative:
        "Overall branch operational diagnostics indicate top-tier recovery performance with controlled delinquency rollover.",
      evidence: [
        {
          metricCode: "collection_efficiency",
          branchValue: 0.884,
          benchmarkValue: 0.814,
          delta: 0.07,
          unit: "percent",
          source: "internal_kpi",
        },
      ],
    },
    meta: DEFAULT_META,
    ai: {
      insightType: "overall_branch",
      status: "ai",
      modelVersion: "gpt-4o-recovery-v2",
      generatedAt: "2026-11-03T10:00:00Z",
      sourceDataVersion: "batch_2026_11_03",
    },
  };
}
