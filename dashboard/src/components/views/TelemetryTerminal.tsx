import { useState, useEffect, useRef } from 'react';
import { Terminal, Play, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface TelemetryTerminalProps {
  tenantId: string;
  onAnalysisComplete: (result: any) => void;
}

export function TelemetryTerminal({ tenantId, onAnalysisComplete }: TelemetryTerminalProps) {
  const [target, setTarget] = useState('payment-service');
  const [customTarget, setCustomTarget] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'completed' | 'failed'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStartAnalysis = async () => {
    const finalTarget = target === 'custom' ? customTarget.trim() : target;
    if (!finalTarget) return;

    setStatus('analyzing');
    setLogs(['Initializing Interactive Telemetry Terminal...', `Target: ${finalTarget}`, 'Connecting to API server...']);
    setScore(null);
    setJobId(null);

    try {
      // Step 1: POST to /api/v1/analyze
      const response = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: finalTarget,
          tenantId: tenantId
        })
      });

      if (!response.ok) {
        throw new Error(`Analyze Request Failed: ${response.statusText}`);
      }

      const jobData = await response.json();
      const newJobId = jobData.jobId;
      setJobId(newJobId);

      setLogs((prev) => [...prev, 'Job scheduled successfully.', `Job ID: ${newJobId}`, 'Establishing log stream...']);

      // Step 2: Establish Server-Sent Events (SSE) connection to stream logs
      const eventSource = new EventSource(`/api/v1/analysis/${newJobId}/logs`);

      eventSource.onmessage = (event) => {
        setLogs((prev) => [...prev, event.data]);
      };

      eventSource.addEventListener('end', async () => {
        eventSource.close();
        setLogs((prev) => [...prev, 'Log stream complete. Fetching analysis results...']);

        // Step 3: GET the final analysis result
        try {
          const res = await fetch(`/api/v1/analysis/${newJobId}`);
          if (!res.ok) {
            throw new Error('Failed to retrieve analysis result');
          }
          const finalJob = await res.json();
          setStatus('completed');
          setScore(finalJob.result.healthScore);
          setLogs((prev) => [
            ...prev,
            '----------------------------------------',
            `Analysis Result: SUCCESS`,
            `Health Score: ${finalJob.result.healthScore}`,
            `Trace Integrity: ${finalJob.result.traceIntegrity}%`,
            `Gaps Found: ${finalJob.result.issues.length}`,
            '----------------------------------------'
          ]);

          // Trigger dashboard synchronization callback
          onAnalysisComplete(finalJob.result);
        } catch (err: any) {
          setStatus('failed');
          setLogs((prev) => [...prev, `Error loading final job: ${err.message}`]);
        }
      });

      eventSource.onerror = () => {
        eventSource.close();
        setStatus('failed');
        setLogs((prev) => [...prev, 'Error: Telemetry connection lost or closed unexpectedly.']);
      };

    } catch (err: any) {
      setStatus('failed');
      setLogs((prev) => [...prev, `Connection failed: ${err.message}`]);
    }
  };

  return (
    <div className="panel terminal-panel">
      <div className="terminal-header">
        <Terminal size={16} className="terminal-icon" />
        <span className="terminal-title">TelemetryHealth Interactive Terminal</span>
        {jobId && <span style={{ marginLeft: '8px', opacity: 0.5, fontSize: '11px', fontFamily: 'var(--mono)' }}>[{jobId}]</span>}
        <span className={`terminal-status-indicator ${status}`}>
          {status}
        </span>
      </div>

      <div className="terminal-controls">
        <div className="control-group">
          <label htmlFor="target-select" className="control-lbl">Select Target</label>
          <select
            id="target-select"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="select-dropdown terminal-select"
            disabled={status === 'analyzing'}
          >
            <option value="payment-service">payment-service (broken trace chain)</option>
            <option value="auth-service">auth-service (cardinality spike)</option>
            <option value="checkout-service">checkout-service (cardinality spike)</option>
            <option value="custom">custom query...</option>
          </select>
        </div>

        {target === 'custom' && (
          <div className="control-group animate-slide-in">
            <label htmlFor="custom-target-input" className="control-lbl">Custom Service / Endpoint / Component</label>
            <input
              id="custom-target-input"
              type="text"
              placeholder="e.g. billing-db or /api/v2/charge"
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
              className="terminal-input"
              disabled={status === 'analyzing'}
            />
          </div>
        )}

        <button
          onClick={handleStartAnalysis}
          disabled={status === 'analyzing' || (target === 'custom' && !customTarget.trim())}
          className="btn btn-terminal-action"
        >
          {status === 'analyzing' ? (
            <>
              <RotateCw size={14} className="spinning" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Analyze</span>
            </>
          )}
        </button>
      </div>

      {/* Retro monospaced screen */}
      <div className="terminal-screen-wrapper">
        <div className="scanline"></div>
        <div ref={logContainerRef} className="terminal-screen">
          {logs.length === 0 ? (
            <div className="terminal-placeholder">
              TelemetryHealth Interactive Terminal v1.0
              <br />
              Select a service, endpoint, or component above and click Analyze.
              <br />
              <br />
              &gt; <span className="blinking-cursor">_</span>
            </div>
          ) : (
            <>
              {logs.map((log, idx) => (
                <div key={idx} className="terminal-log-line">
                  {log}
                </div>
              ))}
              {status === 'analyzing' && (
                <div className="terminal-log-line">
                  &gt; <span className="blinking-cursor">_</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {status === 'completed' && score !== null && (
        <div className="terminal-summary animate-slide-in">
          <CheckCircle2 size={16} className="summary-success-icon" />
          <span>
            Analysis completed! Score calculated: <strong>{score}</strong>. Dashboard metrics synchronized.
          </span>
        </div>
      )}

      {status === 'failed' && (
        <div className="terminal-summary failed animate-slide-in">
          <AlertCircle size={16} className="summary-failed-icon" />
          <span>Analysis failed. Check backend connectivity.</span>
        </div>
      )}
    </div>
  );
}
