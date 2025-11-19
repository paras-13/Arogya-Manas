import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";

const CounselorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]); // will be derived if needed
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // ⭐ NEW ENDPOINT
        const res = await api.get("/counselor/dashboard-data/");

        setProfile(res.data.profile);
        setSessions(res.data.sessions);
        setFeedback(res.data.feedback);
        setStats(res.data.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleAvailabilityClick = () => {
    alert("Availability UI coming here (struct ready).");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50 px-4 md:px-10 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-700">
              Counselor Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Welcome back,{" "}
              {profile?.user?.full_name || profile?.user?.username}.
            </p>
          </div>

          <button
            onClick={handleAvailabilityClick}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700"
          >
            Manage Availability
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-md p-4 border border-indigo-50">
            <div className="text-xs text-gray-500">Total Sessions</div>
            <div className="text-2xl font-bold text-indigo-700">
              {stats?.total_sessions || 0}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4 border border-indigo-50">
            <div className="text-xs text-gray-500">Students Guided</div>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.unique_students || 0}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4 border border-indigo-50">
            <div className="text-xs text-gray-500">Feedback Score</div>
            <div className="text-2xl font-bold text-amber-500">
              {stats?.average_rating || "—"}
            </div>
            <div className="text-xs text-gray-400">
              {stats?.total_feedback_count
                ? `${stats.total_feedback_count} reviews`
                : "No feedback yet"}
            </div>
          </div>
        </div>

        {/* Sessions & Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming sessions */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-5 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Upcoming Sessions
            </h2>

            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming sessions yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between bg-indigo-50/60 rounded-xl px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-semibold text-indigo-700">
                        {session.student_name || "Student"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {session.date} • {session.time} • {session.status}
                      </div>
                    </div>

                    <button className="text-xs px-3 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700">
                      Join Session
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback placeholder (unchanged UI) */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Recent Feedback
            </h2>

            {feedback.length === 0 ? (
              <p className="text-sm text-gray-500">No feedback yet.</p>
            ) : (
              <div className="space-y-3 text-sm max-h-80 overflow-y-auto pr-1">
                {feedback.slice(0, 6).map((fb) => (
                  <div
                    key={fb.id}
                    className="border border-gray-100 rounded-xl px-3 py-2 bg-indigo-50/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-indigo-700">
                        {fb.student_name}
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${
                              star <= fb.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.11 3.405a1 1 0 00.95.69h3.584c.969 0 1.371 1.24.588 1.81l-2.9 2.107a1 1 0 00-.364 1.118l1.11 3.405c.3.922-.755 1.688-1.54 1.118l-2.9-2.107a1 1 0 00-1.175 0l-2.9 2.107c-.784.57-1.838-.196-1.539-1.118l1.11-3.405a1 1 0 00-.364-1.118L2.827 8.842c-.783-.57-.38-1.81.588-1.81H7c.43 0 .81-.276.95-.69l1.099-3.405z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                      {fb.comments || "— No comment provided —"}
                    </p>

                    <p className="text-[10px] text-gray-400 mt-1">
                      {fb.created_at}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Placeholder future module */}
        <div className="bg-white rounded-2xl shadow-md p-5 border border-dashed border-indigo-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Availability & Meeting Room (Structure Ready)
          </h2>
          <p className="text-sm text-gray-600">Here we will later add:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
            <li>Day-wise slot editor.</li>
            <li>Embedded video call UI for live counseling sessions.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CounselorDashboard;
