import React, { useState, useRef, useEffect } from "react";
import { simulateAnyCode } from "./engine/tracer";
import { CanvasRecorder } from "./engine/recorder";
import { UniversalStep } from "./types";
import { CodeEditor } from "./components/CodeEditor";
import { ReelCanvas } from "./components/ReelCanvas";
import { Controls } from "./components/Controls";

const INITIAL_CODE = `#include <stdio.h>

int main() {
    int a[5] = {10, 20, 30, 40, 50};
    int n = 5;
    int key = 40;
    int low = 0, high = n - 1, mid;
    int found = 0;

    while (low <= high) {
        mid = (low + high) / 2;

        if (a[mid] == key) {
            found = 1;
            break;
        }
        else if (a[mid] < key) {
            low = mid + 1;
        }
        else {
            high = mid - 1;
        }
    }
}`;

export default function App() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [detectedLang, setDetectedLang] = useState("C / C++");
  const [algoType, setAlgoType] = useState("Binary Search");
  const [steps, setSteps] = useState<UniversalStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<CanvasRecorder | null>(null);

  const stepIndexRef = useRef(currentStepIndex);
  stepIndexRef.current = currentStepIndex;

  const handleSimulate = async () => {
    setIsPlaying(false);
    const result = await simulateAnyCode(code, apiKey);
    setDetectedLang(result.detectedLanguage);
    setAlgoType(result.algorithmType);
    setSteps(result.steps);
    setCurrentStepIndex(0);
  };

  useEffect(() => {
    handleSimulate();
  }, []);

  // Frame Sequencer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isPlaying && steps.length > 0) {
      interval = setInterval(() => {
        const nextIndex = stepIndexRef.current + 1;

        if (nextIndex >= steps.length) {
          clearInterval(interval);
          setIsPlaying(false);

          if (isRecording && recorderRef.current) {
            setTimeout(() => {
              recorderRef.current?.stop().then((url) => {
                setVideoUrl(url);
                setIsRecording(false);
              });
            }, 600);
          }
        } else {
          setCurrentStepIndex(nextIndex);
        }
      }, 400);
    }

    return () => clearInterval(interval);
  }, [isPlaying, steps.length, isRecording]);

  const handleTogglePlay = () => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleStartRecording = () => {
    if (!canvasRef.current) return;
    setCurrentStepIndex(0);
    setVideoUrl(null);
    recorderRef.current = new CanvasRecorder(canvasRef.current);
    recorderRef.current.start();
    setIsRecording(true);
    setIsPlaying(true);
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#020617", overflow: "hidden" }}>
      {/* Left Input Configuration */}
      <div style={{ width: "480px", borderRight: "1px solid #1e293b", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="password"
          placeholder="Optional: Google Gemini API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            background: "#090d16",
            border: "1px solid #334155",
            color: "#94a3b8",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            outline: "none"
          }}
        />
        <div style={{ flex: 1 }}>
          <CodeEditor code={code} onChange={setCode} onExecute={handleSimulate} />
        </div>
      </div>

      {/* Right Studio Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}
      >
        <ReelCanvas
          canvasRef={canvasRef}
          currentStep={steps[currentStepIndex] || null}
          code={code}
          language={`${detectedLang} • ${algoType}`}
        />
        <div style={{ marginTop: "16px" }}>
          <Controls
            isPlaying={isPlaying}
            isRecording={isRecording}
            videoUrl={videoUrl}
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
            onTogglePlay={handleTogglePlay}
            onReset={handleReset}
            onStartRecording={handleStartRecording}
            onSeek={(step) => setCurrentStepIndex(step)}
          />
        </div>
      </div>
    </div>
  );
}