import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import { api } from "..";
import { procedureKeys } from "./procedures";

const CASH_REFRESH_MS = 60_000;

export const paymentKeys = {
  all: ["payments"],
  day: (iso) => [...paymentKeys.all, "day", iso],
  since: (iso) => [...paymentKeys.all, "since", iso],
};

export const useCashDay = (day) => {
  const start = dayjs(day).startOf("day");
  const end = start.endOf("day");
  return useQuery({
    queryKey: paymentKeys.day(start.format("YYYY-MM-DD")),
    queryFn: async () => {
      const [procedures, payments] = await Promise.all([
        api.procedures.listAll({
          dateFrom: start.toISOString(),
          dateTo: end.toISOString(),
        }),
        api.payments.listAll({ dateFrom: start.toISOString() }),
      ]);
      return { procedures, payments };
    },
    placeholderData: keepPreviousData,
    refetchInterval: CASH_REFRESH_MS,
  });
};

export const usePaymentsSince = (date) => {
  const start = date ? dayjs(date).startOf("day") : null;
  return useQuery({
    enabled: !!start,
    queryKey: paymentKeys.since(start?.format("YYYY-MM-DD")),
    queryFn: () => api.payments.listAll({ dateFrom: start.toISOString() }),
    placeholderData: keepPreviousData,
  });
};

export const useProceduresById = (ids) =>
  useQueries({
    queries: ids.map((id) => ({
      queryKey: procedureKeys.detail(id),
      queryFn: () => api.procedures.get(id),
      staleTime: Infinity,
    })),
    combine: (results) =>
      Object.fromEntries(
        results.filter((r) => r.data).map((r) => [r.data.id, r.data]),
      ),
  });

const usePaymentMutation = (mutationFn, { onSuccess, ...options } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn,
    onSuccess: async (payment, ...rest) => {
      await queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      return onSuccess?.(payment, ...rest);
    },
  });
};

export const useCreatePayment = (options) =>
  usePaymentMutation(api.payments.create, options);

export const useCancelPayment = (options) =>
  usePaymentMutation(api.payments.cancel, options);

export const useRefundPayment = (options) =>
  usePaymentMutation(api.payments.refund, options);
