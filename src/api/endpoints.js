export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    acceptInvite: (token) => `/auth/invite/${token}/accept`,
    resetPassword: (token) => `/auth/reset-password/${token}`,
  },
  users: {
    me: "/users/me",
    list: "/users",
    invite: "/users/invite",
    deactivate: (id) => `/users/${id}/deactivate`,
    resendInvite: (id) => `/users/${id}/resend-invite`,
    sendPasswordReset: (id) => `/users/${id}/reset-password`,
    byId: (id) => `/users/${id}`,
  },
  appointments: {
    list: "/appointments",
    create: "/appointments",
    byId: (id) => `/appointments/${id}`,
    cancel: (id) => `/appointments/${id}/cancel`,
    complete: (id) => `/appointments/${id}/complete`,
  },
  vets: {
    list: "/vets",
    create: "/vets",
    byId: (id) => `/vets/${id}`,
  },
  petOwners: {
    list: "/pet-owners",
    create: "/pet-owners",
    byId: (id) => `/pet-owners/${id}`,
  },
  pets: {
    list: "/pets",
    create: "/pets",
    byId: (id) => `/pets/${id}`,
  },
  procedures: {
    list: "/procedures",
    create: "/procedures",
    byId: (id) => `/procedures/${id}`,
    notes: (id) => `/procedures/${id}/notes`,
  },
  payments: {
    list: "/payments",
    create: "/payments",
    cancel: (id) => `/payments/${id}/cancel`,
    refund: (id) => `/payments/${id}/refund`,
  },
  prescriptions: {
    list: "/prescriptions",
    create: "/prescriptions",
    byId: (id) => `/prescriptions/${id}`,
  },
};
