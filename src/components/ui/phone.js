import { useMediaQuery } from "@mantine/hooks";

export const PHONE = "(max-width: 767px)";
export const usePhone = () => useMediaQuery(PHONE);
