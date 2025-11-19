import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api";

export function useCounselorPortalApi() {
  const queryClient = useQueryClient();

  const getMyProfile = () => api.get("/counselor/me/").then((r) => r.data);
  const getSessions = () =>
    api.get("/counselor/sessions/").then((r) => r.data.sessions);
  const submitApplication = (data) => api.post("/counselor/apply/", data);
  const submitPrescription = (id, notes) =>
    api.post(`/counselor/sessions/${id}/complete/`, { notes });

  return {
    useProfile: () =>
      useQuery({ queryKey: ["counselorProfile"], queryFn: getMyProfile }),
    useSessions: () =>
      useQuery({ queryKey: ["counselorSessions"], queryFn: getSessions }),
    useApply: () =>
      useMutation({
        mutationFn: submitApplication,
        onSuccess: () => queryClient.invalidateQueries(["counselorProfile"]),
      }),
    useCompleteSession: () =>
      useMutation({
        mutationFn: ({ id, notes }) => submitPrescription(id, notes),
        onSuccess: () => queryClient.invalidateQueries(["counselorSessions"]),
      }),
  };
}
