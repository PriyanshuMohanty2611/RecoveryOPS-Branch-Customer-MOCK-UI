import {
  CUSTOMERS,
  BRANCH_METADATA,
  ALL_BRANCH_CODES,
  type CustomerData,
} from "@/data/customer-nba-data";
import type {
  CustomerBranch,
  CustomerRecord,
  CustomerOutreachStats,
  CustomerNbaPortfolio,
  NbaRecommendation,
  ChannelStatItem,
  ApiMeta,
} from "./api";

function toCustomerRecord(c: CustomerData, index: number): CustomerRecord {
  const riskBucket =
    c.dpd >= 90
      ? "90+"
      : c.dpd >= 61
        ? "61-89"
        : c.dpd >= 31
          ? "31-60"
          : c.dpd >= 1
            ? "1-30"
            : "Current";

  return {
    ...c,
    accountId: index + 1,
    customerId: index + 1,
    riskBucket,
    accountStatus: "ACTIVE",
    consent: true,
    doNotContact: c.id === "C009",
    actionStatus: "PENDING",
    paymentContactAttempts: c.paymentContactAttempts ?? null,
  };
}

export function getMockCustomerBranches(asOfDate?: string): {
  data: CustomerBranch[];
  meta: ApiMeta;
} {
  const allRecords = CUSTOMERS.map(toCustomerRecord);

  const branches: CustomerBranch[] = ALL_BRANCH_CODES.map((code) => {
    const meta = BRANCH_METADATA[code] || {
      name: `Branch ${code}`,
      region: "General Division",
      manager: "Assigned Officer",
    };
    const bCustomers = allRecords.filter((c) => c.br === code);
    const dpdAmount = bCustomers.reduce((sum, c) => sum + c.exp, 0);
    const recoveredAmount = bCustomers.reduce(
      (sum, c) => sum + Math.round((c.exp * c.cov) / 100),
      0,
    );

    return {
      code,
      displayCode: `BR-${code}`,
      name: meta.name,
      region: meta.region,
      manager: meta.manager,
      customers: bCustomers.length,
      dpdAmount,
      recoveredAmount,
      accounts: bCustomers,
    };
  });

  return {
    data: branches,
    meta: {
      asOfDate: asOfDate || "2026-07-01",
      source: "synthetic_demo",
      isDemo: true,
    },
  };
}

export function getMockCustomerWorklist(
  branchId?: string,
  query?: string,
  asOfDate?: string,
): { data: CustomerRecord[]; meta: ApiMeta & { total: number } } {
  let list = CUSTOMERS.map(toCustomerRecord);
  if (branchId) {
    list = list.filter((c) => c.br === branchId);
  }
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.acct.toLowerCase().includes(q),
    );
  }
  return {
    data: list,
    meta: {
      asOfDate: asOfDate || "2026-07-01",
      total: list.length,
      source: "synthetic_demo",
      isDemo: true,
    },
  };
}

export function getMockCustomerDetail(customerCode: string): {
  data: { customer: CustomerRecord; accounts: CustomerRecord[] };
  meta: ApiMeta;
} {
  const allRecords = CUSTOMERS.map(toCustomerRecord);
  const found = allRecords.find((c) => c.id === customerCode) || allRecords[0]!;
  return {
    data: {
      customer: found,
      accounts: [found],
    },
    meta: {
      asOfDate: "2026-07-01",
      source: "synthetic_demo",
      isDemo: true,
    },
  };
}

