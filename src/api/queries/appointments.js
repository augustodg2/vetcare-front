import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "..";

export const appointmentKeys = {
  all: ["appointments"],
  list: (params) => [...appointmentKeys.all, "list", params],
};

export const useAppointments = ({ from, to, vetId, enabled = true }) =>
  useQuery({
    enabled,
    queryKey: appointmentKeys.list({ from, to, vetId }),
    queryFn: () => api.appointments.list({ from, to, vetId }),
    placeholderData: keepPreviousData,
  });

// `options.onSuccess` runs after the appointment lists are invalidated
export const useCreateAppointment = ({ onSuccess, ...options } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: api.appointments.create,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      return onSuccess?.(...args);
    },
  });
};
