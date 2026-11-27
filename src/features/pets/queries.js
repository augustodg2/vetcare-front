import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/api";

const prescriptionKeys = {
  all: ["prescriptions"],
  pet: (petId, page) => [...prescriptionKeys.all, "pet", petId, page],
  detail: (id) => [...prescriptionKeys.all, "detail", id],
};

export const usePrescription = (id) =>
  useQuery({
    enabled: !!id,
    queryKey: prescriptionKeys.detail(id),
    queryFn: () => api.prescriptions.get(id),
  });

export const usePetPrescriptions = ({ petId, page = 1 }) =>
  useQuery({
    enabled: !!petId,
    queryKey: prescriptionKeys.pet(petId, page),
    queryFn: () => api.prescriptions.list({ petId, page }),
    placeholderData: keepPreviousData,
  });

export const useCreatePrescription = ({ onSuccess, ...options } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: api.prescriptions.create,
    onSuccess: async (prescription, ...rest) => {
      queryClient.setQueryData(
        prescriptionKeys.detail(prescription.id),
        prescription,
      );
      await queryClient.invalidateQueries({
        queryKey: [...prescriptionKeys.all, "pet"],
      });
      return onSuccess?.(prescription, ...rest);
    },
  });
};
