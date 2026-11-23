import type { CustomerData } from "@/data/customer-nba-data";
import type {
  CustomerOutreachStats,
  CustomerRecord,
  CustomerTimelineItem,
  NbaFeedbackRecord,
  NbaRecommendation,
} from "@/lib/api";

export interface BusinessActionMeta {
  actionCode: string;
  headline: string;
  cardTitle: string;
  channelCode: "PHONE" | "EMAIL" | "SMS" | "FIELD_VISIT" | "HOLD";
  channelLabel: string;
  shortDescription: string;
}

export const BUSINESS_ACTION_CATALOG: Record<string, BusinessActionMeta> = {
  ACT_PHONE_STANDARD: {
    actionCode: "ACT_PHONE_STANDARD",
    headline: "Call the Customer",
    cardTitle: "Call Customer",
    channelCode: "PHONE",
    channelLabel: "Phone Call",
    shortDescription:
      "Contact the customer to discuss the outstanding payment and understand when they can make the payment.",
  },
  ACT_PHONE_INTENSIVE: {
    actionCode: "ACT_PHONE_INTENSIVE",
    headline: "Call the Customer",
    cardTitle: "Call Customer",
    channelCode: "PHONE",
    channelLabel: "Phone Call",
    shortDescription:
      "Contact the customer to discuss the outstanding payment and understand when they can make the payment.",
  },
  ACT_DIGITAL_REMINDER_EMAIL: {
    actionCode: "ACT_DIGITAL_REMINDER_EMAIL",
    headline: "Send an Email Reminder",
    cardTitle: "Send Email Reminder",
    channelCode: "EMAIL",
    channelLabel: "Email",
    shortDescription:
      "Send a friendly payment reminder email showing the overdue amount and a direct online payment link.",
  },
  ACT_DIGITAL_REMINDER_SMS: {
    actionCode: "ACT_DIGITAL_REMINDER_SMS",
    headline: "Send an SMS Reminder",
    cardTitle: "Send SMS Reminder",
    channelCode: "SMS",
    channelLabel: "SMS",
    shortDescription:
      "Send a short text message reminding the customer of the due amount with a quick payment link.",
  },
  ACT_FIELD_VISIT_STANDARD: {
    actionCode: "ACT_FIELD_VISIT_STANDARD",
    headline: "Schedule a Field Visit",
    cardTitle: "Field Visit",
    channelCode: "FIELD_VISIT",
    channelLabel: "Field Visit",
    shortDescription:
      "Arrange an in-person visit to meet the customer, discuss repayment challenges, and collect or schedule payment.",
  },
  ACT_FIELD_VISIT_INTENSIVE: {
    actionCode: "ACT_FIELD_VISIT_INTENSIVE",
    headline: "Schedule a Field Visit",
    cardTitle: "Field Visit",
    channelCode: "FIELD_VISIT",
    channelLabel: "Field Visit",
    shortDescription:
      "Arrange an in-person visit to meet the customer, discuss repayment challenges, and collect or schedule payment.",
  },
  ACT_DISCOUNT_SETTLEMENT: {
    actionCode: "ACT_DISCOUNT_SETTLEMENT",
    headline: "Offer a Settlement Plan",
    cardTitle: "Settlement Offer",
    channelCode: "EMAIL",
    channelLabel: "Email / Offer",
    shortDescription:
      "Share an approved reduced-balance settlement option to help the customer close the overdue account.",
  },
  ACT_LEGAL_WARNING: {
    actionCode: "ACT_LEGAL_WARNING",
    headline: "Send Formal Overdue Notice",
    cardTitle: "Formal Overdue Notice",
    channelCode: "EMAIL",
    channelLabel: "Formal Notice",
    shortDescription:
      "Send a formal overdue notice explaining the next escalation steps if the balance remains unpaid.",
  },
  ACT_HOLD_SUPPRESS: {
    actionCode: "ACT_HOLD_SUPPRESS",
    headline: "Pause Customer Outreach (Account on Hold)",
    cardTitle: "Pause Outreach – On Hold",
    channelCode: "HOLD",
    channelLabel: "On Hold",
    shortDescription:
      "Do not contact the customer right now because the account is closed, up to date, or contact is restricted.",
  },
};

export function getBusinessActionMeta(actionCode: string): BusinessActionMeta {
  const found = BUSINESS_ACTION_CATALOG[actionCode];
  if (found) return found;
  return {
    actionCode,
    headline: "Follow Up with Customer",
    cardTitle: actionCode.replace(/^ACT_/, "").replace(/_/g, " "),
    channelCode: "PHONE",
    channelLabel: "Customer Contact",
    shortDescription:
      "Review the account details and follow up with the customer through an approved channel.",
  };
}

export type WarningLevel = "Review Required" | "Attention Required" | "Information";

export interface BusinessWarning {
  level: WarningLevel;
  title: string;
  message: string;
}

export interface AvailableActionCard {
  actionCode: string;
  title: string;
  channelCode: BusinessActionMeta["channelCode"];
  channelLabel: string;
  description: string;
  suitabilityNote: string;
  isModelRecommended: boolean;
  isCurrentlySelected: boolean;
  available: boolean;
}

export interface UnavailableActionItem {
  actionCode: string;
  title: string;
  channelLabel: string;
  reasons: string[];
}

export interface ParsedContactHistoryItem {
  date: string;
  channel: string;
  outcome: string;
}

export interface ParsedNbaSignals {
  templateName: string | null;
  sent90d: number | null;
  opened90d: number | null;
  clicked90d: number | null;
  settledCount: number | null;
  settledTotalAmount: number | null;
  mostRecentPaymentDate: string | null;
  cadence: string | null;
  outreachSuggestedChannel: string | null;
  outreachTotalAttempts: number | null;
  outreachCap: number | null;
  outreachConnectedCount: number | null;
  fieldAttempts: number | null;
  fieldCap: number | null;
  priorContacts: ParsedContactHistoryItem[];
}

export interface BusinessNbaPresentation {
  hero: {
    prefix: string;
    title: string;
    description: string;
    quickReasons: string[];
    isHold: boolean;
    overriddenFromTitle: string | null;
  };
  approval: {
    badge: string;
    headline: string;
    explanation: string;
    tone: "warning" | "success" | "info" | "danger";
  };
  warnings: BusinessWarning[];
  explanationSections: {
    customerEngagement: string;
    paymentBehaviour: string;
    recentFollowUp: string;
    accountHistory: string;
  };
  otherAvailableActions: AvailableActionCard[];
  unavailableActions: UnavailableActionItem[];
  snapshot: {
    outstanding: {
      totalBalance: number;
      pastDue: number;
      recoveredAmount: number;
      remainingOverdue: number;
      coveragePct: number;
      repaymentLabel: string;
      progressLabel: string;
    };
    paymentStatus: {
      categoryBadge: string;
      primaryText: string;
      supportingText: string;
      statusFooter: string;
      severity: "rose" | "amber" | "emerald" | "sky";
    };
    recentPayments: {
      count30d: number;
      totalRecordedPaid: number | null;
      lastPaymentLabel: string;
      supportingNote: string;
    };
    accountProgress: {
      badge: "Improving" | "Worsening" | "Stable" | "Not Enough History";
      primaryText: string;
      comparisonText: string;
      tone: "emerald" | "rose" | "sky" | "neutral";
    };
  };
}

