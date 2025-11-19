// src/components/counselor/StudentAppointments.jsx

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api";
import { toast } from "react-toastify";
import { FiVideo, FiMessageCircle, FiFileText, FiStar } from "react-icons/fi";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

const statusBadgeClasses = (status) => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    case "pending":
    case "applied":
    default:
      return "bg-yellow-50 text-yellow-700 border-yellow-100";
  }
};

const StudentAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);

  const [prescriptionModal, setPrescriptionModal] = useState({
    open: false,
    loading: false,
    appointmentId: null,
    notes: "",
    date: "",
  });

  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    loading: false,
    appointmentId: null,
    rating: 5,
    comments: "",
  });

  // Fetch history on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await api.get("/counselor/my-appointments/");
        setAppointments(res.data.appointments || []);
      } catch (err) {
        toast.error("Failed to load your appointments.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    if (selectedTab === "upcoming") {
      return appointments.filter((a) => !a.is_past && a.status !== "cancelled");
    }
    if (selectedTab === "past") {
      return appointments.filter((a) => a.is_past || a.status === "completed");
    }
    return appointments;
  }, [appointments, selectedTab]);

  // ====== Prescription handlers ======

  const openPrescriptionModal = async (appointmentId) => {
    setPrescriptionModal({
      open: true,
      loading: true,
      appointmentId,
      notes: "",
      date: "",
    });

    try {
      const res = await api.get(
        `/counselor/appointments/${appointmentId}/prescription/`
      );
      setPrescriptionModal((prev) => ({
        ...prev,
        loading: false,
        notes: res.data.notes || "",
        date: res.data.date || "",
      }));
    } catch (err) {
      setPrescriptionModal((prev) => ({ ...prev, loading: false }));
      toast.error("Failed to load notes.");
    }
  };

  const closePrescriptionModal = () => {
    setPrescriptionModal({
      open: false,
      loading: false,
      appointmentId: null,
      notes: "",
      date: "",
    });
  };

  // ====== Feedback handlers ======

  const openFeedbackModal = (appointment) => {
    const existing = appointment.feedback;
    setFeedbackModal({
      open: true,
      loading: false,
      appointmentId: appointment.id,
      rating: existing?.rating || 5,
      comments: existing?.comments || "",
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({
      open: false,
      loading: false,
      appointmentId: null,
      rating: 5,
      comments: "",
    });
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    const { appointmentId, rating, comments } = feedbackModal;
    if (!appointmentId) return;

    setFeedbackModal((prev) => ({ ...prev, loading: true }));

    try {
      const res = await api.post(
        `/counselor/appointments/${appointmentId}/feedback/`,
        { rating, comments }
      );

      // Update in local state
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                feedback: {
                  rating,
                  comments,
                  created_at: new Date().toISOString(),
                },
              }
            : a
        )
      );

      toast.success("Feedback saved.");
      closeFeedbackModal();
    } catch (err) {
      const msg =
        err?.response?.data?.error || "Failed to save feedback. Try again.";
      toast.error(msg);
      setFeedbackModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // ====== UI helpers ======

  const handleJoinCall = (appt) => {
    // For now, just show a toast. Later you can integrate actual meeting_link / video.
    if (appt.meeting_link) {
      toast.info("Video call integration coming soon!");
      // window.open(appt.meeting_link, "_blank");
    } else {
      toast.info("Video call feature will be added soon.");
    }
  };

  const handleOpenChat = () => {
    toast.info("In-app chat coming soon.");
  };

  // ====== Render ======

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-700">
              My Counseling Sessions
            </h1>
            <p className="text-gray-600 text-sm md:text-base mt-1">
              View all your scheduled and past sessions with ArogyaManas
              counselors. Join meetings, read notes, and share feedback.
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-full shadow-sm flex items-center p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`px-4 py-1.5 text-xs md:text-sm rounded-full transition ${
                  selectedTab === tab.key
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center text-gray-500 text-sm">
            Loading your appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-gray-500 text-sm">
            <p>No appointments found in this category.</p>
            <p className="mt-1">
              You can book a session from the{" "}
              <span className="font-semibold text-indigo-600">Counselor</span>{" "}
              section.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appt) => (
              <motion.div
                key={appt.id}
                whileHover={{ translateY: -2 }}
                className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                {/* Left info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-semibold text-indigo-700">
                      {appt.counselor || "Counselor"}
                    </h2>
                    {appt.specialization && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        {appt.specialization}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600">
                    {appt.date} • {appt.time} •{" "}
                    <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border font-medium capitalize mr-1 mt-1 md:mt-0">
                      <span
                        className={statusBadgeClasses(appt.status)}
                        style={{ padding: "0.125rem 0.4rem" }}
                      >
                        {appt.status}
                      </span>
                    </span>
                    {appt.is_past && (
                      <span className="text-[11px] text-gray-400 ml-1">
                        (Past session)
                      </span>
                    )}
                  </p>
                </div>

                {/* Right actions */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {/* Join Call */}
                  <button
                    onClick={() => handleJoinCall(appt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] md:text-xs rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <FiVideo className="w-4 h-4" />
                    Join Call
                  </button>

                  {/* Chat */}
                  <button
                    onClick={handleOpenChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] md:text-xs rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <FiMessageCircle className="w-4 h-4" />
                    Chat
                  </button>

                  {/* Prescription */}
                  <button
                    onClick={() => openPrescriptionModal(appt.id)}
                    disabled={!appt.has_prescription}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] md:text-xs rounded-full border ${
                      appt.has_prescription
                        ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        : "border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <FiFileText className="w-4 h-4" />
                    {appt.has_prescription ? "View Notes" : "Notes Pending"}
                  </button>

                  {/* Feedback */}
                  <button
                    onClick={() => openFeedbackModal(appt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] md:text-xs rounded-full border border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                  >
                    <FiStar className="w-4 h-4" />
                    {appt.feedback ? "Edit Feedback" : "Give Feedback"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Prescription Modal */}
        <AnimatePresence>
          {prescriptionModal.open && (
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
                className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                  Counselor Notes
                </h3>
                {prescriptionModal.loading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : prescriptionModal.notes ? (
                  <>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Added on {prescriptionModal.date}
                    </p>
                    <div className="text-sm text-gray-700 whitespace-pre-line bg-indigo-50/40 border border-indigo-100 rounded-lg p-3 max-h-60 overflow-y-auto">
                      {prescriptionModal.notes}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    No notes have been added yet for this session.
                  </p>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={closePrescriptionModal}
                    className="px-4 py-2 text-xs rounded-full border text-gray-600 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Modal */}
        <AnimatePresence>
          {feedbackModal.open && (
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
                className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold text-indigo-700 mb-3">
                  {feedbackModal.appointmentId && "Session Feedback"}
                </h3>

                <form onSubmit={submitFeedback} className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setFeedbackModal((prev) => ({
                              ...prev,
                              rating: star,
                            }))
                          }
                          className={`p-1 ${
                            star <= feedbackModal.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          <FiStar className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                      <span className="text-xs text-gray-500 ml-2">
                        {feedbackModal.rating} / 5
                      </span>
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Feedback (optional)
                    </label>
                    <textarea
                      rows={4}
                      value={feedbackModal.comments}
                      onChange={(e) =>
                        setFeedbackModal((prev) => ({
                          ...prev,
                          comments: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Share how this session helped you or any suggestions."
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeFeedbackModal}
                      className="px-4 py-2 text-xs rounded-full border text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={feedbackModal.loading}
                      className="px-5 py-2 text-xs rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {feedbackModal.loading ? "Saving..." : "Save Feedback"}
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

export default StudentAppointments;
