import { SimulationResult, UniversalStep, VisualLayoutType, TreeNodeVisual } from '../types';

export function simulateAnyCode(code: string): SimulationResult {
  const cleanCode = code.trim();
  const lower = cleanCode.toLowerCase();

  // Detect language
  let detectedLanguage = 'JavaScript';
  if (lower.includes('#include') || lower.includes('std::') || lower.includes('cout')) detectedLanguage = 'C++';
  else if (lower.includes('public class') || lower.includes('system.out')) detectedLanguage = 'Java';
  else if (lower.includes('def ') || lower.includes('print(') || lower.includes('elif ')) detectedLanguage = 'Python';
  else if (lower.includes('malloc') || lower.includes('printf(')) detectedLanguage = 'C';

  const lines = cleanCode.split(/\r?\n/);

  // 1. Pattern: Tree / Binary Search Tree
  if (lower.includes('left') && lower.includes('right') && (lower.includes('root') || lower.includes('tree') || lower.includes('node'))) {
    return traceTree(lines, detectedLanguage);
  }

  // 2. Pattern: Stack / Queue
  if (lower.includes('stack') || lower.includes('queue') || lower.includes('push(') || lower.includes('pop()') || lower.includes('enqueue') || lower.includes('dequeue')) {
    return traceStackQueue(lines, detectedLanguage, lower);
  }

  // 3. Pattern: Linked List
  if (lower.includes('->next') || lower.includes('.next') || (lower.includes('struct node') || lower.includes('class node'))) {
    return traceLinkedList(lines, detectedLanguage);
  }

  // 4. Pattern: Sorting (Bars)
  if (lower.includes('swap') || (lower.includes('sort') && !lower.includes('sorted')) || (lower.includes('for') && (lower.includes('i++') || lower.includes('j++')) && lower.includes('[j]'))) {
    return traceSorting(lines, detectedLanguage);
  }

  // 5. Pattern: Binary Search / Two Pointers / Array Scan (Default Grid)
  if (lower.includes('mid') || lower.includes('binary') || lower.includes('target') || lower.includes('search') || lower.includes('arr')) {
    return traceArraySearch(lines, detectedLanguage, lower);
  }

  // 6. Generic Fallback: Dynamic Variable / Control Flow Watcher
  return traceVariables(lines, detectedLanguage);
}

// --------------------------------------------------------------------------
// Sub-Tracer: Trees
// --------------------------------------------------------------------------
function traceTree(lines: string[], lang: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const numbers = extractNumbers(lines.join(' '));
  const vals = numbers.length >= 3 ? numbers.slice(0, 7) : [50, 30, 70, 20, 40, 60, 80];

  // Pre-calculate balanced coordinates for 1080 canvas
  const treeNodes: TreeNodeVisual[] = [
    { val: vals[0], x: 540, y: 360 },
    { val: vals[1], x: 340, y: 450 },
    { val: vals[2], x: 740, y: 450 },
    { val: vals[3] ?? 20, x: 240, y: 540 },
    { val: vals[4] ?? 40, x: 440, y: 540 },
    { val: vals[5] ?? 60, x: 640, y: 540 },
    { val: vals[6] ?? 80, x: 840, y: 540 },
  ];

  treeNodes.forEach((node, i) => {
    steps.push({
      stepIndex: i,
      line: findLineNumber(lines, ['root', 'insert', 'node', 'malloc', 'val', 'data']),
      description: `Traversing / Inserting Tree Node: ${node.val}`,
      layout: 'TREE',
      treeNodes: treeNodes.slice(0, i + 1),
      activeNodeVal: node.val,
    });
  });

  return { detectedLanguage: lang, algorithmType: 'Binary Search Tree', layoutType: 'TREE', totalSteps: steps.length, steps };
}

// --------------------------------------------------------------------------
// Sub-Tracer: Stack & Queue
// --------------------------------------------------------------------------
function traceStackQueue(lines: string[], lang: string, lower: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const isQueue = lower.includes('queue') || lower.includes('fifo');
  const numbers = extractNumbers(lines.join(' '));
  const rawItems = numbers.length >= 2 ? numbers.slice(0, 5) : [10, 20, 30, 40];
  const items: (number | string)[] = [];

  rawItems.forEach((val, i) => {
    items.push(val);
    steps.push({
      stepIndex: i,
      line: findLineNumber(lines, ['push', 'enqueue', 'add', 'insert']),
      description: isQueue ? `Enqueue ${val} to Queue tail` : `Push ${val} onto top of Stack`,
      layout: 'STACK_QUEUE',
      stack: isQueue ? [] : [...items],
      queue: isQueue ? [...items] : [],
      variables: { currentOperation: isQueue ? 'ENQUEUE' : 'PUSH', size: items.length },
    });
  });

  if (items.length > 0) {
    const popped = isQueue ? items.shift() : items.pop();
    steps.push({
      stepIndex: steps.length,
      line: findLineNumber(lines, ['pop', 'dequeue', 'remove', 'poll']),
      description: isQueue ? `Dequeue ${popped} from Queue head` : `Pop ${popped} from Stack top`,
      layout: 'STACK_QUEUE',
      stack: isQueue ? [] : [...items],
      queue: isQueue ? [...items] : [],
      variables: { currentOperation: isQueue ? 'DEQUEUE' : 'POP', removed: popped },
    });
  }

  return { detectedLanguage: lang, algorithmType: isQueue ? 'Queue (FIFO)' : 'Stack (LIFO)', layoutType: 'STACK_QUEUE', totalSteps: steps.length, steps };
}

