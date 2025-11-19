import React, { useState, useEffect } from "react";
import { useMindfulnessApi } from "../apiLinks/useMindfulnessApi";
import { toast } from "react-toastify";

// Helper to format time as MM:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Helper to get the correct embed URL
const getEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    let videoId;
    if (urlObj.hostname.includes("youtu.be")) {
      videoId = urlObj.pathname.slice(1);
    } else {
      videoId = urlObj.searchParams.get("v");
    }
    if (!videoId) return null; // Not a valid YouTube link

    // Autoplay, loop, minimal controls, and allow background play
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&iv_load_policy=3`;
  } catch (e) {
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const embedUrl = getEmbedUrl(audioTrack?.source_url);
  const isSilence = !audioTrack || !embedUrl;

  // Timer logic
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleStopAndSave(false); // Timer finished
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  // Stop and save function
  const handleStopAndSave = async (isPrematureStop = true) => {
    // Record at least 1 minute if the user stops early but > 0 seconds
    const elapsedMinutes =
      elapsedSeconds > 0 ? Math.max(1, Math.floor(elapsedSeconds / 60)) : 0;

    // Only save if at least one minute has passed or timer finished
    if (elapsedMinutes > 0 || !isPrematureStop) {
      try {
        await completeMut.mutateAsync({
          session_id: sessionId,
          duration_minutes: isPrematureStop
            ? elapsedMinutes
            : durationInMinutes,
          successful: true,
        });

        if (isPrematureStop) {
          toast.success(
            `Session saved! You meditated for ${elapsedMinutes} min.`
          );
        } else {
          toast.success(
            `Session complete! Well done on ${durationInMinutes} minutes.`
          );
        }
      } catch (err) {
        toast.error("Could not save session.");
      }
    } else if (isPrematureStop) {
      toast.info("Session was less than a minute and not saved.");
    }

    onClose();
  };

  // --- RENDER LOGIC ---

  if (isSilence) {
    // --- 1. SILENCE MODE ---
    // This is lag-free as it renders no iframe
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <h2 className="text-9xl font-thin text-white mb-8">
            {formatTime(secondsRemaining)}
          </h2>
          <p className="text-lg text-indigo-300 mb-4">Meditating in silence</p>
          <button
            onClick={() => handleStopAndSave(true)}
            disabled={completeMut.isLoading}
            className="px-10 py-4 bg-white/20 text-white font-semibold rounded-full hover:bg-white/30 transition-colors duration-300 disabled:opacity-50"
          >
            {completeMut.isLoading ? "Saving..." : "Stop & Save Session"}
          </button>
        </div>
      </div>
    );
  }

  // --- 2. VIDEO/AUDIO MODE (SIDE-BY-SIDE) ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[600px] flex overflow-hidden">
        {/* Left Side: Timer */}
        <div className="w-1/3 flex flex-col items-center justify-center p-8 bg-gray-50 border-r">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            {audioTrack.title}
          </h3>
          <div className="text-8xl font-thin text-indigo-600 mb-8">
            {formatTime(secondsRemaining)}
          </div>
          <button
            onClick={() => handleStopAndSave(true)}
            disabled={completeMut.isLoading}
            className="w-full px-10 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50"
          >
            {completeMut.isLoading ? "Saving..." : "Stop & Save"}
          </button>
        </div>

        {/* Right Side: Video Player */}
        <div className="w-2/3 bg-black">
          {/* This iframe is now VISIBLE, which fixes the "stuck loading" bug */}
          <iframe
            src={embedUrl}
            title={audioTrack.title}
            className="w-full h-full"
            frameBorder="0"
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};