export function getMockCustomerOutreachStats(customerCode: string): {
  data: CustomerOutreachStats;
  meta: ApiMeta;
} {
  const allRecords = CUSTOMERS.map(toCustomerRecord);
  const c = allRecords.find((item) => item.id === customerCode) || allRecords[0]!;

  const topChannelTuple = c.aff[0] || ["Phone calls", 80];
  const topName = topChannelTuple[0];
  const topScore = Number(topChannelTuple[1]);

  let topCode = "PHONE";
  let topLabel = "Phone Call";
  if (topName === "Mails" || topName.toLowerCase().includes("mail")) {
    topCode = "EMAIL";
    topLabel = "Email";
  } else if (topName === "Field Visit" || topName.toLowerCase().includes("field")) {
    topCode = "FIELD_VISIT";
    topLabel = "Field Visit";
  }

  const channels: ChannelStatItem[] = [
    {
      channelCode: "PHONE",
      channelName: "Phone Call",
      totalRecordedAttempts: 4,
      invalidAttempts: 0,
      undeliveredAttempts: 0,
      totalValidAttempts: 4,
      successfulContacts: Math.max(1, Math.round(4 * (c.reach / 100))),
      totalValidDeliveredAttempts: 4,
      customerResponses: Math.max(1, Math.round(4 * (c.reach / 100))),
      csr: c.reach,
      responseRate: c.reach,
      affinityScore: topCode === "PHONE" ? topScore : Math.max(25, topScore - 18),
      isEligible: true,
      restrictionReason: null,
      dataStatus: "SUFFICIENT",
    },
    {
      channelCode: "EMAIL",
      channelName: "Email",
      totalRecordedAttempts: 6,
      invalidAttempts: 0,
      undeliveredAttempts: 0,
      totalValidAttempts: 6,
      successfulContacts: Math.max(2, Math.round(6 * (c.open / 100))),
      totalValidDeliveredAttempts: 6,
      customerResponses: Math.max(1, Math.round(6 * (c.reach / 100))),
      csr: c.open,
      responseRate: c.reach,
      affinityScore: topCode === "EMAIL" ? topScore : Math.max(20, topScore - 22),
      isEligible: true,
      restrictionReason: null,
      dataStatus: "SUFFICIENT",
    },
    {
      channelCode: "FIELD_VISIT",
      channelName: "Field Visit",
      totalRecordedAttempts: c.dpd >= 30 ? 2 : 0,
      invalidAttempts: 0,
      undeliveredAttempts: 0,
      totalValidAttempts: c.dpd >= 30 ? 2 : 0,
      successfulContacts: c.dpd >= 30 ? 1 : 0,
      totalValidDeliveredAttempts: c.dpd >= 30 ? 2 : 0,
      customerResponses: c.dpd >= 30 ? 1 : 0,
      csr: c.dpd >= 30 ? 65 : null,
      responseRate: c.dpd >= 30 ? 50 : null,
      affinityScore:
        topCode === "FIELD_VISIT" ? topScore : c.dpd >= 30 ? Math.max(15, topScore - 30) : null,
      isEligible: true,
      restrictionReason: null,
      dataStatus: c.dpd >= 30 ? "SUFFICIENT" : "NO_ATTEMPTS",
    },
  ];

  return {
    data: {
      customerCode: c.id,
      customerName: c.name,
      recommendationStatus: "RECOMMENDED",
      recommendedChannel: topLabel,
      recommendedChannelCode: topCode,
      recommendationReason: `${topLabel} has the highest eligible Channel Affinity Score (${topScore.toFixed(1)}) based on verified contact history and response rate.`,
      recommendedCsr: topCode === "EMAIL" ? c.open : c.reach,
      recommendedResponseRate: c.reach,
      recommendedAffinityScore: topScore,
      channels,
      evaluatedAt: new Date().toISOString(),
    },
    meta: {
      asOfDate: "2026-11-02",
      source: "synthetic_demo",
      isDemo: true,
    },
  };
}

