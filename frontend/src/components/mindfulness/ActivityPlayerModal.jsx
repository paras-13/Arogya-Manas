import React, { useState } from "react";
import { useMindfulnessApi } from "../apiLinks/useMindfulnessApi";
import { toast } from "react-toastify";

// Define mood options here to be consistent
const MOOD_OPTIONS = ["angry", "sad", "stressed", "neutral", "calm", "joyful"];

export const ActivityPlayerModal = ({ activity, onClose }) => {
  const { useStartSession, useCompleteSession } = useMindfulnessApi();
  const startMutation = useStartSession();
  const completeMutation = useCompleteSession();

  const [stage, setStage] = useState("before"); // 'before', 'playing', 'after'
  const [sessionId, setSessionId] = useState(null);

  const handleStartSession = async (moodBefore) => {
    try {
      const res = await startMutation.mutateAsync({
        activity_id: activity.id,
        mood_before: moodBefore,
      });
      // The session ID might be nested differently, adjust as needed
      const newSessionId = res.session?.id || res.data?.session?.id;
      if (!newSessionId) {
        throw new Error("Could not get session ID from server.");
      }
      setSessionId(newSessionId);
      setStage("playing"); // Move to the video player stage
      toast.success("Session started. Enjoy.");
    } catch (err) {
      toast.error("Could not start session. Please try again.");
    }
  };

  const handleCompleteSession = async (moodAfter) => {
    if (!sessionId) {
      toast.error("No active session to complete.");
      return;
    }
    try {
      await completeMutation.mutateAsync({
        session_id: sessionId,
        duration_minutes: activity.duration_minutes,
        mood_after: moodAfter,
      });
      toast.success("Session completed! Well done.");
      onClose(); // Close the modal
    } catch (err) {
      toast.error("Could not complete session.");
    }
  };

  // Helper to embed YouTube URLs correctly
  const getEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtu.be")) {
        return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
      }
      const videoId = urlObj.searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (e) {
      return url; // Fallback for non-youtube URLs
    }
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {activity.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* --- STAGE 1: MOOD BEFORE --- */}
        {stage === "before" && (
          <div className="p-8 text-center">
            <h4 className="text-2xl font-semibold text-gray-700 mb-6">
              How are you feeling right now?
            </h4>
            <div className="flex flex-wrap justify-center gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleStartSession(mood)}
                  disabled={startMutation.isLoading}
                  className="capitalize text-lg font-medium px-6 py-3 rounded-full border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all duration-300 disabled:opacity-50"
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- STAGE 2: PLAYING VIDEO --- */}
        {stage === "playing" && (
          <div className="flex-1 flex flex-col">
            <div className="aspect-video bg-black">
              <iframe
                src={getEmbedUrl(activity.video_url)}
                title={activity.name}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 flex justify-end">
              <button
                onClick={() => setStage("after")}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300"
              >
                Finish Session
              </button>
            </div>
          </div>
        )}

        {/* --- STAGE 3: MOOD AFTER --- */}
        {stage === "after" && (
          <div className="p-8 text-center">
            <h4 className="text-2xl font-semibold text-gray-700 mb-6">
              How are you feeling now?
            </h4>
            <div className="flex flex-wrap justify-center gap-3">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleCompleteSession(mood)}
                  disabled={completeMutation.isLoading}
                  className="capitalize text-lg font-medium px-6 py-3 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 disabled:opacity-50"
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
