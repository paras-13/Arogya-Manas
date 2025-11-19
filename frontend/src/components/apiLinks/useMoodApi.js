// src/apiLinks/useMoodApi.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api";

export function useMoodApi() {
  const queryClient = useQueryClient();

  const getDiary = (params = {}) =>
    api.get("/mood/diary/", {
      params: {
        // filter param handled server-side: public_only etc.
        // If date provided, we will pass date as start & end to get that day's entries
        ...(params.filter ? { filter: params.filter } : {}),
        ...(params.date ? { start: params.date, end: params.date } : {}),
      },
    });

  const getMonthCalendar = (month, year) =>
    api.get("/mood/calendar/", { params: { month, year } });

  const createMood = (payload) => api.post("/mood/entries/create/", payload);
  const toggleVisibility = (entry_id, is_public) =>
    api.post("/mood/diary/toggle/", { entry_id, is_public });

  const useDiary = (params = {}) =>
    useQuery({
      queryKey: ["diary", params],
      queryFn: () => getDiary(params).then((r) => r.data.entries || []),
    });

  const useCalendar = (month, year) =>
    useQuery({
      queryKey: ["calendar", month, year],
      queryFn: () =>
        getMonthCalendar(month, year).then((r) => {
          // support both shapes { entries: [...] } or { days: {...} }
          const d = r.data;
          if (d.entries) return d;
          if (d.days) return d; // calendar uses d.days
          return { days: {} };
        }),
    });

  const useCreateMood = () =>
    useMutation({
      mutationFn: createMood,
      onSuccess: () => {
        queryClient.invalidateQueries(["diary"]);
        queryClient.invalidateQueries(["calendar"]);
      },
    });

  const useToggleVisibility = () =>
    useMutation({
      mutationFn: ({ entry_id, is_public }) =>
        toggleVisibility(entry_id, is_public),
      onSuccess: () => {
        queryClient.invalidateQueries(["diary"]);
      },
    });

  return {
    useDiary,
    useCalendar,
    useCreateMood,
    useToggleVisibility,
  };
}
