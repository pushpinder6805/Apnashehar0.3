import { useQuery } from "@tanstack/react-query";
import { api, type Alert } from "@shared/routes";

const alertsResponseSchema = api.alerts.list.responses[200];

export function useAlerts(location: string = "Delhi") {
  const queryKey = [api.alerts.list.path, location];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `${api.alerts.list.path}?location=${encodeURIComponent(location)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      
      const data = await res.json();
      return alertsResponseSchema.parse(data);
    },
    staleTime: 5 * 60 * 1000,
  });
}
