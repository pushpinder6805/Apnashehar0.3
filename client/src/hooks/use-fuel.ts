import { useQuery } from "@tanstack/react-query";
import { api, type FuelPrice } from "@shared/routes";
import { z } from "zod";

const fuelResponseSchema = api.fuel.get.responses[200];

export function useFuelPrices(city?: string) {
  const queryKey = [api.fuel.get.path, city];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = city 
        ? `${api.fuel.get.path}?city=${encodeURIComponent(city)}` 
        : api.fuel.get.path;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch fuel prices");
      
      const data = await res.json();
      // Ensure we always return an array for consistency in UI
      const parsed = fuelResponseSchema.parse(data);
      return Array.isArray(parsed) ? parsed : [parsed];
    },
    staleTime: 60 * 60 * 1000, // 1 hour stale time for fuel
  });
}
