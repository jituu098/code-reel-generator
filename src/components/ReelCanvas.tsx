import React, { useEffect } from "react";
import { UniversalStep, LinkedListNode, SearchCell } from "../types";

interface ReelCanvasProps {
  currentStep: UniversalStep | null;
  code: string;
  language: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const ReelCanvas: React.FC<ReelCanvasProps> = ({
  currentStep,
  code,
  language,
  canvasRef
}) => {
  const codeLines = code.split("\n");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, W, H);

    // Top Badge & Title
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(70, 70, 360, 56, 14);
    ctx.fill();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(language.toUpperCase(), 250, 108);

    // Status Banner
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(70, 150, W - 140, 80, 16);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "left";
    const caption = currentStep
      ? `Step ${currentStep.stepIndex + 1}: ${currentStep.description}`
      : "Ready";
    ctx.fillText(caption, 100, 200);

    // Variable Pills
    if (currentStep?.pointers && currentStep.pointers.length > 0) {
      renderMiniPills(ctx, currentStep.pointers, W, 255);
    }

    // Dynamic Visualizer Area
    if (currentStep?.layout === "LINKED_LIST" && currentStep.linkedList) {
      renderLinkedList(ctx, currentStep.linkedList, W, 680);
    } else if (currentStep?.layout === "SEARCH_GRID" && currentStep.searchGrid) {
      renderSearchGrid(ctx, currentStep.searchGrid.cells, currentStep.searchGrid.target, W, 680);
    } else if (currentStep?.layout === "BARS" && currentStep.bars) {
      renderBars(ctx, currentStep.bars, W, 720);
    } else if (currentStep?.layout === "STACK" && currentStep.stack) {
      renderStack(ctx, currentStep.stack, W, 740);
    }

    // Code Frame
    const codeBoxY = 1040;
    const codeBoxH = 780;
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.roundRect(70, codeBoxY, W - 140, codeBoxH, 24);
    ctx.fill();
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Code Lines Auto-Scroll
    const maxVisibleLines = 15;
    const totalLines = codeLines.length;
    const activeLineNumber = currentStep ? currentStep.line : 1;

    let startIndex = Math.max(0, activeLineNumber - Math.floor(maxVisibleLines / 2) - 1);
    if (startIndex + maxVisibleLines > totalLines) {
      startIndex = Math.max(0, totalLines - maxVisibleLines);
    }
    const visibleLines = codeLines.slice(startIndex, startIndex + maxVisibleLines);

    const lineHeight = 48;
    const codeStartY = codeBoxY + 60;

    // Code Line Rendering with Dedicated Number Column
    visibleLines.forEach((lineText, idx) => {
      const lineNum = startIndex + idx + 1;
      const y = codeStartY + idx * lineHeight;
      const isActive = lineNum === activeLineNumber;

      if (isActive) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
        ctx.fillRect(74, y - 32, W - 148, lineHeight);

        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(74, y - 32, 8, lineHeight);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "left";
        ctx.fillText("▶", 90, y - 4);
      }

      // Line number right-aligned in its own gutter
      ctx.fillStyle = isActive ? "#38bdf8" : "#475569";
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(lineNum), 160, y - 4);

      // Vertical separator
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(175, y - 32, 2, lineHeight);

