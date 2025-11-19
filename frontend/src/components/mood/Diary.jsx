// src/components/mood/Diary.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useMoodApi } from "../apiLinks/useMoodApi";

const Diary = ({ selectedDate }) => {
  const [filter, setFilter] = useState("all");
  const { useDiary, useToggleVisibility } = useMoodApi();

  // Pass filter + date into useDiary (it handles params)
  const { data: entries = [], isLoading } = useDiary({
    filter,
    date: selectedDate,
  });
  const { mutate: toggleVisibility } = useToggleVisibility();

  const handleToggle = (entry_id, currentStatus) => {
    toggleVisibility(
      { entry_id, is_public: !currentStatus },
      {
        onSuccess: () => toast.success("Visibility updated!"),
        onError: () => toast.error("Failed to update"),
      }
    );
  };

  if (isLoading) return <p>Loading...</p>;

  // If selectedDate provided, show only entries for that date
  const filteredEntries = selectedDate
    ? entries.filter((e) => e.date === selectedDate)
    : entries;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          {selectedDate ? `Diary — ${selectedDate}` : "Your Diary"}
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-md p-1"
        >
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <p className="text-gray-400 text-center">No entries found.</p>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition"
            >
              <p className="font-medium">
                {entry.date} —{" "}
                <span className="text-indigo-600 font-semibold">
                  {entry.mood}
                </span>
              </p>
              <p className="text-gray-600 text-sm mt-1">{entry.note}</p>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{entry.is_public ? "🌍 Public" : "🔒 Private"}</span>
                <button
                  onClick={() => handleToggle(entry.id, entry.is_public)}
                  className="text-indigo-500 hover:underline"
                >
                  Toggle
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Diary;
