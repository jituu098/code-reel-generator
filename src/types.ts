export type VisualLayoutType = "BARS" | "SEARCH_GRID" | "LINKED_LIST" | "STACK" | "POINTERS";

export interface LinkedListNode {
  value: string | number;
  next: boolean;
  state?: "normal" | "active" | "target" | "deleted";
}

export interface SearchCell {
  index: number;
  value: number | string;
  state: "default" | "active" | "checked" | "found";
  pointerLabel?: string;
}

export interface UniversalStep {
  stepIndex: number;
  line: number;
  description: string;
  layout: VisualLayoutType;
  linkedList?: LinkedListNode[];
  searchGrid?: {
    cells: SearchCell[];
    target: number | string;
  };
  bars?: { value: number; label?: string; state?: "normal" | "active" | "swap" | "done" }[];
  stack?: { name: string; value: string | number }[];
  pointers?: { name: string; value: string | number }[];
}

export interface SimulationResult {
  detectedLanguage: string;
  algorithmType: string;
  totalSteps: number;
  steps: UniversalStep[];
}