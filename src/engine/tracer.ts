import { SimulationResult, UniversalStep } from "../types";

export async function simulateAnyCode(
  sourceCode: string,
  apiKey?: string
): Promise<SimulationResult> {
  const lines = sourceCode.split("\n");
  const steps: UniversalStep[] = [];
  let stepCounter = 0;

  // 1. Language Detection
  let detectedLanguage = "C / C++";
  if (sourceCode.includes("#include") || sourceCode.includes("std::")) detectedLanguage = "C / C++";
  else if (sourceCode.includes("class ") || sourceCode.includes("System.out") || sourceCode.includes("int[]") || sourceCode.includes("ListNode")) detectedLanguage = "Java";
  else if (sourceCode.includes("def ") || (sourceCode.includes("print(") && !sourceCode.includes(";"))) detectedLanguage = "Python";
  else if (sourceCode.includes("func ") || sourceCode.includes("package main")) detectedLanguage = "Go";
  else if (sourceCode.includes("let ") || sourceCode.includes("const ") || sourceCode.includes("console.log")) detectedLanguage = "JavaScript";

  const findLine = (pattern: RegExp, defaultL: number) => {
    const idx = lines.findIndex((l) => pattern.test(l));
    return idx !== -1 ? idx + 1 : defaultL;
  };

  // 2. Dynamic Target Extractor
  let target = 40;
  const targetMatch = sourceCode.match(/(?:key|target|search|val|x|item|find)\s*=\s*(\d+)/i);
  if (targetMatch && targetMatch[1]) {
    target = parseInt(targetMatch[1], 10);
  } else {
    const conditionMatch = sourceCode.match(/==\s*([a-zA-Z0-9_]+)/);
    if (conditionMatch && conditionMatch[1]) {
      const varName = conditionMatch[1];
      const valMatch = sourceCode.match(new RegExp(`${varName}\\s*=\\s*(\\d+)`));
      if (valMatch && valMatch[1]) {
        target = parseInt(valMatch[1], 10);
      }
    }
  }

  // 3. Dynamic Array Extractor
  let numbers = [10, 20, 30, 40, 50];
  const arrayMatch = sourceCode.match(/=\s*[\{\[]\s*([\d\s,]+)\s*[\}\]]/);
  if (arrayMatch && arrayMatch[1]) {
    const parsed = arrayMatch[1]
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (parsed.length > 0) numbers = parsed;
  }

  // 4. Algorithm Classification
  const isBinarySearch = /binary.*search|low\s*<=|mid\s*=|left\s*<=/i.test(sourceCode);
  const isLinearSearch = (/search|target|indexOf|find|key/i.test(sourceCode) || sourceCode.includes("==")) && !isBinarySearch && !sourceCode.includes("swap") && !sourceCode.includes(">");
  const isSorting = /sort|arr[j]\s*>\s*arr|swap\(|temp\s*=\s*arr|a[j]\s*>\s*a/i.test(sourceCode);
  const isLinkedList = /node|next|head|linkedlist|val/i.test(sourceCode) && !sourceCode.includes("a[") && !sourceCode.includes("arr[");

  // ==========================================
  // CASE 1: FULL STEP-BY-STEP BINARY SEARCH
  // ==========================================
  if (isBinarySearch) {
    const sorted = [...numbers].sort((a, b) => a - b);
    let low = 0;
    let high = sorted.length - 1;
    let mid = -1;

    const lineInitArr = findLine(/a\[.*\]\s*=|arr\s*=/i, 4);
    const lineInitPointers = findLine(/low\s*=/i, 7);
    const lineWhile = findLine(/while\s*\(.*low\s*<=/i, 18);
    const lineMid = findLine(/mid\s*=/i, 19);
    const lineIfEq = findLine(/if\s*\(.*==/i, 21);
    const lineFound = findLine(/found\s*=\s*1|break/i, 23);
    const lineElseIf = findLine(/else\s*if\s*\(.*</i, 26);
    const lineLowMove = findLine(/low\s*=\s*mid\s*\+\s*1/i, 27);
    const lineHighMove = findLine(/high\s*=\s*mid\s*-\s*1/i, 30);

    // Step 1: Initialize Array
    steps.push({
      stepIndex: stepCounter++,
      line: lineInitArr,
      description: `Initialized array: [${sorted.join(", ")}]`,
      layout: "SEARCH_GRID",
      searchGrid: {
        target,
        cells: sorted.map((v, idx) => ({
          index: idx,
          value: v,
          state: "default"
        }))
      },
      pointers: [{ name: "target", value: target }]
    });

    // Step 2: Initialize Pointers
    steps.push({
      stepIndex: stepCounter++,
      line: lineInitPointers,
      description: `Set search boundaries: low = 0, high = ${high}`,
      layout: "SEARCH_GRID",
      searchGrid: {
        target,
        cells: sorted.map((v, idx) => ({
          index: idx,
          value: v,
          state: "default",
          pointerLabel: idx === 0 ? "low" : idx === high ? "high" : undefined
        }))
      },
      pointers: [
        { name: "low", value: low },
        { name: "high", value: high },
        { name: "target", value: target }
      ]
    });

    while (low <= high) {
      // Step: Check while condition
      steps.push({
        stepIndex: stepCounter++,
        line: lineWhile,
        description: `Check while (${low} <= ${high}) -> Condition TRUE`,
        layout: "SEARCH_GRID",
        searchGrid: {
          target,
          cells: sorted.map((v, idx) => ({
            index: idx,
            value: v,
            state: idx >= low && idx <= high ? "default" : "checked",
            pointerLabel: idx === low ? "low" : idx === high ? "high" : undefined
          }))
        },
        pointers: [
          { name: "low", value: low },
          { name: "high", value: high },
          { name: "target", value: target }
        ]
      });

      // Step: Calculate mid
      mid = Math.floor((low + high) / 2);
      steps.push({
        stepIndex: stepCounter++,
        line: lineMid,
        description: `Calculate mid = (${low} + ${high}) / 2 = ${mid}`,
        layout: "SEARCH_GRID",
        searchGrid: {
          target,
          cells: sorted.map((v, idx) => ({
            index: idx,
            value: v,
            state: idx === mid ? "active" : idx >= low && idx <= high ? "default" : "checked",
            pointerLabel: idx === mid ? "mid" : idx === low ? "low" : idx === high ? "high" : undefined
          }))
        },
        pointers: [
          { name: "low", value: low },
          { name: "mid", value: mid },
          { name: "high", value: high },
          { name: "target", value: target }
        ]
      });

      // Step: Check if a[mid] == key
      const isMatch = sorted[mid] === target;
      steps.push({
        stepIndex: stepCounter++,
        line: lineIfEq,
        description: `Check: arr[${mid}] (${sorted[mid]}) == target (${target})? -> ${isMatch ? "TRUE!" : "FALSE"}`,
        layout: "SEARCH_GRID",
        searchGrid: {
          target,
          cells: sorted.map((v, idx) => ({
            index: idx,
            value: v,
            state: idx === mid ? (isMatch ? "found" : "active") : idx >= low && idx <= high ? "default" : "checked",
            pointerLabel: idx === mid ? "mid" : idx === low ? "low" : idx === high ? "high" : undefined
          }))
        },
        pointers: [
          { name: "low", value: low },
          { name: "mid", value: mid },
          { name: "high", value: high },
          { name: "target", value: target }
        ]
      });

      if (isMatch) {
        // Step: Match action
        steps.push({
          stepIndex: stepCounter++,
          line: lineFound,
          description: `Element ${target} FOUND at index ${mid} (Position ${mid + 1})! Break loop.`,
          layout: "SEARCH_GRID",
          searchGrid: {
            target,
            cells: sorted.map((v, idx) => ({
              index: idx,
              value: v,
              state: idx === mid ? "found" : "checked",
              pointerLabel: idx === mid ? "found" : undefined
            }))
          },
          pointers: [
            { name: "found_at", value: mid },
            { name: "target", value: target }
          ]
        });
        break;
      }

      // Step: Check else if (a[mid] < key)
      const isLess = sorted[mid] < target;
      steps.push({
        stepIndex: stepCounter++,
        line: lineElseIf,
        description: `Check else if: arr[${mid}] (${sorted[mid]}) < ${target}? -> ${isLess ? "TRUE" : "FALSE"}`,
        layout: "SEARCH_GRID",
        searchGrid: {
          target,
          cells: sorted.map((v, idx) => ({
            index: idx,
            value: v,
            state: idx === mid ? "active" : idx >= low && idx <= high ? "default" : "checked",
            pointerLabel: idx === mid ? "mid" : undefined
          }))
        },
        pointers: [
          { name: "low", value: low },
          { name: "mid", value: mid },
          { name: "high", value: high }
        ]
      });

      if (isLess) {
        low = mid + 1;
        steps.push({
          stepIndex: stepCounter++,
          line: lineLowMove,
          description: `Since ${sorted[mid]} < ${target}, eliminate left half. Move low = ${low}`,
          layout: "SEARCH_GRID",
          searchGrid: {
            target,
            cells: sorted.map((v, idx) => ({
              index: idx,
              value: v,
              state: idx >= low && idx <= high ? "default" : "checked",
              pointerLabel: idx === low ? "low" : idx === high ? "high" : undefined
            }))
          },
          pointers: [
            { name: "low", value: low },
            { name: "high", value: high },
            { name: "target", value: target }
          ]
        });
      } else {
        high = mid - 1;
        steps.push({
          stepIndex: stepCounter++,
          line: lineHighMove,
          description: `Since ${sorted[mid]} > ${target}, eliminate right half. Move high = ${high}`,
          layout: "SEARCH_GRID",
          searchGrid: {
            target,
            cells: sorted.map((v, idx) => ({
              index: idx,
              value: v,
              state: idx >= low && idx <= high ? "default" : "checked",
              pointerLabel: idx === low ? "low" : idx === high ? "high" : undefined
            }))
          },
          pointers: [
            { name: "low", value: low },
            { name: "high", value: high },
            { name: "target", value: target }
          ]
        });
      }
    }

    return { detectedLanguage, algorithmType: "Binary Search", totalSteps: steps.length, steps };
  }

  // ==========================================
  // CASE 2: LINEAR SEARCH
  // ==========================================
  if (isLinearSearch) {
    const lineLoop = findLine(/for|while/i, 4);
    const lineIf = findLine(/if/i, 6);

    for (let i = 0; i < numbers.length; i++) {
      const match = numbers[i] === target;
      steps.push({
        stepIndex: stepCounter++,
        line: lineIf,
        description: `Inspecting index ${i}: Value ${numbers[i]} == Target ${target}? ${match ? "MATCH FOUND!" : "NO"}`,
        layout: "SEARCH_GRID",
        searchGrid: {
          target,
          cells: numbers.map((v, idx) => ({
            index: idx,
            value: v,
            state: idx === i ? (match ? "found" : "active") : idx < i ? "checked" : "default",
            pointerLabel: idx === i ? "curr" : undefined
          }))
        },
        pointers: [
          { name: "index", value: i },
          { name: "target", value: target }
        ]
      });
      if (match) break;
    }

    return { detectedLanguage, algorithmType: "Linear Search", totalSteps: steps.length, steps };
  }

  // ==========================================
  // CASE 3: SORTING
  // ==========================================
  if (isSorting) {
    const arr = [...numbers];
    const n = arr.length;
    const lineIf = findLine(/if|>/i, 7);
    const lineSwap = findLine(/temp|swap|=/i, 9);

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        steps.push({
          stepIndex: stepCounter++,
          line: lineIf,
          description: `Comparing [${arr[j]}] and [${arr[j + 1]}]`,
          layout: "BARS",
          bars: arr.map((val, idx) => ({
            value: val,
            state: idx === j || idx === j + 1 ? "active" : "normal"
          })),
          pointers: [
            { name: "i", value: i },
            { name: "j", value: j }
          ]
        });

        if (arr[j] > arr[j + 1]) {
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;

          steps.push({
            stepIndex: stepCounter++,
            line: lineSwap,
            description: `Swapped: ${arr[j + 1]} ↔ ${arr[j]}`,
            layout: "BARS",
            bars: arr.map((val, idx) => ({
              value: val,
              state: idx === j || idx === j + 1 ? "swap" : "normal"
            })),
            pointers: [
              { name: "i", value: i },
              { name: "j", value: j },
              { name: "temp", value: temp }
            ]
          });
        }
      }
    }

    return { detectedLanguage, algorithmType: "Bubble Sort", totalSteps: steps.length, steps };
  }

  // ==========================================
  // CASE 4: LINKED LIST
  // ==========================================
  if (isLinkedList) {
    const listVals = [10, 20, 30, 40, 50];
    const lineHead = findLine(/head|ListNode/i, 2);
    const lineLoop = findLine(/while|for/i, 4);

    for (let i = 0; i < listVals.length; i++) {
      const isTarget = listVals[i] === target;
      steps.push({
        stepIndex: stepCounter++,
        line: lineLoop,
        description: `Traverse to node [${i}]: val = ${listVals[i]}`,
        layout: "LINKED_LIST",
        linkedList: listVals.map((v, idx) => ({
          value: v,
          next: idx < listVals.length - 1,
          state: idx === i ? (isTarget ? "target" : "active") : "normal"
        })),
        pointers: [{ name: "curr.val", value: listVals[i] }]
      });
      if (isTarget) break;
    }

    return { detectedLanguage, algorithmType: "Linked List", totalSteps: steps.length, steps };
  }

  // Default: Step-by-step generic flow
  steps.push({
    stepIndex: stepCounter++,
    line: 1,
    description: "Executing standard control flow",
    layout: "POINTERS",
    pointers: [{ name: "status", value: "RUNNING" }]
  });

  return { detectedLanguage, algorithmType: "Control Flow", totalSteps: steps.length, steps };
}