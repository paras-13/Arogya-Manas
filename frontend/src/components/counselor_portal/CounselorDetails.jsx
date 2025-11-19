import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const CounselorDetails = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    specialization: "",
    experience: "",
    qualifications: "",
    languages: "",
    bio: "",
    education: "",
    approach: "",
    motivation: "",
    is_approved: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/counselor/portfolio/");
        setForm({
          specialization: res.data.specialization || "",
          experience: res.data.experience || "",
          qualifications: res.data.qualifications || "",
          languages: res.data.languages || "",
          bio: res.data.bio || "",
          education: res.data.education || "",
          approach: res.data.approach || "",
          motivation: res.data.motivation || "",
          is_approved: res.data.is_approved || false,
        });
      } catch (err) {
        // No profile yet – keep empty fields
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/counselor/profile/update/", {
        specialization: form.specialization,
        experience: Number(form.experience) || 0,
        qualifications: form.qualifications,
        languages: form.languages,
        bio: form.bio,
        education: form.education,
        approach: form.approach,
        motivation: form.motivation,
      });
      toast.success("Profile updated successfully");
      navigate("/arogyamanas/mentor/counselor-dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-blue-50 py-8 px-4 md:px-10">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-indigo-50 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-700">
              My Counselor Profile
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Update your professional details. These will be visible to
              students.
            </p>
          </div>

          <div>
            {form.is_approved ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                Approved Counselor
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                Application Pending / Not Approved
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Core details */}
          <section>
            <h2 className="text-lg font-bold text-indigo-600 mb-3">
              Professional Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Specialization *
                </label>
                <input
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Student Stress, Anxiety, Career Counseling"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Experience (years) *
                </label>
                <input
                  name="experience"
                  type="number"
                  min="0"
                  value={form.experience}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Education *
                </label>
                <input
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  required
                  placeholder="e.g., MA Psychology, PG Diploma in Counseling"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Qualifications (Degrees, Certifications, Trainings)
                </label>
                <textarea
                  name="qualifications"
                  value={form.qualifications}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="List relevant academic and professional qualifications"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Counseling style */}
          <section>
            <h2 className="text-lg font-bold text-indigo-600 mb-3">
              Counseling Style
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Counseling Approach
                </label>
                <input
                  name="approach"
                  value={form.approach}
                  onChange={handleChange}
                  placeholder="e.g., CBT, Talk Therapy, Mindfulness-based"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bio *
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe your experience, focus areas, and how you support students."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Languages & motivation */}
          <section>
            <h2 className="text-lg font-bold text-indigo-600 mb-3">
              Additional Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Languages
                </label>
                <input
                  name="languages"
                  value={form.languages}
                  onChange={handleChange}
                  placeholder="e.g., English, Hindi, Marathi"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Why do you want to be a counselor on ArogyaManas?
                </label>
                <textarea
                  name="motivation"
                  value={form.motivation}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Share your motivation and alignment with student well-being."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </section>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CounselorDetails;
