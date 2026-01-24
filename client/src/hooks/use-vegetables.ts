import { useQuery } from "@tanstack/react-query";
import { api, type KeyVegetable } from "@shared/routes";

const vegetablesResponseSchema = api.vegetables.get.responses[200];

export function useVegetables(city: string) {
  const queryKey = [api.vegetables.get.path, city];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `${api.vegetables.get.path}?city=${encodeURIComponent(city)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch vegetables");
      
      const data = await res.json();
      return vegetablesResponseSchema.parse(data);
    },
    staleTime: 15 * 60 * 1000,
    enabled: !!city,
  });
}
