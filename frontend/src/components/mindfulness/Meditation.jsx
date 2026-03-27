import React, { useState, useMemo } from "react";
import { useMindfulnessApi } from "../apiLinks/useMindfulnessApi";
import { toast } from "react-toastify";
import { MeditationTimerModal } from "./MeditationTimerModal";

// --- Streak Card ---
const StreakCard = ({ title, value, icon, color = "indigo" }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg text-center flex flex-col items-center justify-center gap-2">
    <div className="text-3xl">{icon}</div>
    <div className={`text-5xl font-bold text-${color}-600 tabular-nums`}>
      {value}
    </div>
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {title}
    </div>
  </div>
);

// --- Monthly Calendar Heatmap ---
const MonthHeatmap = ({ heatmapData, isLoading }) => {
  const { days: daysMap = {}, month_name = "" } = heatmapData || {};

  // Build a proper calendar grid for the month
  const { weeks, totalDays } = useMemo(() => {
    if (!daysMap || Object.keys(daysMap).length === 0)
      return { weeks: [], totalDays: 0 };

    const dates = Object.keys(daysMap).sort();
    const firstDate = new Date(dates[0] + "T00:00:00");
    const startDow = firstDate.getDay(); // 0=Sun

    // Pad start with nulls so day 1 falls on correct column
    const cells = [
      ...Array(startDow).fill(null),
      ...dates.map((k) => ({ date: k, minutes: daysMap[k] ?? 0 })),
    ];

    // Chunk into weeks of 7
    const w = [];
    for (let i = 0; i < cells.length; i += 7) {
      w.push(cells.slice(i, i + 7));
    }
    return { weeks: w, totalDays: dates.length };
  }, [daysMap]);

  const colorFor = (m) => {
    if (m >= 20) return "bg-indigo-600 text-white";
    if (m >= 10) return "bg-indigo-400 text-white";
    if (m >= 1)  return "bg-indigo-200 text-indigo-700";
    return "bg-gray-100 text-gray-400";
  };

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  if (isLoading) {
    return (
      <div className="animate-pulse grid grid-cols-7 gap-1">
        {Array(35).fill(0).map((_, i) => (
          <div key={i} className="h-8 rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  const activeDays = Object.values(daysMap).filter((v) => v > 0).length;

  return (
    <div>
      {/* Month title + active count */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800">{month_name}</h3>
        <span className="text-xs text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
          {activeDays}/{totalDays} days active
        </span>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — compact cells */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {Array(7).fill(null).map((_, di) => {
            const cell = week[di];
            if (!cell) return <div key={di} />;
            const dayNum = parseInt(cell.date.split("-")[2]);
            return (
              <div
                key={di}
                title={`${cell.date}: ${cell.minutes} min`}
                className={`h-8 flex flex-col items-center justify-center rounded-md text-[10px] font-semibold transition-colors cursor-default ${colorFor(cell.minutes)}`}
              >
                <span className="text-xs font-bold leading-none">{dayNum}</span>
                {cell.minutes > 0 && (
                  <span className="text-[8px] opacity-80 leading-none mt-px">
                    {cell.minutes}m
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[9px] text-gray-400">None</span>
        <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
        <div className="w-3 h-3 rounded bg-indigo-200" />
        <div className="w-3 h-3 rounded bg-indigo-400" />
        <div className="w-3 h-3 rounded bg-indigo-600" />
        <span className="text-[9px] text-gray-400">20+ min</span>
      </div>
    </div>
  );
};

// Duration chip
const DurationChip = ({ value, label, onClick, active }) => (
  <button
    onClick={() => onClick(value)}
    className={`capitalize px-5 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
      active
        ? "bg-indigo-600 text-white shadow-lg scale-105"
        : "bg-white text-gray-700 hover:bg-gray-100 border"
    }`}
  >
    {label}
  </button>
);

const DURATION_OPTIONS = [
  { value: 5,  label: "5 min"  },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
];

// --- Hardcoded Audio Tracks ---
const LOCAL_AUDIO_TRACKS = [
  { id: "audio_rain", title: "Gentle Rain", source_url: "/audio/rain.mp3" },
  { id: "audio_birds", title: "Forest Birds", source_url: "/audio/birds.mp3" },
  { id: "audio_ocean", title: "Ocean Waves", source_url: "/audio/music.mp3" }, // Mapping music to ocean/relaxing
  { id: "audio_om", title: "Om Chanting", source_url: "/audio/om.mp3" },
  { id: "audio_flute", title: "Calming Flute", source_url: "/audio/flute.mp3" },
  { id: "audio_tibetan", title: "Tibetan Bowl", source_url: "/audio/tibetan-bowl.mp3" },
];

// --- Main Meditation Component ---
const Meditation = () => {
  const {
    useMeditations,
    useStartMeditation,
    useMeditationHeatmap,
    useGetMeditationStats,
  } = useMindfulnessApi();

  // We no longer fetch audios from DB, using local tracks
  const meditations = LOCAL_AUDIO_TRACKS;
  const medsLoading = false;
  
  // Current month heatmap (no args = defaults to now)
  const { data: heatmapData, isLoading: heatmapLoading } = useMeditationHeatmap();
  const { data: stats, isLoading: statsLoading } = useGetMeditationStats();

  const startMut = useStartMeditation();

  const [selectedDuration, setSelectedDuration] = useState(10);
  const [selectedAudioId, setSelectedAudioId] = useState("");
  const [timerConfig, setTimerConfig] = useState(null);

  const handleStartSession = async () => {
    const audioTrack =
      meditations.find((m) => m.id === selectedAudioId) || null;
    
    // We pass null for meditationId since these aren't in the DB anymore
    // The backend handles meditation_id=null gracefully (silence/custom)
    const meditationId = null;

    try {
      const res = await startMut.mutateAsync({ meditation_id: meditationId });
      const sessionId = res.session?.id || res.data?.session?.id;
      if (!sessionId) throw new Error("Could not create session.");

      setTimerConfig({ sessionId, durationInMinutes: selectedDuration, audioTrack });
      toast.success("Meditation session started!");
    } catch {
      toast.error("Could not start session.");
    }
  };

  const handleCloseTimer = () => setTimerConfig(null);

  return (
    <>
      <div className="space-y-8">

        {/* --- 3 Stat Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StreakCard
            title="Current Streak"
            value={statsLoading ? "..." : stats?.current_streak ?? 0}
            icon="🔥"
            color="indigo"
          />
          <StreakCard
            title="Longest Streak"
            value={statsLoading ? "..." : stats?.longest_streak ?? 0}
            icon="🏆"
            color="green"
          />
          <StreakCard
            title="Total Minutes"
            value={statsLoading ? "..." : stats?.total_minutes ?? 0}
            icon="⏱️"
            color="blue"
          />
        </div>

        {/* --- Monthly Heatmap --- */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <MonthHeatmap heatmapData={heatmapData} isLoading={heatmapLoading} />
        </div>

        {/* --- Start a New Session --- */}
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Start a New Session
          </h3>
          <p className="text-gray-400 text-sm mb-8">
            Choose your duration and optional background audio, then begin.
          </p>

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
              <p className="text-gray-400">Loading audio...</p>
            ) : (
              <select
                value={selectedAudioId}
                onChange={(e) => setSelectedAudioId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">Silence</option>
                {meditations.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Start Button */}
          <button
            onClick={handleStartSession}
            disabled={startMut.isLoading}
            className="w-full max-w-md mx-auto py-4 px-8 bg-indigo-600 text-white text-xl font-semibold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            {startMut.isLoading ? "Starting..." : "🧘 Begin Meditation"}
          </button>
        </div>
      </div>

      {/* Timer Modal */}
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