export function getMockCustomerNba(customerCode: string): {
  data: CustomerNbaPortfolio;
  meta: ApiMeta;
} {
  const allRecords = CUSTOMERS.map(toCustomerRecord);
  const c = allRecords.find((item) => item.id === customerCode) || allRecords[0]!;
  const topChannelTuple = c.aff[0] || ["Phone calls", 80];
  const topName = topChannelTuple[0];

  let actionCode = "ACT_PHONE_STANDARD";
  let actionLabel = "Call Customer";
  let channelCode = "PHONE";
  let channelLabel = "Phone Call";

  if (topName === "Mails" || topName.toLowerCase().includes("mail")) {
    actionCode = "ACT_DIGITAL_REMINDER_EMAIL";
    actionLabel = "Send Email Reminder";
    channelCode = "EMAIL";
    channelLabel = "Email";
  } else if (topName === "Field Visit" || topName.toLowerCase().includes("field")) {
    actionCode = "ACT_FIELD_VISIT_STANDARD";
    actionLabel = "Schedule a Field Visit";
    channelCode = "FIELD_VISIT";
    channelLabel = "Field Visit";
  }

  const rec: NbaRecommendation = {
    recommendationId: `REC-MOCK-${c.id}`,
    customerId: c.customerId,
    customerCode: c.id,
    customerName: c.name,
    accountId: c.accountId,
    accountNumber: c.acct,
    accountStatus: c.accountStatus || "ACTIVE",
    timestamp: new Date().toISOString(),
    snapshotDate: "2026-11-02",
    rawEventHorizonDate: "2026-11-02",
    unloggedGapDays: 0,
    modelVersion: "v006",
    primaryAlgorithm: "linucb_cts_bandit",
    segment: c.risk || "STANDARD",
    productType: "PERSONAL",
    daysPastDue: c.dpd,
    dpdBucket: c.riskBucket,
    pastDueAmount: c.exp,
    currentDueAmount: c.exp,
    remainingBalance: c.exp,
    recommendedAction: actionCode,
    recommendedActionLabel: actionLabel,
    recommendedChannelCode: channelCode,
    recommendedChannelLabel: channelLabel,
    isSingleMutuallyExclusiveAction: true,
    expectedRewardEstimate: 0.85,
    ucbDecisionScore: 1.95,
    boundedZ5RewardEstimate: 0.82,
    boundedZ5TopAction: actionCode,
    ctsShadowRewardEstimate: 0.83,
    ctsShadowGreedyAction: actionCode,
    ctsMcChoiceShare: 0.88,
    postStd: 0.12,
    oodMaxAbsZ: 1.2,
    oodTopFeature: "prior_dpd",
    oodDriftFlag: false,
    isCalibratedProbability: true,
    rewardEstimateDisclaimer: "Reward estimates derived from historical recovery outcomes.",
    humanReviewRequired: false,
    humanReviewNote: "",
    singleActionRule: "Strict single mutually exclusive action policy applied.",
    eligibilityStatus: "ELIGIBLE_ACTIVE",
    nEligibleActiveArms: 3,
    eligibleArms: [
      actionCode,
      "ACT_PHONE_STANDARD",
      "ACT_DIGITAL_REMINDER_EMAIL",
      "ACT_FIELD_VISIT_STANDARD",
    ],
    alternativeEligibleActions: [
      {
        actionCode: "ACT_PHONE_STANDARD",
        actionLabel: "Call Customer",
        channelCode: "PHONE",
        channelLabel: "Phone Call",
        expectedRewardEstLinucb: 0.72,
        ucbDecisionScore: 1.65,
        boundedZ5EstLinucb: 0.7,
        expectedRewardEstCts: 0.71,
        ctsMcShare500: 0.12,
        postStd: 0.15,
      },
      {
        actionCode: "ACT_DIGITAL_REMINDER_EMAIL",
        actionLabel: "Send Email Reminder",
        channelCode: "EMAIL",
        channelLabel: "Email",
        expectedRewardEstLinucb: 0.68,
        ucbDecisionScore: 1.55,
        boundedZ5EstLinucb: 0.65,
        expectedRewardEstCts: 0.66,
        ctsMcShare500: 0.08,
        postStd: 0.14,
      },
    ],
    excludedArms: {},
    upstreamEngagement: "High",
    upstreamOutreach: topLabel,
    upstreamPayment: "Partial",
    upstreamContactTime: "10:00 AM – 12:30 PM",
    explanation: {
      "1_engagement_output_influence": `Customer engages actively via ${channelLabel}.`,
      "2_payment_behaviour_signal": `Account shows partial repayment progress (${c.cov}% coverage).`,
      "3_outreach_followup_signal": `Prior touchpoints indicate high affinity for ${channelLabel}.`,
      "4_excluded_actions_and_rules": "No policy blocks detected.",
      "5_prior_recovery_actions_and_outcomes": `${c.touches} historical touchpoints evaluated.`,
    },
    latestDecision: null,
    latestFeedback: null,
  };

  return {
    data: {
      customerCode: c.id,
      customerId: c.customerId,
      customerName: c.name,
      defaultAccountId: c.accountId,
      accounts: [rec],
    },
    meta: {
      asOfDate: "2026-11-02",
      source: "synthetic_demo",
      isDemo: true,
    },
  };
}
