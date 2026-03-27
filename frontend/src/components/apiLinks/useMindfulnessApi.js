// src/apiLinks/useMindfulnessApi.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api";

export function useMindfulnessApi() {
  const qc = useQueryClient();

  // raw calls
  const getRecentMoods = (days = 7) =>
    api.get("/mindfulness/mood-summary/", { params: { days } });
  const getActivities = () => api.get("/mindfulness/activities/");
  const getActivitiesByMood = (mood) =>
    api.get("/mindfulness/activities/by-mood/", { params: { mood } });
  const getRecommendations = () => api.get("/mindfulness/recommendations/");
  const startSession = (payload) =>
    api.post("/mindfulness/sessions/start/", payload);
  const completeSession = (payload) =>
    api.post("/mindfulness/sessions/complete/", payload);
  const getSessions = (params = {}) =>
    api.get("/mindfulness/sessions/", { params });
  const getStats = () => api.get("/mindfulness/stats/");

  // meditation calls
  const getMeditations = () => api.get("/mindfulness/meditations/");
  const startMeditation = (payload) =>
    api.post("/mindfulness/meditations/start/", payload);
  const completeMeditation = (payload) =>
    api.post("/mindfulness/meditations/complete/", payload);
  const getMeditationHeatmap = ({ year, month } = {}) =>
    api.get("/mindfulness/meditations/heatmap/", { params: { year, month } });
  const getMeditationStats = () => api.get("/mindfulness/meditations/stats/");

  // React Query wrappers
  const useActivities = () =>
    useQuery({
      queryKey: ["mindfulness", "activities"],
      queryFn: () => getActivities().then((r) => r.data.activities || []),
    });

  const useActivitiesByMood = (mood) =>
    useQuery({
      queryKey: ["mindfulness", "activitiesByMood", mood],
      queryFn: () =>
        getActivitiesByMood(mood).then((r) => r.data.activities || []),
      enabled: !!mood,
    });

  const useRecommendations = () =>
    useQuery({
      queryKey: ["mindfulness", "recommendations"],
      queryFn: () => getRecommendations().then((r) => r.data || {}),
    });

  const useStartSession = () =>
    useMutation({
      mutationFn: (payload) => startSession(payload),
      onSuccess: () => {
        qc.invalidateQueries(["mindfulness", "sessions"]);
        qc.invalidateQueries(["mindfulness", "recommendations"]);
        qc.invalidateQueries(["mindfulness", "stats"]);
      },
    });

  const useCompleteSession = () =>
    useMutation({
      mutationFn: (payload) => completeSession(payload),
      onSuccess: () => {
        qc.invalidateQueries(["mindfulness", "sessions"]);
        qc.invalidateQueries(["mindfulness", "stats"]);
      },
    });

  const useSessions = (params) =>
    useQuery({
      queryKey: ["mindfulness", "sessions", params],
      queryFn: () => getSessions(params).then((r) => r.data.sessions || []),
    });

  const useStats = () =>
    useQuery({
      queryKey: ["mindfulness", "stats"],
      queryFn: () => getStats().then((r) => r.data || {}),
    });

  // Meditation hooks
  const useMeditations = () =>
    useQuery({
      queryKey: ["mindfulness", "meditations"],
      queryFn: () => getMeditations().then((r) => r.data.meditations || []),
    });

  const useStartMeditation = () =>
    useMutation({
      mutationFn: (payload) => startMeditation(payload),
      onSuccess: () => {
        qc.invalidateQueries(["mindfulness", "meditations"]);
        qc.invalidateQueries(["mindfulness", "meditationHeatmap"]);
        qc.invalidateQueries(["mindfulness", "meditationStats"]);
      },
    });

  const useCompleteMeditation = () =>
    useMutation({
      mutationFn: (payload) => completeMeditation(payload),
      onSuccess: () => {
        qc.invalidateQueries(["mindfulness", "meditations"]);
        qc.invalidateQueries(["mindfulness", "meditationHeatmap"]);
        qc.invalidateQueries(["mindfulness", "meditationStats"]); // Fixed: was 'meditationStreaks' (wrong key)
      },
    });

  const useMeditationHeatmap = ({ year, month } = {}) => {
    const now = new Date();
    const y = year  || now.getFullYear();
    const m = month || now.getMonth() + 1;
    return useQuery({
      queryKey: ["mindfulness", "meditationHeatmap", y, m],
      queryFn: () =>
        getMeditationHeatmap({ year: y, month: m }).then(
          (r) => r.data || { days: {}, year: y, month: m, month_name: "" }
        ),
    });
  };

  const useGetMeditationStats = () =>
    useQuery({
      queryKey: ["mindfulness", "meditationStats"], // <-- New key
      queryFn: () =>
        getMeditationStats().then(
          (r) =>
            r.data || {
              current_streak: 0,
              longest_streak: 0,
              total_meditation_minutes: 0,
              total_meditation_sessions: 0, // <-- Add new default
            }
        ),
    });
  const useRecentMoods = (days) =>
    useQuery({
      queryKey: ["mindfulness", "moodSummary", days],
      queryFn: () => getRecentMoods(days).then((r) => r.data.summaries || []),
    });
  return {
    useActivities,
    useActivitiesByMood,
    useRecommendations,
    useStartSession,
    useCompleteSession,
    useSessions,
    useStats,
    useMeditations,
    useStartMeditation,
    useCompleteMeditation,
    useMeditationHeatmap,
    useGetMeditationStats,
    useRecentMoods,
  };
}
