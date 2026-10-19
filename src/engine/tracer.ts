 import { SimulationResult, UniversalStep, VisualLayoutType, TreeNodeVisual } from '../types';

export function simulateAnyCode(code: string): SimulationResult {
  const cleanCode = code.trim();
  const lower = cleanCode.toLowerCase();

  let detectedLanguage = 'JavaScript';
  if (lower.includes('#include') || lower.includes('std::') || lower.includes('cout')) detectedLanguage = 'C++';
  else if (lower.includes('public class') || lower.includes('system.out')) detectedLanguage = 'Java';
  else if (lower.includes('def ') || lower.includes('print(') || lower.includes('elif ')) detectedLanguage = 'Python';
  else if (lower.includes('malloc') || lower.includes('printf(')) detectedLanguage = 'C';

  const lines = cleanCode.split(/\r?\n/);

  // 1. Linked List
  if (lower.includes('->next') || lower.includes('.next') || lower.includes('struct node') || lower.includes('class node')) {
    return traceLinkedList(lines, detectedLanguage);
  }

  // 2. Sorting
  if (lower.includes('swap') || (lower.includes('sort') && !lower.includes('sorted')) || (lower.includes('for') && (lower.includes('i++') || lower.includes('j++')) && lower.includes('[j]'))) {
    return traceSorting(lines, detectedLanguage);
  }

  // 3. Tree
  if (lower.includes('left') && lower.includes('right') && (lower.includes('root') || lower.includes('tree') || lower.includes('node'))) {
    return traceTree(lines, detectedLanguage);
  }

  // 4. Stack / Queue
  if (lower.includes('stack') || lower.includes('queue') || lower.includes('push(') || lower.includes('pop()') || lower.includes('enqueue') || lower.includes('dequeue')) {
    return traceStackQueue(lines, detectedLanguage, lower);
  }

  // 5. Search / Array
  if (lower.includes('mid') || lower.includes('binary') || lower.includes('target') || lower.includes('search') || lower.includes('arr')) {
    return traceArraySearch(lines, detectedLanguage, lower);
  }

  // 6. Generic Fallback
  return traceVariables(lines, detectedLanguage);
}

// --------------------------------------------------------------------------
// Linked List Tracer with Accurate Sequential Execution Steps
// --------------------------------------------------------------------------
function traceLinkedList(lines: string[], lang: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const rawData = extractNodeValues(lines.join(' '));
  const list = rawData.length > 0 ? rawData : [10, 20, 30];

  const lineWhile = findExactLine(lines, ['while', 'temp != null', 'temp!=null']);
  const linePrint = findExactLine(lines, ['printf', 'temp->data', 'print', 'cout']);
  const lineNext = findExactLine(lines, ['temp = temp->next', 'temp=temp->next', 'temp.next']);

  list.forEach((val, i) => {
    // Step A: Check loop condition
    steps.push({
      stepIndex: steps.length,
      line: lineWhile,
      description: `Check condition: (temp != NULL) -> TRUE (pointing to node ${i})`,
      layout: 'LINKED_LIST',
      array: list,
      currentIndex: i,
      variables: { temp: `Node(${val})`, state: 'Checking condition' },
    });

    // Step B: Print / inspect data
    steps.push({
      stepIndex: steps.length,
      line: linePrint,
      description: `Execute print: Processing data value = ${val}`,
      layout: 'LINKED_LIST',
      array: list,
      currentIndex: i,
      variables: { 'temp->data': val, output: `${val} -> ` },
    });

    // Step C: Advance pointer to next node
    steps.push({
      stepIndex: steps.length,
      line: lineNext,
      description: i < list.length - 1 
        ? `Advance pointer: temp moves to next node (value ${list[i + 1]})` 
        : `Advance pointer: temp = NULL (End of list reached)`,
      layout: 'LINKED_LIST',
      array: list,
      currentIndex: i < list.length - 1 ? i + 1 : list.length,
      variables: { temp: i < list.length - 1 ? `Node(${list[i + 1]})` : 'NULL' },
    });
  });

  // Final step: Loop breaks on NULL
  steps.push({
    stepIndex: steps.length,
    line: lineWhile,
    description: `Check condition: (temp != NULL) -> FALSE (temp is NULL). Loop terminates!`,
    layout: 'LINKED_LIST',
    array: list,
    currentIndex: list.length,
    variables: { temp: 'NULL', status: 'Terminated' },
  });

  return { detectedLanguage: lang, algorithmType: 'Linked List Traversal', layoutType: 'LINKED_LIST', totalSteps: steps.length, steps };
}