function formatChannelWord(channelRaw: string): string {
  const upper = channelRaw.toUpperCase();
  if (upper.includes("FIELD")) return "field visit";
  if (upper.includes("PHONE") || upper.includes("CALL")) return "phone call";
  if (upper.includes("EMAIL") || upper.includes("MAIL")) return "email";
  if (upper.includes("SMS")) return "SMS";
  return channelRaw.toLowerCase();
}

function formatOutcomeWord(outcomeRaw: string): string {
  const upper = outcomeRaw.toUpperCase();
  if (upper === "CONNECTED") return "spoke with customer";
  if (upper === "BORROWER_MET") return "met customer in person";
  if (upper === "NO_ANSWER") return "no answer";
  if (upper === "NO_ONE_HOME") return "customer not at home";
  if (upper === "RESPONDED") return "customer responded";
  return outcomeRaw.toLowerCase().replace(/_/g, " ");
}

function translateOodDriver(featureName: string): string {
  switch (featureName) {
    case "days_since_last_eng":
      return "recent customer message engagement is further back than usual";
    case "days_since_last_contact":
      return "the gap since the last follow-up call or visit differs from typical patterns";
    case "days_since_last_payment":
      return "the time since the last recorded payment differs from typical patterns";
    case "prior_settled_payment_amount":
    case "prior_settled_payment_count":
    case "prior_payment_coverage_ratio":
      return "past payment history differs from typical accounts";
    case "past_due_amount":
    case "remaining_balance":
    case "past_due_ratio":
    case "current_due_amount":
    case "current_due_ratio":
    case "prior_obligation_due_amount":
      return "the overdue amount or balance stands out compared to typical accounts";
    case "days_past_due":
      return "the overdue duration is unusual compared to similar accounts";
    case "prior_out_attempts":
    case "prior_out_conn_count":
    case "prior_out_conn_rate":
    case "prior_out_field_count":
      return "the contact attempt history differs from typical recovery patterns";
    case "prior_eng_sent":
    case "prior_eng_resp_count":
    case "prior_eng_resp_rate":
      return "message response levels differ from typical customer patterns";
    default:
      return "recent account activity differs from historical patterns";
  }
}

export function translateSingleExclusionReason(reason: string): string {
  if (reason === "account_status==CLOSED") {
    return "This account is closed, so customer outreach is not permitted.";
  }
  if (reason === "do_not_contact_flag==1") {
    return "Customer has a Do Not Contact preference on file.";
  }
  if (reason === "contact_consent==0") {
    return "Customer contact permission is not currently active.";
  }
  if (reason === "unobserved_arm_in_historical_db") {
    return "This option is not currently enabled in standard branch recovery workflows.";
  }
  if (reason === "below_settlement_threshold") {
    return "The account does not meet the overdue age or balance requirement for a settlement offer.";
  }
  if (reason === "below_legal_threshold") {
    return "The account has not reached the overdue stage required for a formal escalation notice.";
  }
  if (reason.startsWith("stage==CURRENT") || reason.startsWith("dpd=0<")) {
    return "The account is currently up to date (0 days overdue), so overdue follow-up is not needed.";
  }
  if (reason.startsWith("cooldown_lt_")) {
    return "A contact attempt was made very recently; a short waiting period is still active before the next contact.";
  }

  const attemptMatch = reason.match(/^prior_out_attempts=(\d+)>=\s*cap_(\d+)$/);
  if (attemptMatch) {
    return `Maximum follow-up limit reached (${attemptMatch[1]} of ${attemptMatch[2]} allowed contact attempts already used).`;
  }

  const fieldMatch = reason.match(/^prior_out_field_count=(\d+)>=\s*cap_(\d+)$/);
  if (fieldMatch) {
    return `Maximum field visit limit reached (${fieldMatch[1]} of ${fieldMatch[2]} allowed visits completed).`;
  }

  const dpdOutsideDigital = reason.match(/^dpd=(\d+)_outside_digital_\[(\d+),(\d+)\]$/);
  if (dpdOutsideDigital) {
    const dpd = Number(dpdOutsideDigital[1]);
    const minDpd = Number(dpdOutsideDigital[2]);
    const maxDpd = Number(dpdOutsideDigital[3]);
    if (dpd > maxDpd) {
      return `Account is ${dpd} days overdue; digital reminders are reserved for accounts ${minDpd} to ${maxDpd} days overdue.`;
    }
    return `Digital reminders are only available once an account is at least ${minDpd} day overdue.`;
  }

  const reqDpdDue = reason.match(/^requires_dpd>=(\d+)_and_past_due>=(\d+(?:\.\d+)?)$/);
  if (reqDpdDue) {
    const minDpd = Number(reqDpdDue[1]);
    const minDue = Math.round(Number(reqDpdDue[2]));
    return `Reserved for accounts at least ${minDpd} day${minDpd === 1 ? "" : "s"} overdue with $${minDue.toLocaleString()} or more past due.`;
  }

  if (reason === "fallback_only_when_no_active_arm_eligible") {
    return "Hold status only applies when no contact channels are permitted.";
  }

  return "Currently unavailable under account outreach policies.";
}

export function summarizeExclusionReasons(reasons: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of reasons) {
    const translated = translateSingleExclusionReason(r);
    if (!seen.has(translated)) {
      seen.add(translated);
      out.push(translated);
    }
  }
  return out;
}

export function parseNbaTelemetrySignals(
  activeNba: NbaRecommendation | undefined,
  timelineList: CustomerTimelineItem[],
): ParsedNbaSignals {
  const e1 = activeNba?.explanation["1_engagement_output_influence"] ?? "";
  const e2 = activeNba?.explanation["2_payment_behaviour_signal"] ?? "";
  const e3 = activeNba?.explanation["3_outreach_followup_signal"] ?? "";
  const e5 = activeNba?.explanation["5_prior_recovery_actions_and_outcomes"] ?? "";

  const tplMatch = e1.match(/selected template [A-Z0-9-]+ \('([^']+)'/);
  const prof90Match = e1.match(/shows (\d+) sent, (\d+) opened, (\d+) clicked/);

  const settledSummaryMatch =
    e5.match(/Settled payments \((\d+), total \$([\d,]+)\)/) ??
    e2.match(/and (\d+) logged settled payment\(s\) totaling \$([\d,]+)/);
  const settledZeroMatch =
    e5.includes("Settled payments (0)") || e2.includes("0 logged settled payment");

  const settledDateMatches = [...e5.matchAll(/(\d{4}-\d{2}-\d{2}) settled \$([\d,]+)/g)];
  const latestSettledMatch =
    settledDateMatches.length > 0 ? settledDateMatches[settledDateMatches.length - 1] : undefined;

  let timelinePayDate: string | null = null;
  if (!latestSettledMatch) {
    const payItem = timelineList.find((item) => item.category === "Payment History");
    if (payItem?.time) {
      const isoMatch = payItem.time.match(/^(\d{4}-\d{2}-\d{2})/);
      timelinePayDate = isoMatch?.[1] ?? payItem.time;
    }
  }

  const cadenceMatch = e2.match(/Cadence Engine assigns '([^']+)'/);
  const upOutMatch = e3.match(/Outreach Engine suggests ([A-Z_]+)/);
  const touchesMatch = e3.match(
    /shows (\d+)\/(\d+) total touches \((\d+) connected\) and (\d+)\/(\d+) field visit/,
  );

  const priorContacts: ParsedContactHistoryItem[] = [];
  const contactsBlockMatch = e5.match(/Outreach attempts \(\d+\): ([^|]+)/);
  if (contactsBlockMatch?.[1]) {
    const entries = contactsBlockMatch[1].split(";").map((s) => s.trim());
    for (const entry of entries) {
      const m = entry.match(/^(\d{4}-\d{2}-\d{2})\s+([A-Z_]+)\s+\(([^)]+)\)$/);
      if (m?.[1] && m[2] && m[3]) {
        priorContacts.push({
          date: m[1],
          channel: m[2],
          outcome: m[3],
        });
      }
    }
  }

  return {
    templateName: tplMatch?.[1] ?? null,
    sent90d: prof90Match?.[1] ? Number(prof90Match[1]) : null,
    opened90d: prof90Match?.[2] ? Number(prof90Match[2]) : null,
    clicked90d: prof90Match?.[3] ? Number(prof90Match[3]) : null,
    settledCount: settledSummaryMatch?.[1]
      ? Number(settledSummaryMatch[1])
      : settledZeroMatch
        ? 0
        : null,
    settledTotalAmount: settledSummaryMatch?.[2]
      ? Number(settledSummaryMatch[2].replace(/,/g, ""))
      : settledZeroMatch
        ? 0
        : null,
    mostRecentPaymentDate: latestSettledMatch?.[1] ?? timelinePayDate,
    cadence: cadenceMatch?.[1] ?? null,
    outreachSuggestedChannel: upOutMatch?.[1] ?? null,
    outreachTotalAttempts: touchesMatch?.[1] ? Number(touchesMatch[1]) : null,
    outreachCap: touchesMatch?.[2] ? Number(touchesMatch[2]) : null,
    outreachConnectedCount: touchesMatch?.[3] ? Number(touchesMatch[3]) : null,
    fieldAttempts: touchesMatch?.[4] ? Number(touchesMatch[4]) : null,
    fieldCap: touchesMatch?.[5] ? Number(touchesMatch[5]) : null,
    priorContacts,
  };
}

