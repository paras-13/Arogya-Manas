// src/components/student/StudentDashboard.jsx

import React, { useEffect, useState, useMemo } from "react";
import api from "../../api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  FiActivity,
  FiClock,
  FiHeart,
  FiUserCheck,
  FiTrendingUp,
} from "react-icons/fi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// score -> mood label map
const SCORE_TO_MOOD = {
  1: "Angry",
  2: "Sad",
  3: "Stressed",
  4: "Neutral",
  5: "Calm",
  6: "Joyful",
};

// small stat card
const StatCard = ({ icon, label, value, helper }) => (
  <div className="bg-white rounded-2xl shadow-md p-4 border border-indigo-50 flex items-start gap-3">
    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">{icon}</div>
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase">
        {label}
      </div>
      <div className="text-xl font-bold text-indigo-800 mt-1">{value}</div>
      {helper && (
        <div className="text-[11px] text-gray-400 mt-0.5">{helper}</div>
      )}
    </div>
  </div>
);

const StudentDashboard = () => {
  const [rawMood, setRawMood] = useState([]);
  const [dailyMood, setDailyMood] = useState([]);
  const [streaks, setStreaks] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moodView, setMoodView] = useState("raw"); // "raw" | "daily"

  // ---------- Fetch all dashboard data ----------
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [rawRes, dailyRes, streakRes, sessionsRes] = await Promise.all([
          api.get("/dashboard/mood/raw/?days=30"),
          api.get("/dashboard/mood/daily/?days=30"),
          api.get("/dashboard/streaks/"),
          api.get("/dashboard/sessions/summary/"),
        ]);

        setRawMood(rawRes.data.moods || []);
        setDailyMood(dailyRes.data.summaries || []);
        setStreaks(streakRes.data || null);
        setSessions(sessionsRes.data || null);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ---------- Prepare chart data ----------

  const rawMoodChartData = useMemo(() => {
    if (!rawMood.length) return null;

    const labels = rawMood.map((m) => {
      const d = m.created_at ? new Date(m.created_at) : new Date(m.date);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    const scores = rawMood.map((m) => m.mood_score);

    return {
      labels,
      datasets: [
        {
          label: "Mood score (all logs)",
          data: scores,
          borderColor: "rgb(79, 70, 229)", // indigo-600
          backgroundColor: "rgba(129, 140, 248, 0.2)", // indigo-400/20
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [rawMood]);

  const dailyMoodChartData = useMemo(() => {
    if (!dailyMood.length) return null;

    const labels = dailyMood.map((d) => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    });

    const scores = dailyMood.map((d) => d.avg_score);

    return {
      labels,
      datasets: [
        {
          label: "Daily average mood score",
          data: scores,
          borderColor: "rgb(16, 185, 129)", // emerald-500
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [dailyMood]);

  const moodChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 1,
        max: 6,
        ticks: {
          stepSize: 1,
          callback: (value) =>
            `${value} – ${SCORE_TO_MOOD[value] || "Unknown"}`,
        },
        title: {
          display: true,
          text: "Mood score (1–6)",
        },
      },
      x: {
        ticks: {
          maxRotation: 60,
          minRotation: 30,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const score = ctx.parsed.y;
            const moodLabel = SCORE_TO_MOOD[Math.round(score)] || "";
            return `Score: ${score} (${moodLabel})`;
          },
        },
      },
      legend: {
        display: true,
      },
    },
  };

  const moodLegendBadges = (
    <div className="flex flex-wrap gap-2 text-[11px] text-gray-600 mt-2">
      {Object.entries(SCORE_TO_MOOD).map(([score, mood]) => (
        <span
          key={score}
          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full border border-gray-100"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
          <span className="font-semibold">{score}</span>
          <span>– {mood}</span>
        </span>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="text-gray-500 text-sm animate-pulse">
          Loading your wellbeing dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-800 flex items-center gap-2">
              <FiActivity className="w-6 h-6 text-indigo-500" />
              Wellbeing Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              See your mood trends, mindfulness practice, and sessions at a
              glance.
            </p>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<FiTrendingUp />}
            label="Mood streak (days)"
            value={
              streaks?.mood_streak?.current_streak != null
                ? streaks.mood_streak.current_streak
                : 0
            }
            helper={`Best: ${
              streaks?.mood_streak?.longest_streak || 0
            } days in a row`}
          />
          <StatCard
            icon={<FiClock />}
            label="Meditation minutes"
            value={streaks?.meditation?.total_minutes || 0}
            helper={`Sessions: ${streaks?.meditation?.total_sessions || 0}`}
          />
          <StatCard
            icon={<FiHeart />}
            label="Mindfulness sessions"
            value={sessions?.mindfulness?.total_sessions || 0}
            helper={`${sessions?.mindfulness?.total_minutes || 0} min total`}
          />
          <StatCard
            icon={<FiUserCheck />}
            label="Counseling sessions"
            value={sessions?.counseling?.total_sessions || 0}
            helper={`${Math.round(
              (sessions?.counseling?.total_minutes || 0) / 60
            )} hrs spent`}
          />
        </div>

        {/* Mood graphs */}
        <div className="bg-white rounded-3xl shadow-lg border border-indigo-50 p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                Mood Trends
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Switch between all mood logs and daily mood summary.
              </p>
            </div>

            <div className="inline-flex bg-indigo-50 rounded-full p-1 text-xs">
              <button
                onClick={() => setMoodView("raw")}
                className={`px-3 py-1.5 rounded-full ${
                  moodView === "raw"
                    ? "bg-white shadow text-indigo-700"
                    : "text-gray-600"
                }`}
              >
                All Moods
              </button>
              <button
                onClick={() => setMoodView("daily")}
                className={`px-3 py-1.5 rounded-full ${
                  moodView === "daily"
                    ? "bg-white shadow text-indigo-700"
                    : "text-gray-600"
                }`}
              >
                Daily Mood
              </button>
            </div>
          </div>

          <div className="h-72 md:h-80">
            {moodView === "raw" ? (
              rawMoodChartData ? (
                <Line data={rawMoodChartData} options={moodChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No mood entries yet. Try logging how you feel today.
                </div>
              )
            ) : dailyMoodChartData ? (
              <Line data={dailyMoodChartData} options={moodChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Daily mood summary will appear once you log moods for a few
                days.
              </div>
            )}
          </div>

          {/* Score → Mood legend */}
          <div className="mt-3">
            <div className="text-[11px] font-semibold text-gray-500 uppercase mb-1">
              Score to Mood Mapping
            </div>
            {moodLegendBadges}
          </div>
        </div>

        {/* Meditation & sessions quick summary row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Meditation streak mini card */}
          <div className="bg-white rounded-2xl shadow-md border border-emerald-50 p-5">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <FiClock className="text-emerald-500" />
              Meditation Streak
            </h3>
            <div className="flex items-end gap-6">
              <div>
                <div className="text-3xl font-extrabold text-emerald-600">
                  {streaks?.meditation?.current_streak || 0}
                </div>
                <div className="text-[12px] text-gray-500 mt-1">
                  days in a row
                </div>
              </div>
              <div className="text-[12px] text-gray-500">
                <div>
                  Longest streak:{" "}
                  <span className="font-semibold text-gray-700">
                    {streaks?.meditation?.longest_streak || 0} days
                  </span>
                </div>
                <div>
                  Total time:{" "}
                  <span className="font-semibold text-gray-700">
                    {streaks?.meditation?.total_minutes || 0} min
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Counseling time mini card */}
          <div className="bg-white rounded-2xl shadow-md border border-indigo-50 p-5">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <FiUserCheck className="text-indigo-500" />
              Counseling Engagement
            </h3>
            <div className="flex items-end gap-6">
              <div>
                <div className="text-3xl font-extrabold text-indigo-600">
                  {sessions?.counseling?.completed_sessions || 0}
                </div>
                <div className="text-[12px] text-gray-500 mt-1">
                  sessions completed
                </div>
              </div>
              <div className="text-[12px] text-gray-500">
                <div>
                  Total time:{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.round(
                      (sessions?.counseling?.total_minutes || 0) / 60
                    )}{" "}
                    hrs
                  </span>
                </div>
                <div>
                  Average per session:{" "}
                  <span className="font-semibold text-gray-700">
                    {sessions?.counseling?.total_sessions
                      ? Math.round(
                          (sessions.counseling.total_minutes || 0) /
                            sessions.counseling.total_sessions
                        )
                      : 0}{" "}
                    min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Small note */}
        <p className="text-[11px] text-gray-400 text-center">
          This dashboard helps you reflect, not diagnose. If anything feels too
          heavy, consider booking a session with a counselor.
        </p>
      </div>
    </div>
  );
};

export default StudentDashboard;
