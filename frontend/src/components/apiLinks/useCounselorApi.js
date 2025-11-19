// src/apiLinks/useCounselorApi.js
import api from "../../api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCounselorApi() {
  const queryClient = useQueryClient();

  const fetchCounselors = async () =>
    (await api.get("/counselor/list/")).data.counselors;

  const fetchAppointments = async () =>
    (await api.get("/counselor/my-appointments/")).data.appointments;

  const fetchMessages = async (id) =>
    (await api.get(`/counselor/messages/${id}/`)).data.messages;

  const fetchPrescription = async (id) =>
    (await api.get(`/counselor/prescription/${id}/`)).data;

  const bookAppointment = async (payload) =>
    await api.post("/counselor/book/", payload);

  const sendMessage = async ({ appointment_id, content }) =>
    await api.post(`/counselor/messages/${appointment_id}/send/`, { content });

  const useBookAppointment = () =>
    useMutation({
      mutationFn: bookAppointment,
      onSuccess: () => {
        queryClient.invalidateQueries(["appointments"]);
      },
    });

  const useSendMessage = () =>
    useMutation({
      mutationFn: sendMessage,
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries(["messages", vars.appointment_id]);
      },
    });

  return {
    useCounselorList: () =>
      useQuery({ queryKey: ["counselors"], queryFn: fetchCounselors }),
    useAppointments: () =>
      useQuery({ queryKey: ["appointments"], queryFn: fetchAppointments }),
    useMessages: (id) =>
      useQuery({
        queryKey: ["messages", id],
        queryFn: () => fetchMessages(id),
      }),
    usePrescription: (id) =>
      useQuery({
        queryKey: ["prescription", id],
        queryFn: () => fetchPrescription(id),
      }),
    useBookAppointment,
    useSendMessage,
  };
}
