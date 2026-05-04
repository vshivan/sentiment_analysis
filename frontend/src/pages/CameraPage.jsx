import React, { useRef, useEffect, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import client from "../api";
import styles from "./CameraPage.module.css";

/* ── constants ───────────────────────────────────────────────────── */
const MODELS_URL = "https://justadudewhohacks.github.io/face-api.js/models";

const EMOTION_META = {
  happy:     { emoji: "😄", color: "#22c55e", label: "Happy"    },
  neutral:   { emoji: "😐", color: "#94a3b8", label: "Neutral"  },
  sad:       { emoji: "😢", color: "#60a5fa", label: "Sad"      },
  angry:     { emoji: "😠", color: "#ef4444", label: "Angry"    },
  surprised: { emoji: "😲", color: "#f59e0b", label: "Surprised"},
  fearful:   { emoji: "😨", color: "#a78bfa", label: "Fearful"  },
  disgusted: { emoji: "🤢", color: "#84cc16", label: "Disgusted"},
};
const EMOTION_ORDER = ["happy","neutral","sad","angry","surprised","fearful","disgusted"];

const SESSION_ID = `cam-${Date.now()}`;
const LOG_EVERY  = 5; // log every Nth detection to backend

/* ── helpers ─────────────────────────────────────────────────────── */
function dominant(expr) {
  return Object.entries(expr).reduce((a, b) => b[1] > a[1] ? b : a, ["neutral", 0]);
}

/* ── component ───────────────────────────────────────────────────── */
export default function CameraPage() {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const logCountRef = useRef(0);

  const [modelsReady, setModelsReady]   = useState(false);
  const [camActive,   setCamActive]     = useState(false);
  const [loading,     setLoading]       = useState(false);
  const [error,       setError]         = useState("");
  const [faceFound,   setFaceFound]     = useState(false);
  const [emotions,    setEmotions]      = useState({});
  const [dominantEmo, setDominantEmo]   = useState(null);
  const [confidence,  setConfidence]    = useState(0);
  const [history,     setHistory]       = useState([]);   // [{label,ts}]
  const [sessionStats,setSessionStats]  = useState({});  // {emotion: count}
  const [frameCount,  setFrameCount]    = useState(0);
  const [fps,         setFps]           = useState(0);
  const lastFpsRef = useRef(Date.now());
  const fpsFrames  = useRef(0);

  /* ── load models once ──────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
        ]);
        setModelsReady(true);
      } catch (e) {
        setError("Failed to load face-api.js models. Check your internet connection.");
      } finally {
        setLoading(false);
      }
    })();
    return () => stopCam();
  }, []);

  /* ── start camera ──────────────────────────────────────────────── */
  const startCam = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCamActive(true);
    } catch {
      setError("Camera access denied. Please allow camera permissions and retry.");
    }
  }, []);

  /* ── stop camera ───────────────────────────────────────────────── */
  const stopCam = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setCamActive(false);
    setFaceFound(false);
    setEmotions({});
    setDominantEmo(null);
    setConfidence(0);
    setFps(0);
  }, []);

  /* ── detection loop ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!camActive || !modelsReady) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;

    const detect = async () => {
      if (!video || video.paused || video.ended) { rafRef.current = requestAnimationFrame(detect); return; }

      const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
      faceapi.matchDimensions(canvas, displaySize);

      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceExpressions();

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result) {
        const resized = faceapi.resizeResults(result, displaySize);

        /* draw bounding box */
        const { x, y, width, height } = resized.detection.box;
        ctx.strokeStyle = "#7c3aed";
        ctx.lineWidth   = 2;
        ctx.shadowColor = "#7c3aed";
        ctx.shadowBlur  = 12;
        ctx.strokeRect(x, y, width, height);
        ctx.shadowBlur  = 0;

        /* corner accents */
        const cLen = 18;
        ctx.strokeStyle = "#a78bfa";
        ctx.lineWidth   = 3;
        [[x,y],[x+width,y],[x,y+height],[x+width,y+height]].forEach(([cx,cy],i) => {
          ctx.beginPath();
          ctx.moveTo(cx + (i%2===0 ? 0 : -cLen), cy);
          ctx.lineTo(cx + (i%2===0 ? cLen : 0),  cy);
          ctx.moveTo(cx, cy + (i<2 ? 0 : -cLen));
          ctx.lineTo(cx, cy + (i<2 ? cLen : 0));
          ctx.stroke();
        });

        const expr = result.expressions;
        const [domLabel, domConf] = dominant(expr);

        setFaceFound(true);
        setEmotions({ ...expr });
        setDominantEmo(domLabel);
        setConfidence(domConf);
        setFrameCount(c => c + 1);

        /* session stats */
        setSessionStats(prev => ({ ...prev, [domLabel]: (prev[domLabel] || 0) + 1 }));

        /* rolling history (last 30) */
        setHistory(prev => {
          const next = [...prev, { label: domLabel, ts: Date.now() }];
          return next.slice(-30);
        });

        /* log to backend every N frames */
        logCountRef.current += 1;
        if (logCountRef.current % LOG_EVERY === 0) {
          const emotionsPlain = Object.fromEntries(
            Object.entries(expr).map(([k, v]) => [k, Math.round(v * 1000) / 1000])
          );
          client.post("/emotion-log", {
            dominant: domLabel,
            confidence: Math.round(domConf * 1000) / 1000,
            emotions: emotionsPlain,
            session_id: SESSION_ID
          }).catch(() => {});
        }
      } else {
        setFaceFound(false);
      }

      /* FPS counter */
      fpsFrames.current += 1;
      const now = Date.now();
      if (now - lastFpsRef.current >= 1000) {
        setFps(fpsFrames.current);
        fpsFrames.current = 0;
        lastFpsRef.current = now;
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    video.onloadedmetadata = () => { rafRef.current = requestAnimationFrame(detect); };
    if (video.readyState >= 2) rafRef.current = requestAnimationFrame(detect);

    return () => cancelAnimationFrame(rafRef.current);
  }, [camActive, modelsReady]);

  /* ── top emotion in session ─────────────────────────────────────── */
  const topSession = Object.entries(sessionStats).sort((a,b) => b[1]-a[1])[0];

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>📷</div>
          <div>
            <h1 className={styles.title}>Live Emotion Detection</h1>
            <p className={styles.subtitle}>Real-time facial expression analysis via your webcam</p>
          </div>
        </div>
        <div className={styles.headerBadges}>
          {camActive && (
            <>
              <span className={styles.liveDot}/>
              <span className={styles.liveBadge}>LIVE</span>
              <span className={styles.fpsBadge}>{fps} fps</span>
            </>
          )}
          {modelsReady && !camActive && <span className={styles.readyBadge}>Models Ready ✓</span>}
        </div>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      <div className={styles.grid}>
        {/* ── LEFT: Camera feed ── */}
        <div className={styles.cameraPanel}>
          <div className={styles.videoWrap}>
            <video ref={videoRef} className={styles.video} muted playsInline/>
            <canvas ref={canvasRef} className={styles.canvas}/>

            {!camActive && (
              <div className={styles.overlay}>
                {loading
                  ? <div className={styles.loadingState}>
                      <div className={styles.spinner}/>
                      <p>Loading AI models…</p>
                    </div>
                  : <div className={styles.idleState}>
                      <div className={styles.camIcon}>📷</div>
                      <p>Camera is off</p>
                    </div>
                }
              </div>
            )}

            {camActive && !faceFound && (
              <div className={styles.noFaceHint}>No face detected — look at the camera</div>
            )}
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            {!camActive ? (
              <button
                className={styles.btnStart}
                onClick={startCam}
                disabled={loading || !modelsReady}
              >
                {loading ? "Loading models…" : "▶ Start Camera"}
              </button>
            ) : (
              <button className={styles.btnStop} onClick={stopCam}>
                ⏹ Stop Camera
              </button>
            )}
          </div>

          {/* Session summary */}
          {Object.keys(sessionStats).length > 0 && (
            <div className={styles.sessionSummary}>
              <p className={styles.summaryTitle}>Session Summary</p>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryVal}>{frameCount}</span>
                  <span className={styles.summaryLabel}>Frames analyzed</span>
                </div>
                {topSession && (
                  <div className={styles.summaryCard}>
                    <span className={styles.summaryVal}>
                      {EMOTION_META[topSession[0]]?.emoji} {topSession[0]}
                    </span>
                    <span className={styles.summaryLabel}>Most frequent ({topSession[1]}×)</span>
                  </div>
                )}
                <div className={styles.summaryCard}>
                  <span className={styles.summaryVal}>{Object.keys(sessionStats).length}</span>
                  <span className={styles.summaryLabel}>Unique emotions</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Emotion readouts ── */}
        <div className={styles.readouts}>
          {/* Dominant emotion card */}
          <div className={styles.dominantCard}
            style={{ borderColor: dominantEmo ? EMOTION_META[dominantEmo]?.color : "#312e81" }}>
            {dominantEmo ? (
              <>
                <div className={styles.dominantEmoji}>{EMOTION_META[dominantEmo]?.emoji}</div>
                <div className={styles.dominantLabel}
                  style={{ color: EMOTION_META[dominantEmo]?.color }}>
                  {EMOTION_META[dominantEmo]?.label}
                </div>
                <div className={styles.dominantConf}>{(confidence * 100).toFixed(1)}% confidence</div>
                <div className={styles.dominantBar}
                  style={{ background: EMOTION_META[dominantEmo]?.color,
                           width: `${(confidence * 100).toFixed(1)}%` }}/>
              </>
            ) : (
              <div className={styles.dominantPlaceholder}>
                <span>😶</span>
                <p>Waiting for face…</p>
              </div>
            )}
          </div>

          {/* Emotion bars */}
          <div className={styles.barsCard}>
            <p className={styles.barsTitle}>Emotion Breakdown</p>
            {EMOTION_ORDER.map(em => {
              const val  = emotions[em] ?? 0;
              const meta = EMOTION_META[em];
              const pct  = (val * 100).toFixed(1);
              return (
                <div key={em} className={styles.barRow}>
                  <span className={styles.barEmoji}>{meta.emoji}</span>
                  <span className={styles.barLabel}>{meta.label}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill}
                      style={{ width: `${pct}%`, background: meta.color }}/>
                  </div>
                  <span className={styles.barPct}>{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* History dots */}
          {history.length > 0 && (
            <div className={styles.historyCard}>
              <p className={styles.historyTitle}>Emotion History <span>(last {history.length} readings)</span></p>
              <div className={styles.historyTrack}>
                {history.map((h, i) => (
                  <div key={i}
                    className={styles.historyDot}
                    title={`${EMOTION_META[h.label]?.label} @ ${new Date(h.ts).toLocaleTimeString()}`}
                    style={{ background: EMOTION_META[h.label]?.color,
                             opacity: 0.4 + (i / history.length) * 0.6 }}>
                    {EMOTION_META[h.label]?.emoji}
                  </div>
                ))}
              </div>

              {/* Session bar chart */}
              <div className={styles.sessionBars}>
                {Object.entries(sessionStats)
                  .sort((a,b) => b[1]-a[1])
                  .map(([em, cnt]) => {
                    const total = Object.values(sessionStats).reduce((s,v) => s+v, 0);
                    const pct   = ((cnt / total) * 100).toFixed(0);
                    return (
                      <div key={em} className={styles.sessionBarRow}>
                        <span>{EMOTION_META[em]?.emoji} {em}</span>
                        <div className={styles.sessionBarTrack}>
                          <div className={styles.sessionBarFill}
                            style={{ width:`${pct}%`, background: EMOTION_META[em]?.color }}/>
                        </div>
                        <span className={styles.sessionBarPct}>{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