function getDelinquencyStageCategory(dpd: number): {
  badge: string;
  severity: "rose" | "amber" | "emerald" | "sky";
  description: string;
} {
  if (dpd <= 0) {
    return {
      badge: "Up to date",
      severity: "sky",
      description: "No overdue balance at this time",
    };
  }
  if (dpd <= 30) {
    return {
      badge: "Early overdue account",
      severity: "emerald",
      description: "Recently overdue — early reminder or check-in is appropriate",
    };
  }
  if (dpd <= 60) {
    return {
      badge: "Mid-stage overdue account",
      severity: "amber",
      description: "Moderately overdue — consistent follow-up is needed to prevent further delay",
    };
  }
  return {
    badge: "Late-stage overdue account",
    severity: "rose",
    description: "Extended overdue period requiring direct personal follow-up",
  };
}

export function formatFeedbackStatusForBusiness(status: string | undefined): string {
  switch (status) {
    case "MATURED_READY":
      return "Completed & Verified";
    case "PENDING_WINDOW":
      return "Recorded · Monitoring 30-day outcome";
    case "QUARANTINED_NONCOMPLIANT":
      return "Saved · Flagged for policy review";
    case "IGNORED_HOLD_NO_UPDATE":
      return "Logged · Account on hold";
    case "IGNORED_NOT_EXECUTED":
      return "Action not completed";
    case "DUPLICATE_IGNORED":
      return "Already recorded";
    default:
      return "Saved to activity record";
  }
}

export function formatValidationToastMessage(
  validationStatus: string | undefined,
  actionTitle: string,
): { level: "success" | "info" | "warning"; message: string } {
  if (validationStatus === "QUARANTINED_NONCOMPLIANT") {
    return {
      level: "warning",
      message: `${actionTitle} outcome saved, but this channel was outside current account guidelines and has been flagged for review.`,
    };
  }
  if (validationStatus === "IGNORED_HOLD_NO_UPDATE") {
    return {
      level: "info",
      message: "Note logged. Customer contact remains paused while the account is on hold.",
    };
  }
  return {
    level: "success",
    message: `Outcome for "${actionTitle}" has been saved successfully.`,
  };
}

function buildAlternativeSuitabilityNote(
  actionCode: string,
  dpd: number,
  pastDueAmt: number,
  c: CustomerData,
  outreachStats: CustomerOutreachStats | undefined,
  signals: ParsedNbaSignals,
): string {
  const phoneStat = outreachStats?.channels.find((ch) => ch.channelCode === "PHONE");
  const emailStat = outreachStats?.channels.find((ch) => ch.channelCode === "EMAIL");
  const fieldStat = outreachStats?.channels.find((ch) => ch.channelCode === "FIELD_VISIT");

  switch (actionCode) {
    case "ACT_PHONE_STANDARD":
    case "ACT_PHONE_INTENSIVE":
      if ((signals.outreachConnectedCount ?? 0) > 0) {
        return "Suitable because the customer has answered phone calls previously.";
      }
      if (phoneStat?.csr != null && phoneStat.csr >= 50) {
        return `Phone contact has worked well on this customer's profile (${Math.round(phoneStat.csr)}% past connection success).`;
      }
      return "Suitable for a direct conversation to confirm repayment timing with lower effort than a visit.";

    case "ACT_DIGITAL_REMINDER_EMAIL":
      if (c.open > 0) {
        return `Customer has opened ${c.open}% of past digital messages, making email a responsive low-friction option.`;
      }
      if (emailStat?.responseRate != null && emailStat.responseRate > 0) {
        return "Customer has interacted with email reminders before and can pay online directly.";
      }
      return "Suitable as a written reminder with a convenient self-service payment link.";

    case "ACT_DIGITAL_REMINDER_SMS":
      return "Suitable as a quick written reminder to prompt online or mobile payment.";

    case "ACT_FIELD_VISIT_STANDARD":
    case "ACT_FIELD_VISIT_INTENSIVE":
      if (
        signals.priorContacts.some(
          (p) => p.channel === "FIELD_VISIT" && p.outcome === "BORROWER_MET",
        )
      ) {
        return "The customer has previously met with a field representative in person.";
      }
      if (fieldStat?.isEligible && dpd >= 1) {
        return `Available at ${dpd} day${dpd === 1 ? "" : "s"} overdue if direct in-person follow-up is preferred for the $${pastDueAmt.toLocaleString()} past due balance.`;
      }
      return "Useful when direct in-person conversation is needed to clarify hardship or collect payment.";

    case "ACT_DISCOUNT_SETTLEMENT":
      return "May encourage faster resolution by offering approved partial-waiver settlement terms.";

    case "ACT_LEGAL_WARNING":
      return "Reserved for escalating long-overdue accounts that have not responded to standard follow-up.";

    default:
      return "Approved alternative available under current account guidelines.";
  }
}

export interface BuildPresentationInput {
  activeNba: NbaRecommendation | undefined;
  customer: CustomerData;
  liveCustomer: CustomerRecord | undefined;
  outreachStats: CustomerOutreachStats | undefined;
  timelineList: CustomerTimelineItem[];
  collectorStatus: "PENDING" | "APPROVED" | "EDITED" | "REJECTED";
  overrideActionCode: string | null;
  selectedTimingWindow: string;
  rejectionReason: string;
  effectiveAccountStatus: string;
  hasConsent: boolean;
  isDnc: boolean;
  hasHistoricalDpd: boolean;
  d30Dpd: number;
  delta30Dpd: number;
  effectiveClick: number | null;
  offlineFallbackActionCode: string;
}

