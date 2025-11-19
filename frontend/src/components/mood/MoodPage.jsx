// src/components/mood/MoodPage.jsx
import React, { useState } from "react";
import MoodTracker from "./MootTracker";
import MoodCalendar from "./MoodCalendar";
import Diary from "./Diary";

const MoodPage = () => {
  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mood Tracker</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MoodTracker />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <MoodCalendar
            selectedDate={selectedDate}
            onDateSelect={(d) => setSelectedDate(d)} // this updates Diary
          />
          <Diary selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  );
};

export default MoodPage;