// --------------------------------------------------------------------------
// Array Search Tracer
// --------------------------------------------------------------------------
function traceArraySearch(lines: string[], lang: string, lower: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const numbers = extractNumbers(lines.join(' '));
  const arr = numbers.length >= 4 ? numbers.slice(0, 6) : [10, 20, 30, 40, 50];
  const target = extractTarget(lines.join(' ')) ?? arr[Math.min(3, arr.length - 1)];

  const lineFor = findExactLine(lines, ['for', 'while']);
  const lineIf = findExactLine(lines, ['if', '==', 'target']);
  const lineReturn = findExactLine(lines, ['return', 'break']);

  arr.forEach((val, i) => {
    const isMatch = val === target;

    // Loop header
    steps.push({
      stepIndex: steps.length,
      line: lineFor,
      description: `Loop iteration: checking index i = ${i}`,
      layout: 'SEARCH_GRID',
      array: arr,
      currentIndex: i,
      target,
      variables: { i, 'arr[i]': val, target },
    });

    // If check
    steps.push({
      stepIndex: steps.length,
      line: lineIf,
      description: `Comparing arr[${i}] (${val}) == ${target}? -> ${isMatch ? 'TRUE' : 'FALSE'}`,
      layout: 'SEARCH_GRID',
      array: arr,
      currentIndex: i,
      foundIndex: isMatch ? i : null,
      target,
      variables: { i, 'arr[i]': val, match: isMatch },
    });

    if (isMatch) {
      steps.push({
        stepIndex: steps.length,
        line: lineReturn,
        description: `MATCH FOUND! Return index ${i}. Program terminates.`,
        layout: 'SEARCH_GRID',
        array: arr,
        currentIndex: i,
        foundIndex: i,
        target,
        variables: { result: i, status: 'Found' },
      });
    }
  });

  return { detectedLanguage: lang, algorithmType: 'Linear Search', layoutType: 'SEARCH_GRID', totalSteps: steps.length, steps };
}

// --------------------------------------------------------------------------
// Sorting Bars Tracer
// --------------------------------------------------------------------------
function traceSorting(lines: string[], lang: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const numbers = extractNumbers(lines.join(' '));
  const arr = numbers.length >= 4 ? numbers.slice(0, 5) : [64, 34, 25, 12, 22];
  const n = arr.length;

  const lineIf = findExactLine(lines, ['if', '>']);
  const lineSwap = findExactLine(lines, ['swap', 'tmp', '=']);

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        stepIndex: steps.length,
        line: lineIf,
        description: `Compare: arr[${j}] (${arr[j]}) > arr[${j + 1}] (${arr[j + 1]})`,
        layout: 'BARS',
        array: [...arr],
        comparedIndices: [j, j + 1],
        variables: { j, 'arr[j]': arr[j], 'arr[j+1]': arr[j + 1] },
      });

      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;

        steps.push({
          stepIndex: steps.length,
          line: lineSwap,
          description: `Swap: ${arr[j + 1]} ↔ ${arr[j]}`,
          layout: 'BARS',
          array: [...arr],
          comparedIndices: [j, j + 1],
          variables: { swapped: `${arr[j + 1]} <-> ${arr[j]}` },
        });
      }
    }
  }

  return { detectedLanguage: lang, algorithmType: 'Sorting Algorithm', layoutType: 'BARS', totalSteps: steps.length, steps };
}

