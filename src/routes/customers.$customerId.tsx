import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Phone,
  X,
  Clock,
  Sliders,
  Mail,
  Smartphone,
  MapPin,
  CheckCircle2,
  FileText,
  RotateCcw,
  BarChart3,
  Activity,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Calendar,
  ClipboardCheck,
  DollarSign,
  Wallet,
  Save,
  Edit3,
  PlusCircle,
  UserCheck,
  User,
  BadgeCheck,
  CalendarClock,
  Ban,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { AnimatedKpi } from "@/components/ui/animated-kpi";
import { CUSTOMERS, bestTouchpoint, type CustomerData } from "@/data/customer-nba-data";
import { getCustomerDetailContext } from "@/data/mock-data";
import { api, type CustomerTimelineItem, type NbaRecommendation } from "@/lib/api";
import {
  buildBusinessNbaPresentation,
  formatValidationToastMessage,
  getActionSpecificOutcomes,
  getBusinessActionMeta,
  type ActionOutcomePreset,
} from "@/lib/nba-business-presenter";
import { OutcomeProvider } from "@/hooks/outcome-context";
import { useSelectedTimelineOutcome } from "@/hooks/use-selected-timeline-outcome";
import { outcomeToFeedbackFlags, parseTimelineOutcome } from "@/lib/outcome-parsers";

const NBA_ACTION_ORDER = [
  "ACT_PHONE_STANDARD",
  "ACT_PHONE_INTENSIVE",
  "ACT_DIGITAL_REMINDER_EMAIL",
  "ACT_FIELD_VISIT_STANDARD",
  "ACT_FIELD_VISIT_INTENSIVE",
  "ACT_DIGITAL_REMINDER_SMS",
  "ACT_DISCOUNT_SETTLEMENT",
  "ACT_LEGAL_WARNING",
] as const;

const NBA_ACTION_META: Record<
  string,
  { label: string; channelCode: string; channelLabel: string; legacyName: string }
> = {
  ACT_PHONE_STANDARD: {
    label: "Call Customer",
    channelCode: "PHONE",
    channelLabel: "Phone Call",
    legacyName: "Phone calls",
  },
  ACT_PHONE_INTENSIVE: {
    label: "Call Customer",
    channelCode: "PHONE",
    channelLabel: "Phone Call",
    legacyName: "Phone calls",
  },
  ACT_DIGITAL_REMINDER_EMAIL: {
    label: "Send Email Reminder",
    channelCode: "EMAIL",
    channelLabel: "Email",
    legacyName: "Mails",
  },
  ACT_DIGITAL_REMINDER_SMS: {
    label: "Send SMS Reminder",
    channelCode: "SMS",
    channelLabel: "SMS",
    legacyName: "Mails",
  },
  ACT_FIELD_VISIT_STANDARD: {
    label: "Field Visit",
    channelCode: "FIELD_VISIT",
    channelLabel: "Field Visit",
    legacyName: "Field Visit",
  },
  ACT_FIELD_VISIT_INTENSIVE: {
    label: "Field Visit",
    channelCode: "FIELD_VISIT",
    channelLabel: "Field Visit",
    legacyName: "Field Visit",
  },
  ACT_DISCOUNT_SETTLEMENT: {
    label: "Offer Settlement Discount",
    channelCode: "EMAIL",
    channelLabel: "Email",
    legacyName: "Mails",
  },
  ACT_LEGAL_WARNING: {
    label: "Issue Legal Warning",
    channelCode: "EMAIL",
    channelLabel: "Email",
    legacyName: "Mails",
  },
  ACT_HOLD_SUPPRESS: {
    label: "Hold / Suppress Contact",
    channelCode: "HOLD",
    channelLabel: "Hold / Suppress",
    legacyName: "Hold",
  },
};

function formatTimelineDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function resolveArmForFeedbackChannel(
  channel: "FIELD" | "PHONE" | "MAIL",
  nba: NbaRecommendation | undefined,
): string {
  const rec = nba?.recommendedAction ?? "";
  const elig = nba?.eligibleArms ?? [];
  if (channel === "PHONE") {
    if (rec.startsWith("ACT_PHONE_") && elig.includes(rec)) return rec;
    const found = elig.find((a) => a.startsWith("ACT_PHONE_"));
    return found ?? "ACT_PHONE_STANDARD";
  }
  if (channel === "FIELD") {
    if (rec.startsWith("ACT_FIELD_VISIT_") && elig.includes(rec)) return rec;
    const found = elig.find((a) => a.startsWith("ACT_FIELD_VISIT_"));
    return found ?? "ACT_FIELD_VISIT_STANDARD";
  }
  if (
    (rec === "ACT_DIGITAL_REMINDER_EMAIL" || rec === "ACT_DIGITAL_REMINDER_SMS") &&
    elig.includes(rec)
  ) {
    return rec;
  }
  const found = elig.find(
    (a) => a === "ACT_DIGITAL_REMINDER_EMAIL" || a === "ACT_DIGITAL_REMINDER_SMS",
  );
  return found ?? "ACT_DIGITAL_REMINDER_EMAIL";
}

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer 360 Workspace — RecoveryOps" },
      {
        name: "description",
        content: "Customer priority explanation, next best action and outcome capture.",
      },
    ],
  }),
  component: CustomerDetailView,
});

function CustomerDetailView() {
  return (
    <OutcomeProvider>
      <CustomerDetailWorkspace />
    </OutcomeProvider>
  );
}

