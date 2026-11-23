/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, type ReactNode } from "react";
import type { CustomerTimelineItem } from "@/lib/api";

export interface TimelineOutcome {
  customerCode: string;
  accountId?: number | undefined;
  channel: string;
  outcome: string;
  amountPaid?: number | undefined;
  ptpAgreed?: boolean | undefined;
  ptpAmount?: number | undefined;
  ptpDate?: string | undefined;
  notes?: string | undefined;
  timestamp: string;
  sourceEvent: CustomerTimelineItem;
}

export interface OutcomeContextValue {
  selectedTimelineOutcome: TimelineOutcome | null;
  setSelectedTimelineOutcome: (outcome: TimelineOutcome | null) => void;
}

export const OutcomeContext = createContext<OutcomeContextValue | null>(null);

export function OutcomeProvider({ children }: { children: ReactNode }) {
  const [selectedTimelineOutcome, setSelectedTimelineOutcome] = useState<TimelineOutcome | null>(
    null,
  );
  return (
    <OutcomeContext.Provider value={{ selectedTimelineOutcome, setSelectedTimelineOutcome }}>
      {children}
    </OutcomeContext.Provider>
  );
}
