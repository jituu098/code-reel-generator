import React, { useState, useEffect } from 'react';
import ReelCanvas from './components/ReelCanvas';
import { simulateAnyCode } from './engine/tracer';
import { UniversalStep } from './types';

export default function App() {
  const [code, setCode] = useState<string>(
`#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

int main() {
    struct Node *head, *second, *third;
    head = (struct Node *)malloc(sizeof(struct Node));
    second = (struct Node *)malloc(sizeof(struct Node));
    third = (struct Node *)malloc(sizeof(struct Node));

    head->data = 10;
    head->next = second;
    second->data = 20;
    second->next = third;
    third->data = 30;
    third->next = NULL;

    struct Node *temp = head;
    while (temp != NULL) {
        printf("%d -> ", temp->data);
        temp = temp->next;
    }
    return 0;
}`
  );

  const [steps, setSteps] = useState<UniversalStep[]>([]);
  const [detectedPattern, setDetectedPattern] = useState<string>('Linked List');
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 850 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 850);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleParse = () => {
    try {
      const result = simulateAnyCode(code);
      if (result && Array.isArray(result.steps)) {
        setSteps(result.steps);
        setDetectedPattern(`${result.algorithmType} (${result.detectedLanguage})`);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0d1117',
        color: '#c9d1d9',
        padding: isMobile ? '12px' : '24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        overflowX: 'hidden',
      }}
    >
      <header
        style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto 16px auto',
          borderBottom: '1px solid #30363d',
          paddingBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            color: '#58a6ff',
          }}
        >
          Code Reel Generator
        </h1>
        <span
          style={{
            fontSize: '0.75rem',
            color: '#8b949e',
            border: '1px solid #30363d',
            padding: '4px 8px',
            borderRadius: '12px',
          }}
        >
          {isMobile ? 'Mobile View' : 'Desktop View'}
        </span>
      </header>

      <main
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '20px',
          justifyContent: 'center',
          alignItems: isMobile ? 'center' : 'flex-start',
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <section
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '520px',
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '10px',
            padding: isMobile ? '14px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2
              style={{
                fontSize: '1rem',
                margin: 0,
                color: '#f0f6fc',
                fontWeight: 600,
              }}
            >
              Algorithm Code
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#58a6ff', fontWeight: 600 }}>
              {detectedPattern}
            </span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste any code: C, C++, Java, Python, JavaScript..."
            style={{
              width: '100%',
              height: isMobile ? '220px' : '380px',
              backgroundColor: '#0d1117',
              color: '#79c0ff',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '12px',
              fontFamily: 'Consolas, "Fira Code", Monaco, monospace',
              fontSize: '0.82rem',
              lineHeight: '1.4',
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />

          <button
            onClick={handleParse}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#238636',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Parse & Prepare Reel
          </button>
        </section>

        <section
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '520px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '10px',
            padding: isMobile ? '14px' : '20px',
            boxSizing: 'border-box',
          }}
        >
          <ReelCanvas steps={steps} rawCode={code} isMobile={isMobile} />
        </section>
      </main>
    </div>
  );
}