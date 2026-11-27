import { useMediaQuery } from "@mantine/hooks";

const PHONE = "(max-width: 767px)";
export const usePhone = () => useMediaQuery(PHONE);
