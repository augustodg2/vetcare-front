const env = import.meta.env;

export const CLINIC = {
  name: env.VITE_CLINIC_NAME || "VetCare",
  cnpj: env.VITE_CLINIC_CNPJ || "",
  address: env.VITE_CLINIC_ADDRESS || "",
  city: env.VITE_CLINIC_CITY || "",
  phone: env.VITE_CLINIC_PHONE || "",
};
