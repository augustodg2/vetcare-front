import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "..";

export const procedureKeys = {
  all: ["procedures"],
  pet: (petId, type, page) => [...procedureKeys.all, "pet", petId, type, page],
  detail: (id) => [...procedureKeys.all, "detail", id],
};

export const useProcedure = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: procedureKeys.detail(id),
    queryFn: () => api.procedures.get(id),
  });

export const usePetProcedures = ({ petId, type, page = 1 }) =>
  useQuery({
    enabled: !!petId,
    queryKey: procedureKeys.pet(petId, type, page),
    queryFn: () => api.procedures.list({ petId, type, page }),
    placeholderData: keepPreviousData,
  });