// --------------------------------------------------------------------------
// Sub-Tracer: Singly / Doubly Linked List
// --------------------------------------------------------------------------
function traceLinkedList(lines: string[], lang: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const rawData = extractNodeValues(lines.join(' '));
  const list = rawData.length > 0 ? rawData : [10, 20, 30, 40];

  list.forEach((val, i) => {
    steps.push({
      stepIndex: i,
      line: findLineNumber(lines, ['while', 'temp', '->next', '.next', 'print']),
      description: `Traverse: temp points to Node with val ${val}`,
      layout: 'LINKED_LIST',
      array: list,
      currentIndex: i,
      variables: { temp: val, hasNext: i < list.length - 1 ? 'Yes' : 'NULL' },
    });
  });

  return { detectedLanguage: lang, algorithmType: 'Linked List Traversal', layoutType: 'LINKED_LIST', totalSteps: steps.length, steps };
}

// --------------------------------------------------------------------------
// Sub-Tracer: Sorting (Bars)
// --------------------------------------------------------------------------
function traceSorting(lines: string[], lang: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const numbers = extractNumbers(lines.join(' '));
  const arr = numbers.length >= 4 ? numbers.slice(0, 6) : [64, 34, 25, 12, 22, 11];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        stepIndex: steps.length,
        line: findLineNumber(lines, ['if', 'arr[j]', '>']),
        description: `Compare: ${arr[j]} > ${arr[j + 1]}?`,
        layout: 'BARS',
        array: [...arr],
        comparedIndices: [j, j + 1],
      });

      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;

        steps.push({
          stepIndex: steps.length,
          line: findLineNumber(lines, ['swap', 'arr[j + 1]', 'tmp']),
          description: `Swap: ${arr[j]} and ${arr[j + 1]}`,
          layout: 'BARS',
          array: [...arr],
          comparedIndices: [j, j + 1],
        });
      }
    }
  }

  return { detectedLanguage: lang, algorithmType: 'Sorting Algorithm', layoutType: 'BARS', totalSteps: steps.length, steps };
}

// --------------------------------------------------------------------------
// Sub-Tracer: Search & Grid (Binary / Linear Search)
// --------------------------------------------------------------------------
function traceArraySearch(lines: string[], lang: string, lower: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const numbers = extractNumbers(lines.join(' '));
  const arr = numbers.length >= 4 ? numbers.slice(0, 6) : [10, 20, 30, 40, 50, 60];
  const target = extractTarget(lines.join(' ')) ?? arr[Math.min(3, arr.length - 1)];

  if (lower.includes('mid') || lower.includes('binary')) {
    let low = 0;
    let high = arr.length - 1;
    let found = false;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      steps.push({
        stepIndex: steps.length,
        line: findLineNumber(lines, ['mid', '=', '/']),
        description: `Check mid index ${mid} (${arr[mid]}) == target ${target}`,
        layout: 'SEARCH_GRID',
        array: arr,
        currentIndex: mid,
        target,
        pointers: { low, high, mid },
      });

      if (arr[mid] === target) {
        steps.push({
          stepIndex: steps.length,
          line: findLineNumber(lines, ['return', 'found', 'break']),
          description: `TARGET FOUND! Element ${target} located at index ${mid}`,
          layout: 'SEARCH_GRID',
          array: arr,
          currentIndex: mid,
          foundIndex: mid,
          target,
          pointers: { low, high, mid },
        });
        found = true;
        break;
      } else if (arr[mid] < target) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return { detectedLanguage: lang, algorithmType: 'Binary Search', layoutType: 'SEARCH_GRID', totalSteps: steps.length, steps };
  } else {
    // Linear Search / Array Pointer Walk
    arr.forEach((val, i) => {
      const isMatch = val === target;
      steps.push({
        stepIndex: steps.length,
        line: findLineNumber(lines, ['if', '==', 'target', 'arr[i]']),
        description: `Inspecting index ${i}: Value ${val} == Target ${target}? ${isMatch ? 'MATCH!' : 'NO'}`,
        layout: 'SEARCH_GRID',
        array: arr,
        currentIndex: i,
        foundIndex: isMatch ? i : null,
        target,
      });
    });
    return { detectedLanguage: lang, algorithmType: 'Linear Search / Two Pointers', layoutType: 'SEARCH_GRID', totalSteps: steps.length, steps };
  }
}

// --------------------------------------------------------------------------
// Sub-Tracer: Generic Variable Memory Watcher
// --------------------------------------------------------------------------
function traceVariables(lines: string[], lang: string): SimulationResult {
  const steps: UniversalStep[] = [];
  lines.forEach((line, idx) => {
    if (line.trim().length > 0 && !line.trim().startsWith('//')) {
      steps.push({
        stepIndex: steps.length,
        line: idx + 1,
        description: `Step ${idx + 1}: Executing instruction -> ${line.trim()}`,
        layout: 'VARIABLE_WATCH',
        variables: { Line: idx + 1, Instruction: line.trim() },
      });
    }
  });

  return { detectedLanguage: lang, algorithmType: 'Control Flow Trace', layoutType: 'VARIABLE_WATCH', totalSteps: steps.length, steps };
}

// Helpers
function extractNumbers(str: string): number[] {
  const matches = str.match(/-?\b\d+\b/g);
  return matches ? matches.map(Number) : [];
}

function extractNodeValues(str: string): number[] {
  const matches = Array.from(str.matchAll(/(?:data|val)\s*=\s*([0-9]+)/gi));
  if (matches.length > 0) return matches.map(m => parseInt(m[1], 10));
  return extractNumbers(str).slice(0, 5);
}

function extractTarget(str: string): number | null {
  const match = str.match(/target\s*=\s*([0-9]+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function findLineNumber(lines: string[], keywords: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if (keywords.some(k => l.includes(k))) return i + 1;
  }
  return 1;
}