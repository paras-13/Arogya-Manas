import React, { useState, useEffect } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { SPECIALIZATIONS } from "../../utils/constants";

const CounselorApplication = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [form, setForm] = useState({
    specialization: "",
    experience: "",
    qualifications: "",
    languages: "",
    bio: "",
    approach: "",
    motivation: "",
    education: "",
  });

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await api.get("/counselor/profile/me/");
        const data = res.data;

        setForm((prev) => ({
          ...prev,
          specialization: data.specialization || "",
          experience: data.experience || "",
          qualifications: data.qualifications || "",
          languages: data.languages || "",
          bio: data.bio || "",
          education: data.education || "",
          approach: data.approach || "",
          motivation: data.motivation || "",
        }));
      } catch (err) {
        // If no existing profile, ignore
      } finally {
        setInitialLoading(false);
      }
    };
    fetchExisting();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/counselor/apply/", form);
      navigate("/arogyamanas/mentor/counselor");
    } catch (err) {
      alert("Error submitting application");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500 text-lg">
        Loading your application...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-indigo-50 to-blue-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-3xl p-10 border border-indigo-100">
        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-indigo-700">
            Counselor Application
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Join ArogyaManas and help students overcome academic and emotional
            challenges.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* SECTION 1 */}
          <section>
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 border-l-4 border-indigo-500 pl-3">
              Professional Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SPECIALIZATION */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 font-medium text-sm">
                  Area of Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Specialization</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* EXPERIENCE */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 font-medium text-sm">
                  Experience (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="experience"
                  min="0"
                  value={form.experience}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* EDUCATION */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-gray-700 font-medium text-sm">
                  Educational Background <span className="text-red-500">*</span>
                </label>
                <input
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., MA Psychology, BA Social Work"
                />
              </div>

              {/* QUALIFICATIONS */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-gray-700 font-medium text-sm">
                  Qualifications
                </label>
                <textarea
                  name="qualifications"
                  value={form.qualifications}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="List degrees, certifications, workshops, training..."
                />
              </div>
            </div>
          </section>

          {/* SECTION 2 */}
          <section>
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 border-l-4 border-indigo-500 pl-3">
              Counseling Style
            </h2>

            <div className="space-y-5">
              {/* APPROACH */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 font-medium text-sm">
                  Counseling Approach
                </label>
                <input
                  name="approach"
                  value={form.approach}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., CBT, mindfulness-based, talk therapy..."
                />
              </div>

              {/* BIO */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 font-medium text-sm">
                  Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="w-full rounded-lg border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Introduce yourself and share your approach to student counseling..."
                />
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section>
            <h2 className="text-xl font-semibold text-indigo-600 mb-4 border-l-4 border-indigo-500 pl-3">
              Additional Information
            </h2>

            <div className="space-y-5">
              {/* LANGUAGES */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 font-medium text-sm">
                  Languages
                </label>
                <input
                  name="languages"
                  value={form.languages}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., English, Hindi, Marathi"
                />
              </div>

              {/* MOTIVATION */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-700 font-medium text-sm">
                  Why do you want to join ArogyaManas?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="motivation"
                  value={form.motivation}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="w-full rounded-lg border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Share your motivation to support students..."
                />
              </div>
            </div>
          </section>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-100 shadow-sm transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CounselorApplication;
