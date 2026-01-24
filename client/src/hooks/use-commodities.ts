import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type Commodity } from "@shared/routes";
import { z } from "zod";

// Create separate schema for API response parsing since the API might return different structures
// The shared schema defines the *shape* of a commodity, but we need to validate the full response
const commodityListResponse = api.commodities.list.responses[200];

export function useCommodities(filters?: {
  state?: string;
  district?: string;
  commodity?: string;
  market?: string;
  limit?: number;
}) {
  // Construct query key based on filters to ensure caching works per filter set
  const queryKey = [api.commodities.list.path, filters];

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query parameters
      const params: Record<string, string | number> = {};
      if (filters?.state) params.state = filters.state;
      if (filters?.district) params.district = filters.district;
      if (filters?.commodity) params.commodity = filters.commodity;
      if (filters?.market) params.market = filters.market;
      if (filters?.limit) params.limit = filters.limit;

      // Construct URL with query params
      const queryString = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      const url = `${api.commodities.list.path}?${queryString}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch commodities");
      
      const data = await res.json();
      return commodityListResponse.parse(data);
    },
    // Keep data fresh for 5 minutes but cache longer
    staleTime: 5 * 60 * 1000, 
  });
}
