import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { ApiError } from "@/api/errors";
import { tokenStore } from "@/api/http";
import { STATUS } from "@/api/statusCodes";

export const authKeys = { me: ["auth", "me"] };

async function fetchMe() {
  try {
    return await api.auth.me();
  } catch (e) {
    if (e instanceof ApiError && e.status === STATUS.UNAUTHORIZED) {
      tokenStore.set(null);
      return null;
    }
    throw e;
  }
}

export const useMe = () =>
  useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    enabled: !!tokenStore.get(),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: api.auth.login,
    onSuccess: ({ access_token: token, user }) => {
      tokenStore.set(token);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
};
