import { SimulationResult, UniversalStep, VisualLayoutType } from '../types';

export function simulateAnyCode(code: string): SimulationResult {
  const clean = code.trim();
  const lower = clean.toLowerCase();
  const lines = clean.split(/\r?\n/);

  // 1. Dynamic Data Extraction from user's pasted code
  const parsedNumbers = extractArrayNumbers(clean);
  const detectedTarget = extractTargetNumber(clean);

  // 2. Classify Algorithm Pattern dynamically based on code structure
  if (lower.includes('quick_sort') || lower.includes('quicksort') || (lower.includes('partition') && lower.includes('pivot'))) {
    return traceQuickSort(lines, parsedNumbers);
  }

  if (lower.includes('bubble') || (lower.includes('for') && (lower.includes('swap') || lower.includes('tmp')) && (lower.includes('[j + 1]') || lower.includes('[j+1]')))) {
    return traceBubbleSort(lines, parsedNumbers);
  }

  if (lower.includes('->next') || lower.includes('.next') || lower.includes('struct node') || lower.includes('class node')) {
    return traceLinkedList(lines, clean);
  }

  if (lower.includes('stack') || lower.includes('push(') || lower.includes('pop()') || lower.includes('queue') || lower.includes('enqueue')) {
    return traceStackQueue(lines, parsedNumbers, lower);
  }

  if (lower.includes('left') && lower.includes('right') && (lower.includes('root') || lower.includes('tree'))) {
    return traceTree(lines, parsedNumbers);
  }

  // Default: Dynamic Array Search / Scan using user's array and target
  return traceDynamicSearch(lines, parsedNumbers, detectedTarget, lower);
}

// ----------------------------------------------------
// Dynamic Bubble Sort
// ----------------------------------------------------
function traceBubbleSort(lines: string[], inputArr: number[]): SimulationResult {
  const steps: UniversalStep[] = [];
  const arr = inputArr.length >= 3 ? [...inputArr] : [2, 5, 8, 7, 3, 6, 1, 4];
  const sortedIndices: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  const lineIf = findLine(lines, ['if (a[j]', 'if(a[j]', 'if (arr[j]', 'if(arr[j]', 'if']);
  const lineSwap = findLine(lines, ['int tmp', 'tmp =', 'swap(', 'a[j] = tmp', 'arr[j] = tmp']);

  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      comparisons++;
      const isGreater = arr[j] > arr[j + 1];

      steps.push({
        stepIndex: steps.length,
        line: lineIf,
        description: `Comparing elements ${arr[j]} and ${arr[j + 1]}`,
        layout: 'SORTING_BUBBLE',
        array: [...arr],
        comparedIndices: [j, j + 1],
        sortedIndices: [...sortedIndices],
        comparisonsCount: comparisons,
        swapsCount: swaps,
        evalText: `${arr[j]} > ${arr[j + 1]}`,
        terminalFooter: `n = ${arr.length}  |  i = ${i}  |  j = ${j}  |  swapped = ${isGreater}`,
      });

      if (isGreater) {
        swaps++;
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;

        steps.push({
          stepIndex: steps.length,
          line: lineSwap,
          description: `Swapped: ${arr[j + 1]} ↔ ${arr[j]}`,
          layout: 'SORTING_BUBBLE',
          array: [...arr],
          comparedIndices: [j, j + 1],
          swappedIndices: [j, j + 1],
          sortedIndices: [...sortedIndices],
          comparisonsCount: comparisons,
          swapsCount: swaps,
          evalText: `swap(${arr[j]}, ${arr[j + 1]})`,
          terminalFooter: `n = ${arr.length}  |  i = ${i}  |  j = ${j}  |  swapped = true`,
        });
      }
    }
    sortedIndices.push(arr.length - 1 - i);
  }

  steps.push({
    stepIndex: steps.length,
    line: lines.length,
    description: `Array fully sorted! Total comparisons: ${comparisons}, swaps: ${swaps}`,
    layout: 'SORTING_BUBBLE',
    array: [...arr],
    sortedIndices: arr.map((_, idx) => idx),
    comparisonsCount: comparisons,
    swapsCount: swaps,
    terminalFooter: `SORT COMPLETED  |  COMPARISONS = ${comparisons}  |  SWAPS = ${swaps}`,
  });

  return { detectedLanguage: 'C', algorithmType: 'Bubble Sort', layoutType: 'SORTING_BUBBLE', totalSteps: steps.length, steps };
}

