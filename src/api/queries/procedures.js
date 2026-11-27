import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "..";

export const procedureKeys = {
  all: ["procedures"],
  pet: (petId, page) => [...procedureKeys.all, "pet", petId, page],
  detail: (id) => [...procedureKeys.all, "detail", id],
};

export const useProcedure = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: procedureKeys.detail(id),
    queryFn: () => api.procedures.get(id),
  });

export const usePetProcedures = ({ petId, page = 1 }) =>
  useQuery({
    enabled: !!petId,
    queryKey: procedureKeys.pet(petId, page),
    queryFn: () => api.procedures.list({ petId, page }),
    placeholderData: keepPreviousData,
  });