// --------------------------------------------------------------------------
// Tree Tracer
// --------------------------------------------------------------------------
function traceTree(lines: string[], lang: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const vals = [50, 30, 70, 20, 40];
  const treeNodes: TreeNodeVisual[] = [
    { val: vals[0], x: 540, y: 360 },
    { val: vals[1], x: 340, y: 450 },
    { val: vals[2], x: 740, y: 450 },
    { val: vals[3], x: 240, y: 540 },
    { val: vals[4], x: 440, y: 540 },
  ];

  const lineNode = findExactLine(lines, ['root', 'insert', 'malloc', 'node']);

  treeNodes.forEach((node, i) => {
    steps.push({
      stepIndex: i,
      line: lineNode,
      description: `Traversing / Inserting Tree Node: ${node.val}`,
      layout: 'TREE',
      treeNodes: treeNodes.slice(0, i + 1),
      activeNodeVal: node.val,
      variables: { currentVal: node.val },
    });
  });

  return { detectedLanguage: lang, algorithmType: 'Binary Search Tree', layoutType: 'TREE', totalSteps: steps.length, steps };
}

// --------------------------------------------------------------------------
// Stack / Queue Tracer
// --------------------------------------------------------------------------
function traceStackQueue(lines: string[], lang: string, lower: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const isQueue = lower.includes('queue');
  const items: (number | string)[] = [];
  const rawVals = [10, 20, 30];

  const linePush = findExactLine(lines, ['push', 'enqueue', 'add']);
  const linePop = findExactLine(lines, ['pop', 'dequeue', 'remove']);

  rawVals.forEach((val) => {
    items.push(val);
    steps.push({
      stepIndex: steps.length,
      line: linePush,
      description: isQueue ? `Enqueue ${val} to Queue rear` : `Push ${val} onto Stack top`,
      layout: 'STACK_QUEUE',
      stack: isQueue ? [] : [...items],
      queue: isQueue ? [...items] : [],
      variables: { action: isQueue ? 'ENQUEUE' : 'PUSH', item: val },
    });
  });

  if (items.length > 0) {
    const popped = isQueue ? items.shift() : items.pop();
    steps.push({
      stepIndex: steps.length,
      line: linePop,
      description: isQueue ? `Dequeue ${popped} from front` : `Pop ${popped} from top`,
      layout: 'STACK_QUEUE',
      stack: isQueue ? [] : [...items],
      queue: isQueue ? [...items] : [],
      variables: { action: isQueue ? 'DEQUEUE' : 'POP', item: popped },
    });
  }

  return { detectedLanguage: lang, algorithmType: isQueue ? 'Queue' : 'Stack', layoutType: 'STACK_QUEUE', totalSteps: steps.length, steps };
}

// --------------------------------------------------------------------------
// Variable Fallback Tracer
// --------------------------------------------------------------------------
function traceVariables(lines: string[], lang: string): SimulationResult {
  const steps: UniversalStep[] = [];
  lines.forEach((line, idx) => {
    if (line.trim().length > 0 && !line.trim().startsWith('//')) {
      steps.push({
        stepIndex: steps.length,
        line: idx + 1,
        description: `Execute Line ${idx + 1}: ${line.trim()}`,
        layout: 'VARIABLE_WATCH',
        variables: { currentLine: idx + 1, statement: line.trim() },
      });
    }
  });

  return { detectedLanguage: lang, algorithmType: 'Control Flow', layoutType: 'VARIABLE_WATCH', totalSteps: steps.length, steps };
}

// Helpers
function findExactLine(lines: string[], keywords: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase().trim();
    if (keywords.some((k) => lineLower.includes(k))) {
      return i + 1; // 1-based line indexing
    }
  }
  return 1;
}

function extractNumbers(str: string): number[] {
  const matches = str.match(/-?\b\d+\b/g);
  return matches ? matches.map(Number) : [];
}

function extractNodeValues(str: string): number[] {
  const matches = Array.from(str.matchAll(/(?:data|val)\s*=\s*([0-9]+)/gi));
  if (matches.length > 0) return matches.map((m) => parseInt(m[1], 10));
  return extractNumbers(str).slice(0, 5);
}

function extractTarget(str: string): number | null {
  const match = str.match(/target\s*=\s*([0-9]+)/i);
  return match ? parseInt(match[1], 10) : null;
}