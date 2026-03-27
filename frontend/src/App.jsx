import { useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import api, { registerLogout } from "./api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthContext } from "./store/AuthContext";

// Layout
import MainLayout from "./components/layout/MainLayout";

// Public Pages
import LandingPage from "./LandingPage";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";

// Protected Pages (Student)
import Profile from "./components/profile";
import StudentIntro from "./components/student_portal/StudentIntro";
import MoodPage from "./components/mood/MoodPage";

// Mindfulness
import Mindfulness from "./components/mindfulness/Mindfulness";
import Sessions from "./components/mindfulness/Sessions";
import Meditation from "./components/mindfulness/Meditation";
import MindfulnessStats from "./components/mindfulness/MindfulnessStats";
import CounselorPage from "./components/counselor/CounselorPage";

// Mentor
import { USER_TYPE } from "./utils/constants";
import CounselorApplication from "./components/counselor_portal/CounselorApplication";
import CounselorDashboard from "./components/counselor_portal/CounselorDashBoard";
import CounselorPortal from "./components/counselor_portal/CounselorPortal";
import CounselorDetails from "./components/counselor_portal/CounselorDetails";
import CounselorAvailability from "./components/counselor_portal/CounselorAvailability";
import ArogyaMitraAIChat from "./components/ai_assist/ArogyaMitraAIChat";
import StudentAppointments from "./components/counselor/StudentAppointments";
import CounselorSessions from "./components/counselor_portal/CounselorSessions";
import StudentDashboard from "./components/student_portal/StudentDashboard";

function App() {
  const { logout, authState } = useContext(AuthContext);

  useEffect(() => {
    const testingBackend = async() => {
      try {
        const resp = await api.get("/testing/ping");
        console.log(resp);
      }
      catch(err) {
        console.log(err);
      }
    }
    testingBackend()
    // registerLogout(logout);
  }, []);

  const hasToken = !!authState?.token;
  const userRole = authState?.user?.role;

  const roleBase = userRole ? `/arogyamanas/${userRole}` : "/arogyamanas";

  const redirectDashboard = {
    [USER_TYPE.STUDENT]: `${roleBase}/`,
    [USER_TYPE.MENTOR]: `${roleBase}/counselor-dashboard`,
    [USER_TYPE.ADMIN]: `${roleBase}/admin-dashboard`,
  };

  return (
    <Router>
      <ToastContainer />

      <Routes>
        {/* DEFAULT ROOT REDIRECT */}
        <Route path="arogyamanas/" element={<LandingPage />} />
        <Route path="/" element={<Navigate to="/arogyamanas" replace />} />

        {/* PUBLIC ROUTES */}
        <Route path="arogyamanas/register" element={<Register />} />
        <Route
          path="arogyamanas/login"
          element={
            hasToken ? <Navigate to={redirectDashboard[userRole]} /> : <Login />
          }
        />

        {/* PROTECTED ROUTES */}
        {hasToken ? (
          <Route path="arogyamanas/:role" element={<MainLayout />}>
            {/* COMMON ROUTES */}
            <Route path="profile" element={<Profile />} />

            {/* STUDENT ROUTES */}
            {userRole === USER_TYPE.STUDENT && (
              <>
                <Route path="" element={<StudentIntro />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="mood" element={<MoodPage />} />
                <Route path="ai_assist" element={<ArogyaMitraAIChat />} />

                <Route path="mindfulness" element={<Mindfulness />}>
                  <Route index element={<Navigate to="sessions" replace />} />
                  <Route path="sessions" element={<Sessions />} />
                  <Route path="meditation" element={<Meditation />} />
                  <Route path="stats" element={<MindfulnessStats />} />
                </Route>

                <Route path="mentor" element={<CounselorPage />} />
                <Route path="appointments" element={<StudentAppointments />} />
              </>
            )}

            {/* MENTOR ROUTES */}
            {userRole === USER_TYPE.MENTOR && (
              <>
                <Route path="counselor" element={<CounselorPortal />} />
                <Route
                  path="apply-counselor"
                  element={<CounselorApplication />}
                />
                <Route
                  path="counselor-dashboard"
                  element={<CounselorDashboard />}
                />
                <Route
                  path="counselor-details"
                  element={<CounselorDetails />}
                />
                <Route
                  path="availability"
                  element={<CounselorAvailability />}
                />
                <Route path="sessions" element={<CounselorSessions />} />
              </>
            )}

            {/* ADMIN ROUTES */}
            {userRole === USER_TYPE.ADMIN && (
              <Route
                path="admin-dashboard"
                element={<h1>Admin Dashboard</h1>}
              />
            )}
          </Route>
        ) : (
          <Route
            path="*"
            element={<Navigate to="/arogyamanas/login" replace />}
          />
        )}
      </Routes>
    </Router>
  );
}

export default App;