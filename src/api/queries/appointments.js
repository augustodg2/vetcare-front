import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