export function buildBusinessNbaPresentation(
  input: BuildPresentationInput,
): BusinessNbaPresentation {
  const {
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
    offlineFallbackActionCode,
  } = input;

  const isClosedAccount = effectiveAccountStatus !== "ACTIVE";
  const isHoldSuppressed =
    activeNba != null ? activeNba.eligibilityStatus === "SUPPRESSED_HOLD_FALLBACK" : false;

  // 1. Determine Outreach Model primary recommendation to guarantee 100% channel alignment
  let targetChannelCode: "PHONE" | "EMAIL" | "FIELD_VISIT" | "SMS" | "HOLD" | null = null;
  if (
    isClosedAccount ||
    isDnc ||
    !hasConsent ||
    isHoldSuppressed ||
    outreachStats?.recommendationStatus === "SUPPRESSED_DNC"
  ) {
    targetChannelCode = "HOLD";
  } else if (outreachStats?.recommendedChannelCode) {
    const raw = outreachStats.recommendedChannelCode.toUpperCase();
    if (raw.includes("PHONE") || raw === "CALL") targetChannelCode = "PHONE";
    else if (raw.includes("EMAIL") || raw === "MAIL") targetChannelCode = "EMAIL";
    else if (raw.includes("FIELD")) targetChannelCode = "FIELD_VISIT";
    else if (raw.includes("SMS")) targetChannelCode = "SMS";
  } else if (offlineFallbackActionCode) {
    if (offlineFallbackActionCode.includes("PHONE")) targetChannelCode = "PHONE";
    else if (offlineFallbackActionCode.includes("EMAIL")) targetChannelCode = "EMAIL";
    else if (offlineFallbackActionCode.includes("FIELD")) targetChannelCode = "FIELD_VISIT";
    else if (offlineFallbackActionCode.includes("SMS")) targetChannelCode = "SMS";
    else if (offlineFallbackActionCode.includes("HOLD")) targetChannelCode = "HOLD";
  }

  // 2. Select aligned action matching Outreach recommendation
  let alignedActionCode: string | null = null;
  if (targetChannelCode === "HOLD") {
    alignedActionCode = "ACT_HOLD_SUPPRESS";
  } else if (targetChannelCode === "EMAIL") {
    const nbaRec = activeNba?.recommendedAction;
    alignedActionCode =
      nbaRec &&
      (nbaRec === "ACT_DIGITAL_REMINDER_EMAIL" ||
        nbaRec === "ACT_DISCOUNT_SETTLEMENT" ||
        nbaRec === "ACT_LEGAL_WARNING")
        ? nbaRec
        : "ACT_DIGITAL_REMINDER_EMAIL";
  } else if (targetChannelCode === "PHONE") {
    const nbaRec = activeNba?.recommendedAction;
    alignedActionCode =
      nbaRec && (nbaRec === "ACT_PHONE_STANDARD" || nbaRec === "ACT_PHONE_INTENSIVE")
        ? nbaRec
        : "ACT_PHONE_STANDARD";
  } else if (targetChannelCode === "FIELD_VISIT") {
    const nbaRec = activeNba?.recommendedAction;
    alignedActionCode =
      nbaRec && (nbaRec === "ACT_FIELD_VISIT_STANDARD" || nbaRec === "ACT_FIELD_VISIT_INTENSIVE")
        ? nbaRec
        : "ACT_FIELD_VISIT_STANDARD";
  } else if (targetChannelCode === "SMS") {
    alignedActionCode = "ACT_DIGITAL_REMINDER_SMS";
  }

  const rawModelActionCode = activeNba?.recommendedAction ?? offlineFallbackActionCode;
  const modelActionCode = alignedActionCode || rawModelActionCode;

  const activeActionCode =
    collectorStatus === "EDITED" && overrideActionCode ? overrideActionCode : modelActionCode;
  const activeMeta = getBusinessActionMeta(activeActionCode);
  const modelMeta = getBusinessActionMeta(modelActionCode);

  const pastDueAmt = liveCustomer?.pastDueAmount ?? activeNba?.pastDueAmount ?? c.exp;
  const remainingBal = liveCustomer?.remainingBalance ?? activeNba?.remainingBalance ?? c.exp;
  const recoveredAmount = Math.round(((pastDueAmt > 0 ? pastDueAmt : c.exp) * c.cov) / 100);
  const remainingOverdue = Math.max(0, pastDueAmt - recoveredAmount);

  const signals = parseNbaTelemetrySignals(activeNba, timelineList);

  const totalTouches = signals.outreachTotalAttempts ?? c.touches;
  const touchesCap = signals.outreachCap ?? 4;
  const connCount = signals.outreachConnectedCount ?? 0;
  const fieldCount = signals.fieldAttempts ?? 0;
  const fieldCap = signals.fieldCap ?? 2;

  const isEffectiveHold =
    activeActionCode === "ACT_HOLD_SUPPRESS" || (isHoldSuppressed && collectorStatus !== "EDITED");

  // Hold reason sentence grounded strictly in real account flags
  const holdReasons: string[] = [];
  if (isClosedAccount) holdReasons.push("this account is marked as Closed");
  if (isDnc) holdReasons.push("the customer has a Do Not Contact preference");
  if (!hasConsent) holdReasons.push("customer contact permission is not active");
  if (!isClosedAccount && c.dpd <= 0) holdReasons.push("the account currently has 0 days overdue");
  const joinedHoldReasons =
    holdReasons.length <= 1
      ? (holdReasons[0] ?? "")
      : holdReasons.length === 2
        ? `${holdReasons[0]} and ${holdReasons[1]}`
        : `${holdReasons.slice(0, -1).join(", ")}, and ${holdReasons[holdReasons.length - 1]}`;
  const holdReasonSentence =
    holdReasons.length > 0
      ? `Customer contact is paused because ${joinedHoldReasons}.`
      : "No outreach channels are permitted under current account rules.";

  // 1. Hero Quick Reasons (2-3 simple, dynamic business bullets)
  const quickReasons: string[] = [];
  if (isEffectiveHold) {
    if (isClosedAccount) {
      quickReasons.push("Account status is closed — no recovery outreach should be made.");
    }
    if (isDnc) {
      quickReasons.push("Customer has requested not to be contacted (Do Not Contact active).");
    } else if (!hasConsent) {
      quickReasons.push("Customer permission to contact is currently disabled.");
    }
    if (!isClosedAccount && c.dpd <= 0) {
      quickReasons.push("The account has 0 days overdue, so no payment follow-up is required.");
    }
    if (remainingBal > 0 && isClosedAccount) {
      quickReasons.push(
        `Recorded remaining balance is $${remainingBal.toLocaleString()} under closed status.`,
      );
    }
    if (quickReasons.length === 0) {
      quickReasons.push("No outreach channels are permitted under current compliance rules.");
    }
  } else {
    const ch = activeMeta.channelCode;
    const outreachChannelLabel =
      outreachStats?.recommendedChannel ||
      (ch === "PHONE"
        ? "Phone Call"
        : ch === "EMAIL"
          ? "Email"
          : ch === "FIELD_VISIT"
            ? "Field Visit"
            : "Primary Channel");
    const affinityVal =
      outreachStats?.recommendedAffinityScore != null
        ? outreachStats.recommendedAffinityScore.toFixed(1)
        : null;

    if (affinityVal) {
      quickReasons.push(
        `Outreach Model determined ${outreachChannelLabel} has the highest affinity score (${affinityVal}) — NBA aligned to this channel for optimal response probability.`,
      );
    } else if (ch === "PHONE") {
      if (
        signals.priorContacts.some((p) => p.channel === "PHONE" && p.outcome === "CONNECTED") ||
        c.reach >= 40
      ) {
        quickReasons.push(
          "Outreach Model identified Phone Call as the optimal channel based on past connected contact.",
        );
      } else {
        quickReasons.push(
          "Outreach Model identified Phone Call as the optimal channel for immediate direct conversation.",
        );
      }
    } else if (ch === "FIELD_VISIT") {
      quickReasons.push(
        "Outreach Model identified Field Visit as the optimal channel for direct in-person consultation.",
      );
    } else {
      if (totalTouches >= touchesCap) {
        quickReasons.push(
          `Previous phone and visit limits (${totalTouches} of ${touchesCap}) have been reached, making an email reminder the right approved option.`,
        );
      } else {
        quickReasons.push(
          "Outreach Model identified Email as the optimal channel with self-service repayment options.",
        );
      }
    }

    if (pastDueAmt > 0) {
      quickReasons.push(
        `The customer has $${pastDueAmt.toLocaleString()} overdue${c.dpd > 0 ? ` (${c.dpd} days overdue)` : ""} on a $${remainingBal.toLocaleString()} total balance.`,
      );
    } else if (remainingBal > 0) {
      quickReasons.push(`The account has $${remainingBal.toLocaleString()} in remaining balance.`);
    }

    if (c.pays === 0) {
      quickReasons.push(
        "No successful payments were recorded in the last 30 days, showing follow-up is needed.",
      );
    } else {
      quickReasons.push(
        `${c.pays} recent payment${c.pays === 1 ? "" : "s"} recorded in the last 30 days — follow-up can help clear the remaining balance.`,
      );
    }
  }

  // 2. Approval / Review Status Banner (Section 7)
  let approval: BusinessNbaPresentation["approval"];
  if (isHoldSuppressed && collectorStatus !== "REJECTED" && collectorStatus !== "EDITED") {
    approval = {
      badge: "On Hold",
      headline: "Customer Contact Paused",
      explanation: `${holdReasonSentence} Outreach actions cannot be approved right now.`,
      tone: "danger",
    };
  } else if (collectorStatus === "APPROVED") {
    approval = {
      badge: "Approved",
      headline: `Approved for Follow-up (${selectedTimingWindow})`,
      explanation: `Confirmed by user. Next step: ${activeMeta.cardTitle.toLowerCase()}.`,
      tone: "success",
    };
  } else if (collectorStatus === "EDITED") {
    approval = {
      badge: "Action Changed",
      headline: `Alternate Action Confirmed (${selectedTimingWindow})`,
      explanation: `Selected ${activeMeta.cardTitle} instead of ${modelMeta.cardTitle}.`,
      tone: "info",
    };
  } else if (collectorStatus === "REJECTED") {
    approval = {
      badge: "Declined",
      headline: "Recommendation Declined",
      explanation: `Reason recorded: ${rejectionReason}.`,
      tone: "danger",
    };
  } else {
    approval = {
      badge: "Waiting for Approval",
      headline: "Manager Approval Required",
      explanation:
        "Please review the customer's situation and confirm or adjust this action before contacting the customer.",
      tone: "warning",
    };
  }

  // 3. Business Warnings (Section 9 — translated from OOD drift, gaps, attempt caps, blocks)
  const warnings: BusinessWarning[] = [];
  if (isEffectiveHold) {
    warnings.push({
      level: "Review Required",
      title: "Outreach Blocked by Customer Permissions or Account Status",
      message: holdReasonSentence,
    });
  } else if (activeNba?.oodDriftFlag) {
    const driverText = translateOodDriver(activeNba.oodTopFeature);
    const gapText =
      activeNba.unloggedGapDays > 0
        ? ` No new customer interactions or payments were logged during the last ${activeNba.unloggedGapDays} days.`
        : "";
    if (activeNba.oodMaxAbsZ >= 20 || activeNba.unloggedGapDays > 14 || c.dpd >= 90) {
      warnings.push({
        level: "Attention Required",
        title: "Account Information Requires Additional Review",
        message: `Some customer activity is significantly different from historical patterns (${driverText}).${gapText} Please verify recent account details before reaching out.`,
      });
    } else {
      warnings.push({
        level: "Information",
        title: "Recent Activity Note",
        message: `Customer activity varies slightly from earlier history (${driverText}).${gapText}`,
      });
    }
  }

  if (!isEffectiveHold && totalTouches >= touchesCap) {
    warnings.push({
      level: "Information",
      title: "Contact Frequency Limit Reached",
      message: `${totalTouches} of ${touchesCap} allowed direct outreach attempts have been made. Phone calls and field visits are paused to avoid over-contacting the customer.`,
    });
  }

  // 4. Four Structured Plain-Language Explanation Sections (Section 4)
  // A. Customer Engagement
  const engParts: string[] = [];
  const sent90 = signals.sent90d;
  const open90 = signals.opened90d;
  const click90 = signals.clicked90d;
  const metInField = signals.priorContacts.some(
    (p) => p.channel === "FIELD_VISIT" && p.outcome === "BORROWER_MET",
  );
  const spokeByPhone = signals.priorContacts.some(
    (p) => p.channel === "PHONE" && p.outcome === "CONNECTED",
  );

  if (spokeByPhone && metInField) {
    engParts.push(
      "The customer has engaged with both phone calls and in-person visits in previous interactions.",
    );
  } else if (spokeByPhone) {
    engParts.push(
      "The customer has answered previous phone calls, showing reliable engagement over the phone.",
    );
  } else if (metInField) {
    engParts.push(
      "The customer has responded to previous field visits and engaged well during in-person contact.",
    );
  } else if (c.open > 0 || (effectiveClick ?? 0) > 0) {
    engParts.push(
      `The customer engages digitally, with a ${c.open}% message open rate and ${c.reach}% overall response rate.`,
    );
  } else {
    engParts.push(
      "There is limited recent direct response history across channels on this account.",
    );
  }

  if (sent90 != null && sent90 > 0) {
    engParts.push(
      `In the last 90 days, ${sent90} reminder${sent90 === 1 ? " was" : "s were"} sent — ${open90 ?? 0} opened and ${click90 ?? 0} link${(click90 ?? 0) === 1 ? "" : "s"} clicked.`,
    );
  }

  const chosenTemplate = signals.templateName || c.content[0];
  if (chosenTemplate) {
    engParts.push(`Suggested messaging focus: "${chosenTemplate}".`);
  }

  // B. Payment Behaviour
  const payParts: string[] = [];
  if (
    signals.settledCount != null &&
    signals.settledCount > 0 &&
    signals.settledTotalAmount != null
  ) {
    payParts.push(
      `The customer has made ${signals.settledCount} settled payment${signals.settledCount === 1 ? "" : "s"} totaling $${signals.settledTotalAmount.toLocaleString()}${signals.mostRecentPaymentDate ? ` (most recently on ${signals.mostRecentPaymentDate})` : ""}, but has not cleared the full balance.`,
    );
  } else if (c.pays > 0) {
    payParts.push(
      `The customer made ${c.pays} payment${c.pays === 1 ? "" : "s"} in the last 30 days and shows ${c.repaymentType.toLowerCase()} progress (${c.cov}% of the overdue amount recovered).`,
    );
  } else if (c.cov > 0) {
    payParts.push(
      `No payments were received in the last 30 days, though historical recovery stands at ${c.cov}% (${c.repaymentType.toLowerCase()}). $${pastDueAmt.toLocaleString()} remains overdue.`,
    );
  } else {
    payParts.push(
      `No payments have been recorded recently or in settled history, leaving $${pastDueAmt.toLocaleString()} overdue.`,
    );
  }

  if (signals.cadence || c.cad[0]) {
    payParts.push(
      `Recommended follow-up pace based on payment behaviour: ${signals.cadence ?? c.cad[0]}.`,
    );
  }

  // C. Recent Follow-up Activity
  const followParts: string[] = [];
  if (totalTouches > 0) {
    followParts.push(
      `${totalTouches} follow-up attempt${totalTouches === 1 ? "" : "s"} recorded (out of ${touchesCap} allowed), with ${connCount} direct conversation${connCount === 1 ? "" : "s"} and ${fieldCount} of ${fieldCap} field visit${fieldCap === 1 ? "" : "s"} completed.`,
    );
    const latestContact =
      signals.priorContacts.length > 0
        ? signals.priorContacts[signals.priorContacts.length - 1]
        : undefined;
    if (latestContact) {
      followParts.push(
        `Most recent follow-up was a ${formatChannelWord(latestContact.channel)} on ${latestContact.date} (${formatOutcomeWord(latestContact.outcome)}).`,
      );
    } else if (c.daysSinceOutreach > 0 && c.lastOutreachMethod !== "None") {
      followParts.push(
        `Last contact attempt was ${c.daysSinceOutreach} day${c.daysSinceOutreach === 1 ? "" : "s"} ago via ${c.lastOutreachMethod.toLowerCase()}.`,
      );
    }
  } else {
    followParts.push(
      "No prior phone calls or field visits have been recorded for this account yet.",
    );
  }

  if (isEffectiveHold) {
    followParts.push("Further follow-up is paused under current account restrictions.");
  } else if (totalTouches >= touchesCap && activeMeta.channelCode === "EMAIL") {
    followParts.push(
      "Because phone and field attempt limits are reached, an email reminder is the recommended next follow-up.",
    );
  } else if (
    signals.outreachSuggestedChannel === "FIELD_VISIT" &&
    activeMeta.channelCode === "PHONE"
  ) {
    followParts.push(
      "While the account also qualifies for a field visit, a phone call is recommended next because it is effective and lower-effort.",
    );
  } else {
    followParts.push(
      `A ${activeMeta.channelLabel.toLowerCase()} follow-up fits the customer's recent interaction history.`,
    );
  }

  // D. Account History
  const stageInfo = getDelinquencyStageCategory(c.dpd);
  const accParts: string[] = [];
  if (c.dpd > 0) {
    accParts.push(
      `The account has been overdue for ${c.dpd} day${c.dpd === 1 ? "" : "s"} (${stageInfo.badge.toLowerCase()}), with $${pastDueAmt.toLocaleString()} overdue out of a $${remainingBal.toLocaleString()} total balance.`,
    );
  } else {
    accParts.push(
      `The account currently has 0 days overdue${remainingBal > 0 ? ` with a $${remainingBal.toLocaleString()} remaining balance` : ""}.`,
    );
  }

  if (hasHistoricalDpd) {
    if (delta30Dpd < 0 && d30Dpd !== c.dpd) {
      accParts.push(
        `Over the last 30 days, overdue status improved from ${d30Dpd} days overdue to ${c.dpd} days overdue.`,
      );
    } else if (delta30Dpd > 0 && d30Dpd !== c.dpd) {
      accParts.push(
        `Over the last 30 days, overdue status increased from ${d30Dpd} days overdue to ${c.dpd} days overdue.`,
      );
    } else {
      accParts.push(
        `Overdue duration has remained unchanged at ${c.dpd} days over the past 30 days.`,
      );
    }
  }

  accParts.push(
    `Account status is ${isClosedAccount ? "Closed" : "Active"} and customer contact permission is ${hasConsent && !isDnc ? "Active" : "Restricted"}.`,
  );

  // 5. Other Available Actions (Section 6 — Strictly genuine eligible arms ONLY, deduplicated by clean action title)
  const otherAvailableActions: AvailableActionCard[] = [];
  const seenCardTitles = new Set<string>([activeMeta.cardTitle]);
  if (activeNba) {
    const eligibleNonHold = activeNba.eligibleArms.filter((arm) => arm !== "ACT_HOLD_SUPPRESS");
    const alternativeCodes = activeNba.alternativeEligibleActions.map((a) => a.actionCode);
    const orderedCodes: string[] = [];
    for (const code of alternativeCodes) {
      if (eligibleNonHold.includes(code) && !orderedCodes.includes(code)) {
        orderedCodes.push(code);
      }
    }
    for (const code of eligibleNonHold) {
      if (code !== activeActionCode && !orderedCodes.includes(code)) {
        orderedCodes.push(code);
      }
    }
    // Also if operator overrode to an alternative, include the original recommended arm so user can switch back easily
    if (
      collectorStatus === "EDITED" &&
      overrideActionCode &&
      eligibleNonHold.includes(activeNba.recommendedAction) &&
      activeNba.recommendedAction !== overrideActionCode
    ) {
      orderedCodes.unshift(activeNba.recommendedAction);
    }

    for (const code of orderedCodes) {
      if (code === activeActionCode) continue;
      const meta = getBusinessActionMeta(code);
      if (seenCardTitles.has(meta.cardTitle)) continue;
      seenCardTitles.add(meta.cardTitle);
      otherAvailableActions.push({
        actionCode: code,
        title: meta.cardTitle,
        channelCode: meta.channelCode,
        channelLabel: meta.channelLabel,
        description: meta.shortDescription,
        suitabilityNote: buildAlternativeSuitabilityNote(
          code,
          c.dpd,
          pastDueAmt,
          c,
          outreachStats,
          signals,
        ),
        isModelRecommended: code === activeNba.recommendedAction,
        isCurrentlySelected: code === activeActionCode,
        available: true,
      });
    }
  } else if (hasConsent && !isDnc && !isClosedAccount && c.dpd > 0) {
    const fallbackArms = ["ACT_PHONE_STANDARD", "ACT_DIGITAL_REMINDER_EMAIL"];
    if (c.dpd >= 1 && pastDueAmt >= 500) {
      fallbackArms.push("ACT_FIELD_VISIT_STANDARD");
    }
    for (const code of fallbackArms) {
      if (code === activeActionCode) continue;
      const meta = getBusinessActionMeta(code);
      if (seenCardTitles.has(meta.cardTitle)) continue;
      seenCardTitles.add(meta.cardTitle);
      otherAvailableActions.push({
        actionCode: code,
        title: meta.cardTitle,
        channelCode: meta.channelCode,
        channelLabel: meta.channelLabel,
        description: meta.shortDescription,
        suitabilityNote: buildAlternativeSuitabilityNote(
          code,
          c.dpd,
          pastDueAmt,
          c,
          outreachStats,
          signals,
        ),
        isModelRecommended: false,
        isCurrentlySelected: false,
        available: true,
      });
    }
  }

  // 6. Unavailable Actions (collapsible plain-language summary of backend excludedArms)
  const unavailableActions: UnavailableActionItem[] = [];
  if (activeNba) {
    for (const [armCode, reasons] of Object.entries(activeNba.excludedArms)) {
      if (armCode === "ACT_HOLD_SUPPRESS") continue;
      const meta = getBusinessActionMeta(armCode);
      unavailableActions.push({
        actionCode: armCode,
        title: meta.cardTitle,
        channelLabel: meta.channelLabel,
        reasons: summarizeExclusionReasons(reasons),
      });
    }
  }

  // 7. Customer Recovery Snapshot (Section 5)
  const progressBadge: BusinessNbaPresentation["snapshot"]["accountProgress"]["badge"] =
    !hasHistoricalDpd
      ? "Not Enough History"
      : delta30Dpd < 0
        ? "Improving"
        : delta30Dpd > 0
          ? "Worsening"
          : "Stable";

  const progressTone: BusinessNbaPresentation["snapshot"]["accountProgress"]["tone"] =
    !hasHistoricalDpd ? "neutral" : delta30Dpd < 0 ? "emerald" : delta30Dpd > 0 ? "rose" : "sky";

  const progressPrimaryText = !hasHistoricalDpd
    ? "No prior history"
    : delta30Dpd < 0
      ? `${Math.abs(delta30Dpd)} fewer overdue day${Math.abs(delta30Dpd) === 1 ? "" : "s"}`
      : delta30Dpd > 0
        ? `${delta30Dpd} more overdue day${delta30Dpd === 1 ? "" : "s"}`
        : "No change";

  const progressComparisonText = !hasHistoricalDpd
    ? "Historical 30-day comparison is unavailable for this account."
    : delta30Dpd === 0
      ? `Remained steady at ${c.dpd} days overdue compared to 30 days ago.`
      : `${d30Dpd} days overdue (30 days ago) → ${c.dpd} days overdue today`;

  let lastPaymentLabel = "No recent payment recorded";
  if (signals.mostRecentPaymentDate) {
    lastPaymentLabel = `Most recent payment: ${signals.mostRecentPaymentDate}`;
  } else if (c.last > 0 && c.pays > 0) {
    lastPaymentLabel = `Most recent payment: ${c.last} day${c.last === 1 ? "" : "s"} ago`;
  } else if (c.last > 0 && signals.settledCount !== 0) {
    lastPaymentLabel = `Last recorded payment: ${c.last} day${c.last === 1 ? "" : "s"} ago`;
  }

  return {
    hero: {
      prefix:
        collectorStatus === "EDITED" && !isEffectiveHold ? "Selected Action" : "Recommended Action",
      title: activeMeta.headline,
      description: activeMeta.shortDescription,
      quickReasons: quickReasons.slice(0, 3),
      isHold: isEffectiveHold,
      overriddenFromTitle:
        collectorStatus === "EDITED" && overrideActionCode && overrideActionCode !== modelActionCode
          ? modelMeta.headline
          : null,
    },
    approval,
    warnings,
    explanationSections: {
      customerEngagement: engParts.join(" "),
      paymentBehaviour: payParts.join(" "),
      recentFollowUp: followParts.join(" "),
      accountHistory: accParts.join(" "),
    },
    otherAvailableActions,
    unavailableActions,
    snapshot: {
      outstanding: {
        totalBalance: remainingBal,
        pastDue: pastDueAmt,
        recoveredAmount,
        remainingOverdue,
        coveragePct: c.cov,
        repaymentLabel: c.repaymentType,
        progressLabel: `${c.cov}% of the overdue amount recovered`,
      },
      paymentStatus: {
        categoryBadge: stageInfo.badge,
        primaryText: c.dpd <= 0 ? "Up to date" : `${c.dpd} Days Overdue`,
        supportingText: stageInfo.description,
        statusFooter: isClosedAccount ? "Closed account" : "Active delinquent monitoring",
        severity: stageInfo.severity,
      },
      recentPayments: {
        count30d: c.pays,
        totalRecordedPaid: signals.settledTotalAmount,
        lastPaymentLabel,
        supportingNote:
          signals.settledTotalAmount != null
            ? `$${signals.settledTotalAmount.toLocaleString()} total settled payment${signals.settledCount === 1 ? "" : "s"} on record`
            : c.pays > 0
              ? `${c.cov}% of overdue balance recovered`
              : "No payments completed in the last 30 days",
      },
      accountProgress: {
        badge: progressBadge,
        primaryText: progressPrimaryText,
        comparisonText: progressComparisonText,
        tone: progressTone,
      },
    },
  };
}

