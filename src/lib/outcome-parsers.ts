import type { CustomerTimelineItem } from "@/lib/api";
import type { TimelineOutcome } from "@/hooks/outcome-context";

const CURRENCY_RE = /\$[\d,]+(?:\.\d{2})?/g;
const DATE_RE = /\d{4}-\d{2}-\d{2}/;

function extractAmount(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const match = text.match(CURRENCY_RE);
  if (!match) return undefined;
  const raw = match[0].replace(/[$,]/g, "");
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractDate(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const match = text.match(DATE_RE);
  return match ? match[0] : undefined;
}

function normalizeChannel(title: string, category: string): string {
  const t = title.toLowerCase();
  const c = category.toLowerCase();
  if (t.includes("field") || t.includes("visit")) return "FIELD_VISIT";
  if (t.includes("phone") || t.includes("call")) return "PHONE";
  if (
    t.includes("email") ||
    t.includes("mail") ||
    t.includes("message") ||
    c.includes("suggested message")
  )
    return "EMAIL";
  if (t.includes("sms") || t.includes("text")) return "SMS";
  if (c.includes("payment")) return "PAYMENT";
  return "PHONE";
}

function normalizeOutcome(status: string, category: string, title: string): string {
  const s = status.toLowerCase();
  const t = title.toLowerCase();
  if (category === "Payment History") {
    if (s.includes("full") || s.includes("100%") || s.includes("settled")) return "FULL_PAYMENT";
    if (s.includes("partial") || s.includes("% recovered")) return "PARTIAL_PAYMENT";
    return "PAYMENT_RECORDED";
  }
  if (s.includes("connected") || s.includes("met") || s.includes("answered")) return "CONNECTED";
  if (s.includes("responded") || s.includes("clicked") || s.includes("opened")) return "RESPONDED";
  if (s.includes("delivered")) return "DELIVERED";
  if (s.includes("no answer") || s.includes("unavailable") || s.includes("not available"))
    return "UNAVAILABLE";
  if (s.includes("refused") || s.includes("declined") || t.includes("refused")) return "REFUSED";
  return "RECORDED";
}

function isConnectedOutcome(outcome: string, status: string): boolean {
  const text = `${outcome} ${status}`.toLowerCase();
  return (
    text.includes("connected") ||
    text.includes("met") ||
    text.includes("answered") ||
    text.includes("full payment") ||
    text.includes("partial payment")
  );
}

function isRespondedOutcome(outcome: string, status: string): boolean {
  const text = `${outcome} ${status}`.toLowerCase();
  return (
    isConnectedOutcome(outcome, status) ||
    text.includes("responded") ||
    text.includes("clicked") ||
    text.includes("opened") ||
    text.includes("delivered") ||
    text.includes("promised")
  );
}

function isPtpOutcome(outcome: string, status: string, title: string): boolean {
  const text = `${outcome} ${status} ${title}`.toLowerCase();
  return text.includes("ptp") || text.includes("promise") || text.includes("promised");
}

export function parseTimelineOutcome(
  customerCode: string,
  accountId: number | undefined,
  item: CustomerTimelineItem,
): TimelineOutcome {
  // Prefer the structured fields returned by /timeline; fall back to title/category
  // heuristics only for older payloads that carry just display strings.
  const channel =
    item.kind === "PAYMENT"
      ? "PAYMENT"
      : (item.channelCode ?? normalizeChannel(item.title, item.category));
  const outcome = normalizeOutcome(item.status, item.category, item.title);
  const amountPaid =
    item.details?.paymentAmount ?? item.amount ?? extractAmount(`${item.status} ${item.title}`);
  const ptpAgreed =
    Boolean(item.details?.ptpAmount) ||
    item.kind === "PROMISE" ||
    isPtpOutcome(outcome, item.status, item.title);
  const ptpAmount = item.details?.ptpAmount ?? (ptpAgreed ? amountPaid : undefined);
  const ptpDate = item.details?.ptpDate ?? (ptpAgreed ? extractDate(item.status) : undefined);

  return {
    customerCode,
    accountId,
    channel,
    outcome,
    amountPaid,
    ptpAgreed,
    ptpAmount,
    ptpDate,
    timestamp: item.occurredAt ?? item.time,
    sourceEvent: item,
  };
}

export function outcomeToFeedbackFlags(outcome: TimelineOutcome): {
  respondedFlag: 0 | 1;
  connectedFlag: 0 | 1;
} {
  return {
    respondedFlag: isRespondedOutcome(outcome.outcome, outcome.sourceEvent.status) ? 1 : 0,
    connectedFlag: isConnectedOutcome(outcome.outcome, outcome.sourceEvent.status) ? 1 : 0,
  };
}
