import React, { useState, useRef, useEffect, useContext } from "react";
import { CgProfile } from "react-icons/cg";
import { AuthContext } from "../../store/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleProfile = () => {
    navigate(`/arogyamanas/${localStorage.getItem("role")}/profile`);
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/arogyamanas/login");
  };

  return (
    <nav className="w-full bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-md px-6 py-4 flex justify-between items-center relative z-20">
      {/* BRAND */}
      <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 text-transparent bg-clip-text drop-shadow-sm tracking-tight">
        ArogyaManas
      </h1>

      {/* PROFILE */}
      <div ref={dropdownRef} className="relative">
        <CgProfile
          className="w-9 h-9 text-gray-700 hover:text-indigo-600 transition cursor-pointer hover:scale-110"
          onClick={() => setOpen(!open)}
        />

        {open && (
          <div className="absolute right-0 mt-3 w-44 rounded-xl bg-white/90 backdrop-blur-lg border border-gray-200 shadow-2xl overflow-hidden animate-fadeIn z-50">
            <button
              onClick={handleProfile}
              className="w-full text-left px-5 py-2.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-5 py-2.5 text-red-600 hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
