import { useQuery } from "@tanstack/react-query";
import { api, type Weather } from "@shared/routes";

const weatherResponseSchema = api.weather.get.responses[200];

export function useWeather(city: string) {
  const queryKey = [api.weather.get.path, city];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `${api.weather.get.path}?city=${encodeURIComponent(city)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch weather");
      
      const data = await res.json();
      return weatherResponseSchema.parse(data);
    },
    staleTime: 30 * 60 * 1000, // 30 mins
  });
}
