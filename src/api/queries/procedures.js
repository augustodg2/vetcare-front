import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/api";

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

export const useCreateProcedure = ({ onSuccess, ...options } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: api.procedures.create,
    onSuccess: async (procedure, ...rest) => {
      queryClient.setQueryData(procedureKeys.detail(procedure.id), procedure);
      await queryClient.invalidateQueries({
        queryKey: [...procedureKeys.all, "pet"],
      });
      return onSuccess?.(procedure, ...rest);
    },
  });
};

export const useAddProcedureNote = ({ onSuccess, ...options } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, content }) => api.procedures.addNote(id, content),
    onSuccess: async (procedure, ...rest) => {
      queryClient.setQueryData(procedureKeys.detail(procedure.id), procedure);
      await queryClient.invalidateQueries({
        queryKey: [...procedureKeys.all, "pet"],
      });
      return onSuccess?.(procedure, ...rest);
    },
  });
};
