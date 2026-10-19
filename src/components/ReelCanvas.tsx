import React, { useRef, useState, useEffect } from 'react';
import { UniversalStep } from '../types';

interface ReelCanvasProps {
  steps: UniversalStep[];
  rawCode?: string;
  isMobile?: boolean;
}

export default function ReelCanvas({ steps, rawCode = '', isMobile = false }: ReelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [steps]);

  const drawFrame = (stepIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1920;

    // 1. Clear & Background Gradient
    ctx.beginPath();
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#090d16');
    bgGradient.addColorStop(1, '#040609');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Header
    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 44px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CODE REEL VISUALIZER', width / 2, 115);

    const step = steps[stepIndex];
    if (!step) {
      ctx.fillStyle = '#8b949e';
      ctx.font = '34px sans-serif';
      ctx.fillText('Click "Parse & Prepare Reel" to begin', width / 2, height / 2);
      return;
    }

    // 3. Step Status Badge
    ctx.beginPath();
    ctx.fillStyle = '#1f6feb';
    if (ctx.roundRect) ctx.roundRect(width / 2 - 250, 155, 500, 60, 30);
    else ctx.rect(width / 2 - 250, 155, 500, 60);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`Step ${stepIndex + 1} of ${steps.length}`, width / 2, 196);

    // 4. DSA Visual Layout Dispatcher
    const layout = step.layout || 'SEARCH_GRID';
    const zoneStartY = 280;

    if (layout === 'LINKED_LIST') {
      renderLinkedList(ctx, step, width, zoneStartY);
    } else if (layout === 'BARS') {
      renderBars(ctx, step, width, zoneStartY);
    } else if (layout === 'STACK_QUEUE') {
      renderStackQueue(ctx, step, width, zoneStartY);
    } else if (layout === 'TREE') {
      renderTree(ctx, step, width, zoneStartY);
    } else if (layout === 'VARIABLE_WATCH') {
      renderVariableWatch(ctx, step, width, zoneStartY);
    } else {
      renderSearchGrid(ctx, step, width, zoneStartY);
    }

    // 5. Code Execution Trace Window with Synchronized Highlighting
    const codeBoxY = 680;
    const codeBoxHeight = 960;
    const codeBoxWidth = width - 100;
    const codeBoxX = 50;

    ctx.beginPath();
    ctx.fillStyle = '#0d1117';
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 3;
    if (ctx.roundRect) ctx.roundRect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight, 20);
    else ctx.rect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight);
    ctx.fill();
    ctx.stroke();

    // Trace header
    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CODE EXECUTION TRACE', codeBoxX + 36, codeBoxY + 50);

    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Active Line: ${step.line}`, codeBoxX + codeBoxWidth - 36, codeBoxY + 50);

    const lines = (rawCode ? rawCode.split(/\r?\n/) : []).map((l) => l.trimEnd());
    if (lines.length > 0) {
      const lineSpacing = 46;
      const activeLineIdx = step.line - 1;
      const visibleLinesCount = 18;
      let startIdx = 0;
      if (lines.length > visibleLinesCount && activeLineIdx > 8) {
        startIdx = Math.min(activeLineIdx - 8, lines.length - visibleLinesCount);
      }
      const endIdx = Math.min(startIdx + visibleLinesCount, lines.length);

      const codeStartY = codeBoxY + 110;

      for (let idx = startIdx; idx < endIdx; idx++) {
        const displayRow = idx - startIdx;
        const lineY = codeStartY + displayRow * lineSpacing;
        const isHighlighted = idx === activeLineIdx;

        if (isHighlighted) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(56, 139, 253, 0.35)';
          ctx.fillRect(codeBoxX + 12, lineY - 32, codeBoxWidth - 24, lineSpacing);

          ctx.fillStyle = '#58a6ff';
          ctx.fillRect(codeBoxX + 12, lineY - 32, 6, lineSpacing);

          ctx.fillStyle = '#58a6ff';
          ctx.font = 'bold 30px monospace';
          ctx.textAlign = 'left';
          ctx.fillText('▶', codeBoxX + 24, lineY);
        }

        ctx.fillStyle = isHighlighted ? '#58a6ff' : '#484f58';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(String(idx + 1), codeBoxX + 68, lineY);

        ctx.fillStyle = isHighlighted ? '#ffffff' : '#8b949e';
        ctx.font = `${isHighlighted ? 'bold ' : ''}26px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(lines[idx], codeBoxX + 88, lineY);
      }
    }

    // 6. Bottom Explanation Box
    const textDesc = step.description || step.explanation;
    if (textDesc) {
      const bY = height - 210;
      const bH = 130;

      ctx.beginPath();
      ctx.fillStyle = '#161b22';
      if (ctx.roundRect) ctx.roundRect(50, bY, width - 100, bH, 16);
      else ctx.rect(50, bY, width - 100, bH);
      ctx.fill();
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#7ee787';
      ctx.font = 'bold 28px -apple-system, sans-serif';
      ctx.textAlign = 'center';

      if (textDesc.length > 46) {
        const splitPoint = textDesc.lastIndexOf(' ', 46);
        ctx.fillText(textDesc.substring(0, splitPoint), width / 2, bY + 52);
        ctx.fillText(textDesc.substring(splitPoint + 1), width / 2, bY + 98);
      } else {
        ctx.fillText(textDesc, width / 2, bY + 75);
      }
    }
  };

  // --- Layout: Linked List ---
  function renderLinkedList(ctx: CanvasRenderingContext2D, step: UniversalStep, width: number, startY: number) {
    const list = step.array || [10, 20, 30];
    const nodeW = 140;
    const nodeH = 90;
    const arrowW = 60;
    const totalW = list.length * (nodeW + arrowW) + 90;
    const startX = Math.max(50, (width - totalW) / 2);

    list.forEach((val, idx) => {
      const x = startX + idx * (nodeW + arrowW);
      const isActive = idx === step.currentIndex;

      ctx.beginPath();
      ctx.fillStyle = isActive ? '#238636' : '#161b22';
      if (ctx.roundRect) ctx.roundRect(x, startY + 40, nodeW, nodeH, 14);
      else ctx.rect(x, startY + 40, nodeW, nodeH);
      ctx.fill();
      ctx.strokeStyle = isActive ? '#3fb950' : '#30363d';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + nodeW * 0.65, startY + 40);
      ctx.lineTo(x + nodeW * 0.65, startY + 40 + nodeH);
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + (nodeW * 0.65) / 2, startY + 40 + nodeH / 2 + 12);

      ctx.beginPath();
      ctx.arc(x + nodeW * 0.82, startY + 40 + nodeH / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#58a6ff';
      ctx.fill();

      // Arrow
      const arrowStartX = x + nodeW;
      const arrowEndX = arrowStartX + arrowW;
      const arrowY = startY + 40 + nodeH / 2;
      ctx.beginPath();
      ctx.moveTo(arrowStartX, arrowY);
      ctx.lineTo(arrowEndX, arrowY);
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(arrowEndX - 10, arrowY - 8);
      ctx.lineTo(arrowEndX, arrowY);
      ctx.lineTo(arrowEndX - 10, arrowY + 8);
      ctx.fillStyle = '#58a6ff';
      ctx.fill();

      // Pointer marker
      if (isActive) {
        ctx.fillStyle = '#3fb950';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('▲', x + nodeW / 2, startY + 40 + nodeH + 46);
        ctx.font = 'bold 26px monospace';
        ctx.fillText('temp', x + nodeW / 2, startY + 40 + nodeH + 82);
      }
    });

    const nullX = startX + list.length * (nodeW + arrowW) + 10;
    ctx.fillStyle = '#f85149';
    ctx.font = 'bold 34px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NULL', nullX, startY + 40 + nodeH / 2 + 12);
  }

  // --- Layout: Sorting Bars ---
  function renderBars(ctx: CanvasRenderingContext2D, step: UniversalStep, width: number, startY: number) {
    const arr = (step.array as number[]) || [64, 34, 25, 12, 22];
    const maxVal = Math.max(...arr, 70);
    const barW = Math.min(80, Math.floor((width - 160) / arr.length));
    const gap = 16;
    const totalW = arr.length * barW + (arr.length - 1) * gap;
    const startX = (width - totalW) / 2;
    const maxBarH = 240;

    arr.forEach((val, idx) => {
      const x = startX + idx * (barW + gap);
      const barH = (val / maxVal) * maxBarH;
      const y = startY + 280 - barH;
      const isCompared = step.comparedIndices?.includes(idx);

      ctx.beginPath();
      ctx.fillStyle = isCompared ? '#da3633' : '#1f6feb';
      if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [10, 10, 0, 0]);
      else ctx.rect(x, y, barW, barH);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + barW / 2, y - 12);
    });
  }

  // --- Layout: Stack & Queue ---
  function renderStackQueue(ctx: CanvasRenderingContext2D, step: UniversalStep, width: number, startY: number) {
    const isQueue = Boolean(step.queue && step.queue.length > 0);
    const items = isQueue ? step.queue! : (step.stack || [10, 20, 30]);

    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isQueue ? 'QUEUE (FIFO) CONVEYOR' : 'STACK (LIFO) CHAMBER', width / 2, startY + 20);

    const boxW = 120;
    const boxH = 65;
    const gap = 12;

    if (isQueue) {
      const totalW = items.length * (boxW + gap);
      const startX = (width - totalW) / 2;
      items.forEach((item, idx) => {
        const x = startX + idx * (boxW + gap);
        ctx.beginPath();
        ctx.fillStyle = '#161b22';
        if (ctx.roundRect) ctx.roundRect(x, startY + 80, boxW, boxH, 12);
        else ctx.rect(x, startY + 80, boxW, boxH);
        ctx.fill();
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px monospace';
        ctx.fillText(String(item), x + boxW / 2, startY + 80 + boxH / 2 + 12);
      });
    } else {
      items.forEach((item, idx) => {
        const y = startY + 260 - idx * (boxH + gap);
        const x = (width - 240) / 2;
        ctx.beginPath();
        ctx.fillStyle = idx === items.length - 1 ? '#238636' : '#161b22';
        if (ctx.roundRect) ctx.roundRect(x, y, 240, boxH, 10);
        else ctx.rect(x, y, 240, boxH);
        ctx.fill();
        ctx.strokeStyle = '#30363d';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px monospace';
        ctx.fillText(String(item), width / 2, y + boxH / 2 + 10);
      });
    }
  }

  // --- Layout: Tree Structure ---
  function renderTree(ctx: CanvasRenderingContext2D, step: UniversalStep, width: number, startY: number) {
    const nodes = step.treeNodes || [];
    if (nodes.length > 1) {
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 4;
      for (let i = 1; i < nodes.length; i++) {
        const parentIdx = Math.floor((i - 1) / 2);
        const p = nodes[parentIdx];
        const child = nodes[i];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(child.x, child.y);
        ctx.stroke();
      }
    }

    nodes.forEach((n) => {
      const isActive = n.val === step.activeNodeVal;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 36, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#238636' : '#161b22';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#3fb950' : '#58a6ff';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(n.val), n.x, n.y + 10);
    });
  }

  // --- Layout: Search Grid ---
  function renderSearchGrid(ctx: CanvasRenderingContext2D, step: UniversalStep, width: number, startY: number) {
    const arr = step.array || [10, 20, 30, 40, 50];
    const boxSize = Math.min(140, Math.floor((width - 120) / arr.length) - 14);
    const gap = 14;
    const totalW = arr.length * boxSize + (arr.length - 1) * gap;
    const startX = (width - totalW) / 2;

    arr.forEach((val, idx) => {
      const x = startX + idx * (boxSize + gap);
      const isMatch = idx === step.foundIndex;
      const isActive = idx === step.currentIndex;

      ctx.beginPath();
      ctx.fillStyle = isMatch ? '#238636' : isActive ? '#da3633' : '#161b22';
      if (ctx.roundRect) ctx.roundRect(x, startY + 60, boxSize, boxSize, 16);
      else ctx.rect(x, startY + 60, boxSize, boxSize);
      ctx.fill();
      ctx.strokeStyle = isMatch || isActive ? '#ffffff' : '#30363d';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + boxSize / 2, startY + 60 + boxSize / 2 + 16);

      ctx.fillStyle = '#8b949e';
      ctx.font = '26px monospace';
      ctx.fillText(`[${idx}]`, x + boxSize / 2, startY + 60 + boxSize + 40);

      if (isActive) {
        ctx.fillStyle = '#58a6ff';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText('▲', x + boxSize / 2, startY + 60 + boxSize + 88);
      }
    });
  }

  // --- Layout: Variable Watch ---
  function renderVariableWatch(ctx: CanvasRenderingContext2D, step: UniversalStep, width: number, startY: number) {
    const vars = step.variables || { status: 'Running' };
    ctx.fillStyle = '#e3b341';
    ctx.font = 'bold 34px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LIVE MEMORY & STATE WATCHER', width / 2, startY + 30);

    let vY = startY + 90;
    Object.entries(vars).forEach(([k, v]) => {
      ctx.beginPath();
      ctx.fillStyle = '#161b22';
      if (ctx.roundRect) ctx.roundRect((width - 600) / 2, vY, 600, 60, 10);
      else ctx.rect((width - 600) / 2, vY, 600, 60);
      ctx.fill();
      ctx.strokeStyle = '#30363d';
      ctx.stroke();

      ctx.fillStyle = '#58a6ff';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${k}:`, (width - 550) / 2, vY + 40);

      ctx.fillStyle = '#7ee787';
      ctx.textAlign = 'right';
      ctx.fillText(String(v), (width + 550) / 2, vY + 40);
      vY += 75;
    });
  }

  useEffect(() => {
    drawFrame(currentStepIdx);
  }, [currentStepIdx, steps, rawCode]);

  useEffect(() => {
    let timeoutId: any;
    if (isPlaying) {
      if (currentStepIdx < steps.length - 1) {
        timeoutId = setTimeout(() => {
          setCurrentStepIdx((prev) => prev + 1);
        }, 1100);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timeoutId);
  }, [isPlaying, currentStepIdx, steps.length]);

  const handleStartRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas || steps.length === 0) return;

    recordedChunksRef.current = [];
    setCurrentStepIdx(0);

    const stream = canvas.captureStream(30);
    const options = { mimeType: 'video/webm;codecs=vp9' };
    const recorder = new MediaRecorder(
      stream,
      MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined
    );

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'code-reel-9x16.webm';
      a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setIsPlaying(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsPlaying(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        gap: '14px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: isMobile ? '280px' : '340px',
          aspectRatio: '9 / 16',
          backgroundColor: '#000000',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
          border: '1px solid #30363d',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          width: '100%',
          maxWidth: isMobile ? '280px' : '340px',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={steps.length === 0}
          style={{
            flex: '1 1 calc(50% - 4px)',
            padding: '10px',
            backgroundColor: isPlaying ? '#d29922' : '#238636',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: steps.length === 0 ? 'not-allowed' : 'pointer',
            opacity: steps.length === 0 ? 0.5 : 1,
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentStepIdx(0);
          }}
          disabled={steps.length === 0}
          style={{
            flex: '1 1 calc(50% - 4px)',
            padding: '10px',
            backgroundColor: '#21262d',
            color: '#c9d1d9',
            border: '1px solid #30363d',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: steps.length === 0 ? 'not-allowed' : 'pointer',
            opacity: steps.length === 0 ? 0.5 : 1,
          }}
        >
          Reset
        </button>

        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={steps.length === 0}
          style={{
            flex: '1 1 100%',
            padding: '12px',
            backgroundColor: isRecording ? '#da3633' : '#1f6feb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: steps.length === 0 ? 'not-allowed' : 'pointer',
            opacity: steps.length === 0 ? 0.5 : 1,
          }}
        >
          {isRecording ? 'Stop & Download Reel' : 'Record 9:16 Reel'}
        </button>
      </div>
    </div>
  );
}