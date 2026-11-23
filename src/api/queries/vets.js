import { useQuery } from "@tanstack/react-query";
import { api } from "..";

export const vetKeys = {
  all: ["vets"],
  everyone: () => [...vetKeys.all, "all"],
};

export const useAllVets = ({ enabled = true } = {}) =>
  useQuery({
    enabled,
    queryKey: vetKeys.everyone(),
    queryFn: api.vets.listAll,
  });