// ----------------------------------------------------
// Dynamic Quick Sort
// ----------------------------------------------------
function traceQuickSort(lines: string[], inputArr: number[]): SimulationResult {
  const steps: UniversalStep[] = [];
  const arr = inputArr.length >= 3 ? [...inputArr] : [2, 5, 8, 7, 3, 6, 1, 4];
  const sortedIndices: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  const linePivot = findLine(lines, ['int p =', 'pivot =', 'p = a[hi]', 'p = arr[hi]']);
  const lineIf = findLine(lines, ['if (a[j]', 'if(a[j]', 'if (arr[j]', 'if(arr[j]', 'if']);
  const lineSwap = findLine(lines, ['swap(&a[i]', 'swap(&arr[i]', 'swap(', 'tmp =']);

  const pivotIdx = arr.length - 1;
  const pivotVal = arr[pivotIdx];

  steps.push({
    stepIndex: steps.length,
    line: linePivot,
    description: `Selected pivot: value ${pivotVal} at index ${pivotIdx}`,
    layout: 'SORTING_QUICK',
    array: [...arr],
    pivotIndex: pivotIdx,
    sortedIndices: [],
    comparisonsCount: 0,
    swapsCount: 0,
    evalText: `pivot = ${pivotVal}`,
    terminalFooter: `lo = 0  |  hi = ${pivotIdx}  |  pivot = ${pivotVal}`,
  });

  let i = 0;
  for (let j = 0; j < arr.length - 1; j++) {
    comparisons++;
    const isSmaller = arr[j] < pivotVal;

    steps.push({
      stepIndex: steps.length,
      line: lineIf,
      description: `Comparing arr[${j}] (${arr[j]}) < pivot (${pivotVal})`,
      layout: 'SORTING_QUICK',
      array: [...arr],
      comparedIndices: [j, pivotIdx],
      pivotIndex: pivotIdx,
      sortedIndices: [...sortedIndices],
      comparisonsCount: comparisons,
      swapsCount: swaps,
      evalText: `${arr[j]} < ${pivotVal}`,
      terminalFooter: `i = ${i}  |  j = ${j}  |  pivot = ${pivotVal}`,
    });

    if (isSmaller) {
      if (i !== j) {
        swaps++;
        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;

        steps.push({
          stepIndex: steps.length,
          line: lineSwap,
          description: `Moving smaller element left: swap(${arr[j]}, ${arr[i]})`,
          layout: 'SORTING_QUICK',
          array: [...arr],
          swappedIndices: [i, j],
          pivotIndex: pivotIdx,
          sortedIndices: [...sortedIndices],
          comparisonsCount: comparisons,
          swapsCount: swaps,
          evalText: `swap(arr[${i}], arr[${j}])`,
          terminalFooter: `i = ${i}  |  j = ${j}  |  pivot = ${pivotVal}`,
        });
      }
      i++;
    }
  }

  swaps++;
  const t = arr[i];
  arr[i] = arr[pivotIdx];
  arr[pivotIdx] = t;
  sortedIndices.push(i);

  steps.push({
    stepIndex: steps.length,
    line: lineSwap,
    description: `Placed pivot ${pivotVal} in final position at index ${i}`,
    layout: 'SORTING_QUICK',
    array: [...arr],
    pivotIndex: i,
    sortedIndices: [...sortedIndices],
    comparisonsCount: comparisons,
    swapsCount: swaps,
    evalText: `swap(pivot, arr[${i}])`,
    terminalFooter: `PIVOT LOCKED AT INDEX ${i}`,
  });

  return { detectedLanguage: 'C', algorithmType: 'Quick Sort (Lomuto)', layoutType: 'SORTING_QUICK', totalSteps: steps.length, steps };
}

