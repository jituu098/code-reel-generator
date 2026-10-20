export type VisualLayoutType =
  | 'SORTING_BUBBLE'
  | 'SORTING_QUICK'
  | 'SEARCH_GRID'
  | 'LINKED_LIST'
  | 'STACK_QUEUE'
  | 'TREE'
  | 'VARIABLE_WATCH';

export interface UniversalStep {
  stepIndex?: number;
  line: number;
  description: string;
  layout: VisualLayoutType;
  array: number[];
  comparedIndices?: [number, number];
  swappedIndices?: [number, number];
  pivotIndex?: number | null;
  sortedIndices?: number[];
  comparisonsCount: number;
  swapsCount: number;
  evalText?: string;
  terminalFooter?: string;
  [key: string]: any;
}

export interface SimulationResult {
  detectedLanguage: string;
  algorithmType: string;
  layoutType: VisualLayoutType;
  totalSteps: number;
  steps: UniversalStep[];
}