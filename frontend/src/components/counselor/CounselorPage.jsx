import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { SPECIALIZATIONS } from "../../utils/constants";

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Helper: get next date for the chosen weekday (YYYY-MM-DD)
const nextDateForDay = (dayKey) => {
  const today = new Date();
  const target = DAY_INDEX[dayKey];
  const todayIdx = today.getDay(); // 0=Sun .. 6=Sat
  let diff = (target - todayIdx + 7) % 7;
  if (diff === 0) diff = 7; // next week, not today
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().slice(0, 10);
};

const CounselorPage = () => {
  const [specialization, setSpecialization] = useState("");
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSlot, setSelectedSlot] = useState(null); // { counselor, slot }
  const [selectedDate, setSelectedDate] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch counselors (with filter)
  const fetchCounselors = async (spec = "") => {
    setLoading(true);
    try {
      const res = await api.get("/counselor/list/", {
        params: spec ? { specialization: spec } : {},
      });
      setCounselors(res.data.counselors || []);
    } catch (err) {
      toast.error("Failed to load counselors.");
      setCounselors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  const groupedAvailability = useMemo(() => {
    // counselorId -> day -> slots[]
    const map = {};
    for (const c of counselors) {
      const dayMap = {};
      c.availability?.forEach((slot) => {
        const day = slot.day;
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(slot);
      });
      map[c.profile_id] = dayMap;
    }
    return map;
  }, [counselors]);

  const handleOpenBooking = (counselor, slot) => {
    setSelectedSlot({ counselor, slot });
    setSelectedDate(nextDateForDay(slot.day));
  };

  const handleCloseBooking = () => {
    setSelectedSlot(null);
    setSelectedDate("");
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !selectedDate) return;

    setBookingLoading(true);
    try {
      await api.post("/counselor/book-appointment/", {
        slot_id: selectedSlot.slot.id,
        date: selectedDate,
      });
      toast.success("Appointment booked successfully!");
      handleCloseBooking();
    } catch (err) {
      const msg =
        err?.response?.data?.error || "Could not book this slot. Try another.";
      toast.error(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-blue-50 px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER + FILTER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-700">
              Find a Counselor
            </h1>
            <p className="text-gray-600 text-sm md:text-base mt-1">
              Search verified ArogyaManas counselors by specialization and pick
              a time that works for you.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs md:text-sm text-gray-600">
              Specialization
            </label>
            <select
              value={specialization}
              onChange={(e) => {
                const val = e.target.value;
                setSpecialization(val);
                fetchCounselors(val);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {SPECIALIZATIONS.map((s) => (
                <option key={s.value || "all"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center text-gray-500">
            Loading counselors...
          </div>
        ) : counselors.length === 0 ? (
          <div className="min-h-[40vh] flex items-center justify-center text-gray-500 text-sm">
            No counselors found for this filter yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {counselors.map((c) => {
              const daySlots = groupedAvailability[c.profile_id] || {};
              return (
                <motion.div
                  key={c.profile_id}
                  whileHover={{ translateY: -3 }}
                  className="bg-white rounded-2xl shadow-md border border-indigo-50 p-5 flex flex-col gap-4"
                >
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-indigo-700">
                        {c.name}
                      </h2>
                      <p className="text-xs font-medium text-indigo-500 mt-0.5">
                        {c.specialization_label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {c.experience} year
                        {c.experience === 1 ? "" : "s"} experience
                      </p>
                    </div>
                  </div>

                  {/* Bio & extras */}
                  <div className="text-xs text-gray-600 space-y-1">
                    {c.bio && <p>{c.bio}</p>}
                    {c.languages && (
                      <p>
                        <span className="font-semibold">Languages:</span>{" "}
                        {c.languages}
                      </p>
                    )}
                    {c.education && (
                      <p>
                        <span className="font-semibold">Education:</span>{" "}
                        {c.education}
                      </p>
                    )}
                    {c.approach && (
                      <p>
                        <span className="font-semibold">Approach:</span>{" "}
                        {c.approach}
                      </p>
                    )}
                  </div>

                  {/* Availability */}
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Weekly Availability
                    </p>
                    {Object.keys(daySlots).length === 0 ? (
                      <p className="text-[11px] text-gray-400">
                        Counselor has not added availability yet.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {Object.entries(daySlots).map(([dayKey, slots]) => (
                          <div key={dayKey}>
                            <p className="text-[11px] font-semibold text-indigo-600 mb-1">
                              {DAY_LABELS[dayKey]}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {slots.map((slot) => (
                                <button
                                  key={slot.id}
                                  onClick={() => handleOpenBooking(c, slot)}
                                  className="text-[11px] px-3 py-1 rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                >
                                  {slot.start_time} – {slot.end_time}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* BOOKING DIALOG */}
        <AnimatePresence>
          {selectedSlot && (
            <motion.div
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                  Confirm Appointment
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Counselor:{" "}
                  <span className="font-semibold">
                    {selectedSlot.counselor.name}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Slot:{" "}
                  <span className="font-semibold">
                    {DAY_LABELS[selectedSlot.slot.day]}{" "}
                    {selectedSlot.slot.start_time} –{" "}
                    {selectedSlot.slot.end_time}
                  </span>
                </p>

                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Choose Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Ideally choose a date that falls on{" "}
                      {DAY_LABELS[selectedSlot.slot.day]}.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseBooking}
                      className="px-4 py-2 text-xs rounded-full border text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="px-5 py-2 text-xs rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {bookingLoading ? "Booking..." : "Confirm Booking"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CounselorPage;
