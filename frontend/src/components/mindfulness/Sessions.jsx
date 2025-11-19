import React, { useState } from "react";
import { useMindfulnessApi } from "../apiLinks/useMindfulnessApi";
import { ActivityPlayerModal } from "./ActivityPlayerModal"; // Import the new modal

const MoodChip = ({ value, onClick, active }) => (
  <button
    onClick={() => onClick(value)}
    className={`capitalize px-4 py-2 rounded-full font-medium transition-all duration-300 ${
      active
        ? "bg-indigo-600 text-white shadow-lg"
        : "bg-white text-gray-700 hover:bg-gray-100 border"
    }`}
  >
    {value}
  </button>
);

// New component for the activity cards for better UI
const ActivityCard = ({ activity, onStart }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col">
    <div className="p-6 flex-1">
      <div className="font-semibold text-xl text-gray-800 mb-2">
        {activity.name}
      </div>
      <div className="text-sm text-gray-500 mb-4">
        {activity.duration_minutes} min
      </div>
      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
        {activity.description || "A guided session to help you find balance."}
      </p>
    </div>
    <div className="p-4 bg-gray-50 flex justify-end items-center gap-2">
      <span className="text-xs font-medium text-indigo-500 uppercase">
        {activity.mood_tags?.join(", ")}
      </span>
      <button
        className="ml-auto px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300"
        onClick={() => onStart(activity)}
      >
        Start
      </button>
    </div>
  </div>
);

const Sessions = () => {
  const { useRecommendations, useActivitiesByMood } = useMindfulnessApi();
  const { data: recData, isLoading: recLoading } = useRecommendations();
  const [selectedMood, setSelectedMood] = useState(null);
  const { data: moodActivities = [], isLoading: moodLoading } =
    useActivitiesByMood(selectedMood || "");

  // State to manage the modal
  const [activeActivity, setActiveActivity] = useState(null);

  const moodOptions = ["angry", "sad", "stressed", "neutral", "calm", "joyful"];

  const handleStart = (activity) => {
    setActiveActivity(activity);
  };

  return (
    <>
      <div className="space-y-10">
        {/* Recommended Sessions Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Sessions for You
          </h3>
          {recLoading ? (
            <p>Loading recommendations...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(recData?.recommendations || []).map((act) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  onStart={handleStart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Explore by Mood Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-semibold text-gray-800 mb-5">
            Explore by Mood
          </h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {moodOptions.map((m) => (
              <MoodChip
                key={m}
                value={m}
                onClick={setSelectedMood}
                active={selectedMood === m}
              />
            ))}
          </div>
          {moodLoading ? (
            <p>Loading activities...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moodActivities.map((act) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  onStart={handleStart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Render the modal if an activity is selected */}
      {activeActivity && (
        <ActivityPlayerModal
          activity={activeActivity}
          onClose={() => setActiveActivity(null)}
        />
      )}
    </>
  );
};

export default Sessions;
