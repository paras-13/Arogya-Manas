import React, { useState, useMemo } from "react";
import { useMindfulnessApi } from "../apiLinks/useMindfulnessApi";
import { toast } from "react-toastify";
import { MeditationTimerModal } from "./MeditationTimerModal"; // Import the new timer modal

// --- Reusable Internal Components ---

// Card to show Streaks
const StreakCard = ({ title, value, color = "indigo" }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
    <div className={`text-5xl font-bold text-${color}-600`}>{value}</div>
    <div className="text-sm font-semibold text-gray-500 mt-2 uppercase">
      {title}
    </div>
  </div>
);

// The 30-day Heatmap Component
const Heatmap = ({ daysMap, isLoading }) => {
  const days = useMemo(() => {
    if (!daysMap || Object.keys(daysMap).length === 0) {
      return Array(30).fill({ date: null, minutes: 0 });
    }
    return Object.keys(daysMap)
      .sort()
      .slice(-30)
      .map((k) => ({ date: k, minutes: daysMap[k] || 0 }));
  }, [daysMap]);

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading heatmap...</div>;
  }

  return (
    <div className="grid grid-cols-10 gap-1.5">
      {days.map((day, index) => {
        const m = day.minutes;
        const cls =
          m >= 30
            ? "bg-indigo-700"
            : m >= 15
            ? "bg-indigo-500"
            : m >= 1
            ? "bg-indigo-300"
            : "bg-gray-200 hover:bg-gray-300";
        return (
          <div
            key={day.date || index}
            title={day.date ? `${day.date}: ${m} min` : "No data"}
            className={`w-full aspect-square rounded ${cls} transition-colors`}
          ></div>
        );
      })}
    </div>
  );
};

// Filter chip for duration
const DurationChip = ({ value, label, onClick, active }) => (
  <button
    onClick={() => onClick(value)}
    className={`capitalize px-5 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
      active
        ? "bg-indigo-600 text-white shadow-lg"
        : "bg-white text-gray-700 hover:bg-gray-100 border"
    }`}
  >
    {label}
  </button>
);

const DURATION_OPTIONS = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
];

// --- Main Meditation Component ---

const Meditation = () => {
  const {
    useMeditations,
    useStartMeditation,
    useMeditationHeatmap,
    useGetMeditationStats,
  } = useMindfulnessApi();

  const { data: meditations = [], isLoading: medsLoading } = useMeditations();
  const { data: heatmapData, isLoading: heatmapLoading } =
    useMeditationHeatmap(30);
  const { data: stats, isLoading: statsLoading } = useGetMeditationStats();

  const startMut = useStartMeditation();

  // State for the new timer flow
  const [selectedDuration, setSelectedDuration] = useState(10); // Default 10 min
  const [selectedAudioId, setSelectedAudioId] = useState(""); // Default "silence"
  const [timerConfig, setTimerConfig] = useState(null); // This triggers the modal

  // --- Event Handlers ---

  const handleStartSession = async () => {
    // 1. Find the selected audio track object (if any)
    const audioTrack =
      meditations.find((m) => m.id === selectedAudioId) || null;
    let meditationId = audioTrack ? audioTrack.id : null;

    // 2. Create a session on the backend
    try {
      const res = await startMut.mutateAsync({ meditation_id: meditationId });
      const sessionId = res.session?.id || res.data?.session?.id;

      if (!sessionId) throw new Error("Could not create session.");

      // 3. Set the config to launch the timer modal
      setTimerConfig({
        sessionId: sessionId,
        durationInMinutes: selectedDuration,
        audioTrack: audioTrack,
      });
      toast.success("Meditation session started!");
    } catch (err) {
      toast.error("Could not start session.");
    }
  };

  const handleCloseTimer = () => {
    setTimerConfig(null);
  };

  // --- Render ---

  return (
    <>
      <div className="space-y-10">
        {/* --- Stats Header --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Your 30-Day Progress
            </h3>
            <Heatmap
              daysMap={heatmapData?.days || {}}
              isLoading={heatmapLoading}
            />
          </div>
          <div className="grid grid-rows-2 gap-6">
            <StreakCard
              title="Current Streak"
              value={statsLoading ? "..." : stats?.current_streak ?? 0}
              color="indigo"
            />
            <StreakCard
              title="Longest Streak"
              value={statsLoading ? "..." : stats?.longest_streak ?? 0}
              color="green"
            />
          </div>
        </div>

        {/* --- New Meditation Session --- */}
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            Start a New Session
          </h3>

          {/* 1. Select Duration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 mb-3">
              I want to meditate for...
            </label>
            <div className="flex flex-wrap justify-center gap-3">
              {DURATION_OPTIONS.map((opt) => (
                <DurationChip
                  key={opt.label}
                  value={opt.value}
                  label={opt.label}
                  onClick={setSelectedDuration}
                  active={selectedDuration === opt.value}
                />
              ))}
            </div>
          </div>

          {/* 2. Select Audio */}
          <div className="mb-8 max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-500 mb-3">
              With background audio...
            </label>
            {medsLoading ? (
              <p>Loading audio...</p>
            ) : (
              <select
                value={selectedAudioId}
                onChange={(e) => setSelectedAudioId(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Silence</option>
                {meditations.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.duration_minutes} min)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Start Button */}
          <button
            onClick={handleStartSession}
            disabled={startMut.isLoading}
            className="w-full max-w-md mx-auto py-4 px-8 bg-indigo-600 text-white text-xl font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50"
          >
            {startMut.isLoading ? "Starting..." : "Begin Meditation"}
          </button>
        </div>
      </div>

      {/* --- Timer Modal --- */}
      {timerConfig && (
        <MeditationTimerModal
          sessionId={timerConfig.sessionId}
          durationInMinutes={timerConfig.durationInMinutes}
          audioTrack={timerConfig.audioTrack}
          onClose={handleCloseTimer}
        />
      )}
    </>
  );
};

export default Meditation;
