import type { LabActionType } from '@/types';

export interface SimReportProps {
  /** (value, unit, label, condition?) — condition matches ExpectedResult.condition. */
  onMeasurement?: (value: number, unit: string, label: string, condition?: string) => void;
  onObservation?: (text: string) => void;
  /** Required-action evidence: (actionType, targetApparatus, value?). */
  onAction?: (actionType: LabActionType, targetApparatus: string, value?: number) => void;
}
