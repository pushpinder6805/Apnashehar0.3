import { useQuery } from "@tanstack/react-query";
import { api, type AQI } from "@shared/routes";

const aqiResponseSchema = api.aqi.get.responses[200];

export function useAQI(city: string) {
  const queryKey = [api.aqi.get.path, city];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `${api.aqi.get.path}?city=${encodeURIComponent(city)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch AQI");
      
      const data = await res.json();
      return aqiResponseSchema.parse(data);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!city,
  });
}