// ----------------------------------------------------
// Dynamic Linked List
// ----------------------------------------------------
function traceLinkedList(lines: string[], rawCode: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const nodeValMatches = Array.from(rawCode.matchAll(/(?:data|val)\s*=\s*([0-9]+)/gi));
  const list = nodeValMatches.length > 0 ? nodeValMatches.map((m) => parseInt(m[1], 10)) : [10, 20, 30];

  const lineWhile = findLine(lines, ['while (temp', 'while(temp', 'while']);
  const linePrint = findLine(lines, ['printf', 'cout', 'print', 'temp->data']);
  const lineNext = findLine(lines, ['temp = temp->next', 'temp=temp->next', 'temp.next']);

  list.forEach((val, i) => {
    // 1. Condition check
    steps.push({
      stepIndex: steps.length,
      line: lineWhile,
      description: `Checking condition: (temp != NULL) -> TRUE`,
      layout: 'LINKED_LIST',
      array: list,
      comparedIndices: [i, i],
      comparisonsCount: i + 1,
      swapsCount: 0,
      evalText: `temp != NULL`,
      terminalFooter: `temp = Node(${val})  |  data = ${val}`,
    });

    // 2. Action / Print
    steps.push({
      stepIndex: steps.length,
      line: linePrint,
      description: `Printing node value: ${val}`,
      layout: 'LINKED_LIST',
      array: list,
      comparedIndices: [i, i],
      comparisonsCount: i + 1,
      swapsCount: 0,
      evalText: `printf("%d", ${val})`,
      terminalFooter: `temp = Node(${val})  |  printed: ${val} ->`,
    });

    // 3. Move pointer
    steps.push({
      stepIndex: steps.length,
      line: lineNext,
      description: i < list.length - 1 ? `temp moves to next node (${list[i + 1]})` : `temp = NULL`,
      layout: 'LINKED_LIST',
      array: list,
      comparedIndices: [i < list.length - 1 ? i + 1 : i, i < list.length - 1 ? i + 1 : i],
      comparisonsCount: i + 1,
      swapsCount: 0,
      evalText: `temp = temp->next`,
      terminalFooter: i < list.length - 1 ? `next = Node(${list[i + 1]})` : `next = NULL`,
    });
  });

  return { detectedLanguage: 'C', algorithmType: 'Linked List Traversal', layoutType: 'LINKED_LIST', totalSteps: steps.length, steps };
}

// ----------------------------------------------------
// Dynamic Stack / Queue
// ----------------------------------------------------
function traceStackQueue(lines: string[], inputArr: number[], lower: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const isQueue = lower.includes('queue');
  const items = inputArr.length > 0 ? [...inputArr] : [10, 20, 30, 40];
  const currentStack: number[] = [];

  const linePush = findLine(lines, ['push', 'enqueue', 'add', 'insert']);
  const linePop = findLine(lines, ['pop', 'dequeue', 'remove']);

  items.forEach((val, idx) => {
    currentStack.push(val);
    steps.push({
      stepIndex: steps.length,
      line: linePush,
      description: isQueue ? `Enqueued ${val} into Queue` : `Pushed ${val} onto Stack`,
      layout: 'STACK_QUEUE',
      array: [...currentStack],
      comparedIndices: [currentStack.length - 1, currentStack.length - 1],
      comparisonsCount: idx + 1,
      swapsCount: 0,
      evalText: isQueue ? `enqueue(${val})` : `push(${val})`,
      terminalFooter: `size = ${currentStack.length}  |  top = ${val}`,
    });
  });

  if (currentStack.length > 0) {
    const popped = isQueue ? currentStack.shift() : currentStack.pop();
    steps.push({
      stepIndex: steps.length,
      line: linePop,
      description: isQueue ? `Dequeued ${popped}` : `Popped ${popped} from Stack`,
      layout: 'STACK_QUEUE',
      array: [...currentStack],
      comparedIndices: [Math.max(0, currentStack.length - 1), Math.max(0, currentStack.length - 1)],
      comparisonsCount: steps.length,
      swapsCount: 1,
      evalText: isQueue ? `dequeue() -> ${popped}` : `pop() -> ${popped}`,
      terminalFooter: `size = ${currentStack.length}  |  removed = ${popped}`,
    });
  }

  return { detectedLanguage: 'C', algorithmType: isQueue ? 'Queue' : 'Stack', layoutType: 'STACK_QUEUE', totalSteps: steps.length, steps };
}

