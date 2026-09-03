import type { LabActionType } from '@/types';
import type { SimReportProps } from './types';

interface Reporter {
  recordMeasurement: (value: number, unit: string, label: string, condition?: string, apparatusId?: string) => void;
  recordAction: (actionType: LabActionType, targetApparatus: string, value?: number) => void;
  recordObservation: (text: string) => void;
}

/** Store-backed sim callbacks. Sims stay synchronous and UI-only. */
export function buildSimReporters(store: Reporter): Required<SimReportProps> {
  return {
    onMeasurement: (value, unit, label, condition) =>
      store.recordMeasurement(value, unit, label, condition),
    onObservation: (text) => store.recordObservation(text),
    onAction: (actionType, targetApparatus, value) =>
      store.recordAction(actionType, targetApparatus, value),
  };
}
