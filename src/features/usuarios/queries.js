import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/api";

export const userKeys = {
  all: ["users"],
  list: (params) => [...userKeys.all, "list", params],
};

export const useUsers = ({ search = "", page = 1, status } = {}) =>
  useQuery({
    queryKey: userKeys.list({ search, page, status }),
    queryFn: () => api.users.list({ search, page, status }),
    placeholderData: keepPreviousData,
  });

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vet, ...data }) => {
      const user = await api.users.invite(data);
      if (vet) await api.vets.create({ userId: user.id, ...vet });
      return user;
    },
    // also refresh when the vet step fails: the user was already invited
    onSettled: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.users.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user) => {
      await api.users.deactivate(user.id);
      if (user.vet) await api.vets.remove(user.vet.id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useResendInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.users.resendInvite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useSendPasswordReset = () =>
  useMutation({ mutationFn: (id) => api.users.sendPasswordReset(id) });
