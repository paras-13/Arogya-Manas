import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api";

const CounselorPortal = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Values from backend
  const [status, setStatus] = useState("NOT_APPLIED");
  const [isApplied, setIsApplied] = useState(false);
  const [isAccepted, setIsAccepted] = useState(0);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.post("/counselor/application-status/");

        setStatus(res.data.status); // NOT_APPLIED | PENDING | APPROVED
        setIsApplied(res.data.is_applied);
        setIsAccepted(res.data.is_accepted); // 0 | 1
      } catch {
        setStatus("NOT_APPLIED");
        setIsApplied(false);
        setIsAccepted(0);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // ---------- UI LOGIC (Same as Sidebar) ----------

  const showApplyButton = (!isApplied && isAccepted === 0) || isAccepted === 2;
  const showPendingText = isApplied && isAccepted === 0;
  const showApprovedButton = isApplied && isAccepted === 1;

  // ------------------------------------------------

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-100 px-6 md:px-12 py-10">
      <div className="max-w-7xl mx-auto space-y-14">
        {/* HERO SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-3xl shadow-xl p-10 md:p-14"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold">
            Become a Certified Counselor at ArogyaManas
          </h1>

          <p className="mt-4 text-lg md:text-xl opacity-90 max-w-2xl">
            Help students overcome academic pressure, emotional challenges, and
            life stress with your expertise.
          </p>

          {/* Dynamic Status */}
          {!loading && (
            <div className="mt-6">
              {!isApplied && isAccepted === 0 && (
                <span className="px-4 py-2 bg-white text-indigo-700 rounded-full font-semibold shadow-md">
                  You have not applied yet.
                </span>
              )}

              {showPendingText && (
                <span className="px-4 py-2 bg-yellow-300 text-gray-900 rounded-full font-semibold shadow-md">
                  Your application is under review.
                </span>
              )}

              {isApplied && isAccepted === 2 && (
                <span className="px-4 py-2 bg-red-300 text-gray-900 rounded-full font-semibold shadow-md">
                  Your application was rejected. You may reapply.
                </span>
              )}

              {isApplied && isAccepted === 1 && (
                <span className="px-4 py-2 bg-green-300 text-gray-900 rounded-full font-semibold shadow-md">
                  You are now an Approved Counselor 🎉
                </span>
              )}
            </div>
          )}

          {/* BUTTONS */}
          <div className="mt-8 flex gap-4 flex-wrap">
            {showApplyButton && (
              <button
                onClick={() => navigate("/arogyamanas/mentor/apply-counselor")}
                className="px-7 py-3 bg-white text-indigo-700 font-semibold rounded-full shadow hover:bg-indigo-100 transition"
              >
                Apply as Counselor
              </button>
            )}

            {showApprovedButton && (
              <button
                onClick={() =>
                  navigate("/arogyamanas/mentor/counselor-dashboard")
                }
                className="px-7 py-3 bg-white text-green-700 font-semibold rounded-full shadow hover:bg-green-100 transition"
              >
                Go to Counselor Dashboard
              </button>
            )}
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              title: "Support Students",
              desc: "Help them manage emotional stress, academic pressure, and personal issues.",
              icon: "💬",
            },
            {
              title: "Smart Session Tools",
              desc: "Manage bookings, chat with students, and track progress effortlessly.",
              icon: "📅",
            },
            {
              title: "Flexible Availability",
              desc: "Choose when you want to take sessions, anytime.",
              icon: "⏱",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Journey Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-lg p-10 border border-indigo-50"
        >
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">
            Your Journey as a Counselor
          </h2>

          <div className="space-y-6 border-l-2 border-indigo-300 ml-4 pl-6">
            <div>
              <h3 className="text-lg font-semibold text-indigo-700">
                1. Apply
              </h3>
              <p className="text-gray-700">
                Submit your professional details and motivations.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-indigo-700">
                2. Review
              </h3>
              <p className="text-gray-700">
                Our panel evaluates your profile and background.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-indigo-700">
                3. Approval
              </h3>
              <p className="text-gray-700">
                Once approved, gain full access to counselor tools.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-indigo-700">
                4. Serve
              </h3>
              <p className="text-gray-700">
                Start helping students and making meaningful impact.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xl md:text-2xl font-semibold text-indigo-700 mt-10"
        >
          “A counselor is not just a guide — they are a lifeline, a mentor, and
          a source of hope.”
        </motion.div>
      </div>
    </div>
  );
};

export default CounselorPortal;
