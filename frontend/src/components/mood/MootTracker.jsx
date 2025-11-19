import React, { useState } from "react";
import { toast } from "react-toastify";
import { useMoodApi } from "../apiLinks/useMoodApi";

const MoodTracker = () => {
  const [mood, setMood] = useState("");
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const { useCreateMood } = useMoodApi();
  const { mutate: createMood } = useCreateMood();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!mood) {
      toast.error("Please select your mood!");
      return;
    }

    createMood(
      { mood, note, is_public: isPublic },
      {
        onSuccess: (res) => {
          toast.success(res.data.message || "Mood saved!");
          setMood("");
          setNote("");
          setIsPublic(false);
        },
        onError: (err) => {
          toast.error(err.response?.data?.error || "Failed to save mood");
        },
      }
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        Log Today’s Mood
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Select Mood</option>
          <option value="joyful">😊 Joyful</option>
          <option value="calm">😌 Calm</option>
          <option value="neutral">😐 Neutral</option>
          <option value="stressed">😰 Stressed</option>
          <option value="sad">😞 Sad</option>
          <option value="angry">😠 Angry</option>
        </select>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe your day..."
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-400 h-60"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          <label>Make this entry public</label>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition"
        >
          Save Mood
        </button>
      </form>
    </div>
  );
};

export default MoodTracker;
