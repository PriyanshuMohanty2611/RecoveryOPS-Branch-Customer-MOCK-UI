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
  DriverItem,
  RootCauseDriverItem,
  InsightItem,
  BranchComparisonAIResponse,
  SelectedKpiAIResponse,
  OverallBranchAIResponse,
} from "../types/shared";
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

const API_BASE =
  ((import.meta.env as Record<string, unknown>)["VITE_API_URL"] as string | undefined) ??
  "http://localhost:3001/api";

export type {
  ApiMeta,
  BranchSummary,
  BranchOverviewResponse,
  BranchPerformanceResponse,
  BranchPeersResponse,
  BranchDriversResponse,
  BranchInsightsResponse,
  MetricValue,
  NetworkResponse,
  DriverItem,
  RootCauseDriverItem,
  InsightItem,
  BranchComparisonAIResponse,
  SelectedKpiAIResponse,
  OverallBranchAIResponse,
};

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function fetchJson<T>(path: string, fallback?: () => T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { accept: "application/json" },
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
    fetchJson<NetworkResponse>(
      `/analytics/network${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockNetwork(asOfDate)
    ),
  getBranches: (asOfDate?: string) =>
    fetchJson<{ data: BranchSummary[]; meta: ApiMeta }>(
      `/branches${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranches(asOfDate)
    ),
  getBranchOverview: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchOverviewResponse>(
      `/branches/${branchId}/overview${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchOverview(branchId, asOfDate)
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
      () => getMockBranchPerformance(branchId, asOfDate)
    ),
  getBranchPeers: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchPeersResponse>(
      `/branches/${branchId}/peers${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchPeers(branchId, asOfDate)
    ),
  getBranchDrivers: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchDriversResponse>(
      `/branches/${branchId}/drivers${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchDrivers(branchId, asOfDate)
    ),
  getBranchInsights: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchInsightsResponse>(
      `/branches/${branchId}/insights${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchInsights(asOfDate)
    ),
  getBranchComparisonAI: (branchId: number, asOfDate?: string) =>
    fetchJson<BranchComparisonAIResponse>(
      `/branches/${branchId}/ai-insights/comparison${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockBranchComparisonAI(branchId)
    ),
  getSelectedKpiAI: (branchId: number, kpi: string, asOfDate?: string) =>
    fetchJson<SelectedKpiAIResponse>(
      `/branches/${branchId}/ai-insights/kpi${buildQuery({ kpi, as_of_date: asOfDate })}`,
      () => getMockSelectedKpiAI(branchId, kpi)
    ),
  getOverallBranchAI: (branchId: number, asOfDate?: string) =>
    fetchJson<OverallBranchAIResponse>(
      `/branches/${branchId}/ai-insights/overall${buildQuery({ as_of_date: asOfDate })}`,
      () => getMockOverallBranchAI(branchId)
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
};

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
