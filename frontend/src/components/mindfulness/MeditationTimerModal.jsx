import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMindfulnessApi } from "../apiLinks/useMindfulnessApi";
import { toast } from "react-toastify";

// Format seconds as MM:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Detect if URL is a local file (not YouTube)
const isLocalAudio = (url) => {
  if (!url) return false;
  return !url.includes("youtube.com") && !url.includes("youtu.be");
};

// Build YouTube embed URL (fallback for old YouTube entries)
const getYouTubeEmbed = (url) => {
  try {
    const urlObj = new URL(url);
    let videoId;
    if (urlObj.hostname.includes("youtu.be")) {
      videoId = urlObj.pathname.slice(1);
    } else {
      videoId = urlObj.searchParams.get("v");
    }
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&iv_load_policy=3`;
  } catch {
    return null;
  }
};

export const MeditationTimerModal = ({
  sessionId,
  durationInMinutes,
  audioTrack,
  onClose,
}) => {
  const { useCompleteMeditation } = useMindfulnessApi();
  const completeMut = useCompleteMeditation();

  const totalSeconds = durationInMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);

  // Ref for elapsed so it's never stale in callbacks
  const elapsedRef = useRef(0);
  const [elapsedDisplay, setElapsedDisplay] = useState(0);
  const savedRef = useRef(false);

  // Audio element ref (for local MP3s)
  const audioRef = useRef(null);

  // Determine audio mode
  const sourceUrl = audioTrack?.source_url || null;
  const useLocalAudio = sourceUrl && isLocalAudio(sourceUrl);
  const youtubeEmbed = sourceUrl && !useLocalAudio ? getYouTubeEmbed(sourceUrl) : null;
  const isSilence = !sourceUrl;

  // Lock body scroll when modal mounts
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Start/stop local audio
  useEffect(() => {
    if (useLocalAudio && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Browser may block autoplay; user click already happened so should be fine
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [useLocalAudio]);

  // Stop & save the session
  const handleStopAndSave = useCallback(
    async (isPrematureStop = true) => {
      if (savedRef.current) return;
      savedRef.current = true;

      // Stop local audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const elapsed = elapsedRef.current;

      if (elapsed >= 30) {
        try {
          await completeMut.mutateAsync({
            session_id: sessionId,
            duration_seconds: elapsed,
            successful: true,
          });

          const mins = Math.floor(elapsed / 60);
          const secs = elapsed % 60;
          const label = mins > 0 ? `${mins}m ${secs > 0 ? secs + "s" : ""}`.trim() : `${secs}s`;

          toast.success(
            isPrematureStop
              ? `Session saved! You meditated for ${label}.`
              : `🎉 Full ${durationInMinutes} minutes complete — great work!`
          );
        } catch {
          toast.error("Could not save session.");
        }
      } else if (isPrematureStop) {
        toast.info("Session was less than 30 seconds and not saved.");
      }

      onClose();
    },
    [sessionId, durationInMinutes, completeMut, onClose]
  );

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleStopAndSave(false);
      return;
    }
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
      elapsedRef.current += 1;
      setElapsedDisplay((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining, handleStopAndSave]);

  // Circular progress
  const radius = 70; // Slightly smaller to prevent vertical overflow
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? (elapsedDisplay / totalSeconds) * 100 : 0;
  const strokeDash = (progress / 100) * circumference;

  // ─── SILENCE MODE ───────────────────────────────────────────────
  if (isSilence || (!useLocalAudio && !youtubeEmbed)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/85 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <svg width="200" height="200" className="-rotate-90">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="100" cy="100" r={radius} fill="none"
                stroke="#818cf8" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                style={{ transition: "stroke-dasharray 1s linear" }}
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-5xl font-thin text-white tabular-nums">{formatTime(secondsRemaining)}</div>
              <div className="text-xs text-indigo-300 mt-1">remaining</div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-indigo-300 text-sm font-medium">Meditating in silence</p>
            <p className="text-white/50 text-xs mt-1">Elapsed: {formatTime(elapsedDisplay)}</p>
          </div>

          <button
            onClick={() => handleStopAndSave(true)}
            disabled={completeMut.isLoading}
            className="px-10 py-4 bg-white/20 text-white font-semibold rounded-full hover:bg-white/30 transition-colors border border-white/20 disabled:opacity-50"
          >
            {completeMut.isLoading ? "Saving..." : "Stop & Save Session"}
          </button>
        </div>
      </div>
    );
  }

  // ─── LOCAL AUDIO MODE ────────────────────────────────────────────
  if (useLocalAudio) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/85 backdrop-blur-sm">
        {/* Hidden looping audio element */}
        <audio ref={audioRef} src={sourceUrl} loop preload="auto" />

        <div className="flex flex-col items-center gap-6">
          {/* Track name */}
          <div className="text-center">
            <p className="text-indigo-300 text-sm uppercase tracking-widest font-semibold">Now Playing</p>
            <h2 className="text-white text-2xl font-semibold mt-1">{audioTrack.title}</h2>
          </div>

          {/* Circular ring */}
          <div className="relative flex items-center justify-center">
            <svg width="200" height="200" className="-rotate-90">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="100" cy="100" r={radius} fill="none"
                stroke="#818cf8" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                style={{ transition: "stroke-dasharray 1s linear" }}
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-5xl font-thin text-white tabular-nums">{formatTime(secondsRemaining)}</div>
              <div className="text-xs text-indigo-300 mt-1">remaining</div>
            </div>
          </div>

          {/* Elapsed */}
          <p className="text-white/50 text-xs">Elapsed: {formatTime(elapsedDisplay)}</p>

          <button
            onClick={() => handleStopAndSave(true)}
            disabled={completeMut.isLoading}
            className="px-10 py-4 bg-white/20 text-white font-semibold rounded-full hover:bg-white/30 transition-colors border border-white/20 disabled:opacity-50"
          >
            {completeMut.isLoading ? "Saving..." : "Stop & Save Session"}
          </button>
        </div>
      </div>
    );
  }

  // ─── YOUTUBE MODE (legacy fallback) ──────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[600px] flex overflow-hidden">
        {/* Left: Timer */}
        <div className="w-1/3 flex flex-col items-center justify-center p-8 bg-gray-50 border-r gap-4">
          <h3 className="text-xl font-semibold text-gray-700 text-center">{audioTrack.title}</h3>
          <div className="relative flex items-center justify-center">
            <svg width="180" height="180" className="-rotate-90">
              <circle cx="90" cy="90" r="70" fill="none" stroke="#e0e7ff" strokeWidth="8" />
              <circle
                cx="90" cy="90" r="70" fill="none"
                stroke="#4f46e5" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 2 * Math.PI * 70} ${2 * Math.PI * 70}`}
                style={{ transition: "stroke-dasharray 1s linear" }}
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-4xl font-thin text-indigo-600 tabular-nums">{formatTime(secondsRemaining)}</div>
              <div className="text-xs text-gray-400 mt-0.5">remaining</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">Elapsed: <span className="font-medium text-gray-700">{formatTime(elapsedDisplay)}</span></div>
          <button
            onClick={() => handleStopAndSave(true)}
            disabled={completeMut.isLoading}
            className="w-full px-8 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {completeMut.isLoading ? "Saving..." : "Stop & Save"}
          </button>
        </div>

        {/* Right: YouTube iframe */}
        <div className="w-2/3 bg-black">
          <iframe
            src={youtubeEmbed}
            title={audioTrack.title}
            className="w-full h-full"
            frameBorder="0"
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};
