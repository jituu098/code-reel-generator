import React from "react";

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  onExecute: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, onExecute }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: 0 }}>Input JavaScript</h2>
        <button
          onClick={onExecute}
          style={{
            background: "#0284c7",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Parse & Prepare Reel
        </button>
      </div>

      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        style={{
          flex: 1,
          backgroundColor: "#030712",
          color: "#38bdf8",
          fontFamily: "'Fira Code', monospace",
          fontSize: "14px",
          lineHeight: "1.6",
          padding: "16px",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          resize: "none",
          outline: "none"
        }}
      />
    </div>
  );
};