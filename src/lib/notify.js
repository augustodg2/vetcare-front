import { notifications } from "@mantine/notifications";
import { dispatchApiError } from "@/api/errorHandler";

export const toast = {
  ok: (message) =>
    notifications.show({ message, color: "teal", withBorder: true }),
  err: (
    error,
    fallback = "Não foi possível concluir a ação. Tente de novo.",
  ) => {
    dispatchApiError(error);
    notifications.show({
      message: error?.apiMessage || fallback,
      color: "red",
      withBorder: true,
    });
  },
};