      // Indented code text
      ctx.textAlign = "left";
      ctx.fillStyle = isActive ? "#ffffff" : "#94a3b8";
      ctx.font = isActive ? "bold 24px monospace" : "22px monospace";
      ctx.fillText(lineText, 195, y - 4);
    });
  }, [currentStep, code, language]);

  // 1. Linked List: Box Nodes with Next Arrows
  const renderLinkedList = (
    ctx: CanvasRenderingContext2D,
    nodes: LinkedListNode[],
    canvasWidth: number,
    centerY: number
  ) => {
    const nodeW = 110;
    const nodeH = 90;
    const arrowLen = 50;
    const totalW = nodes.length * nodeW + (nodes.length - 1) * arrowLen;
    const startX = (canvasWidth - totalW) / 2;

    nodes.forEach((node, idx) => {
      const x = startX + idx * (nodeW + arrowLen);
      const y = centerY - nodeH / 2;

      if (node.state === "target") {
        ctx.fillStyle = "#10b981";
      } else if (node.state === "active") {
        ctx.fillStyle = "#facc15";
      } else {
        ctx.fillStyle = "#1e293b";
      }

      ctx.beginPath();
      ctx.roundRect(x, y, nodeW, nodeH, 16);
      ctx.fill();
      ctx.strokeStyle = node.state === "active" ? "#facc15" : "#38bdf8";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = node.state === "active" || node.state === "target" ? "#000000" : "#ffffff";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(node.value), x + nodeW / 2, y + nodeH / 2 + 10);

      if (node.next) {
        const arrowStartX = x + nodeW + 6;
        const arrowEndX = arrowStartX + arrowLen - 12;
        const arrowY = centerY;

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(arrowEndX, arrowY);
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowY - 8);
        ctx.lineTo(arrowEndX + 10, arrowY);
        ctx.lineTo(arrowEndX, arrowY + 8);
        ctx.fill();
      }
    });
  };

  // 2. Search Array Box Grid Visualizer
  const renderSearchGrid = (
    ctx: CanvasRenderingContext2D,
    cells: SearchCell[],
    target: number | string,
    canvasWidth: number,
    centerY: number
  ) => {
    // Target Badge
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect((canvasWidth - 340) / 2, centerY - 170, 340, 60, 14);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("TARGET:", (canvasWidth - 340) / 2 + 30, centerY - 132);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 30px monospace";
    ctx.fillText(String(target), (canvasWidth - 340) / 2 + 180, centerY - 131);

    // Array Cell Boxes
    const cellW = Math.min(105, (canvasWidth - 180) / cells.length);
    const cellH = 100;
    const totalW = cells.length * cellW;
    const startX = (canvasWidth - totalW) / 2;

    cells.forEach((cell, idx) => {
      const x = startX + idx * cellW;
      const y = centerY;

      if (cell.state === "found") {
        ctx.fillStyle = "#10b981";
      } else if (cell.state === "active") {
        ctx.fillStyle = "#facc15";
      } else if (cell.state === "checked") {
        ctx.fillStyle = "#334155";
      } else {
        ctx.fillStyle = "#1e293b";
      }

      ctx.beginPath();
      ctx.roundRect(x + 4, y, cellW - 8, cellH, 14);
      ctx.fill();
      ctx.strokeStyle = cell.state === "active" ? "#facc15" : cell.state === "found" ? "#10b981" : "#475569";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = cell.state === "active" || cell.state === "found" ? "#000000" : "#ffffff";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(cell.value), x + cellW / 2, y + 60);

      // Cell Index
      ctx.fillStyle = "#64748b";
      ctx.font = "20px monospace";
      ctx.fillText(`[${idx}]`, x + cellW / 2, y - 14);

      // Pointer Labels (low, mid, high)
      if (cell.pointerLabel) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(`▲ ${cell.pointerLabel}`, x + cellW / 2, y + cellH + 34);
      }
    });
  };

  // 3. Vertical Bars for Sorting
  const renderBars = (
    ctx: CanvasRenderingContext2D,
    bars: { value: number; label?: string; state?: string }[],
    canvasWidth: number,
    centerY: number
  ) => {
    const maxVal = Math.max(...bars.map((b) => b.value), 10);
    const barWidth = Math.min(100, (canvasWidth - 240) / bars.length);
    const totalWidth = bars.length * barWidth;
    const startX = (canvasWidth - totalWidth) / 2;

    bars.forEach((item, idx) => {
      const barHeight = Math.max(45, (item.value / maxVal) * 360);
      const x = startX + idx * barWidth;
      const y = centerY + 160 - barHeight;

      if (item.state === "swap") {
        ctx.fillStyle = "#ef4444";
      } else if (item.state === "active") {
        ctx.fillStyle = "#facc15";
      } else if (item.state === "done") {
        ctx.fillStyle = "#10b981";
      } else {
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        grad.addColorStop(0, "#38bdf8");
        grad.addColorStop(1, "#0284c7");
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.roundRect(x + 6, y, barWidth - 12, barHeight, 14);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(item.value), x + barWidth / 2, y - 18);
    });
  };

  // 4. Call Stack for Recursion
  const renderStack = (
    ctx: CanvasRenderingContext2D,
    stack: { name: string; value: string | number }[],
    canvasWidth: number,
    baseY: number
  ) => {
    const frameHeight = 65;
    const frameWidth = 480;
    const startX = (canvasWidth - frameWidth) / 2;

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CALL STACK FRAMES", canvasWidth / 2, baseY - 420);

    stack.forEach((frame, idx) => {
      const y = baseY - (idx + 1) * (frameHeight + 12);
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(startX, y, frameWidth, frameHeight, 14);
      ctx.fill();

      ctx.strokeStyle = idx === stack.length - 1 ? "#38bdf8" : "#334155";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "left";
      ctx.fillText(frame.name, startX + 24, y + 42);

      ctx.fillStyle = "#ffffff";
      ctx.font = "24px monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(frame.value), startX + frameWidth - 24, y + 42);
    });
  };

  // Mini Badges
  const renderMiniPills = (
    ctx: CanvasRenderingContext2D,
    pointers: { name: string; value: string | number }[],
    canvasWidth: number,
    yPos: number
  ) => {
    const pillWidth = 240;
    const gap = 16;
    const visiblePointers = pointers.slice(0, 4);
    const totalWidth = visiblePointers.length * pillWidth + (visiblePointers.length - 1) * gap;
    const startX = Math.max(70, (canvasWidth - totalWidth) / 2);

    visiblePointers.forEach((p, idx) => {
      const x = startX + idx * (pillWidth + gap);
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(x, yPos, pillWidth, 58, 14);
      ctx.fill();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "22px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${p.name}:`, x + 20, yPos + 36);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 26px monospace";
      ctx.fillText(String(p.value), x + 115, yPos + 38);
    });
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        width={1080}
        height={1920}
        style={{
          height: "85vh",
          aspectRatio: "9/16",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
        }}
      />
    </div>
  );
};