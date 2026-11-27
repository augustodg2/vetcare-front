import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { tokenStore } from "@/api/http";
import { authKeys } from "@/api/queries/auth";

export const useResetPassword = () =>
  useMutation({
    mutationFn: ({ token, password }) =>
      api.auth.resetPassword(token, { password }),
  });

// Accepting an invite signs the person in: the response carries a session token.
export const useAcceptInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const { access_token: sessionToken, user } = await api.auth.acceptInvite(
        token,
        { password },
      );
      tokenStore.set(sessionToken);
      // drop whatever a previous session left behind, keeping the auth query
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
      queryClient.setQueryData(authKeys.me, user);
      return user;
    },
  });
};