export interface ActionOutcomePreset {
  id: string;
  label: string;
  subtitle: string;
  tone: "emerald" | "blue" | "amber" | "rose";
  dispositionOrPresenceOrStatus: string;
  reaction: string;
  nextStep: string;
  ptpAgreed: boolean;
  suggestPaymentMode: "NONE" | "PARTIAL" | "FULL";
}

export function getActionSpecificOutcomes(
  channel: "PHONE" | "FIELD" | "MAIL",
): ActionOutcomePreset[] {
  if (channel === "PHONE") {
    return [
      {
        id: "phone_contacted",
        label: "Customer contacted",
        subtitle: "Spoke with customer and reviewed the overdue amount",
        tone: "blue",
        dispositionOrPresenceOrStatus: "Connected — Spoke with Customer",
        reaction: "Calm & Acknowledged Liability",
        nextStep: "Follow-up Call Scheduled (Within 48h)",
        ptpAgreed: false,
        suggestPaymentMode: "NONE",
      },
      {
        id: "phone_ptp",
        label: "Customer promised payment",
        subtitle: "Customer agreed to pay by a specific date",
        tone: "emerald",
        dispositionOrPresenceOrStatus: "Connected — Spoke with Customer",
        reaction: "Promised Payment via Portal",
        nextStep: "PTP Registered on Call",
        ptpAgreed: true,
        suggestPaymentMode: "NONE",
      },
      {
        id: "phone_partial",
        label: "Partial payment received",
        subtitle: "Customer paid part of the overdue amount today",
        tone: "emerald",
        dispositionOrPresenceOrStatus: "Connected — Spoke with Customer",
        reaction: "Calm & Acknowledged Liability",
        nextStep: "Payment Link Dispatched via SMS",
        ptpAgreed: true,
        suggestPaymentMode: "PARTIAL",
      },
      {
        id: "phone_full",
        label: "Full payment received",
        subtitle: "Full overdue amount has been paid today",
        tone: "emerald",
        dispositionOrPresenceOrStatus: "Connected — Spoke with Customer",
        reaction: "Promised Payment via Portal",
        nextStep: "PTP Registered on Call",
        ptpAgreed: false,
        suggestPaymentMode: "FULL",
      },
      {
        id: "phone_unavailable",
        label: "Customer unavailable",
        subtitle: "Call was not answered or number went to voicemail",
        tone: "amber",
        dispositionOrPresenceOrStatus: "Ringing / No Answer",
        reaction: "Calm & Acknowledged Liability",
        nextStep: "Follow-up Call Scheduled (Within 48h)",
        ptpAgreed: false,
        suggestPaymentMode: "NONE",
      },
      {
        id: "phone_refused",
        label: "Customer refused payment",
        subtitle: "Customer declined to make or promise a payment",
        tone: "rose",
        dispositionOrPresenceOrStatus: "Connected — Spoke with Customer",
        reaction: "Aggressive / Disconnected Call",
        nextStep: "Escalate to In-Person Field Visit",
        ptpAgreed: false,
        suggestPaymentMode: "NONE",
      },
      {
        id: "phone_followup",
        label: "Follow-up required",
        subtitle: "Further follow-up or visit is needed",
        tone: "amber",
        dispositionOrPresenceOrStatus: "Answered by Family / Spouse",
        reaction: "Distressed / Cash Flow Problem",
        nextStep: "Follow-up Call Scheduled (Within 48h)",
        ptpAgreed: false,
        suggestPaymentMode: "NONE",
      },
    ];
  }

  if (channel === "FIELD") {
    return [
      {
        id: "field_contacted",
        label: "Customer met in person",
        subtitle: "Field representative met with customer at address",
        tone: "blue",
        dispositionOrPresenceOrStatus: "Customer Met in Person",
        reaction: "Cooperative & Willing to Settle",
        nextStep: "Loan Restructuring Requested",
        ptpAgreed: false,
        suggestPaymentMode: "NONE",
      },
      {
        id: "field_ptp",
        label: "Customer promised payment",
        subtitle: "Customer committed to a payment date during visit",
        tone: "emerald",
        dispositionOrPresenceOrStatus: "Customer Met in Person",
        reaction: "Cooperative & Willing to Settle",
        nextStep: "Promise to Pay (PTP) Agreed",
        ptpAgreed: true,
        suggestPaymentMode: "NONE",
      },
      {
        id: "field_partial",
        label: "Partial payment received",
        subtitle: "Customer paid part of the overdue balance during visit",
        tone: "emerald",
        dispositionOrPresenceOrStatus: "Customer Met in Person",
        reaction: "Cooperative & Willing to Settle",
        nextStep: "Immediate Partial Payment Today",
        ptpAgreed: true,
        suggestPaymentMode: "PARTIAL",
      },
      {
        id: "field_full",
        label: "Full payment received",
        subtitle: "Full overdue amount collected during the visit",
        tone: "emerald",
        dispositionOrPresenceOrStatus: "Customer Met in Person",
        reaction: "Cooperative & Willing to Settle",
        nextStep: "Promise to Pay (PTP) Agreed",
        ptpAgreed: false,
        suggestPaymentMode: "FULL",
      },
      {
        id: "field_unavailable",
        label: "Customer unavailable",
        subtitle: "Premises locked or customer was not available",
        tone: "amber",
        dispositionOrPresenceOrStatus: "Premises Locked / Not Available",
        reaction: "Evasive / Asking for Time",
        nextStep: "Loan Restructuring Requested",
        ptpAgreed: false,
        suggestPaymentMode: "NONE",
      },
      {
        id: "field_refused",
        label: "Customer refused payment",
        subtitle: "Customer refused to pay or agree on a plan",
        tone: "rose",
        dispositionOrPresenceOrStatus: "Customer Met in Person",
        reaction: "Hostile / Refused Discussion",
        nextStep: "Refused to Commit / Awaiting Notice",
        ptpAgreed: false,
        suggestPaymentMode: "NONE",
      },
      {
        id: "field_followup",
        label: "Follow-up required",
        subtitle: "Spoke with family member or requested follow-up visit",
        tone: "amber",
        dispositionOrPresenceOrStatus: "Met Family / Third-Party",
        reaction: "Claimed Financial Hardship / Job Loss",
        nextStep: "Loan Restructuring Requested",
        ptpAgreed: false,
        suggestPaymentMode: "NONE",
      },
    ];
  }

  // EMAIL / DIGITAL
  return [
    {
      id: "mail_engaged",
      label: "Customer viewed or clicked link",
      subtitle: "Email reminder opened and payment link accessed",
      tone: "blue",
      dispositionOrPresenceOrStatus: "Delivered & Link Clicked / Viewed",
      reaction: "Online Self-Service Pay Initiated",
      nextStep: "Send Urgent Automated Reminder SMS",
      ptpAgreed: false,
      suggestPaymentMode: "NONE",
    },
    {
      id: "mail_ptp",
      label: "Customer promised payment",
      subtitle: "Customer replied and committed to a payment date",
      tone: "emerald",
      dispositionOrPresenceOrStatus: "Customer Replied via Email / Portal",
      reaction: "Online Self-Service Pay Initiated",
      nextStep: "Send Urgent Automated Reminder SMS",
      ptpAgreed: true,
      suggestPaymentMode: "NONE",
    },
    {
      id: "mail_partial",
      label: "Partial payment received",
      subtitle: "Partial online payment completed via reminder link",
      tone: "emerald",
      dispositionOrPresenceOrStatus: "Delivered & Link Clicked / Viewed",
      reaction: "Online Self-Service Pay Initiated",
      nextStep: "Send Urgent Automated Reminder SMS",
      ptpAgreed: true,
      suggestPaymentMode: "PARTIAL",
    },
    {
      id: "mail_full",
      label: "Full payment received",
      subtitle: "Full overdue amount settled online after reminder",
      tone: "emerald",
      dispositionOrPresenceOrStatus: "Delivered & Link Clicked / Viewed",
      reaction: "Online Self-Service Pay Initiated",
      nextStep: "Send Urgent Automated Reminder SMS",
      ptpAgreed: false,
      suggestPaymentMode: "FULL",
    },
    {
      id: "mail_no_response",
      label: "Customer unavailable / no reply",
      subtitle: "Reminder delivered, awaiting customer response",
      tone: "amber",
      dispositionOrPresenceOrStatus: "Delivered — Awaiting Customer Open",
      reaction: "No Action Taken / Passive Disregard",
      nextStep: "Escalate to Outbound Collection Call",
      ptpAgreed: false,
      suggestPaymentMode: "NONE",
    },
    {
      id: "mail_followup",
      label: "Follow-up required",
      subtitle: "Need phone follow-up or contact check (bounce / hardship)",
      tone: "rose",
      dispositionOrPresenceOrStatus: "Returned Unclaimed / Mail Bounce",
      reaction: "Grievance / Hardship Letter Submitted",
      nextStep: "Escalate to Outbound Collection Call",
      ptpAgreed: false,
      suggestPaymentMode: "NONE",
    },
  ];
}

export function formatLatestFeedbackBannerText(fb: NbaFeedbackRecord): {
  badge: string;
  detail: string;
} {
  const actionMeta = getBusinessActionMeta(fb.selectedAction);
  const badge =
    fb.paymentAmount > 0
      ? `${actionMeta.cardTitle}: $${fb.paymentAmount.toLocaleString()} Collected`
      : `${actionMeta.cardTitle}: ${formatFeedbackStatusForBusiness(fb.validationStatus)}`;

  const parts: string[] = [];
  if (fb.rescheduleDate && fb.executionStatus !== "EXECUTED") {
    parts.push(`Planned follow-up date: ${fb.rescheduleDate}`);
  } else {
    parts.push(formatFeedbackStatusForBusiness(fb.validationStatus));
  }
  if (fb.notTakenReason && fb.executionStatus !== "EXECUTED") {
    parts.push(`Reason: ${fb.notTakenReason}`);
  }
  return { badge, detail: parts.join(" · ") };
}
