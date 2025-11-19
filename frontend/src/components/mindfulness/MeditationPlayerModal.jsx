import React from "react";
import { toast } from "react-toastify";

// Helper to embed YouTube URLs correctly
const getEmbedUrl = (url) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
    }
    const videoId = urlObj.searchParams.get("v");
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return `${url}?autoplay=1`; // Attempt autoplay
  } catch (e) {
    return url; // Fallback
  }
};

export const MeditationPlayerModal = ({
  meditation,
  activeSession,
  onClose,
  onComplete,
  isLoadingComplete,
}) => {
  const embedUrl = getEmbedUrl(meditation.source_url);

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {meditation.title}
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

        {/* --- Video/Audio Player --- */}
        <div className="flex-1 flex flex-col">
          <div className="aspect-video bg-black">
            <iframe
              src={embedUrl}
              title={meditation.title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="p-5 flex justify-between items-center bg-gray-50">
            <span className="text-sm text-gray-500">
              {meditation.duration_minutes} Minute Session
            </span>
            {/* Show "Mark Complete" only if a session was officially started */}
            {activeSession && (
              <button
                onClick={onComplete}
                disabled={isLoadingComplete}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300 disabled:opacity-50"
              >
                {isLoadingComplete ? "Completing..." : "Mark Complete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
