import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import { motion } from "framer-motion";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const labelForDay = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const CounselorAvailability = () => {
  const [slots, setSlots] = useState([]); // all slots from backend
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Local state for new slot creation
  const [newSlot, setNewSlot] = useState({
    day: "monday",
    start_time: "",
    end_time: "",
  });

  // Group slots by day for UI
  const slotsByDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => (map[d] = []));
    slots.forEach((s) => {
      if (!map[s.day]) map[s.day] = [];
      map[s.day].push(s);
    });
    return map;
  }, [slots]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await api.get("/counselor/availability/");
      setSlots(res.data.availability || []);
    } catch (err) {
      setError("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleNewSlotChange = (e) => {
    const { name, value } = e.target;
    setNewSlot((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newSlot.start_time || !newSlot.end_time) {
      setError("Please select both start and end time.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        day: newSlot.day,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
      };
      const res = await api.post("/counselor/availability/", payload);

      // Append new slots
      const created = res.data.slots || [];
      setSlots((prev) => [...prev, ...created]);

      // Reset form
      setNewSlot((prev) => ({
        ...prev,
        start_time: "",
        end_time: "",
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Error adding availability slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/counselor/availability/${id}/`);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError("Failed to delete slot.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading your availability...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 md:px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-700">
              Weekly Availability
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Set the days and time slots when you are available to meet
              students on ArogyaManas.
            </p>
          </div>

          <div className="bg-white border border-indigo-100 rounded-2xl px-4 py-3 shadow-sm text-xs md:text-sm text-gray-600 max-w-md">
            <span className="font-semibold text-indigo-600">Tip:</span> Create
            short, focused slots (e.g., 30–60 minutes) instead of very long
            blocks. This helps students pick convenient times.
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Add Slot Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md border border-indigo-50 p-5 md:p-6"
        >
          <h2 className="text-lg font-semibold text-indigo-700 mb-4">
            Add a new availability slot
          </h2>

          <form
            onSubmit={handleAddSlot}
            className="flex flex-col md:flex-row gap-4 md:items-end"
          >
            {/* Day select */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Day
              </label>
              <select
                name="day"
                value={newSlot.day}
                onChange={handleNewSlotChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {labelForDay[d]}
                  </option>
                ))}
              </select>
            </div>

            {/* Start time */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Start time
              </label>
              <input
                type="time"
                name="start_time"
                value={newSlot.start_time}
                onChange={handleNewSlotChange}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required
              />
            </div>

            {/* End time */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                End time
              </label>
              <input
                type="time"
                name="end_time"
                value={newSlot.end_time}
                onChange={handleNewSlotChange}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required
              />
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow-md hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Add Slot"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Weekly view */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {DAYS.map((dayKey) => {
            const daySlots = slotsByDay[dayKey] || [];
            return (
              <div
                key={dayKey}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-indigo-700 text-sm">
                    {labelForDay[dayKey]}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {daySlots.length} slot
                    {daySlots.length === 1 ? "" : "s"}
                  </span>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No slots added yet for this day.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between bg-indigo-50 rounded-xl px-3 py-2 text-xs"
                      >
                        <span className="font-medium text-indigo-800">
                          {slot.start_time} – {slot.end_time}
                        </span>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default CounselorAvailability;