// ----------------------------------------------------
// Dynamic Binary Tree
// ----------------------------------------------------
function traceTree(lines: string[], inputArr: number[]): SimulationResult {
  const steps: UniversalStep[] = [];
  const arr = inputArr.length >= 3 ? inputArr.slice(0, 7) : [50, 30, 70, 20, 40, 60, 80];
  const lineNode = findLine(lines, ['root', 'insert', 'node', 'malloc']);

  arr.forEach((val, idx) => {
    steps.push({
      stepIndex: steps.length,
      line: lineNode,
      description: `Inserted / Visited tree node: ${val}`,
      layout: 'TREE',
      array: arr.slice(0, idx + 1),
      comparedIndices: [idx, idx],
      comparisonsCount: idx + 1,
      swapsCount: 0,
      evalText: `insert(${val})`,
      terminalFooter: `node = ${val}  |  totalNodes = ${idx + 1}`,
    });
  });

  return { detectedLanguage: 'C', algorithmType: 'Binary Search Tree', layoutType: 'TREE', totalSteps: steps.length, steps };
}

// ----------------------------------------------------
// Dynamic Array Search
// ----------------------------------------------------
function traceDynamicSearch(lines: string[], inputArr: number[], targetVal: number | null, lower: string): SimulationResult {
  const steps: UniversalStep[] = [];
  const arr = inputArr.length >= 2 ? [...inputArr] : [6, 13, 19, 27, 32, 41, 46, 53, 59, 64, 70, 78, 84, 91, 96];
  const target = targetVal !== null ? targetVal : arr[Math.floor(arr.length / 2)];

  const isBinary = lower.includes('mid') || lower.includes('binary');
  const lineIf = findLine(lines, ['if (a[', 'if(a[', 'if (arr[', 'if(arr[', 'if']);

  if (isBinary) {
    let low = 0;
    let high = arr.length - 1;
    let compCount = 0;

    while (low <= high) {
      compCount++;
      const mid = Math.floor((low + high) / 2);
      const isMatch = arr[mid] === target;

      steps.push({
        stepIndex: steps.length,
        line: lineIf,
        description: `Inspecting mid index ${mid}: ${arr[mid]} == ${target}`,
        layout: 'SEARCH_GRID',
        array: [...arr],
        comparedIndices: [mid, mid],
        target,
        sortedIndices: isMatch ? [mid] : [],
        comparisonsCount: compCount,
        swapsCount: 0,
        evalText: `${arr[mid]} == ${target}`,
        terminalFooter: `low = ${low}  |  mid = ${mid}  |  high = ${high}`,
      });

      if (isMatch) break;
      if (arr[mid] < target) low = mid + 1;
      else high = mid - 1;
    }

    return { detectedLanguage: 'C', algorithmType: 'Binary Search', layoutType: 'SEARCH_GRID', totalSteps: steps.length, steps };
  }

  // Linear Scan
  for (let idx = 0; idx < arr.length; idx++) {
    const isMatch = arr[idx] === target;
    steps.push({
      stepIndex: steps.length,
      line: lineIf,
      description: `Checking index ${idx}: ${arr[idx]} == ${target}?`,
      layout: 'SEARCH_GRID',
      array: [...arr],
      comparedIndices: [idx, idx],
      target,
      sortedIndices: isMatch ? [idx] : [],
      comparisonsCount: idx + 1,
      swapsCount: 0,
      evalText: `${arr[idx]} == ${target}`,
      terminalFooter: `i = ${idx}  |  target = ${target}  |  match = ${isMatch}`,
    });
    if (isMatch) break;
  }

  return { detectedLanguage: 'C', algorithmType: 'Linear Search', layoutType: 'SEARCH_GRID', totalSteps: steps.length, steps };
}

// ----------------------------------------------------
// Helper Functions to Extract User Code Values
// ----------------------------------------------------
function extractArrayNumbers(code: string): number[] {
  // Matches { 2, 5, 8 } or [ 2, 5, 8 ]
  const arrayLiteralMatch = code.match(/[{[]\s*([0-9,\s\-]+)\s*[}\]]/);
  if (arrayLiteralMatch && arrayLiteralMatch[1]) {
    const nums = arrayLiteralMatch[1]
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));
    if (nums.length > 0) return nums;
  }

  // Fallback: extract all standalone numbers (excluding loop bounds like 0, 1)
  const allNums = Array.from(code.matchAll(/\b([0-9]+)\b/g))
    .map((m) => parseInt(m[1], 10))
    .filter((n) => n > 1);

  return allNums.length >= 3 ? Array.from(new Set(allNums)).slice(0, 10) : [];
}

function extractTargetNumber(code: string): number | null {
  const match = code.match(/(?:target|x|val|key)\s*=\s*([0-9]+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function findLine(lines: string[], keywords: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if (keywords.some((k) => l.includes(k.toLowerCase()))) return i + 1;
  }
  return 1;
}