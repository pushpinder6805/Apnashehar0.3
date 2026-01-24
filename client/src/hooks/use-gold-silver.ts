import { useQuery } from "@tanstack/react-query";
import type { GoldSilver } from "@shared/routes";

export function useGoldSilver() {
  return useQuery<GoldSilver>({
    queryKey: ['/api/gold-silver'],
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
}
