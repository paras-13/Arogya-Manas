import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api";
import { toast } from "react-toastify";
import { FiVideo, FiMessageCircle, FiFileText } from "react-icons/fi";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

const CounselorSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);

  const [presModal, setPresModal] = useState({
    open: false,
    sessionId: null,
    notes: "",
    loading: false,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/counselor/my-sessions/");
        setSessions(res.data.sessions);
      } catch (e) {
        toast.error("Unable to load sessions.");
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = sessions.filter((s) => {
    if (selectedTab === "upcoming") return !s.is_past;
    if (selectedTab === "past") return s.is_past;
    return true;
  });

  const openPrescription = (session) => {
    setPresModal({
      open: true,
      sessionId: session.id,
      notes: session.has_prescription ? session.prescription : "",
      loading: false,
    });
  };

  const savePrescription = async () => {
    setPresModal((p) => ({ ...p, loading: true }));
    try {
      await api.post(
        `/counselor/session/${presModal.sessionId}/prescription/`,
        {
          notes: presModal.notes,
        }
      );
      toast.success("Prescription saved!");

      // update UI
      setSessions((prev) =>
        prev.map((s) =>
          s.id === presModal.sessionId ? { ...s, has_prescription: true } : s
        )
      );

      setPresModal({ open: false, sessionId: null, notes: "" });
    } catch {
      toast.error("Failed to save prescription.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-700">
            Your Counseling Sessions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage upcoming and past sessions, add notes, and support your
            students.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow p-1 rounded-full inline-flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm transition ${
                selectedTab === t.key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No sessions found.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((s) => (
              <motion.div
                key={s.id}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-2xl p-5 shadow border border-indigo-100"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-indigo-700">
                      {s.student}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {s.date} • {s.time}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.slot_day} | {s.slot_range}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 md:mt-0 flex gap-3">
                    {/* Start call - future */}
                    <button
                      onClick={() => toast.info("Video feature coming soon!")}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
                    >
                      <FiVideo className="w-5 h-5" />
                      Call
                    </button>

                    {/* Chat */}
                    <button
                      onClick={() => toast.info("Chat feature coming soon!")}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
                    >
                      <FiMessageCircle className="w-5 h-5" />
                      Chat
                    </button>

                    {/* Prescription */}
                    <button
                      onClick={() => openPrescription(s)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-emerald-700 border border-emerald-300 hover:bg-emerald-50"
                    >
                      <FiFileText className="w-5 h-5" />
                      {s.has_prescription ? "Edit Notes" : "Add Notes"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Prescription Modal */}
        <AnimatePresence>
          {presModal.open && (
            <motion.div
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <h3 className="text-lg font-bold text-indigo-700">
                  Add / Update Prescription
                </h3>
                <textarea
                  rows={6}
                  className="w-full mt-3 p-3 border rounded-lg"
                  placeholder="Write notes for the student..."
                  value={presModal.notes}
                  onChange={(e) =>
                    setPresModal((p) => ({ ...p, notes: e.target.value }))
                  }
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() =>
                      setPresModal({ open: false, sessionId: null, notes: "" })
                    }
                    className="px-4 py-2 rounded-full border text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={savePrescription}
                    className="px-5 py-2 rounded-full bg-indigo-600 text-white"
                  >
                    Save Notes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CounselorSessions;
