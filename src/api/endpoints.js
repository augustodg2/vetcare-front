export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    acceptInvite: (token) => `/auth/invite/${token}/accept`,
  },
  users: {
    me: "/users/me",
    list: "/users",
    invite: "/users/invite",
    deactivate: (id) => `/users/${id}/deactivate`,
    byId: (id) => `/users/${id}`,
  },
  appointments: {
    list: "/appointments",
    create: "/appointments",
    cancel: (id) => `/appointments/${id}/cancel`,
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
};
