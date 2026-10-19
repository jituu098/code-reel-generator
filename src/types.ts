export type VisualLayoutType =
  | 'SEARCH_GRID'
  | 'BARS'
  | 'LINKED_LIST'
  | 'STACK_QUEUE'
  | 'TREE'
  | 'VARIABLE_WATCH';

export interface TreeNodeVisual {
  val: number | string;
  x: number;
  y: number;
  left?: number;
  right?: number;
}

export interface UniversalStep {
  stepIndex?: number;
  line: number;
  description: string;
  layout: VisualLayoutType;
  explanation?: string;
  // Dynamic snapshot properties
  array?: (number | string)[];
  pointers?: Record<string, number | null>;
  activeIndices?: number[];
  comparedIndices?: [number, number];
  foundIndex?: number | null;
  target?: number | string | null;
  stack?: (number | string)[];
  queue?: (number | string)[];
  treeNodes?: TreeNodeVisual[];
  activeNodeVal?: number | string | null;
  variables?: Record<string, any>;
  [key: string]: any;
}

export interface SimulationResult {
  detectedLanguage: string;
  algorithmType: string;
  layoutType: VisualLayoutType;
  totalSteps: number;
  steps: UniversalStep[];
}