function CustomerDetailWorkspace() {
  const { customerId } = Route.useParams();
  const queryClient = useQueryClient();
  const { selectedTimelineOutcome, setSelectedTimelineOutcome } = useSelectedTimelineOutcome();
  const fallbackCustomer = CUSTOMERS.find((x) => x.id === customerId) || CUSTOMERS[0]!;

  const { data: detailData } = useQuery({
    queryKey: ["customer-detail", customerId],
    queryFn: () => api.getCustomerDetail(customerId),
    staleTime: 30_000,
  });

  const nbaQuery = useQuery({
    queryKey: ["customer-nba", customerId],
    queryFn: () => api.getCustomerNba(customerId),
    staleTime: 30_000,
  });

  const liveAccounts = detailData?.data?.accounts ?? [];
  const nbaAccounts = nbaQuery.data?.data?.accounts ?? [];

  const activeAccountId =
    nbaQuery.data?.data?.defaultAccountId ??
    liveAccounts.find((a) => a.accountStatus === "ACTIVE")?.accountId ??
    liveAccounts[0]?.accountId ??
    null;

  const timelineQuery = useQuery({
    queryKey: ["customer-timeline", customerId, activeAccountId],
    queryFn: () => api.getCustomerTimeline(customerId, activeAccountId),
    staleTime: 30_000,
  });

  const liveCustomer =
    (activeAccountId != null
      ? liveAccounts.find((a) => a.accountId === activeAccountId)
      : undefined) ?? detailData?.data?.customer;
  const c: CustomerData = liveCustomer
    ? { ...fallbackCustomer, ...liveCustomer }
    : fallbackCustomer;
  const activeNba: NbaRecommendation | undefined =
    (activeAccountId != null
      ? nbaAccounts.find((a) => a.accountId === activeAccountId)
      : undefined) ?? nbaAccounts[0];

  const outreachQuery = useQuery({
    queryKey: ["customer-outreach-stats", c.id, activeAccountId],
    queryFn: () => api.getCustomerOutreachStats(c.id, activeAccountId),
    staleTime: 30000,
  });
  const outreachStats = outreachQuery.data?.data;

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Outreach Model & NBA decision state
  const [collectorStatus, setCollectorStatus] = useState<
    "PENDING" | "APPROVED" | "EDITED" | "REJECTED"
  >("PENDING");
  const [overrideChannel, setOverrideChannel] = useState<string | null>(null);
  const [overrideActionCode, setOverrideActionCode] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [otherActionsOpen, setOtherActionsOpen] = useState(false);
  const [selectedOutcomePresetId, setSelectedOutcomePresetId] = useState<string>("");

  // NBA Modal states
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("Customer Requested Hardship Pause");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [changeChannelModalOpen, setChangeChannelModalOpen] = useState(false);
  const [selectedArmChoice, setSelectedArmChoice] = useState<string>("ACT_PHONE_STANDARD");
  const [selectedTimingWindow, setSelectedTimingWindow] = useState<string>("10:00 AM – 12:30 PM");

  // Authoritative Backend Statistical Metrics & Policy Guard
  const pastDueAmt = liveCustomer?.pastDueAmount ?? activeNba?.pastDueAmount ?? c.exp;
  const remainingBal = liveCustomer?.remainingBalance ?? activeNba?.remainingBalance ?? c.exp;
  const hasBalanceData =
    liveCustomer?.remainingBalance != null || activeNba?.remainingBalance != null;
  const overdueShare =
    hasBalanceData && remainingBal > 0 ? Math.round((pastDueAmt / remainingBal) * 100) : null;

  const phoneStats = outreachStats?.channels.find((ch) => ch.channelCode === "PHONE");
  const emailStats = outreachStats?.channels.find((ch) => ch.channelCode === "EMAIL");
  const fieldStats = outreachStats?.channels.find((ch) => ch.channelCode === "FIELD_VISIT");

  const fieldEligibleInNba = activeNba
    ? activeNba.eligibilityStatus !== "SUPPRESSED_HOLD_FALLBACK" &&
      (activeNba.eligibleArms.includes("ACT_FIELD_VISIT_STANDARD") ||
        activeNba.eligibleArms.includes("ACT_FIELD_VISIT_INTENSIVE"))
    : c.dpd >= 1 && pastDueAmt >= 500;

  const phoneSuccess =
    phoneStats?.csr ??
    (c.ch.find((x) => x[0] === "Phone calls" || x[0] === "Direct Phone")?.[1] || 68);
  const emailSuccess =
    emailStats?.csr ?? (c.ch.find((x) => x[0] === "Mails" || x[0] === "Digital Mail")?.[1] || 42);
  const fieldSuccess =
    fieldStats?.csr ??
    (c.ch.find((x) => x[0] === "Field Visit")?.[1] || (fieldEligibleInNba ? 85 : 0));

  const phoneRR = phoneStats?.responseRate ?? Math.max(15, Math.round(c.reach * 0.9));
  const emailRR = emailStats?.responseRate ?? Math.max(10, Math.round(c.reach * 0.6));
  const fieldRR = fieldStats?.responseRate ?? Math.max(25, Math.round(c.reach * 0.95));

  const rawCandidates = [
    {
      code: "PHONE" as const,
      name: "Phone calls",
      label: "Phone Call",
      actionTitle: "Call Customer",
      icon: Phone,
      successRate: phoneSuccess,
      responseRate: phoneRR,
      score:
        phoneStats?.affinityScore != null
          ? phoneStats.affinityScore
          : Number((0.6 * phoneSuccess + 0.4 * phoneRR).toFixed(1)),
      permitted: phoneStats ? phoneStats.isEligible : true,
      reason: phoneStats?.restrictionReason || "Available & Verified",
      csrRaw: phoneStats?.csr ?? null,
      rrRaw: phoneStats?.responseRate ?? null,
      affinityRaw: phoneStats?.affinityScore ?? null,
    },
    {
      code: "EMAIL" as const,
      name: "Mails",
      label: "Email",
      actionTitle: "Send Email",
      icon: Mail,
      successRate: emailSuccess,
      responseRate: emailRR,
      score:
        emailStats?.affinityScore != null
          ? emailStats.affinityScore
          : Number((0.6 * emailSuccess + 0.4 * emailRR).toFixed(1)),
      permitted: emailStats ? emailStats.isEligible : true,
      reason: emailStats?.restrictionReason || "Available & Verified",
      csrRaw: emailStats?.csr ?? null,
      rrRaw: emailStats?.responseRate ?? null,
      affinityRaw: emailStats?.affinityScore ?? null,
    },
    {
      code: "FIELD" as const,
      name: "Field Visit",
      label: "Field Visit",
      actionTitle: "Field Visit",
      icon: MapPin,
      successRate: fieldSuccess,
      responseRate: fieldRR,
      score:
        fieldStats?.affinityScore != null
          ? fieldStats.affinityScore
          : Number((0.6 * fieldSuccess + 0.4 * fieldRR).toFixed(1)),
      permitted: fieldStats ? fieldStats.isEligible : fieldEligibleInNba,
      reason:
        fieldStats?.restrictionReason ||
        (fieldEligibleInNba
          ? "Available for Field Escalation"
          : "Requires active overdue balance of $500+"),
      csrRaw: fieldStats?.csr ?? null,
      rrRaw: fieldStats?.responseRate ?? null,
      affinityRaw: fieldStats?.affinityScore ?? null,
    },
  ];

  const rankedChannels = rawCandidates
    .map((item) => {
      const baseScore = item.score;
      const finalScore = Number((item.permitted ? baseScore : baseScore * 0.5).toFixed(1));
      return { ...item, score: finalScore };
    })
    .sort((a, b) => b.score - a.score);

  const primaryRecommendation = rankedChannels[0]!;
  const activeChannel = overrideChannel
    ? rankedChannels.find(
        (r) =>
          r.name === overrideChannel || r.label === overrideChannel || r.code === overrideChannel,
      ) || primaryRecommendation
    : primaryRecommendation;

  // Bandit-backed Next Best Action metrics — strictly aligned with Outreach Statistical Model
  const isHoldSuppressed = activeNba
    ? activeNba.eligibilityStatus === "SUPPRESSED_HOLD_FALLBACK"
    : false;

  // Derive Outreach target channel to guarantee parity between Outreach card and NBA hero
  const targetChannelCode: "PHONE" | "EMAIL" | "FIELD_VISIT" | "HOLD" =
    isHoldSuppressed || outreachStats?.recommendationStatus === "SUPPRESSED_DNC"
      ? "HOLD"
      : outreachStats?.recommendedChannelCode
        ? outreachStats.recommendedChannelCode === "FIELD_VISIT" ||
          outreachStats.recommendedChannelCode === "FIELD"
          ? "FIELD_VISIT"
          : outreachStats.recommendedChannelCode === "EMAIL"
            ? "EMAIL"
            : "PHONE"
        : activeChannel.code === "FIELD"
          ? "FIELD_VISIT"
          : activeChannel.code === "EMAIL"
            ? "EMAIL"
            : "PHONE";

  let alignedActionCode = "ACT_PHONE_STANDARD";
  if (targetChannelCode === "HOLD") {
    alignedActionCode = "ACT_HOLD_SUPPRESS";
  } else if (targetChannelCode === "EMAIL") {
    const rec = activeNba?.recommendedAction;
    alignedActionCode =
      rec &&
      (rec === "ACT_DIGITAL_REMINDER_EMAIL" ||
        rec === "ACT_DISCOUNT_SETTLEMENT" ||
        rec === "ACT_LEGAL_WARNING")
        ? rec
        : "ACT_DIGITAL_REMINDER_EMAIL";
  } else if (targetChannelCode === "PHONE") {
    const rec = activeNba?.recommendedAction;
    alignedActionCode =
      rec && (rec === "ACT_PHONE_STANDARD" || rec === "ACT_PHONE_INTENSIVE")
        ? rec
        : "ACT_PHONE_STANDARD";
  } else if (targetChannelCode === "FIELD_VISIT") {
    const rec = activeNba?.recommendedAction;
    alignedActionCode =
      rec && (rec === "ACT_FIELD_VISIT_STANDARD" || rec === "ACT_FIELD_VISIT_INTENSIVE")
        ? rec
        : "ACT_FIELD_VISIT_STANDARD";
  }

  const effectiveActionCode =
    collectorStatus === "EDITED" && overrideActionCode ? overrideActionCode : alignedActionCode;
  const activeNbaMeta = NBA_ACTION_META[effectiveActionCode];

  const effectiveChannelCode = activeNbaMeta?.channelCode ?? targetChannelCode;

  const NbaHeroIcon =
    effectiveChannelCode === "PHONE"
      ? Phone
      : effectiveChannelCode === "FIELD_VISIT" || effectiveChannelCode === "FIELD"
        ? MapPin
        : effectiveChannelCode === "HOLD"
          ? AlertTriangle
          : Mail;

  const channelDisplayLabel =
    getBusinessActionMeta(effectiveActionCode).channelLabel ||
    (effectiveChannelCode === "PHONE"
      ? "Phone Call"
      : effectiveChannelCode === "EMAIL"
        ? "Email"
        : effectiveChannelCode === "FIELD_VISIT" || effectiveChannelCode === "FIELD"
          ? "Field Visit"
          : "On Hold");

  const actionHeadline =
    getBusinessActionMeta(effectiveActionCode).cardTitle ||
    activeNbaMeta?.label ||
    (effectiveChannelCode === "PHONE"
      ? "Call Customer"
      : effectiveChannelCode === "EMAIL"
        ? "Send Email"
        : "Field Visit");

  // Hard Policy Gates checklist (reflects live account status, consent, DNC & bandit hold)
  const effectiveAccountStatus =
    liveCustomer?.accountStatus ?? activeNba?.accountStatus ?? "ACTIVE";
  const isClosedAccount = effectiveAccountStatus !== "ACTIVE";
  const hasConsent = liveCustomer ? liveCustomer.consent : true;
  const isDnc = liveCustomer ? liveCustomer.doNotContact : false;

  const policyGates = [
    {
      name: "Account Eligibility",
      rule: "Active delinquent status (ACTIVE & DPD > 0)",
      status: !isClosedAccount && c.dpd > 0 ? "PASSED" : "BLOCKED",
      detail: `${effectiveAccountStatus} · ${c.dpd} DPD · Stage ${c.dpd > 60 ? "Late" : c.dpd > 0 ? "Early" : "Current"}`,
    },
    {
      name: "Customer Permission",
      rule: "Consent active & DNC flag clear",
      status: hasConsent && !isDnc ? "PASSED" : "BLOCKED",
      detail: `Consent = ${hasConsent ? "TRUE" : "FALSE"} · DNC = ${isDnc ? "TRUE" : "FALSE"}`,
    },
    {
      name: "Channel Usability",
      rule: "Usable verified endpoint available",
      status: hasConsent ? "PASSED" : "BLOCKED",
      detail: hasConsent ? "Validated phone & digital endpoints" : "Contact permission restricted",
    },
    {
      name: "Contact Window",
      rule: "Allowed local window 09:00 - 18:00",
      status: "PASSED",
      detail: "Scheduled inside permitted window",
    },
    {
      name: "Cooldown Period",
      rule: "Minimum 48 hours between contact attempts",
      status: c.daysSinceOutreach >= 2 ? "PASSED" : "COOLDOWN_ACTIVE",
      detail: `${c.daysSinceOutreach}d elapsed since last outreach`,
    },
    {
      name: "Frequency Cap",
      rule: "Max 4 outreach attempts / cap 2 field",
      status: c.touches < 4 ? "PASSED" : "CAP_WARNING",
      detail: `${c.touches}/4 recorded outreach touches`,
    },
  ];

  const hasPolicyBlock = policyGates.some((g) => g.status === "BLOCKED") || isHoldSuppressed;
  const riskBucket =
    c.dpd >= 90
      ? "90+ DPD"
      : c.dpd >= 61
        ? "61–89 DPD"
        : c.dpd >= 31
          ? "31–60 DPD"
          : c.dpd >= 1
            ? "1–30 DPD"
            : "Current";

  const outcomeDueBase = pastDueAmt > 0 ? pastDueAmt : remainingBal;
  const recoveredAmount = Math.round(((pastDueAmt > 0 ? pastDueAmt : c.exp) * c.cov) / 100);

  const OutreachHeroIcon =
    outreachStats?.recommendedChannelCode === "FIELD_VISIT"
      ? MapPin
      : outreachStats?.recommendedChannelCode === "EMAIL"
        ? Mail
        : outreachStats?.recommendedChannelCode === "PHONE"
          ? Phone
          : activeChannel.icon;

  // Link engagement rate: If response rate is recorded, link engagement must not be 0% due to missing/unseeded click data
  const effectiveClick =
    c.click > 0
      ? c.click
      : c.reach > 0
        ? Math.min(c.open || 100, Math.max(c.reach, Math.round(c.reach * 1.5)))
        : null;

  // Discrete block progress bar helper (e.g. ▰▰▰▰▰▰▰▱▱▱) with color even for small values like 2%
  const renderBlockBar = (
    value: number | null | undefined,
    colorClass = "text-primary",
    total = 10,
  ) => {
    if (value == null || value <= 0) {
      return (
        <span className="font-mono text-[11px] tracking-tight text-muted-foreground/30 select-none">
          {"▱".repeat(total)}
        </span>
      );
    }
    // For any positive rate (even 2%), show at least 1 filled block with color
    const filled = Math.max(1, Math.min(total, Math.round((value / 100) * total)));
    const empty = total - filled;
    const isVeryLow = value < 8;
    return (
      <span className="font-mono text-[11px] tracking-tight select-none">
        <span className={`${colorClass} font-bold ${isVeryLow ? "opacity-80" : ""}`}>
          {"▰".repeat(filled)}
        </span>
        <span className="text-muted-foreground/25">{"▱".repeat(empty)}</span>
      </span>
    );
  };

  // Context-rich message copy/script snippet for Option 1 Live Preview
  const templateName = c.content[0] || "Standard Delinquency Notice";
  const templateLower = templateName.toLowerCase();
  const formattedBalance = `$${pastDueAmt.toLocaleString()}`;
  const isVoiceScript =
    templateLower.includes("call") ||
    templateLower.includes("script") ||
    templateLower.includes("phone") ||
    (!isHoldSuppressed && effectiveChannelCode === "PHONE" && !templateLower.includes("email"));

  let liveSnippet = isVoiceScript
    ? `Good day ${c.name}, calling from RecoveryOps regarding account ${c.acct}, which has an overdue balance of ${formattedBalance}. Can we review repayment options or set up a convenient payment today?`
    : `Dear ${c.name}, your account ${c.acct} has an outstanding balance of ${formattedBalance}. Please review resolution options or settle your balance via our secure portal at portal.recoveryops.com/pay/${c.acct}.`;

  if (templateLower.includes("final notice")) {
    liveSnippet = isVoiceScript
      ? `Good day ${c.name}, calling from RecoveryOps regarding account ${c.acct} with an overdue balance of ${formattedBalance} (${c.dpd} days overdue). Formal escalation is pending — can we arrange payment today or confirm a firm commitment?`
      : `Dear ${c.name}, your account ${c.acct} has an overdue balance of ${formattedBalance} (${c.dpd} days overdue). Formal escalation is pending. Please use our secure portal link to review options or settle your balance today.`;
  } else if (templateLower.includes("plan")) {
    liveSnippet = isVoiceScript
      ? `Good day ${c.name}, calling from RecoveryOps regarding account ${c.acct}. We have an approved relief payment plan to settle your balance of ${formattedBalance} in flexible installments. Can we confirm your eligibility today?`
      : `Hello ${c.name}, an approved payment plan offer is active for account ${c.acct} (${formattedBalance}). Click to view your customized installment schedule.`;
  } else if (templateLower.includes("broken") || templateLower.includes("re-engagement")) {
    liveSnippet = isVoiceScript
      ? `Good day ${c.name}, calling from RecoveryOps regarding account ${c.acct}. We noticed the scheduled payment of ${formattedBalance} was missed and want to help restructure a workable date today.`
      : `Dear ${c.name}, we noted your scheduled commitment on account ${c.acct} for ${formattedBalance} was not fulfilled. Please connect with our frontline team today to restructure your repayment schedule.`;
  } else if (templateLower.includes("courtesy") || templateLower.includes("reminder")) {
    liveSnippet = isVoiceScript
      ? `Hello ${c.name}, courtesy call from RecoveryOps regarding account ${c.acct}. A balance of ${formattedBalance} is due. Would you like me to send a direct one-click payment link to your mobile?`
      : `Hello ${c.name}, friendly reminder that a payment of ${formattedBalance} for account ${c.acct} is due. Settle quickly and securely via: portal.recoveryops.com/pay/${c.acct}.`;
  } else if (templateLower.includes("settlement")) {
    liveSnippet = `Dear ${c.name}, an authorized settlement offer with partial waiver terms is available for account ${c.acct} (${formattedBalance}). Contact us before this window expires to secure formal terms.`;
  }

  const dpdStatusLabel =
    c.dpd === 0
      ? "Good Standing"
      : c.dpd <= 30
        ? "Early Delinquency"
        : c.dpd <= 60
          ? "Mid-Stage Delinquency"
          : "Late-Stage Default";

  const dpdStageLabel =
    c.dpd === 0
      ? "Current (0 DPD)"
      : c.dpd <= 30
        ? "1–30 DPD Bracket"
        : c.dpd <= 60
          ? "30–60 DPD Bracket"
          : "90+ DPD Charge-off Risk";

  const isLiveDetail = Boolean(detailData?.data);
  const liveHasDpdTrend =
    isLiveDetail && liveCustomer?.d30Dpd != null && liveCustomer?.delta30Dpd != null;
  const mockTrajectory = !isLiveDetail ? getCustomerDetailContext(c.id)?.riskTrajectory : undefined;
  const hasHistoricalDpd = isLiveDetail
    ? liveHasDpdTrend
    : Boolean(mockTrajectory && typeof mockTrajectory.delta30Dpd === "number");
  const d30Dpd = isLiveDetail ? (liveCustomer?.d30Dpd ?? c.dpd) : (mockTrajectory?.d30Dpd ?? c.dpd);
  const delta30Dpd = isLiveDetail
    ? (liveCustomer?.delta30Dpd ?? 0)
    : (mockTrajectory?.delta30Dpd ?? 0);

  const trendBadgeLabel = !hasHistoricalDpd
    ? "Unavailable"
    : delta30Dpd < 0
      ? "Improving"
      : delta30Dpd > 0
        ? "Deteriorating"
        : "Stable";

  const trendDisplayValue = !hasHistoricalDpd
    ? "Unavailable"
    : delta30Dpd < 0
      ? `-${Math.abs(delta30Dpd)} DPD`
      : delta30Dpd > 0
        ? `+${delta30Dpd} DPD`
        : "0 DPD";

  const trendSubtext = !hasHistoricalDpd
    ? "Historical baseline snapshot unavailable"
    : delta30Dpd === 0
      ? `Stable at ${c.dpd} days overdue compared to 30 days ago`
      : `${d30Dpd} days overdue (30 days ago) → ${c.dpd} days overdue today`;

  const [animateLiveBars, setAnimateLiveBars] = useState<boolean>(false);
  useEffect(() => {
    setAnimateLiveBars(false);
    const t = setTimeout(() => setAnimateLiveBars(true), 60);
    return () => clearTimeout(t);
  }, [c.id, activeAccountId, c.cov, activeChannel.successRate]);

  const timelineData = timelineQuery.data;
  const timelineList = timelineData?.data ?? [];
  const timelineNextAction = timelineData?.nextAction ?? null;
  const latestPromise = timelineList
    .filter((item) => item.kind === "PROMISE" || item.details?.ptpAmount != null)
    .sort((a, b) => {
      const aDate = a.details?.ptpDate ?? a.time;
      const bDate = b.details?.ptpDate ?? b.time;
      return bDate.localeCompare(aDate);
    })[0];
  const promiseAmount = latestPromise?.details?.ptpAmount ?? latestPromise?.amount ?? null;
  const promiseDate =
    latestPromise?.details?.ptpDate ??
    (latestPromise?.kind === "PROMISE" ? latestPromise.time : null);
  const promiseStatus = latestPromise?.details?.ptpStatus ?? latestPromise?.status ?? null;
  const [selectedTimelineEventId, setSelectedTimelineEventId] = useState<string | null>(null);

  const offlineFallbackArm = hasPolicyBlock
    ? "ACT_HOLD_SUPPRESS"
    : activeChannel.code === "PHONE"
      ? "ACT_PHONE_STANDARD"
      : activeChannel.code === "FIELD"
        ? "ACT_FIELD_VISIT_STANDARD"
        : "ACT_DIGITAL_REMINDER_EMAIL";

  const nbaPresentation = buildBusinessNbaPresentation({
    activeNba,
    customer: c,
    liveCustomer,
    outreachStats,
    timelineList,
    collectorStatus,
    overrideActionCode,
    selectedTimingWindow,
    rejectionReason,
    effectiveAccountStatus,
    hasConsent,
    isDnc,
    hasHistoricalDpd,
    d30Dpd,
    delta30Dpd,
    effectiveClick,
    offlineFallbackActionCode: offlineFallbackArm,
  });

  // Frontline Feedback State
  const [feedbackChannel, setFeedbackChannel] = useState<"FIELD" | "PHONE" | "MAIL">(() => {
    if (activeChannel.code === "FIELD") return "FIELD";
    if (activeChannel.code === "PHONE") return "PHONE";
    return "MAIL";
  });

  // Channel-specific response & demeanor states
  const [fieldPresence, setFieldPresence] = useState<string>("Customer Met in Person");
  const [fieldReaction, setFieldReaction] = useState<string>("Cooperative & Willing to Settle");
  const [fieldCommitment, setFieldCommitment] = useState<string>("Immediate Partial Payment Today");

  const [phoneDisposition, setPhoneDisposition] = useState<string>(
    "Connected — Spoke with Customer",
  );
  const [phoneReaction, setPhoneReaction] = useState<string>("Calm & Acknowledged Liability");
  const [phoneNextStep, setPhoneNextStep] = useState<string>("PTP Registered on Call");

  const [mailStatus, setMailStatus] = useState<string>("Delivered & Link Clicked / Viewed");
  const [mailReaction, setMailReaction] = useState<string>("Online Self-Service Pay Initiated");
  const [mailNextStep, setMailNextStep] = useState<string>("Send Urgent Automated Reminder SMS");

  // Financial inputs & balance calculation
  const [amountPaidInput, setAmountPaidInput] = useState<number>(0);
  const [ptpAgreed, setPtpAgreed] = useState<boolean>(false);
  const [ptpAmountInput, setPtpAmountInput] = useState<number>(() => Math.min(1200, c.exp));
  const [ptpDateInput, setPtpDateInput] = useState<string>("2026-11-12");
  const [ptpPaymentMode, setPtpPaymentMode] = useState<string>("UPI / Instant Transfer");
  const [feedbackNotes, setFeedbackNotes] = useState<string>("");
  const [notesOpen, setNotesOpen] = useState<boolean>(true);
  const [responseSectionOpen, setResponseSectionOpen] = useState<boolean>(false);

  const applyOutcomePreset = (preset: ActionOutcomePreset) => {
    setSelectedOutcomePresetId(preset.id);
    if (feedbackChannel === "FIELD") {
      setFieldPresence(preset.dispositionOrPresenceOrStatus);
      setFieldReaction(preset.reaction);
      setFieldCommitment(preset.nextStep);
    } else if (feedbackChannel === "PHONE") {
      setPhoneDisposition(preset.dispositionOrPresenceOrStatus);
      setPhoneReaction(preset.reaction);
      setPhoneNextStep(preset.nextStep);
    } else {
      setMailStatus(preset.dispositionOrPresenceOrStatus);
      setMailReaction(preset.reaction);
      setMailNextStep(preset.nextStep);
    }
    setPtpAgreed(preset.ptpAgreed);
    if (preset.suggestPaymentMode === "FULL") {
      setAmountPaidInput(outcomeDueBase);
    } else if (preset.suggestPaymentMode === "PARTIAL") {
      setAmountPaidInput((prev) =>
        prev > 0 && prev < outcomeDueBase ? prev : Math.max(1, Math.round(outcomeDueBase * 0.25)),
      );
    } else if (
      preset.id.includes("unavailable") ||
      preset.id.includes("refused") ||
      preset.id.includes("no_response")
    ) {
      setAmountPaidInput(0);
    }
  };

  // Synchronize NBA decision and persisted feedback whenever active account or recommendation changes
  useEffect(() => {
    setAmountPaidInput(0);
    setFeedbackNotes("");
    setPtpAmountInput(Math.min(1200, outcomeDueBase));
    setExplanationOpen(true);
    setSelectedOutcomePresetId("");

    if (!activeNba) {
      setCollectorStatus("PENDING");
      setOverrideActionCode(null);
      setOverrideChannel(null);
      return;
    }

    const dec = activeNba.latestDecision;
    if (dec) {
      setCollectorStatus(dec.status);
      if (dec.status === "EDITED") {
        setOverrideActionCode(dec.selectedAction);
        setOverrideChannel(
          NBA_ACTION_META[dec.selectedAction]?.legacyName ?? dec.selectedChannelLabel,
        );
      } else {
        setOverrideActionCode(null);
        setOverrideChannel(null);
      }
      if (dec.reason) setRejectionReason(dec.reason);
      if (dec.timingWindow) setSelectedTimingWindow(dec.timingWindow);
    } else {
      setCollectorStatus("PENDING");
      setOverrideActionCode(null);
      setOverrideChannel(null);
      setRejectionReason("Customer Requested Hardship Pause");
    }

    const firstActiveArm =
      activeNba.recommendedAction !== "ACT_HOLD_SUPPRESS"
        ? activeNba.recommendedAction
        : (activeNba.eligibleArms.find((a) => a !== "ACT_HOLD_SUPPRESS") ?? "ACT_PHONE_STANDARD");
    setSelectedArmChoice(dec?.status === "EDITED" ? dec.selectedAction : firstActiveArm);

    const effChan =
      dec?.status === "EDITED" ? dec.selectedChannelCode : activeNba.recommendedChannelCode;
    if (effChan === "FIELD_VISIT") {
      setFeedbackChannel("FIELD");
    } else if (effChan === "PHONE") {
      setFeedbackChannel("PHONE");
    } else if (effChan === "EMAIL" || effChan === "SMS") {
      setFeedbackChannel("MAIL");
    }
  }, [
    activeAccountId,
    activeNba,
    activeNba?.recommendationId,
    activeNba?.latestDecision?.decisionId,
    activeNba?.latestFeedback?.feedbackEventId,
    outcomeDueBase,
  ]);

  const nbaDecisionMutation = useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: number;
      payload: Parameters<typeof api.submitNbaDecision>[1];
    }) => api.submitNbaDecision(accountId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customer-nba", customerId] });
    },
  });

  const nbaFeedbackMutation = useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: number;
      payload: Parameters<typeof api.submitNbaFeedback>[1];
    }) => api.submitNbaFeedback(accountId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customer-nba", customerId] });
    },
  });

  const outcomeTriggerMutation = useMutation({
    mutationFn: ({
      customerCode,
      payload,
    }: {
      customerCode: string;
      payload: Parameters<typeof api.triggerOutcomeUpdate>[1];
    }) => api.triggerOutcomeUpdate(customerCode, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customer-nba", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-detail", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-timeline", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-outreach-stats", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-payment-model", customerId] });
    },
  });

  // Selecting a timeline event refines the NBA bandit with that recorded signal.
  // The timeline itself is a read-only history: recording NEW events happens only
  // through the Record Outcome form, never through clicking.
  useEffect(() => {
    if (!selectedTimelineOutcome) return;
    if (!activeNba || activeAccountId == null) {
      setSelectedTimelineOutcome(null);
      return;
    }

    const outcome = selectedTimelineOutcome;
    const flags = outcomeToFeedbackFlags(outcome);
    const execTsIso = outcome.timestamp || new Date().toISOString();

    let selectedAction = activeNba.recommendedAction;
    if (outcome.channel === "PHONE") selectedAction = "ACT_PHONE_STANDARD";
    else if (outcome.channel === "EMAIL") selectedAction = "ACT_DIGITAL_REMINDER_EMAIL";
    else if (outcome.channel === "SMS") selectedAction = "ACT_DIGITAL_REMINDER_SMS";
    else if (outcome.channel === "FIELD_VISIT") selectedAction = "ACT_FIELD_VISIT_STANDARD";

    const statusLower = outcome.outcome.toLowerCase();
    const executionStatus: "EXECUTED" | "FAILED_ATTEMPT" | "SKIPPED" =
      statusLower.includes("unavailable") ||
      statusLower.includes("refused") ||
      statusLower.includes("no answer")
        ? "FAILED_ATTEMPT"
        : "EXECUTED";

    void nbaFeedbackMutation.mutate(
      {
        accountId: activeAccountId,
        payload: {
          feedbackEventId: `FB-TIMELINE-${activeAccountId}-${Date.now()}`,
          recommendationId: activeNba.recommendationId,
          customerId: activeNba.customerId,
          accountId: activeNba.accountId,
          selectedAction,
          executionTs: execTsIso,
          executionStatus,
          paymentAmount: outcome.amountPaid ?? 0,
          paymentDate: outcome.amountPaid && outcome.amountPaid > 0 ? execTsIso.slice(0, 10) : null,
          respondedFlag: flags.respondedFlag,
          connectedFlag: flags.connectedFlag,
          sourceTable:
            outcome.channel === "EMAIL" || outcome.channel === "SMS"
              ? "engagement_event"
              : "contact_event",
          pastDueAmount: activeNba.pastDueAmount,
          currentDueAmount: activeNba.currentDueAmount,
          ptpAgreed: outcome.ptpAgreed ?? false,
          ptpAmount: outcome.ptpAmount,
          ptpDate: outcome.ptpDate,
          notes:
            outcome.notes ||
            `Timeline event selected for review: ${outcome.outcome} via ${outcome.channel}`,
          customerResponse: {
            channel: outcome.channel,
            outcome: outcome.outcome,
            sourceCategory: outcome.sourceEvent.category,
          },
        },
      },
      {
        onError: (err) => {
          console.error("NBA feedback from timeline outcome failed:", err);
        },
      },
    );

    setSelectedTimelineOutcome(null);
  }, [
    selectedTimelineOutcome,
    activeNba,
    activeAccountId,
    nbaFeedbackMutation,
    setSelectedTimelineOutcome,
  ]);

  const handleStoreFeedback = async () => {
    const paid = Number(amountPaidInput) || 0;
    const dueBase = outcomeDueBase;
    const remaining = Math.max(0, dueBase - paid);
    const projectedDpd =
      paid >= dueBase
        ? "Balance Paid in Full"
        : paid > 0
          ? "Partially Paid"
          : `${c.dpd} Days Overdue`;

    const execArm = resolveArmForFeedbackChannel(feedbackChannel, activeNba);
    const bizMeta = getBusinessActionMeta(execArm);
    const channelName =
      bizMeta.cardTitle ||
      (feedbackChannel === "FIELD"
        ? "Field Visit"
        : feedbackChannel === "PHONE"
          ? "Phone Call"
          : "Email Reminder");

    const presenceOrDisp =
      feedbackChannel === "FIELD"
        ? fieldPresence
        : feedbackChannel === "PHONE"
          ? phoneDisposition
          : mailStatus;

    const reactionText =
      feedbackChannel === "FIELD"
        ? fieldReaction
        : feedbackChannel === "PHONE"
          ? phoneReaction
          : mailReaction;

    const commitmentOrStep =
      feedbackChannel === "FIELD"
        ? fieldCommitment
        : feedbackChannel === "PHONE"
          ? phoneNextStep
          : mailNextStep;

    const respondedFlag: 0 | 1 =
      paid > 0 ||
      (feedbackChannel === "FIELD" &&
        (fieldPresence === "Customer Met in Person" ||
          fieldPresence === "Met Family / Third-Party")) ||
      (feedbackChannel === "PHONE" &&
        (phoneDisposition.startsWith("Connected") || phoneDisposition.startsWith("Answered"))) ||
      (feedbackChannel === "MAIL" &&
        (mailStatus.includes("Clicked") ||
          mailStatus.includes("Opened") ||
          mailStatus.includes("Replied")))
        ? 1
        : 0;

    const connectedFlag: 0 | 1 =
      (feedbackChannel === "FIELD" && fieldPresence === "Customer Met in Person") ||
      (feedbackChannel === "PHONE" && phoneDisposition.startsWith("Connected"))
        ? 1
        : 0;

    let validationStatus: string | undefined;
    if (activeNba && activeAccountId != null) {
      const execTsIso = new Date().toISOString();
      const payDateIso = paid > 0 ? execTsIso.slice(0, 10) : null;
      const fbEventId = `FB-UI-${activeAccountId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      try {
        const res = await nbaFeedbackMutation.mutateAsync({
          accountId: activeAccountId,
          payload: {
            feedbackEventId: fbEventId,
            recommendationId: activeNba.recommendationId,
            customerId: activeNba.customerId,
            accountId: activeNba.accountId,
            selectedAction: execArm,
            executionTs: execTsIso,
            executionStatus: "EXECUTED",
            paymentAmount: paid,
            paymentDate: payDateIso,
            respondedFlag,
            connectedFlag,
            sourceTable: feedbackChannel === "MAIL" ? "engagement_event" : "contact_event",
            pastDueAmount: activeNba.pastDueAmount,
            currentDueAmount: activeNba.currentDueAmount,
            timingWindow: selectedTimingWindow,
            ptpAgreed,
            ptpAmount: ptpAgreed ? Number(ptpAmountInput) || 0 : undefined,
            ptpDate: ptpAgreed ? ptpDateInput : undefined,
            ptpMode: ptpAgreed ? ptpPaymentMode : undefined,
            notes: feedbackNotes.trim() || "Customer outreach outcome recorded.",
            customerResponse: {
              channel: feedbackChannel,
              disposition: presenceOrDisp,
              reaction: reactionText,
              commitment: commitmentOrStep,
            },
          },
        });
        validationStatus = res.data.validationStatus;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save outcome";
        toast.error(msg);
        return;
      }
    }

    setDrawerOpen(false);

    // Propagate the recorded outcome to Engagement, Payment and Outreach models
    // in real time, in addition to the NBA bandit feedback above.
    // (Single writer for contact_event: the propagation service records the
    // outreach touch — do NOT also call recordCustomerOutcome here or the
    // outreach attempt cap will be consumed twice.)
    if (activeAccountId != null) {
      const propagationChannel =
        feedbackChannel === "FIELD"
          ? "FIELD_VISIT"
          : feedbackChannel === "PHONE"
            ? "PHONE"
            : "EMAIL";
      try {
        await outcomeTriggerMutation.mutateAsync({
          customerCode: c.id,
          payload: {
            accountId: activeAccountId,
            channel: propagationChannel,
            outcome: presenceOrDisp,
            amountPaid: paid,
            ptpAgreed,
            ptpAmount: ptpAgreed ? Number(ptpAmountInput) || 0 : undefined,
            ptpDate: ptpAgreed ? ptpDateInput : undefined,
            notes: feedbackNotes.trim() || `Outcome recorded via ${channelName}`,
          },
        });
      } catch (err) {
        console.error("Outcome propagation from form failed:", err);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["customer-timeline", customerId] });

    const toastSpec = formatValidationToastMessage(validationStatus, channelName);
    if (toastSpec.level === "warning") {
      toast.warning(toastSpec.message);
    } else if (toastSpec.level === "info") {
      toast.info(toastSpec.message);
    } else {
      toast.success(toastSpec.message);
    }
  };

  const bTouch = bestTouchpoint(c);

  // Persist collector decisions to Postgres (collector_action_history) so the
  // activity timeline shows genuine rows, then refresh the timeline query.
  const persistCollectorAction = (actionType: string, notes?: string | null) => {
    void api
      .recordCollectorAction(c.id, {
        accountId: activeAccountId,
        actionType,
        notes: notes ?? null,
      })
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["customer-timeline", customerId] });
      })
      .catch((err) => {
        console.error("Failed to persist collector action:", err);
      });
  };

  const handleApproveNBA = async () => {
    if (hasPolicyBlock || isHoldSuppressed) {
      toast.error("Action is paused due to customer permissions or account restrictions.");
      return;
    }
    const chosenArm =
      activeNba && collectorStatus === "EDITED" && overrideActionCode
        ? overrideActionCode
        : (activeNba?.recommendedAction ?? effectiveActionCode);
    const friendlyTitle = getBusinessActionMeta(chosenArm).headline;

    if (!activeNba || activeAccountId == null) {
      setCollectorStatus("APPROVED");
      toast.success(`Action approved: ${friendlyTitle}`);
      return;
    }
    try {
      await nbaDecisionMutation.mutateAsync({
        accountId: activeAccountId,
        payload: {
          recommendationId: activeNba.recommendationId,
          decisionType: "APPROVE",
          selectedAction: chosenArm,
          timingWindow: selectedTimingWindow,
        },
      });
      setCollectorStatus("APPROVED");
      toast.success(`Action approved: ${friendlyTitle}`);

      // Open the record outcome drawer so the collector can capture the real
      // execution result. The outcome form will propagate feedback to all four
      // models when submitted.
      const acceptedChannelCode = NBA_ACTION_META[chosenArm]?.channelCode ?? targetChannelCode;
      if (acceptedChannelCode === "FIELD_VISIT" || acceptedChannelCode === "FIELD") {
        setFeedbackChannel("FIELD");
      } else if (acceptedChannelCode === "PHONE") {
        setFeedbackChannel("PHONE");
      } else {
        setFeedbackChannel("MAIL");
      }
      setSelectedOutcomePresetId("");
      setDrawerOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve action");
    }
  };

  const handleRejectNBA = async () => {
    const friendlyTitle = getBusinessActionMeta(effectiveActionCode).headline;
    if (activeNba && activeAccountId != null) {
      try {
        await nbaDecisionMutation.mutateAsync({
          accountId: activeAccountId,
          payload: {
            recommendationId: activeNba.recommendationId,
            decisionType: "REJECT",
            selectedAction: effectiveActionCode,
            reason: rejectionReason,
            notes: rejectionNotes.trim() || undefined,
          },
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to record declined action");
        return;
      }
    }
    setCollectorStatus("REJECTED");
    setRejectionModalOpen(false);
    toast.warning(`Recommendation declined: ${rejectionReason}`);

    persistCollectorAction("DECISION_REJECT", `Declined: ${rejectionReason}`);
  };

  const handleChangeChannelSubmit = async (newArmCode: string, newTiming: string) => {
    const meta = NBA_ACTION_META[newArmCode];
    const targetLabel = getBusinessActionMeta(newArmCode).cardTitle;
    if (activeNba && activeAccountId != null) {
      try {
        await nbaDecisionMutation.mutateAsync({
          accountId: activeAccountId,
          payload: {
            recommendationId: activeNba.recommendationId,
            decisionType: "OVERRIDE",
            selectedAction: newArmCode,
            timingWindow: newTiming,
          },
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Action could not be selected under current rules",
        );
        return;
      }
    }
    setOverrideActionCode(newArmCode);
    setOverrideChannel(meta?.legacyName ?? null);
    setSelectedTimingWindow(newTiming);
    setCollectorStatus("EDITED");
    setChangeChannelModalOpen(false);
    toast.success(`Selected action updated to ${targetLabel} (${newTiming})`);
    persistCollectorAction("DECISION_OVERRIDE", `Action changed to ${targetLabel} (${newTiming})`);
  };

  return (
    <AppShell
      title={`${c.name} · ${c.id}`}
      section="Customer Level"
      subtitle="Customer 360 Workspace"
      actions={
        <Link
          to="/worklist"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition shadow-xs"
        >
          <ArrowLeft className="size-3.5" /> Back to Worklist
        </Link>
      }
    >
      <div className="mx-auto max-w-[1280px] space-y-4">
        {/* CUSTOMER HEADER CARD */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{c.name}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                    effectiveAccountStatus === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30"
                  }`}
                >
                  {effectiveAccountStatus}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.id} · Account {c.acct}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 sm:gap-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Repayment Ratio
                </div>
                <div className="mt-0.5 text-2xl font-bold text-foreground">{c.cov}%</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Preferred Channel
                </div>
                <div className="mt-0.5 text-xl font-bold text-primary">
                  {activeNba
                    ? isHoldSuppressed
                      ? "On Hold"
                      : getBusinessActionMeta(activeNba.recommendedAction).channelLabel
                    : bTouch}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Follow-up Timing
                </div>
                <div className="mt-0.5 text-xl font-bold text-foreground">{c.cad[0]}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 CORE DETAIL CARDS */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {/* 1. Suggested Message */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-5 shadow-xs flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-primary to-indigo-600" />
            <div>
              <div className="min-h-[44px] mb-3">
                <h3 className="text-sm font-bold text-foreground">Engagement Model</h3>
                <p className="text-xs text-muted-foreground">
                  Recommended message template &amp; operational objective
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground shrink-0">Suggested Message Template</span>
                  <span className="font-bold text-primary text-right leading-tight max-w-[210px]">
                    {c.content[0]}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-muted-foreground shrink-0">Message Objective</span>
                  <span className="font-semibold text-foreground text-right leading-tight max-w-[210px]">
                    {c.content[1]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Historical open rate</span>
                  <div className="flex items-center gap-2">
                    {renderBlockBar(c.open, "text-blue-600 dark:text-blue-400")}
                    <span className="font-semibold text-foreground w-8 text-right font-mono text-[11px]">
                      {c.open > 0 ? `${c.open}%` : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Link engagement</span>
                  <div className="flex items-center gap-2">
                    {renderBlockBar(effectiveClick, "text-indigo-600 dark:text-indigo-400")}
                    <span className="font-semibold text-foreground w-8 text-right font-mono text-[11px]">
                      {effectiveClick != null && effectiveClick > 0 ? `${effectiveClick}%` : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Response rate</span>
                  <div className="flex items-center gap-2">
                    {renderBlockBar(c.reach, "text-emerald-600 dark:text-emerald-400")}
                    <span className="font-semibold text-foreground w-8 text-right font-mono text-[11px]">
                      {c.reach > 0 ? `${c.reach}%` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Option 1: Live Message / Script Preview Box */}
              <div className="mt-4 pt-3.5 border-t border-border/70 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  <FileText className="size-3.5 text-primary" />
                  <span>{isVoiceScript ? "Live Script Snippet" : "Live Message Preview"}</span>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-[11.5px] leading-relaxed text-muted-foreground font-sans italic">
                  "{liveSnippet}"
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">
                    Target: <strong className="text-foreground">{c.name}</strong> ({c.acct})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(liveSnippet);
                      setCopiedSnippet(true);
                      toast.success(
                        isVoiceScript
                          ? "Call script copied to clipboard"
                          : "Message template copied to clipboard",
                      );
                      setTimeout(() => setCopiedSnippet(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer shrink-0"
                  >
                    {copiedSnippet ? (
                      <>
                        <Check className="size-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>{isVoiceScript ? "Copy Script" : "Copy Template"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Payment Model */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-5 shadow-xs flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-emerald-500" />
            <div className="flex flex-col h-full">
              <div className="min-h-[44px] mb-3">
                <h3 className="text-sm font-bold text-foreground">Payment Model</h3>
                <p className="text-xs text-muted-foreground">
                  Four approved repayment and contact-history metrics
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1 auto-rows-fr">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 flex flex-col justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Contact attempts
                  </div>
                  <div className="my-2 text-2xl font-black text-foreground tabular-nums">
                    {c.paymentContactAttempts ?? "—"}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">Last 30 days</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 flex flex-col justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Successful payments
                  </div>
                  <div className="my-2 text-2xl font-black text-foreground tabular-nums">
                    {c.pays}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">Last 30 days</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 flex flex-col justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Days since payment
                  </div>
                  <div className="my-2 text-2xl font-black text-foreground tabular-nums">
                    {c.last}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">All verified history</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 flex flex-col justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Coverage ratio
                  </div>
                  <div className="my-2 text-2xl font-black text-primary tabular-nums">{c.cov}%</div>
                  <div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, c.cov)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Recommended Channel & Time */}
          <div className="rounded-2xl border border-primary/20 bg-card p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
            {/* Subtle top accent gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-emerald-500" />

            <div className="space-y-3">
              <div className="min-h-[44px] mb-3 flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground">Outreach Model</h3>
                    <InfoTooltip
                      title="Historical Channel Affinity Model"
                      content="Formula: Channel Affinity = (0.60 × CSR) + (0.40 × Response Rate), ranked with confidence-tiering and Empirical Bayes shrinkage so single-attempt flukes do not override higher-evidence channels."
                      impact="Ranks policy-eligible channels on this account by historical engagement; Next Best Action combines this with delinquency, recovery value, and exploration."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optimal contact channel recommendation
                  </p>
                </div>
                {/* Recommendation Status Badge */}
                {outreachStats && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                      outreachStats.recommendationStatus === "RECOMMENDED"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : outreachStats.recommendationStatus === "SUPPRESSED_DNC"
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {outreachStats.recommendationStatus === "RECOMMENDED"
                      ? "Recommended"
                      : outreachStats.recommendationStatus === "SUPPRESSED_DNC"
                        ? "DNC Suppressed"
                        : outreachStats.recommendationStatus === "INSUFFICIENT_DATA"
                          ? "Insufficient Data"
                          : "No Eligible Channel"}
                  </span>
                )}
              </div>

              {/* Offline Warning Banner if API fails */}
              {outreachQuery.isError && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-[10.5px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>Backend Outreach API offline. Showing labelled demo state.</span>
                </div>
              )}

              {/* PRIMARY RECOMMENDED CHANNEL HERO CARD */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-lg bg-primary/15 grid place-items-center text-primary">
                      <OutreachHeroIcon className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">
                          {outreachStats
                            ? outreachStats.recommendedChannel ||
                              (outreachStats.recommendationStatus === "INSUFFICIENT_DATA"
                                ? "Insufficient Interaction History"
                                : outreachStats.recommendationStatus === "SUPPRESSED_DNC"
                                  ? "Outreach Suppressed"
                                  : "No Eligible Channel")
                            : activeChannel.label}
                        </span>
                        {(!outreachStats ||
                          outreachStats.recommendationStatus === "RECOMMENDED") && (
                          <span className="rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[9.5px] font-bold">
                            Recommended
                          </span>
                        )}
                        {outreachStats?.recommendationStatus === "RECOMMENDED" &&
                          outreachStats.channels.find(
                            (x) => x.channelCode === outreachStats.recommendedChannelCode,
                          )?.dataStatus === "INSUFFICIENT" && (
                            <span
                              title="Recommended channel has fewer than 3 valid historical attempts"
                              className="rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold"
                            >
                              Low Sample
                            </span>
                          )}
                        {outreachStats?.recommendationStatus === "INSUFFICIENT_DATA" && (
                          <span className="rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 text-[9.5px] font-bold">
                            Insufficient Data
                          </span>
                        )}
                        {outreachStats?.recommendationStatus === "SUPPRESSED_DNC" && (
                          <span className="rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 text-[9.5px] font-bold">
                            DNC Blocked
                          </span>
                        )}
                        {overrideChannel && (
                          <span className="rounded-sm bg-amber-500/15 px-1 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                            Overridden
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Historical Channel Affinity Model
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Prominent Stat Badges */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60 text-center">
                  <div className="rounded-lg bg-card/80 border border-border/70 p-2 h-[68px] flex flex-col items-center justify-center shadow-2xs">
                    <div className="text-base font-black tracking-tight text-foreground tabular-nums">
                      {outreachStats
                        ? outreachStats.recommendedCsr != null
                          ? `${outreachStats.recommendedCsr}%`
                          : "—"
                        : activeChannel.csrRaw != null
                          ? `${activeChannel.csrRaw}%`
                          : `${activeChannel.successRate}%`}
                    </div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      CSR
                    </div>
                  </div>
                  <div className="rounded-lg bg-card/80 border border-border/70 p-2 h-[68px] flex flex-col items-center justify-center shadow-2xs">
                    <div className="text-base font-black tracking-tight text-foreground tabular-nums">
                      {outreachStats
                        ? outreachStats.recommendedResponseRate != null
                          ? `${outreachStats.recommendedResponseRate}%`
                          : "—"
                        : activeChannel.rrRaw != null
                          ? `${activeChannel.rrRaw}%`
                          : `${activeChannel.responseRate}%`}
                    </div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      Response Rate
                    </div>
                  </div>
                  <div className="rounded-lg bg-primary/10 border border-primary/35 p-2 h-[68px] flex flex-col items-center justify-center shadow-2xs">
                    <div className="text-base font-black tracking-tight text-primary tabular-nums">
                      {outreachStats
                        ? outreachStats.recommendedAffinityScore != null
                          ? outreachStats.recommendedAffinityScore.toFixed(1)
                          : "—"
                        : activeChannel.affinityRaw != null
                          ? activeChannel.affinityRaw.toFixed(1)
                          : activeChannel.score.toFixed(1)}
                    </div>
                    <div className="text-[9px] font-bold text-primary uppercase tracking-wider mt-0.5">
                      Affinity Score
                    </div>
                  </div>
                </div>

                {/* Channel Comparison Matrix with Pixel-Perfect Vertical Column Alignment */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    <span>Channel Comparison</span>
                    <div className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground text-center">
                      <span className="w-9 text-center">CSR</span>
                      <span className="w-9 text-center">RR</span>
                      <span className="w-11 text-center">AFFINITY</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {rawCandidates.map((cand) => {
                      const chData = outreachStats?.channels.find(
                        (x) =>
                          x.channelCode === cand.code ||
                          (cand.code === "FIELD" && x.channelCode === "FIELD_VISIT"),
                      );

                      const isDnc = outreachStats?.recommendationStatus === "SUPPRESSED_DNC";
                      const isEligible = chData ? chData.isEligible : !isDnc && cand.permitted;
                      const affinityVal = chData?.affinityScore;
                      const dataStatus = chData?.dataStatus ?? "NO_ATTEMPTS";

                      // STRICT OPTIMAL CHECK:
                      // 1. Eligible
                      // 2. Affinity score is not null
                      // 3. Recommendation status is RECOMMENDED
                      // 4. Highest affinity channel matching recommendedChannelCode
                      const isOptimal =
                        !isDnc &&
                        isEligible &&
                        affinityVal != null &&
                        outreachStats?.recommendationStatus === "RECOMMENDED" &&
                        (outreachStats.recommendedChannelCode === cand.code ||
                          (cand.code === "FIELD" &&
                            outreachStats.recommendedChannelCode === "FIELD_VISIT"));

                      const isNoAttempts =
                        dataStatus === "NO_ATTEMPTS" || (chData?.totalValidAttempts ?? 0) === 0;

                      const csrDisplay = isNoAttempts
                        ? "—"
                        : chData?.csr != null
                          ? `${chData.csr}%`
                          : cand.csrRaw != null
                            ? `${cand.csrRaw}%`
                            : "—";
                      const rrDisplay = isNoAttempts
                        ? "—"
                        : chData?.responseRate != null
                          ? `${chData.responseRate}%`
                          : cand.rrRaw != null
                            ? `${cand.rrRaw}%`
                            : "—";
                      const affDisplay = isNoAttempts
                        ? "—"
                        : chData?.affinityScore != null
                          ? chData.affinityScore.toFixed(1)
                          : cand.affinityRaw != null
                            ? cand.affinityRaw.toFixed(1)
                            : "—";

                      let badgeText = "ELIGIBLE";
                      let badgeClass =
                        "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25";
                      let badgeTitle = "Channel eligible and meeting policy requirements";

                      if (isDnc || !isEligible) {
                        badgeText = "SUPPRESSED";
                        badgeClass =
                          "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
                        badgeTitle =
                          chData?.restrictionReason || "Channel suppressed by policy or consent";
                      } else if (isOptimal) {
                        const attempts = chData?.totalValidAttempts ?? 0;
                        badgeText =
                          attempts > 0 && attempts < 3 ? `OPTIMAL (${attempts})` : "OPTIMAL";
                        badgeClass =
                          "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold";
                        badgeTitle =
                          attempts > 0 && attempts < 3
                            ? `Recommended primary channel (${attempts} valid attempt(s) — low sample)`
                            : "Recommended primary channel based on proven history";
                      } else if (
                        dataStatus === "NO_ATTEMPTS" ||
                        (chData?.totalValidAttempts ?? 0) === 0
                      ) {
                        badgeText = "NO ATTEMPTS";
                        badgeClass = "bg-muted text-muted-foreground border-border/50";
                        badgeTitle = "No recorded contact attempts on this channel";
                      } else if (
                        dataStatus === "INSUFFICIENT" ||
                        (chData?.totalValidAttempts ?? 0) < 3
                      ) {
                        const attempts = chData?.totalValidAttempts ?? 1;
                        badgeText = `LOW (${attempts})`;
                        badgeClass =
                          "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold";
                        badgeTitle = `Only ${attempts} valid attempt(s) recorded. Minimum 3 attempts required for full statistical confidence.`;
                      } else if (affinityVal == null || affinityVal === 0) {
                        badgeText = "INSUFFICIENT";
                        badgeClass = "bg-muted text-muted-foreground border-border/50";
                        badgeTitle = "Channel affinity cannot be computed";
                      }

                      return (
                        <div
                          key={cand.code}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-xs transition ${
                            isOptimal
                              ? "bg-primary/10 border-primary/40 shadow-2xs font-semibold"
                              : "bg-card/70 border-border/60 text-muted-foreground hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 pr-1">
                            <cand.icon className="size-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-foreground text-[11px] whitespace-nowrap shrink-0">
                              {cand.label}
                            </span>
                            <span
                              title={badgeTitle}
                              className={`rounded-sm text-[7.5px] font-extrabold uppercase px-1 py-0.5 border whitespace-nowrap shrink-0 ${badgeClass}`}
                            >
                              {badgeText}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 font-mono text-[10.5px] tabular-nums shrink-0">
                            <span className="w-9 text-center text-foreground font-semibold">
                              {csrDisplay}
                            </span>
                            <span className="w-9 text-center text-foreground font-semibold">
                              {rrDisplay}
                            </span>
                            <span
                              className={`w-11 text-center font-bold ${isOptimal ? "text-primary text-[11px]" : "text-foreground"}`}
                            >
                              {affDisplay}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Post-due date outreach and repayments (Line Chart) - Hidden / Commented out as requested
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Post-due date outreach and repayments
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Weekly touchpoints occurred post due-date up to current date ({c.touches} total)
              </p>

              <div className="relative mt-2 pt-2">
                <div className="relative h-28 w-full">
                  {(() => {
                    const maxY = Math.max(...wk, 4);
                    const xPercents = [12.5, 37.5, 62.5, 87.5];
                    const pts = wk.map((v, i) => {
                      const x = xPercents[i]!;
                      const y = 82 - (v / maxY) * 60;
                      return { x, y, v, paid: Boolean(pw[i]) };
                    });

                    const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                    const areaD = `${lineD} L ${pts[pts.length - 1]!.x} 94 L ${pts[0]!.x} 94 Z`;

                    return (
                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="w-full h-full overflow-visible"
                      >
                        <defs>
                          <linearGradient id="outreachLineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        <path d={areaD} fill="url(#outreachLineGrad)" />

                        <path
                          d={lineD}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    );
                  })()}

                  <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
                    {wk.map((v, i) => {
                      const maxY = Math.max(...wk, 4);
                      const topPercent = 82 - (v / maxY) * 60;
                      return (
                        <div key={i} className="relative flex flex-col items-center">
                          <div
                            className="absolute flex flex-col items-center -translate-y-1/2"
                            style={{ top: `${topPercent}%` }}
                          >
                            <span className="text-[12px] font-extrabold text-foreground leading-none mb-1">
                              {v}
                            </span>
                            <span className="size-3.5 rounded-full border-2 border-primary bg-card shadow-xs" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 border-t pt-3 text-center">
                  {wk.map((v, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-[11px] font-medium text-muted-foreground">Week {i + 1}</span>
                      <span className="text-xs font-bold text-foreground mt-0.5">
                        {v} touches
                      </span>
                      {pw[i] ? (
                        <span className="inline-block mt-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                          ● paid
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
        */}

        {/* Card 5: Account Recovery Snapshot */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Activity className="size-4 text-primary" />
                <span>Account Recovery Snapshot</span>
                <InfoTooltip
                  title="Account Recovery Snapshot"
                  content="A current view of delinquency stage, the latest recorded payment commitment, and outstanding exposure for the selected account."
                  impact="Review the promise amount, due date, and recorded status alongside the account's balances."
                />
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Delinquency status, payment commitment, and outstanding exposure
              </p>
            </div>
            {(liveCustomer?.snapshotDate || activeNba?.snapshotDate) && (
              <span className="text-[10.5px] text-muted-foreground">
                Snapshot {liveCustomer?.snapshotDate ?? activeNba?.snapshotDate}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Delinquency Stage
              </span>
              <div className="mt-2 text-xl font-black text-foreground">{c.dpd} DPD</div>
              <span className="mt-1 block text-[10.5px] font-semibold text-muted-foreground">
                {dpdStatusLabel} · {riskBucket}
              </span>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Promise-to-Pay
                </span>
                {latestPromise && promiseStatus && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      promiseStatus.toLowerCase().includes("fulfill") ||
                      promiseStatus.toLowerCase().includes("kept")
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : promiseStatus.toLowerCase().includes("pending")
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {promiseStatus}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xl font-black text-foreground">
                {timelineQuery.isLoading
                  ? "Loading..."
                  : timelineQuery.isError
                    ? "Unavailable"
                    : latestPromise
                      ? promiseAmount != null
                        ? `$${promiseAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : "Amount unavailable"
                      : "No promise recorded"}
              </div>
              <span className="mt-1 block text-[10.5px] text-muted-foreground">
                {timelineQuery.isLoading
                  ? "Loading commitment details"
                  : timelineQuery.isError
                    ? "Commitment history unavailable"
                    : latestPromise && promiseDate
                      ? `Due ${formatTimelineDate(promiseDate)}`
                      : latestPromise
                        ? "Due date unavailable"
                        : "No payment commitment on record"}
              </span>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Past-Due Amount
              </span>
              <div className="mt-2 text-xl font-black text-foreground">
                ${pastDueAmt.toLocaleString()}
              </div>
              <span className="mt-1 block text-[10.5px] text-muted-foreground">
                Current overdue exposure
              </span>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Remaining Balance
              </span>
              <div className="mt-2 text-xl font-black text-foreground">
                ${remainingBal.toLocaleString()}
              </div>
              {overdueShare != null ? (
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>Past due share</span>
                    <span className="font-semibold text-foreground">{overdueShare}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(0, overdueShare))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <span className="mt-1 block text-[10.5px] text-muted-foreground">
                  Past-due share unavailable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT: Activity Timeline on Left, Next Best Action on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT: Activity Timeline */}
          <div className="lg:col-span-5 h-full">
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Activity timeline</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recent outreach, messages, approvals and repayment events
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {timelineData?.meta?.total ?? timelineList.length} events logged
                  </span>
                </div>

                {/* Vertical timeline: chronological events from the recorded history */}
                <div className="relative border-l-2 border-border/70 ml-3 pl-4 py-1 flex-1 flex flex-col">
                  {timelineQuery.isLoading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((k) => (
                        <div key={k} className="h-[72px] rounded-xl bg-muted/40 animate-pulse" />
                      ))}
                    </div>
                  ) : timelineQuery.isError ? (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="size-3.5" /> Activity history could not be loaded
                      </div>
                      <p className="text-muted-foreground">
                        The recorded-events service is unavailable. No events are shown until the
                        connection is restored.
                      </p>
                      <button
                        type="button"
                        onClick={() => void timelineQuery.refetch()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1 font-bold text-foreground hover:bg-muted transition cursor-pointer"
                      >
                        <RotateCcw className="size-3" /> Retry
                      </button>
                    </div>
                  ) : timelineList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <FileText className="size-3.5" /> No recorded activity yet
                      </div>
                      <p className="mt-1 leading-relaxed">
                        Outreach, message, payment and decision events will appear here as they are
                        recorded for this account.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {timelineList.map((item) => {
                        const isSelected =
                          selectedTimelineEventId != null &&
                          selectedTimelineEventId === item.eventId;
                        const isLive = item.isLatest === true;
                        const dotTone =
                          item.tone === "green"
                            ? "bg-emerald-500/70"
                            : item.tone === "rose"
                              ? "bg-rose-500/70"
                              : item.tone === "amber"
                                ? "bg-amber-500/70"
                                : "bg-slate-400/70 dark:bg-slate-500";
                        const statusTone =
                          item.tone === "green"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : item.tone === "rose"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : item.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-primary/10 text-primary";

                        return (
                          <div
                            key={item.eventId ?? `${item.title}-${item.time}`}
                            onClick={() => {
                              setSelectedTimelineEventId(item.eventId ?? null);
                              const outcome = parseTimelineOutcome(
                                c.id,
                                activeAccountId ?? undefined,
                                item,
                              );
                              setSelectedTimelineOutcome(outcome);
                            }}
                            style={
                              isLive
                                ? {
                                    background:
                                      "linear-gradient(135deg, #DBEAFE 0%, #E0F2FE 45%, #EDE9FE 100%)",
                                    borderColor: "#3B82F6",
                                  }
                                : undefined
                            }
                            className={`relative rounded-xl p-3.5 text-xs transition cursor-pointer ${
                              isSelected
                                ? isLive
                                  ? "border-2 ring-2 ring-blue-500/40 shadow-sm"
                                  : "border border-primary/50 bg-primary/[0.05] ring-1 ring-primary/25"
                                : isLive
                                  ? "border-2 ring-1 ring-blue-500/40 shadow-sm hover:-translate-y-px hover:shadow"
                                  : "border border-border/60 bg-gradient-to-r from-muted/25 via-muted/15 to-card/60 hover:bg-muted/40 hover:border-border hover:-translate-y-px"
                            }`}
                          >
                            {/* Node icon on the live card; plain dots for history */}
                            {isLive ? (
                              <div
                                className="absolute -left-[28px] top-3 z-10 flex size-6 items-center justify-center"
                                title={item.category}
                              >
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-30" />
                                <span className="relative flex size-6 items-center justify-center rounded-full border-2 border-white bg-rose-600 text-white shadow-sm ring-1 ring-rose-500/50 dark:border-card">
                                  <User className="size-3 stroke-[2.5]" />
                                </span>
                              </div>
                            ) : (
                              <div
                                className={`absolute -left-[21px] top-[18px] z-10 size-2.5 rounded-full ring-2 ring-card ${dotTone}`}
                                title={item.category}
                              />
                            )}

                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="font-extrabold text-xs leading-snug flex-1 text-foreground">
                                {item.title}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isLive && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                                    <span className="relative flex size-2">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                      <span className="relative inline-flex size-2 rounded-full bg-white" />
                                    </span>
                                    Live
                                  </span>
                                )}
                                <span className="text-[11px] text-muted-foreground">
                                  {formatTimelineDate(item.time)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                {item.category}
                              </span>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${statusTone}`}
                              >
                                {item.status}
                              </span>
                              {item.amount != null && item.amount > 0 && (
                                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                                  ${item.amount.toLocaleString()}
                                </span>
                              )}
                              {item.details?.ptpAmount != null && item.details.ptpAmount > 0 && (
                                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                  PTP ${item.details.ptpAmount.toLocaleString()}
                                </span>
                              )}
                              {item.channelName && (
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                  {item.channelName}
                                </span>
                              )}
                            </div>

                            {item.details && (
                              <div className="mt-2.5 rounded-lg border border-border/50 bg-background/60 px-2.5 py-2 space-y-1 text-[11px] text-muted-foreground">
                                {item.details.messageTemplate && (
                                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                    <span>
                                      <span className="font-semibold text-foreground/80">
                                        Message:
                                      </span>{" "}
                                      {item.details.messageTemplate}
                                      {item.details.messageStage
                                        ? ` · ${item.details.messageStage}`
                                        : ""}
                                    </span>
                                  </div>
                                )}
                                {item.details.paymentAmount != null &&
                                  item.details.paymentAmount > 0 && (
                                    <div>
                                      <span className="font-semibold text-foreground/80">
                                        Payment received:
                                      </span>{" "}
                                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                        $
                                        {item.details.paymentAmount.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                      {item.details.paymentStatus
                                        ? ` (${item.details.paymentStatus})`
                                        : ""}
                                      {item.details.appliedDueDate
                                        ? ` · applied to due ${formatTimelineDate(item.details.appliedDueDate)}`
                                        : ""}
                                    </div>
                                  )}
                                {item.details.ptpAmount != null && item.details.ptpAmount > 0 && (
                                  <div>
                                    <span className="font-semibold text-foreground/80">
                                      Promise to pay:
                                    </span>{" "}
                                    <span className="font-semibold text-foreground">
                                      $
                                      {item.details.ptpAmount.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                    {item.details.ptpDate
                                      ? ` due ${formatTimelineDate(item.details.ptpDate)}`
                                      : ""}
                                    {item.details.ptpStatus ? ` · ${item.details.ptpStatus}` : ""}
                                    {item.details.ptpMode ? ` · ${item.details.ptpMode}` : ""}
                                  </div>
                                )}
                                {(item.details.disposition ||
                                  item.details.reaction ||
                                  item.details.commitment) && (
                                  <div>
                                    <span className="font-semibold text-foreground/80">
                                      Response:
                                    </span>{" "}
                                    {[
                                      item.details.disposition,
                                      item.details.reaction,
                                      item.details.commitment,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </div>
                                )}
                                {item.details.notes && (
                                  <div className="italic text-muted-foreground/90">
                                    Note: {item.details.notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Next scheduled action — from prioritized action / cadence engine */}
                  {timelineNextAction && timelineNextAction.nextContactDate && (
                    <div className="relative rounded-xl border border-dashed border-primary/45 bg-gradient-to-r from-primary/[0.04] to-card p-3.5 text-xs mt-3">
                      <div className="absolute -left-[28px] top-4 z-10 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs ring-2 ring-card">
                        <CalendarClock className="size-3" />
                      </div>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="font-extrabold text-xs text-foreground">
                          Pending Frontline Action: {actionHeadline}
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-primary">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        {timelineNextAction.channelName ?? channelDisplayLabel} via{" "}
                        {timelineNextAction.cadence ?? "standard cadence"} — next contact due{" "}
                        {formatTimelineDate(timelineNextAction.nextContactDate)} · status{" "}
                        {timelineNextAction.actionStatus ?? "PENDING"}. Record the borrower response
                        below.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Activity Timeline Actions */}
              <div className="mt-5 border-t border-border/70 pt-4 flex items-center justify-end gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOutcomePresetId("");
                    setDrawerOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition cursor-pointer"
                >
                  <Phone className="size-3.5" /> Record Outcome
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Business-Friendly Next Best Action Decision Support Dashboard */}
          <div className="lg:col-span-7 h-full">
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                {/* 1. PROMINENT MAIN RECOMMENDATION HERO SECTION (Master Prompt Sections 2 & 8) */}
                <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary shrink-0" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                        Next Best Action
                      </span>
                    </div>
                    {nbaPresentation.hero.overriddenFromTitle && (
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                        Changed from: {nbaPresentation.hero.overriddenFromTitle}
                      </span>
                    )}
                    {nbaPresentation.hero.isHold && (
                      <span className="rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                        Account on Hold
                      </span>
                    )}
                  </div>

                  {nbaQuery.isError && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span>
                        Recommendation service is temporarily unavailable — showing standard account
                        guidance.
                      </span>
                    </div>
                  )}

                  {nbaQuery.isLoading && !activeNba ? (
                    <div className="space-y-2">
                      <div className="h-8 w-72 rounded-xl bg-muted animate-pulse" />
                      <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`size-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                            nbaPresentation.hero.isHold
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                              : "bg-primary/15 border-primary/25 text-primary"
                          }`}
                        >
                          <NbaHeroIcon className="size-5" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-snug">
                            {nbaPresentation.hero.prefix}: {nbaPresentation.hero.title}
                          </h3>
                          <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                            {nbaPresentation.hero.description}
                          </p>
                        </div>
                      </div>

                      {nbaPresentation.hero.quickReasons.length > 0 && (
                        <div className="rounded-lg bg-background/80 border border-border/70 px-3.5 py-2.5 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Key Reasons
                          </div>
                          <ul className="space-y-1">
                            {nbaPresentation.hero.quickReasons.map((reason, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-foreground"
                              >
                                <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CLEAR USER DECISION BUTTONS (Section 8) */}
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        hasPolicyBlock ||
                        isHoldSuppressed ||
                        collectorStatus === "APPROVED" ||
                        nbaDecisionMutation.isPending
                      }
                      onClick={() => void handleApproveNBA()}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-sm flex items-center gap-1.5 ${
                        hasPolicyBlock || isHoldSuppressed
                          ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                          : collectorStatus === "APPROVED"
                            ? "bg-emerald-600 text-white cursor-default"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                      }`}
                    >
                      {collectorStatus === "APPROVED" ? (
                        <>
                          <CheckCircle2 className="size-3.5" /> Approved
                        </>
                      ) : isHoldSuppressed || hasPolicyBlock ? (
                        <>
                          <Ban className="size-3.5" /> Contact Paused
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" /> Accept Recommendation
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isHoldSuppressed || hasPolicyBlock}
                      onClick={() => {
                        const firstActive =
                          activeNba && activeNba.recommendedAction !== "ACT_HOLD_SUPPRESS"
                            ? activeNba.recommendedAction
                            : activeNba?.eligibleArms.find((a) => a !== "ACT_HOLD_SUPPRESS");
                        setSelectedArmChoice(
                          collectorStatus === "EDITED" && overrideActionCode
                            ? overrideActionCode
                            : (firstActive ?? "ACT_PHONE_STANDARD"),
                        );
                        setChangeChannelModalOpen(true);
                      }}
                      className="rounded-xl border border-border/80 bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-xs font-semibold text-foreground transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="size-3.5 text-primary" /> Choose Another Action
                    </button>

                    <button
                      type="button"
                      disabled={collectorStatus === "REJECTED" || nbaDecisionMutation.isPending}
                      onClick={() => setRejectionModalOpen(true)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 px-3 py-2 text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <X className="size-3.5" /> Reject Recommendation
                    </button>
                  </div>
                </div>

                {/* WHY ARE WE RECOMMENDING THIS ACTION? (Section 4 — Collapsed by default matching Screenshot 8) */}
                <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setExplanationOpen((prev) => !prev)}
                    className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-left hover:bg-muted/30 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-4 text-primary shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        Why are we recommending this action?
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span>{explanationOpen ? "Hide explanation" : "Show explanation"}</span>
                      {explanationOpen ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </span>
                  </button>

                  {explanationOpen && (
                    <div className="p-4 pt-3 border-t border-border/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px] bg-muted/15">
                      <div className="rounded-xl bg-card border border-border/70 p-3.5 space-y-1 shadow-2xs">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                          A. Customer Engagement
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {nbaPresentation.explanationSections.customerEngagement}
                        </p>
                      </div>
                      <div className="rounded-xl bg-card border border-border/70 p-3.5 space-y-1 shadow-2xs">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                          B. Payment Behaviour
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {nbaPresentation.explanationSections.paymentBehaviour}
                        </p>
                      </div>
                      <div className="rounded-xl bg-card border border-border/70 p-3.5 space-y-1 shadow-2xs">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                          C. Recent Follow-up Activity
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {nbaPresentation.explanationSections.recentFollowUp}
                        </p>
                      </div>
                      <div className="rounded-xl bg-card border border-border/70 p-3.5 space-y-1 shadow-2xs">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                          D. Account History
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {nbaPresentation.explanationSections.accountHistory}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. OTHER AVAILABLE ACTIONS (Collapsible Dropdown Section) */}
                <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOtherActionsOpen((prev) => !prev)}
                    className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-left hover:bg-muted/30 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders className="size-4 text-primary shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
                            Other Available Actions
                          </h4>
                          <span className="hidden sm:inline-block text-[11px] text-muted-foreground">
                            — Alternative options permitted for this account
                          </span>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground sm:hidden mt-0.5">
                          Alternative options permitted for this account
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span>{otherActionsOpen ? "Hide options" : "Show options"}</span>
                      {otherActionsOpen ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </span>
                  </button>

                  {otherActionsOpen && (
                    <div className="p-4 pt-3 border-t border-border/70 bg-muted/15 space-y-3">
                      {nbaPresentation.otherAvailableActions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {nbaPresentation.otherAvailableActions.map((alt) => (
                            <div
                              key={alt.actionCode}
                              className="rounded-xl border border-border/80 bg-card p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:border-primary/40 hover:shadow-sm transition"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold text-foreground">
                                    {alt.title}
                                  </span>
                                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                    Available
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {alt.description}
                                </p>
                                <p className="text-[11px] text-foreground/90 leading-relaxed">
                                  <strong className="font-semibold text-foreground">
                                    Why it fits:
                                  </strong>{" "}
                                  {alt.suitabilityNote}
                                </p>
                              </div>

                              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/50">
                                <span className="text-[10.5px] font-semibold text-muted-foreground">
                                  Channel: {alt.channelLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOverrideActionCode(alt.actionCode);
                                    setOverrideChannel(alt.channelCode);
                                    setCollectorStatus("EDITED");
                                    toast.success(`Action switched to ${alt.title}`);
                                  }}
                                  className="rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary hover:text-primary-foreground px-3 py-1 text-[11px] font-bold text-primary transition cursor-pointer shadow-2xs"
                                >
                                  Select Action
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border/70 bg-card p-4 text-center text-xs text-muted-foreground">
                          No other outreach actions are currently available for this account.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CUSTOMER RECOVERY SNAPSHOT (Section 5 — FOUR CLEAN BUSINESS KPI CARDS) */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="size-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Customer Recovery Snapshot
                      </h4>
                    </div>
                    <span className="text-[10.5px] font-semibold text-muted-foreground">
                      Account Summary
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Card 1 — Outstanding Amount */}
                    <div className="rounded-xl border border-border/80 bg-muted/25 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Outstanding Amount
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                              c.cov >= 60
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : c.cov >= 20
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {nbaPresentation.snapshot.outstanding.repaymentLabel}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                          <span className="text-xl font-black text-foreground tracking-tight">
                            <AnimatedKpi
                              value={nbaPresentation.snapshot.outstanding.totalBalance}
                              prefix="$"
                            />
                          </span>
                          <span className="text-[10.5px] text-muted-foreground">total balance</span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
                          <div>
                            Recovered:{" "}
                            <b className="text-foreground">
                              $
                              {nbaPresentation.snapshot.outstanding.recoveredAmount.toLocaleString()}
                            </b>{" "}
                            · Remaining overdue:{" "}
                            <b className="text-foreground">
                              $
                              {nbaPresentation.snapshot.outstanding.remainingOverdue.toLocaleString()}
                            </b>
                          </div>
                          <div className="text-[10.5px]">
                            {nbaPresentation.snapshot.outstanding.progressLabel} (overdue portion: $
                            {nbaPresentation.snapshot.outstanding.pastDue.toLocaleString()})
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            c.cov >= 60
                              ? "bg-emerald-500"
                              : c.cov >= 20
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                          style={{ width: animateLiveBars ? `${Math.min(100, c.cov)}%` : "0%" }}
                        />
                      </div>
                    </div>

                    {/* Card 2 — Payment Status */}
                    <div className="rounded-xl border border-border/80 bg-muted/25 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Payment Status
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                              nbaPresentation.snapshot.paymentStatus.severity === "rose"
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                : nbaPresentation.snapshot.paymentStatus.severity === "amber"
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                  : nbaPresentation.snapshot.paymentStatus.severity === "emerald"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                    : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                            }`}
                          >
                            {nbaPresentation.snapshot.paymentStatus.categoryBadge}
                          </span>
                        </div>
                        <div className="mt-1.5 text-xl font-black text-foreground tracking-tight">
                          {nbaPresentation.snapshot.paymentStatus.primaryText}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          {nbaPresentation.snapshot.paymentStatus.supportingText}
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-primary" />
                        <span>{nbaPresentation.snapshot.paymentStatus.statusFooter}</span>
                      </div>
                    </div>

                    {/* Card 3 — Recent Payments */}
                    <div className="rounded-xl border border-border/80 bg-muted/25 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Recent Payments
                          </span>
                          <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[9.5px] font-bold text-muted-foreground">
                            Last 30 days
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-baseline gap-2">
                          <span className="text-xl font-black text-foreground tracking-tight">
                            <AnimatedKpi value={nbaPresentation.snapshot.recentPayments.count30d} />
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            successful payment
                            {nbaPresentation.snapshot.recentPayments.count30d === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
                          <div>{nbaPresentation.snapshot.recentPayments.supportingNote}</div>
                          <div className="text-[10.5px] font-medium text-foreground/80">
                            {nbaPresentation.snapshot.recentPayments.lastPaymentLabel}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                          style={{
                            width: animateLiveBars ? `${Math.min(100, c.pays * 25)}%` : "0%",
                          }}
                        />
                      </div>
                    </div>

                    {/* Card 4 — Account Progress */}
                    <div className="rounded-xl border border-border/80 bg-muted/25 p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Account Progress
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-bold flex items-center gap-1 ${
                              nbaPresentation.snapshot.accountProgress.tone === "neutral"
                                ? "bg-muted text-muted-foreground border border-border"
                                : nbaPresentation.snapshot.accountProgress.tone === "emerald"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : nbaPresentation.snapshot.accountProgress.tone === "rose"
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                    : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                            }`}
                          >
                            {nbaPresentation.snapshot.accountProgress.tone === "emerald" ? (
                              <TrendingDown className="size-2.5" />
                            ) : nbaPresentation.snapshot.accountProgress.tone === "rose" ? (
                              <TrendingUp className="size-2.5" />
                            ) : (
                              <Activity className="size-2.5" />
                            )}
                            {nbaPresentation.snapshot.accountProgress.badge}
                          </span>
                        </div>
                        <div
                          className={`mt-1.5 text-xl font-black tracking-tight ${
                            nbaPresentation.snapshot.accountProgress.tone === "neutral"
                              ? "text-muted-foreground"
                              : nbaPresentation.snapshot.accountProgress.tone === "emerald"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : nbaPresentation.snapshot.accountProgress.tone === "rose"
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-foreground"
                          }`}
                        >
                          {nbaPresentation.snapshot.accountProgress.primaryText}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          {nbaPresentation.snapshot.accountProgress.comparisonText}
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                        <Clock className="size-3 text-muted-foreground/80" />
                        <span>Compared with 30 days ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OUTCOME & RECOVERY FEEDBACK POPUP MODAL */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <button
            aria-label="Close outcome popup modal backdrop"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-xs transition"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative w-full max-w-4xl lg:max-w-5xl rounded-2xl border border-border/80 bg-white dark:bg-card p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Follow-up Outcome Capture
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Record What Happened After Contact
                </h3>
              </div>
              <button
                type="button"
                className="size-8 rounded-lg hover:bg-muted grid place-items-center cursor-pointer text-muted-foreground hover:text-foreground transition"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Account Quick Summary Banner */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 sm:p-3 text-xs flex justify-between items-center gap-2 flex-wrap">
              <div>
                <span className="font-bold text-foreground">{c.name}</span> ({c.acct})
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Overdue: ${pastDueAmt.toLocaleString()} · Remaining balance: $
                  {remainingBal.toLocaleString()} ·{" "}
                  {c.dpd === 0 ? "Up to date" : `${c.dpd} days overdue`}
                </div>
              </div>
              <span className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10.5px] font-bold text-primary shrink-0">
                Planned Action: {nbaPresentation.hero.title}
              </span>
            </div>

            {/* Horizontal Two-Column Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
              {/* LEFT COLUMN: Contact Channel + Quick Outcome Selector */}
              <div className="space-y-3">
                {/* Step 1: Communication Channel Cards */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    1. Which channel was used to contact the customer?
                  </label>

                  <div className="space-y-2">
                    {[
                      {
                        code: "PHONE" as const,
                        label: "Phone Call",
                        icon: Phone,
                        csr: phoneStats?.csr ?? null,
                        rr: phoneStats?.responseRate ?? null,
                        legacyPermitted: phoneStats
                          ? phoneStats.isEligible
                          : hasConsent && !isDnc && !isClosedAccount,
                      },
                      {
                        code: "MAIL" as const,
                        label: "Email",
                        icon: Mail,
                        csr: emailStats?.csr ?? null,
                        rr: emailStats?.responseRate ?? null,
                        legacyPermitted: emailStats
                          ? emailStats.isEligible
                          : hasConsent && !isDnc && !isClosedAccount,
                      },
                      {
                        code: "FIELD" as const,
                        label: "Field Visit",
                        icon: MapPin,
                        csr: fieldStats?.csr ?? null,
                        rr: fieldStats?.responseRate ?? null,
                        legacyPermitted: fieldStats
                          ? fieldStats.isEligible
                          : hasConsent &&
                            !isDnc &&
                            !isClosedAccount &&
                            c.dpd >= 1 &&
                            pastDueAmt >= 500,
                      },
                    ].map((ch) => {
                      const isSelected = feedbackChannel === ch.code;
                      const mappedArm = resolveArmForFeedbackChannel(ch.code, activeNba);
                      const isPrescribed = activeNba
                        ? !isHoldSuppressed && mappedArm === effectiveActionCode
                        : ch.code === "PHONE"
                          ? primaryRecommendation.code === "PHONE"
                          : ch.code === "MAIL"
                            ? primaryRecommendation.code === "EMAIL"
                            : primaryRecommendation.code === "FIELD";
                      const isChannelEligible = activeNba
                        ? !isHoldSuppressed && activeNba.eligibleArms.includes(mappedArm)
                        : ch.legacyPermitted;
                      return (
                        <div
                          key={ch.code}
                          onClick={() => {
                            setFeedbackChannel(ch.code);
                            setSelectedOutcomePresetId("");
                          }}
                          className={`rounded-xl border p-2.5 sm:p-3 cursor-pointer transition flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-border/70 bg-muted/20 hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`size-8 rounded-lg grid place-items-center ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <ch.icon className="size-4" />
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
                                {ch.label}
                                {isPrescribed && (
                                  <span className="rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[9px] font-bold">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {getBusinessActionMeta(mappedArm).cardTitle}
                                {ch.csr != null ? ` · ${Math.round(ch.csr)}% past answer rate` : ""}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isChannelEligible
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              {isChannelEligible ? "Available" : "Restricted"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Quick Action-Specific Outcome Presets (Section 8) */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-muted-foreground">
                    2. What was the outcome?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {getActionSpecificOutcomes(feedbackChannel).map((preset) => {
                      const active = selectedOutcomePresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyOutcomePreset(preset)}
                          className={`rounded-lg border p-2 text-left transition cursor-pointer ${
                            active
                              ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                              : "border-border/70 bg-muted/20 hover:bg-muted/40"
                          }`}
                        >
                          <div className="font-bold text-[11.5px] text-foreground">
                            {preset.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                            {preset.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Detailed Selectors */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setResponseSectionOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between cursor-pointer text-left"
                  >
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Activity className="size-3" />
                      <span>More interaction details (optional)</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold hover:text-foreground">
                      <span>{responseSectionOpen ? "Hide" : "Customize"}</span>
                      {responseSectionOpen ? (
                        <ChevronUp className="size-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                      )}
                    </span>
                  </button>

                  {responseSectionOpen && (
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      {/* FIELD VISIT FIELDS */}
                      {feedbackChannel === "FIELD" && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Customer Availability at Visit
                            </label>
                            <select
                              value={fieldPresence}
                              onChange={(e) => setFieldPresence(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                            >
                              <option value="Customer Met in Person">Customer Met in Person</option>
                              <option value="Premises Locked / Not Available">
                                Premises Locked / Not Available
                              </option>
                              <option value="Met Family / Third-Party">Met Family Member</option>
                              <option value="Address Shifted / Untraceable">
                                Address Changed / Unable to Locate
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Customer Response
                            </label>
                            <select
                              value={fieldReaction}
                              onChange={(e) => setFieldReaction(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                            >
                              <option value="Cooperative & Willing to Settle">
                                Cooperative &amp; Willing to Pay
                              </option>
                              <option value="Claimed Financial Hardship / Job Loss">
                                Reported Financial Hardship
                              </option>
                              <option value="Evasive / Asking for Time">Asked for More Time</option>
                              <option value="Disputed Balance / Hidden Charges">
                                Disputed Balance / Charges
                              </option>
                              <option value="Hostile / Refused Discussion">
                                Refused Discussion
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Next Step Agreed
                            </label>
                            <select
                              value={fieldCommitment}
                              onChange={(e) => setFieldCommitment(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                            >
                              <option value="Immediate Partial Payment Today">
                                Partial Payment Made Today
                              </option>
                              <option value="Promise to Pay (PTP) Agreed">
                                Promised Full Payment on Later Date
                              </option>
                              <option value="Loan Restructuring Requested">
                                Requested Payment Plan Adjustment
                              </option>
                              <option value="Refused to Commit / Awaiting Notice">
                                Declined to Commit
                              </option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* PHONE CALL FIELDS */}
                      {feedbackChannel === "PHONE" && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Call Result
                            </label>
                            <select
                              value={phoneDisposition}
                              onChange={(e) => setPhoneDisposition(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                            >
                              <option value="Connected — Spoke with Customer">
                                Connected — Spoke with Customer
                              </option>
                              <option value="Answered by Family / Spouse">
                                Answered by Family Member
                              </option>
                              <option value="Ringing / No Answer">No Answer</option>
                              <option value="Left Voicemail / IVR Dispatched">
                                Left Voicemail
                              </option>
                              <option value="Busy / Number Disconnected">
                                Line Busy / Disconnected
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Customer Response
                            </label>
                            <select
                              value={phoneReaction}
                              onChange={(e) => setPhoneReaction(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                            >
                              <option value="Calm & Acknowledged Liability">
                                Acknowledged Overdue Balance
                              </option>
                              <option value="Distressed / Cash Flow Problem">
                                Mentioned Cash Flow Difficulty
                              </option>
                              <option value="Promised Payment via Portal">
                                Promised to Pay Online
                              </option>
                              <option value="Disputed Interest / Penalties">
                                Questioned Charges or Interest
                              </option>
                              <option value="Aggressive / Disconnected Call">
                                Ended Call / Refused
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Agreed Next Step
                            </label>
                            <select
                              value={phoneNextStep}
                              onChange={(e) => setPhoneNextStep(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                            >
                              <option value="PTP Registered on Call">Payment Date Promised</option>
                              <option value="Payment Link Dispatched via SMS">
                                Sent Payment Link by SMS
                              </option>
                              <option value="Follow-up Call Scheduled (Within 48h)">
                                Follow-up Call Scheduled
                              </option>
                              <option value="Escalate to In-Person Field Visit">
                                Refer for Field Visit
                              </option>
                              <option value="Issue Statutory Legal Notice">
                                Send Formal Overdue Notice
                              </option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* EMAIL / DIGITAL FIELDS */}
                      {feedbackChannel === "MAIL" && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Message Status
                            </label>
                            <select
                              value={mailStatus}
                              onChange={(e) => setMailStatus(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                            >
                              <option value="Delivered & Link Clicked / Viewed">
                                Delivered &amp; Payment Link Clicked
                              </option>
                              <option value="Delivered — Awaiting Customer Open">
                                Delivered — Awaiting Response
                              </option>
                              <option value="Customer Replied via Email / Portal">
                                Customer Replied
                              </option>
                              <option value="Returned Unclaimed / Mail Bounce">
                                Email Bounced / Undelivered
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Customer Action
                            </label>
                            <select
                              value={mailReaction}
                              onChange={(e) => setMailReaction(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                            >
                              <option value="Online Self-Service Pay Initiated">
                                Started Online Payment
                              </option>
                              <option value="Statement of Account Requested">
                                Requested Account Statement
                              </option>
                              <option value="Grievance / Hardship Letter Submitted">
                                Submitted Hardship Request
                              </option>
                              <option value="No Action Taken / Passive Disregard">
                                No Response Yet
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Next Follow-up Step
                            </label>
                            <select
                              value={mailNextStep}
                              onChange={(e) => setMailNextStep(e.target.value)}
                              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                            >
                              <option value="Send Urgent Automated Reminder SMS">
                                Send Follow-up SMS Reminder
                              </option>
                              <option value="Escalate to Outbound Collection Call">
                                Follow Up by Phone Call
                              </option>
                              <option value="Issue Final Statutory Demand Notice">
                                Send Formal Notice
                              </option>
                              <option value="Refer to Skip-Tracing Agency">
                                Verify Customer Contact Details
                              </option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Payment Details, Payment Promise & Notes */}
              <div className="space-y-3">
                {/* Step 3: Payment Details */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>3. Payment Details</span>
                    <span className="text-muted-foreground">Updates remaining overdue amount</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Overdue Amount */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Overdue Amount
                      </span>
                      <div className="text-base font-black text-foreground mt-0.5">
                        ${pastDueAmt.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Total Balance: ${remainingBal.toLocaleString()}
                      </span>
                    </div>

                    {/* Amount Paid Today */}
                    <div className="rounded-xl border-2 border-primary/40 bg-card p-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                        Amount Paid Today ($)
                      </span>
                      <div className="mt-1 space-y-1.5">
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-primary" />
                          <input
                            type="number"
                            min={0}
                            max={outcomeDueBase}
                            value={amountPaidInput === 0 ? "" : amountPaidInput}
                            placeholder="0"
                            onChange={(e) =>
                              setAmountPaidInput(Math.max(0, Number(e.target.value) || 0))
                            }
                            className="w-full rounded-lg border border-border bg-muted/40 pl-7 pr-2.5 py-1 text-sm font-black text-foreground focus:outline-hidden focus:border-primary"
                          />
                        </div>
                        {/* Quick Payment Buttons */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {[0, 500, 1000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setAmountPaidInput(preset)}
                              className="rounded-sm bg-muted hover:bg-muted/80 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground cursor-pointer"
                            >
                              ${preset}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setAmountPaidInput(outcomeDueBase)}
                            className="rounded-sm bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold cursor-pointer"
                          >
                            Pay Full (${outcomeDueBase.toLocaleString()})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remaining Overdue After Payment */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Remaining Overdue
                      </span>
                      <div
                        className={`text-base font-black mt-0.5 ${
                          outcomeDueBase - amountPaidInput <= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        ${Math.max(0, outcomeDueBase - amountPaidInput).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {amountPaidInput > 0 && outcomeDueBase > 0
                          ? `${Math.min(100, Math.round((amountPaidInput / outcomeDueBase) * 100))}% Paid`
                          : "Awaiting Payment"}
                      </span>
                    </div>

                    {/* Account Status After Payment */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Status After Payment
                      </span>
                      <div
                        className={`text-base font-black mt-0.5 ${
                          c.dpd === 0 || (outcomeDueBase > 0 && amountPaidInput >= outcomeDueBase)
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {c.dpd === 0
                          ? "Up to date"
                          : outcomeDueBase > 0 && amountPaidInput >= outcomeDueBase
                            ? "Paid in Full"
                            : `${c.dpd} Days Overdue`}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {c.dpd === 0 || (outcomeDueBase > 0 && amountPaidInput >= outcomeDueBase)
                          ? "Overdue balance cleared"
                          : amountPaidInput > 0
                            ? "Partial payment applied"
                            : nbaPresentation.snapshot.paymentStatus.categoryBadge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 4: Payment Promise */}
                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPtpAgreed((prev) => !prev)}
                      className="flex items-center gap-2 text-left cursor-pointer group"
                    >
                      <Calendar className="size-3.5 text-primary" />
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition">
                        Payment Promise (if agreed)
                      </span>
                      {ptpAgreed ? (
                        <ChevronUp className="size-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <span className="text-muted-foreground text-[11px]">
                        Customer promised to pay?
                      </span>
                      <input
                        type="checkbox"
                        checked={ptpAgreed}
                        onChange={(e) => setPtpAgreed(e.target.checked)}
                        className="size-4 rounded accent-primary cursor-pointer"
                      />
                    </label>
                  </div>

                  {ptpAgreed && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/60">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Promised Amount ($)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                          <input
                            type="number"
                            value={ptpAmountInput === 0 ? "" : ptpAmountInput}
                            placeholder="Amount"
                            onChange={(e) => setPtpAmountInput(Number(e.target.value) || 0)}
                            className="w-full rounded-lg border border-border bg-muted/30 pl-7 pr-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Promised Date
                        </label>
                        <input
                          type="date"
                          value={ptpDateInput}
                          onChange={(e) => setPtpDateInput(e.target.value)}
                          className="w-full rounded-lg border border-border bg-muted/30 p-1.5 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Payment Method
                        </label>
                        <select
                          value={ptpPaymentMode}
                          onChange={(e) => setPtpPaymentMode(e.target.value)}
                          className="w-full rounded-lg border border-border bg-muted/30 p-1.5 text-xs font-bold text-foreground focus:outline-hidden focus:border-primary cursor-pointer"
                        >
                          <option value="UPI / Instant Transfer">UPI / Instant Transfer</option>
                          <option value="NetBanking / Bank Transfer">Bank Transfer</option>
                          <option value="Branch Cashier Visit">Branch Counter Payment</option>
                          <option value="Field Agent Cash Pickup">Field Payment Pickup</option>
                          <option value="Post-Dated Cheque (PDC)">Cheque</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 5: Notes */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setNotesOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between cursor-pointer text-left"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="size-3 text-primary" />
                      <span>Follow-up Notes</span>
                      <span className="text-[9.5px] font-normal text-muted-foreground/80">
                        (Optional)
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold hover:text-foreground">
                      <span>{notesOpen ? "Hide" : "Show"}</span>
                      {notesOpen ? (
                        <ChevronUp className="size-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                      )}
                    </span>
                  </button>

                  {notesOpen && (
                    <div className="space-y-2 pt-0.5">
                      <textarea
                        rows={2}
                        value={feedbackNotes}
                        onChange={(e) => setFeedbackNotes(e.target.value)}
                        placeholder="Add short notes about what the customer shared or next steps agreed..."
                        className="w-full rounded-xl border border-border bg-card p-2 text-xs text-foreground focus:outline-hidden focus:border-primary"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {[
                          "Salary arrives next week",
                          "Promised online payment today",
                          "Spoke with family member",
                          "Reported temporary financial difficulty",
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() =>
                              setFeedbackNotes((prev) => (prev ? `${prev} · ${chip}` : chip))
                            }
                            className="rounded-md border border-border bg-card hover:bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition cursor-pointer"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={nbaFeedbackMutation.isPending}
                onClick={() => void handleStoreFeedback()}
                className="rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-primary-foreground transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Save className="size-3.5" />
                <span>{nbaFeedbackMutation.isPending ? "Saving..." : "Save Action Outcome"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION ACTION MODAL */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            aria-label="Close rejection modal backdrop"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-xs transition"
            onClick={() => setRejectionModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 text-xs z-10">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Team Decision Log
                </span>
                <h3 className="text-base font-bold text-foreground">Decline Recommended Action</h3>
              </div>
              <button
                className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground"
                onClick={() => setRejectionModalOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Decline the recommended{" "}
              <strong className="text-foreground">{nbaPresentation.hero.title}</strong> via{" "}
              <strong className="text-foreground">{channelDisplayLabel}</strong> for {c.name}.
              Choose a reason so the team knows why this action was declined:
            </p>

            <div className="space-y-2">
              {[
                {
                  id: "Customer Requested Hardship Pause",
                  label: "Customer Requested Hardship Pause",
                  desc: "Customer reported a temporary hardship or emergency; contact pause requested.",
                },
                {
                  id: "Incorrect / Disputed Contact Details",
                  label: "Incorrect or Disputed Contact Details",
                  desc: "Phone number or email on file bounced or needs verification.",
                },
                {
                  id: "Disputed Balance / Escalated to Disputes",
                  label: "Disputed Balance / Sent to Disputes",
                  desc: "Customer raised a question or dispute about the amount owed.",
                },
                {
                  id: "Collector Judgment Override",
                  label: "Team Operational Judgment",
                  desc: "Account context requires a different approach based on team review.",
                },
                {
                  id: "Promise to Pay Already Handled Offline",
                  label: "Payment Arrangement Handled Offline",
                  desc: "Customer already confirmed payment at a branch or through banking channels.",
                },
              ].map((reason) => (
                <label
                  key={reason.id}
                  onClick={() => setRejectionReason(reason.id)}
                  className={`block rounded-xl border p-3 cursor-pointer transition ${
                    rejectionReason === reason.id
                      ? "border-rose-500/50 bg-rose-500/10 text-rose-950 dark:text-rose-100"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="rejectionReason"
                      checked={rejectionReason === reason.id}
                      onChange={() => setRejectionReason(reason.id)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-xs">{reason.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 ml-5">{reason.desc}</p>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Enter details for your team log..."
                className="w-full rounded-lg border border-border/80 bg-muted/20 p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setRejectionModalOpen(false)}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={nbaDecisionMutation.isPending}
                onClick={() => void handleRejectNBA()}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              >
                {nbaDecisionMutation.isPending ? "Saving..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE CHANNEL / ACTION SELECTION MODAL */}
      {changeChannelModalOpen &&
        (() => {
          const canApplyOverride =
            !isHoldSuppressed &&
            !hasPolicyBlock &&
            (activeNba ? activeNba.eligibleArms.includes(selectedArmChoice) : true) &&
            !nbaDecisionMutation.isPending;

          return (
            <div className="fixed inset-0 z-50 grid place-items-center p-4">
              <button
                aria-label="Close change channel modal backdrop"
                className="absolute inset-0 bg-foreground/30 backdrop-blur-xs transition"
                onClick={() => setChangeChannelModalOpen(false)}
              />

              <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 text-xs z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Alternative Contact Options
                    </span>
                    <h3 className="text-base font-bold text-foreground">Choose Another Action</h3>
                  </div>
                  <button
                    type="button"
                    className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => setChangeChannelModalOpen(false)}
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-xs flex justify-between items-center gap-2">
                  <div>
                    <span className="font-bold text-foreground">{c.name}</span> ({c.acct})
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Overdue: ${pastDueAmt.toLocaleString()} · Remaining: $
                      {remainingBal.toLocaleString()} ·{" "}
                      {c.dpd === 0 ? "Up to date" : `${c.dpd} days overdue`} (
                      {nbaPresentation.snapshot.paymentStatus.categoryBadge.toLowerCase()})
                    </div>
                  </div>
                  <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                    Current: {nbaPresentation.hero.title}
                  </span>
                </div>

                {/* ACTION OPTIONS LIST (Available Actions Only, deduplicated by clean action title) */}
                {(() => {
                  const eligibleActionCodes = (() => {
                    if (!activeNba || isHoldSuppressed) return [];
                    const rankedPool: string[] = [
                      ...(activeNba.eligibleArms.includes(activeNba.recommendedAction)
                        ? [activeNba.recommendedAction]
                        : []),
                      ...activeNba.alternativeEligibleActions.map((a) => a.actionCode),
                      ...NBA_ACTION_ORDER,
                    ];
                    const byTitle = new Map<string, string>();
                    for (const armCode of rankedPool) {
                      if (armCode === "ACT_HOLD_SUPPRESS") continue;
                      if (!activeNba.eligibleArms.includes(armCode)) continue;
                      const title = getBusinessActionMeta(armCode).cardTitle;
                      if (!byTitle.has(title)) {
                        byTitle.set(title, armCode);
                      }
                    }
                    return NBA_ACTION_ORDER.filter(
                      (armCode) =>
                        byTitle.get(getBusinessActionMeta(armCode).cardTitle) === armCode,
                    );
                  })();
                  const permittedOfflineCandidates = rawCandidates.filter((cand) => cand.permitted);

                  return (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-muted-foreground">
                        {activeNba
                          ? `${eligibleActionCodes.length} available option${eligibleActionCodes.length === 1 ? "" : "s"} for this account`
                          : "Available Communication Channels"}
                      </label>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {activeNba ? (
                          eligibleActionCodes.length > 0 ? (
                            eligibleActionCodes.map((armCode) => {
                              const armMeta = NBA_ACTION_META[armCode];
                              const bizMeta = getBusinessActionMeta(armCode);
                              const isModelTop =
                                armCode === activeNba.recommendedAction ||
                                getBusinessActionMeta(activeNba.recommendedAction).cardTitle ===
                                  bizMeta.cardTitle;
                              const isSelected =
                                selectedArmChoice === armCode ||
                                getBusinessActionMeta(selectedArmChoice).cardTitle ===
                                  bizMeta.cardTitle;
                              const ArmIcon =
                                armMeta?.channelCode === "PHONE"
                                  ? Phone
                                  : armMeta?.channelCode === "FIELD_VISIT"
                                    ? MapPin
                                    : Mail;

                              return (
                                <button
                                  key={armCode}
                                  type="button"
                                  onClick={() => setSelectedArmChoice(armCode)}
                                  className={`w-full text-left rounded-xl border p-3 transition flex items-center justify-between gap-3 cursor-pointer ${
                                    isSelected
                                      ? "border-primary bg-primary/10 shadow-xs"
                                      : "border-border/70 bg-muted/20 hover:bg-muted/40"
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div
                                      className={`size-9 rounded-lg grid place-items-center shrink-0 ${
                                        isSelected
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      <ArmIcon className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
                                        <span>{bizMeta.cardTitle}</span>
                                        {isModelTop && (
                                          <span className="rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[9px] font-bold">
                                            Recommended
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                        {bizMeta.shortDescription}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                      Available
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3 text-[11px] text-muted-foreground">
                              No outreach actions are currently available for this account.
                            </div>
                          )
                        ) : permittedOfflineCandidates.length > 0 ? (
                          permittedOfflineCandidates.map((cand) => {
                            const armCode =
                              cand.code === "PHONE"
                                ? "ACT_PHONE_STANDARD"
                                : cand.code === "FIELD"
                                  ? "ACT_FIELD_VISIT_STANDARD"
                                  : "ACT_DIGITAL_REMINDER_EMAIL";
                            const bizMeta = getBusinessActionMeta(armCode);
                            const isSelected = selectedArmChoice === armCode;
                            return (
                              <button
                                key={cand.code}
                                type="button"
                                onClick={() => setSelectedArmChoice(armCode)}
                                className={`w-full text-left rounded-xl border p-3.5 transition flex items-center justify-between gap-3 cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary/10 shadow-xs"
                                    : "border-border/70 bg-muted/20 hover:bg-muted/40"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`size-9 rounded-lg grid place-items-center shrink-0 ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    <cand.icon className="size-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
                                      <span>{bizMeta.cardTitle}</span>
                                      {cand.name === primaryRecommendation.name && (
                                        <span className="rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[9px] font-bold">
                                          Recommended
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                      {bizMeta.shortDescription}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    Available
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3 text-[11px] text-muted-foreground">
                            No outreach actions are currently available for this account.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
                  <button
                    type="button"
                    onClick={() => setChangeChannelModalOpen(false)}
                    className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canApplyOverride}
                    onClick={() =>
                      void handleChangeChannelSubmit(selectedArmChoice, selectedTimingWindow)
                    }
                    className="rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-primary-foreground transition shadow-sm cursor-pointer"
                  >
                    {nbaDecisionMutation.isPending
                      ? "Saving Selection..."
                      : "Confirm Selected Action"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </AppShell>
  );
}
