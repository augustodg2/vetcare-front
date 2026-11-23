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
  pet: (petId, page) => [...appointmentKeys.all, "pet", petId, page],
};

export const useAppointments = ({ from, to, vetId, enabled = true }) =>
  useQuery({
    enabled,
    queryKey: appointmentKeys.list({ from, to, vetId }),
    queryFn: () => api.appointments.list({ from, to, vetId }),
    placeholderData: keepPreviousData,
  });

const useAppointmentMutation = (mutationFn, { onSuccess, ...options } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      return onSuccess?.(...args);
    },
  });
};

export const useCreateAppointment = (options) =>
  useAppointmentMutation(api.appointments.create, options);

export const useUpdateAppointment = (options) =>
  useAppointmentMutation(
    ({ id, ...data }) => api.appointments.update(id, data),
    options,
  );

export const useCancelAppointment = (options) =>
  useAppointmentMutation(api.appointments.cancel, options);

export const usePetAppointments = ({ petId, page = 1 }) =>
  useQuery({
    enabled: !!petId,
    queryKey: appointmentKeys.pet(petId, page),
    queryFn: () => api.pets.appointments(petId, { page }),
    placeholderData: keepPreviousData,
  });
