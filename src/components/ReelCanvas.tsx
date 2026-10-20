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

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Sound Engine Setup
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const dest = ctx.createMediaStreamDestination();
      audioCtxRef.current = ctx;
      audioDestinationRef.current = dest;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playMechanicalTick = (isSwap = false) => {
    if (!audioCtxRef.current || !audioDestinationRef.current) return;
    const ctx = audioCtxRef.current;
    const dest = audioDestinationRef.current;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isSwap) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  };

  useEffect(() => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [steps]);

  // Main Canvas Rendering
  const drawFrame = (stepIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1920;

    // 1. Grid Background
    ctx.fillStyle = '#0a1626';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(24, 52, 89, 0.45)';
    ctx.lineWidth = 1.5;
    const gridSize = 44;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const step = steps[stepIndex];

    // 2. Title & Algorithm Category
    ctx.fillStyle = '#f0f6fc';
    ctx.font = '900 52px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '3px';
    const title = step?.layout === 'SORTING_QUICK' ? 'QUICK SORT' : 'BUBBLE SORT';
    ctx.fillText(title, width / 2, 130);

    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('ORDENACIÓN POR INTERCAMBIO', width / 2, 170);

    if (!step) {
      ctx.fillStyle = '#8b949e';
      ctx.font = '34px monospace';
      ctx.fillText('Click "Parse & Prepare Reel" to begin', width / 2, height / 2);
      return;
    }

    // 3. Digital HUD Boxes (COMPARA & CAMBIA)
    const hudW = 280;
    const hudH = 68;
    const hudY = 215;

    // Left HUD (COMPARA)
    ctx.beginPath();
    ctx.fillStyle = '#0d1f36';
    if (ctx.roundRect) ctx.roundRect(width / 2 - hudW - 16, hudY, hudW, hudH, 14);
    else ctx.rect(width / 2 - hudW - 16, hudY, hudW, hudH);
    ctx.fill();
    ctx.strokeStyle = '#1b3b66';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('COMPARA', width / 2 - hudW + 8, hudY + 44);

    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(step.comparisonsCount ?? 0), width / 2 - 36, hudY + 46);

    // Right HUD (CAMBIA)
    ctx.beginPath();
    ctx.fillStyle = '#0d1f36';
    if (ctx.roundRect) ctx.roundRect(width / 2 + 16, hudY, hudW, hudH, 14);
    else ctx.rect(width / 2 + 16, hudY, hudW, hudH);
    ctx.fill();
    ctx.strokeStyle = '#1b3b66';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CAMBIA', width / 2 + 36, hudY + 44);

    ctx.fillStyle = '#e3b341';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(step.swapsCount ?? 0), width / 2 + hudW - 4, hudY + 46);

    // 4. Bar Elements & Dual-Claw Overhead Crane
    const arr = step.array || [50, 20, 40, 10, 30];
    const n = arr.length;
    const chartBottomY = 580;
    const maxVal = Math.max(...arr, 50);
    const maxBarH = 210;
    const barW = Math.min(84, Math.floor((width - 140) / n) - 12);
    const gap = 14;
    const totalW = n * barW + (n - 1) * gap;
    const startX = (width - totalW) / 2;

    const comp: number[] = step.comparedIndices ? [...step.comparedIndices] : [];
    const sorted: number[] = step.sortedIndices ? [...step.sortedIndices] : [];

    // Overhead Crane
    if (comp.length === 2 && comp[0] !== comp[1]) {
      const idxA = comp[0];
      const idxB = comp[1];
      const xA = startX + idxA * (barW + gap) + barW / 2;
      const xB = startX + idxB * (barW + gap) + barW / 2;
      const midX = (xA + xB) / 2;
      const craneTopY = 320;

      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(midX, craneTopY - 30);
      ctx.lineTo(midX, craneTopY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(midX, craneTopY, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#e3b341';
      ctx.fill();

      const clawY = chartBottomY - ((Math.max(arr[idxA], arr[idxB]) / maxVal) * maxBarH) - 30;

      ctx.beginPath();
      ctx.moveTo(midX, craneTopY);
      ctx.lineTo(xA, clawY);
      ctx.moveTo(midX, craneTopY);
      ctx.lineTo(xB, clawY);
      ctx.stroke();

      [xA, xB].forEach((posX) => {
        ctx.beginPath();
        ctx.fillStyle = '#e3b341';
        ctx.rect(posX - barW / 2 - 4, clawY, barW + 8, 14);
        ctx.fill();
      });
    }

    // Render Bars
    arr.forEach((val, i) => {
      const h = Math.max(34, (val / maxVal) * maxBarH);
      const x = startX + i * (barW + gap);
      const y = chartBottomY - h;

      const isCompared = comp.includes(i);
      const isSorted = sorted.includes(i);
      const isPivot = step.pivotIndex === i;

      ctx.beginPath();
      if (isPivot) {
        ctx.fillStyle = '#e3b341';
      } else if (isSorted) {
        ctx.fillStyle = '#238636';
      } else if (isCompared) {
        ctx.fillStyle = '#8f2d2b';
      } else {
        ctx.fillStyle = '#102540';
      }

      if (ctx.roundRect) ctx.roundRect(x, y, barW, h, [8, 8, 0, 0]);
      else ctx.rect(x, y, barW, h);
      ctx.fill();

      ctx.strokeStyle = isPivot ? '#ffffff' : isSorted ? '#3fb950' : isCompared ? '#ff7b72' : '#234a7d';
      ctx.lineWidth = isCompared || isPivot || isSorted ? 3.5 : 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + barW / 2, y + h / 2 + 13);
    });

    // 5. Code Terminal Window (Clean Clip & No Ghosting)
    const termX = 60;
    const termY = 670;
    const termW = width - 120;
    const termH = 960;

    ctx.beginPath();
    ctx.fillStyle = '#0c1a2e';
    if (ctx.roundRect) ctx.roundRect(termX, termY, termW, termH, 20);
    else ctx.rect(termX, termY, termW, termH);
    ctx.fill();
    ctx.strokeStyle = '#1b3b66';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Mac Window Buttons
    const btnY = termY + 32;
    [
      { color: '#ff5f56', x: termX + 32 },
      { color: '#ffbd2e', x: termX + 60 },
      { color: '#27c93f', x: termX + 88 },
    ].forEach((btn) => {
      ctx.beginPath();
      ctx.arc(btn.x, btnY, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = btn.color;
      ctx.fill();
    });

    // Tab Header
    const tabW = 200;
    const tabH = 42;
    const tabX = termX + 130;
    const tabY = termY + 12;

    ctx.beginPath();
    ctx.fillStyle = '#10233d';
    if (ctx.roundRect) ctx.roundRect(tabX, tabY, tabW, tabH, [10, 10, 0, 0]);
    else ctx.rect(tabX, tabY, tabW, tabH);
    ctx.fill();
    ctx.strokeStyle = '#1b3b66';
    ctx.stroke();

    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('bubble_sort.c', tabX + tabW / 2, tabY + 28);

    // Code lines rendering with viewport clipping
    const lines = (rawCode ? rawCode.split(/\r?\n/) : []).map((l) => l.trimEnd());
    if (lines.length > 0) {
      const lineSpacing = 48;
      const codeStartY = termY + 110;
      const activeLineIdx = (step.line || 1) - 1;

      // Ensure clean view window
      const visibleLines = 15;
      let startIdx = 0;
      if (lines.length > visibleLines && activeLineIdx > 6) {
        startIdx = Math.min(activeLineIdx - 6, lines.length - visibleLines);
      }
      const endIdx = Math.min(startIdx + visibleLines, lines.length);

      ctx.save();
      ctx.beginPath();
      ctx.rect(termX + 4, termY + 60, termW - 8, termH - 115);
      ctx.clip();

      for (let idx = startIdx; idx < endIdx; idx++) {
        const row = idx - startIdx;
        const lineY = codeStartY + row * lineSpacing;
        const isHighlighted = idx === activeLineIdx;

        if (isHighlighted) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(227, 179, 65, 0.2)';
          ctx.fillRect(termX + 8, lineY - 32, termW - 16, lineSpacing);

          ctx.fillStyle = '#e3b341';
          ctx.fillRect(termX + 8, lineY - 32, 6, lineSpacing);

          if (step.evalText) {
            ctx.fillStyle = '#ff7b72';
            ctx.font = 'bold 28px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(step.evalText, termX + termW - 36, lineY);
          }
        }

        ctx.fillStyle = isHighlighted ? '#e3b341' : '#486282';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(String(idx + 1), termX + 60, lineY);

        ctx.fillStyle = isHighlighted ? '#ffffff' : '#9bb2d1';
        ctx.font = `${isHighlighted ? 'bold ' : ''}25px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(lines[idx], termX + 85, lineY);
      }
      ctx.restore();
    }

    // Terminal Bottom Status Bar
    const footerY = termY + termH - 48;
    ctx.fillStyle = '#10233d';
    ctx.fillRect(termX, footerY, termW, 48);

    ctx.fillStyle = '#79c0ff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(step.terminalFooter || 'EXECUTION TRACE ACTIVE', width / 2, footerY + 32);

    // 6. Bottom Explanation Box
    const textDesc = step.description;
    if (textDesc) {
      const descY = height - 190;
      const descH = 120;

      ctx.beginPath();
      ctx.fillStyle = '#0c1a2e';
      if (ctx.roundRect) ctx.roundRect(60, descY, width - 120, descH, 16);
      else ctx.rect(60, descY, width - 120, descH);
      ctx.fill();
      ctx.strokeStyle = '#1b3b66';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#39d353';
      ctx.font = 'bold 28px -apple-system, sans-serif';
      ctx.textAlign = 'center';

      if (textDesc.length > 48) {
        const splitPoint = textDesc.lastIndexOf(' ', 48);
        ctx.fillText(textDesc.substring(0, splitPoint), width / 2, descY + 48);
        ctx.fillText(textDesc.substring(splitPoint + 1), width / 2, descY + 92);
      } else {
        ctx.fillText(textDesc, width / 2, descY + 68);
      }
    }
  };

  useEffect(() => {
    drawFrame(currentStepIdx);
  }, [currentStepIdx, steps, rawCode]);

  // Stepper loop with automatic end-of-reel video download
  useEffect(() => {
    let timeoutId: any;
    if (isPlaying) {
      if (currentStepIdx < steps.length - 1) {
        timeoutId = setTimeout(() => {
          const nextIdx = currentStepIdx + 1;
          const nextStep = steps[nextIdx];
          const isSwap = Boolean(nextStep?.swappedIndices);
          playMechanicalTick(isSwap);
          setCurrentStepIdx(nextIdx);
        }, 900);
      } else {
        // Reached end of execution
        setIsPlaying(false);
        if (isRecording) {
          // Pause slightly on the final frame so the completed state is visible in the video
          setTimeout(() => {
            handleStopRecording();
          }, 1200);
        }
      }
    }
    return () => clearTimeout(timeoutId);
  }, [isPlaying, currentStepIdx, steps, isRecording]);

  // Start Recording
  const handleStartRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas || steps.length === 0) return;

    initAudio();
    recordedChunksRef.current = [];
    setCurrentStepIdx(0);

    const canvasStream = canvas.captureStream(30);
    const audioTracks = audioDestinationRef.current ? audioDestinationRef.current.stream.getAudioTracks() : [];
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioTracks,
    ]);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(combinedStream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'algorithm-visual-reel.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
  };

  const togglePlayback = () => {
    initAudio();
    setIsPlaying(!isPlaying);
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
          backgroundColor: '#0a1626',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
          border: '1px solid #1b3b66',
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
          onClick={togglePlayback}
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
          {isPlaying ? 'Pause' : 'Play With Sound'}
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
            backgroundColor: '#162b47',
            color: '#c9d1d9',
            border: '1px solid #1b3b66',
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
          {isRecording ? 'Stop & Download Reel' : 'Record 9:16 Reel (With Audio)'}
        </button>
      </div>
    </div>
  );
}