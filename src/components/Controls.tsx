import React from "react";
import { Play, Pause, RotateCcw, Video, Download } from "lucide-react";

interface ControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
  videoUrl: string | null;
  currentStepIndex: number;
  totalSteps: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onStartRecording: () => void;
  onSeek: (step: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  isRecording,
  videoUrl,
  currentStepIndex,
  totalSteps,
  onTogglePlay,
  onReset,
  onStartRecording,
  onSeek
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "480px" }}>
      {/* Timeline scrubber */}
      <input
        type="range"
        min={0}
        max={Math.max(0, totalSteps - 1)}
        value={currentStepIndex}
        onChange={(e) => onSeek(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#38bdf8" }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onTogglePlay}
            style={{
              background: "#1e293b",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            onClick={onReset}
            style={{
              background: "#1e293b",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}
          >
            <RotateCcw size={18} /> Reset
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onStartRecording}
            disabled={isRecording}
            style={{
              background: isRecording ? "#dc2626" : "#059669",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: isRecording ? "not-allowed" : "pointer"
            }}
          >
            <Video size={18} /> {isRecording ? "Rendering Reel..." : "Record 9:16 Reel"}
          </button>

          {videoUrl && (
            <a
              href={videoUrl}
              download="code_short_reel.webm"
              style={{
                background: "#0284c7",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                textDecoration: "none"
              }}
            >
              <Download size={18} /> Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
};