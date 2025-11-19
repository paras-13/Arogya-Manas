import React, { useState } from "react";
import dayjs from "dayjs";
import { useMoodApi } from "../apiLinks/useMoodApi";

const moodConfig = {
  angry: { color: "bg-red-400", emoji: "😡" },
  sad: { color: "bg-blue-400", emoji: "😢" },
  stressed: { color: "bg-purple-400", emoji: "😰" },
  neutral: { color: "bg-gray-300", emoji: "😐" },
  calm: { color: "bg-green-300", emoji: "😌" },
  joyful: { color: "bg-yellow-300", emoji: "😄" },
};

const MoodCalendar = ({ selectedDate, onDateSelect }) => {
  const [month, setMonth] = useState(dayjs().month());
  const [year, setYear] = useState(dayjs().year());
  const [hoveredDate, setHoveredDate] = useState(null);

  const { useCalendar } = useMoodApi();
  const { data, isLoading } = useCalendar(month + 1, year);

  const days = data?.days || {};
  const daysInMonth = dayjs(`${year}-${month + 1}-01`).daysInMonth();

  if (isLoading) return <p>Loading calendar...</p>;

  const getMoodDataForDate = (date) => {
    const entry = days[date];
    if (!entry) return null;
    return {
      mood: entry.mood,
      note: entry.note || null,
      emoji: moodConfig[entry.mood]?.emoji,
      color: moodConfig[entry.mood]?.color,
      score: entry.avg_score,
    };
  };

  const getMoodConfig = (date) => {
    const d = getMoodDataForDate(date);
    return d ? { color: d.color, emoji: d.emoji } : null;
  };

  return (
    <div className="relative bg-white p-6 rounded-2xl shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Mood Calendar</h2>
        <div className="space-x-2">
          <button
            className="text-indigo-600 font-semibold"
            onClick={() => {
              if (month === 0) {
                setYear(year - 1);
                setMonth(11);
              } else setMonth(month - 1);
            }}
          >
            ⬅
          </button>
          <span>{dayjs(`${year}-${month + 1}-01`).format("MMMM YYYY")}</span>
          <button
            className="text-indigo-600 font-semibold"
            onClick={() => {
              if (month === 11) {
                setYear(year + 1);
                setMonth(0);
              } else setMonth(month + 1);
            }}
          >
            ➡
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-sm text-gray-700">
        {Object.entries(moodConfig).map(([mood, { color, emoji }]) => (
          <div key={mood} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded-full ${color}`} />
            <span>
              {emoji} {mood}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {[...Array(daysInMonth)].map((_, i) => {
          const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            i + 1
          ).padStart(2, "0")}`;
          const moodCfg = getMoodConfig(date);
          const moodData = getMoodDataForDate(date);
          const isSelected = selectedDate === date;

          return (
            <div
              key={date}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
              onClick={() => onDateSelect && onDateSelect(date)}
              className={`relative h-16 rounded-lg flex flex-col items-center justify-center text-sm transition-transform cursor-pointer hover:scale-105 ${
                moodCfg?.color || "bg-gray-100"
              } ${isSelected ? "ring-4 ring-indigo-500" : ""}`}
            >
              <span className="font-semibold">{i + 1}</span>
              {moodCfg && <span className="text-lg">{moodCfg.emoji}</span>}

              {hoveredDate === date && moodData && (
                <div className="absolute z-10 -top-20 w-48 p-3 bg-white shadow-lg rounded-lg border text-xs text-gray-700">
                  <div className="flex items-center mb-1">
                    <span className="text-lg mr-2">{moodData.emoji}</span>
                    <span className="font-semibold capitalize">
                      {moodData.mood}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">
                    Avg: {moodData.score?.toFixed(2)}
                  </p>
                  {moodData.note ? (
                    <p className="text-gray-600">{moodData.note}</p>
                  ) : (
                    <p className="text-gray-400 italic">No note for this day</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoodCalendar;
