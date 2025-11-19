import React from "react";
import { useMindfulnessApi } from "../apiLinks/useMindfulnessApi";

// A simple reusable stat card component
const StatCard = ({ title, value, unit, color = "indigo" }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg">
    <div className={`text-sm font-medium text-gray-500`}>{title}</div>
    <div className={`text-4xl font-bold text-${color}-600 mt-2`}>
      {value}
      {unit && <span className="text-2xl ml-1 text-gray-700">{unit}</span>}
    </div>
  </div>
);

// A simple component to show recent moods
const RecentMoods = ({ moods, isLoading }) => {
  const getMoodEmoji = (mood) => {
    const map = {
      joyful: "😊",
      calm: "😌",
      neutral: "😐",
      stressed: "😟",
      sad: "😢",
      angry: "😠",
    };
    return map[mood] || "❓";
  };

  if (isLoading) return <div className="text-center p-4">Loading moods...</div>;
  if (!moods || moods.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">
          Recent Moods
        </h4>
        <p className="text-gray-500">
          No mood summaries found. Start tracking your mood!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h4 className="text-lg font-semibold text-gray-700 mb-4">
        Your Week in Moods
      </h4>
      <div className="flex justify-between space-x-2 overflow-x-auto">
        {moods
          .slice(0, 7)
          .reverse()
          .map((summary) => (
            <div
              key={summary.date}
              className="flex-1 min-w-[70px] text-center p-3 bg-gray-50 rounded-lg"
            >
              <div className="text-3xl">
                {getMoodEmoji(summary.dominant_mood)}
              </div>
              <div className="text-xs font-semibold text-gray-500 mt-2">
                {new Date(summary.date).toLocaleDateString("en-US", {
                  weekday: "short",
                })}
              </div>
              <div className="text-xs capitalize text-gray-700">
                {summary.dominant_mood}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

const MindfulnessStats = () => {
  const { useStats, useRecentMoods } = useMindfulnessApi();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: moods, isLoading: moodsLoading } = useRecentMoods(7); // Fetch 7 days

  return (
    <div className="space-y-8">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sessions"
          value={statsLoading ? "..." : stats?.total_sessions ?? 0}
        />
        <StatCard
          title="Total Minutes"
          value={statsLoading ? "..." : stats?.total_minutes ?? 0}
          unit="min"
          color="green"
        />
        <StatCard
          title="Avg. Duration"
          value={statsLoading ? "..." : stats?.avg_duration ?? 0}
          unit="min"
          color="blue"
        />
      </div>

      {/* Recent Moods Component */}
      <RecentMoods moods={moods} isLoading={moodsLoading} />

      {/* Placeholder for future charts */}
      <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">
          Progress Chart
        </h4>
        <p className="text-gray-500">
          (Your mindfulness-over-time chart will go here)
        </p>
      </div>
    </div>
  );
};

export default MindfulnessStats;
