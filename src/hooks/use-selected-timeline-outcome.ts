import { useContext } from "react";
import { OutcomeContext, type OutcomeContextValue } from "./outcome-context";

export function useSelectedTimelineOutcome(): OutcomeContextValue {
  const ctx = useContext(OutcomeContext);
  if (!ctx) {
    throw new Error("useSelectedTimelineOutcome must be used within OutcomeProvider");
  }
  return ctx;
}
