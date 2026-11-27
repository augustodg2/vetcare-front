import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/api";

const appointmentKeys = {
  all: ["appointments"],
  list: (params) => [...appointmentKeys.all, "list", params],
  pet: (petId, params) => [...appointmentKeys.all, "pet", petId, params],
};

export const useAppointments = ({ from, to, vetId, petId, enabled = true }) =>
  useQuery({
    enabled,
    queryKey: appointmentKeys.list({ from, to, vetId, petId }),
    queryFn: () => api.appointments.list({ from, to, vetId, petId }),
    placeholderData: keepPreviousData,
  });

const monthRange = (month) => ({
  from: month.startOf("month").toISOString(),
  to: month.add(1, "month").startOf("month").toISOString(),
});

export const useMonthAppointments = ({ month, vetId, petId, enabled = true }) =>
  useQueries({
    queries: [0, -1, 1].map((offset) => {
      const { from, to } = monthRange(month.add(offset, "month"));
      return {
        enabled,
        queryKey: appointmentKeys.list({ from, to, vetId, petId }),
        queryFn: () => api.appointments.list({ from, to, vetId, petId }),
      };
    }),
    combine: ([current, ...neighbors]) => ({
      data: current.data && [
        ...current.data,
        ...neighbors.flatMap((q) => q.data ?? []),
      ],
      error: current.error,
      refetch: current.refetch,
    }),
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

export const useCompleteAppointment = (options) =>
  useAppointmentMutation(api.appointments.complete, options);

export const usePetAppointments = ({
  petId,
  from,
  to,
  status,
  order,
  page = 1,
}) =>
  useQuery({
    enabled: !!petId,
    queryKey: appointmentKeys.pet(petId, { from, to, status, order, page }),
    queryFn: () =>
      api.appointments.byPet(petId, { from, to, status, order, page }),
    placeholderData: keepPreviousData,
  });
