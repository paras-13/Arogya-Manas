import React, { useContext } from "react";
import { AuthContext } from "../../store/AuthContext";
import { AUTH_ACTIONS } from "../../utils/constants";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, Calendar, LogOut } from "lucide-react";

const Profile = () => {
  const { authState, authDispatcher } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    authDispatcher({ type: AUTH_ACTIONS.LOGOUT });

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 flex justify-center items-center p-6">
      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-xl border border-indigo-100 rounded-3xl shadow-2xl p-10 relative overflow-hidden">
        {/* Decorative Vibes */}
        <div className="absolute -top-10 -right-10 h-40 w-40 bg-indigo-200/30 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-blue-200/30 rounded-full blur-2xl"></div>

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-700 drop-shadow-sm">
            Your Profile
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Manage and review your ArogyaManas account details.
          </p>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 p-[3px] shadow-lg">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
              <User className="h-14 w-14 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <div className="p-5 rounded-2xl bg-white/60 shadow hover:shadow-md transition border border-indigo-100 flex items-center gap-4">
            <User className="h-6 w-6 text-indigo-600" />
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="font-semibold text-gray-800">
                {authState.user?.name}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/60 shadow hover:shadow-md transition border border-blue-100 flex items-center gap-4">
            <Mail className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Email Address</p>
              <p className="font-semibold text-gray-800">
                {authState.user?.email}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/60 shadow hover:shadow-md transition border border-emerald-100 flex items-center gap-4">
            <Shield className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-500">Account Type</p>
              <p className="font-semibold text-gray-800 capitalize">
                {authState.user?.role}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/60 shadow hover:shadow-md transition border border-amber-100 flex items-center gap-4">
            <Calendar className="h-6 w-6 text-amber-600" />
            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="font-semibold text-gray-800">
                {authState.user?.created_at?.split("T")[0] || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition font-medium"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
