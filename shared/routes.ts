import { z } from 'zod';
import { commoditySchema, fuelPriceSchema, weatherSchema, aqiSchema, alertSchema, keyVegetableSchema, quickReportSchema, goldSilverSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  commodities: {
    list: {
      method: 'GET' as const,
      path: '/api/commodities',
      input: z.object({
        state: z.string().optional(),
        district: z.string().optional(),
        commodity: z.string().optional(),
        market: z.string().optional(),
        limit: z.coerce.number().optional().default(20),
      }).optional(),
      responses: {
        200: z.array(commoditySchema),
        500: errorSchemas.internal,
      },
    },
  },
  fuel: {
    get: {
      method: 'GET' as const,
      path: '/api/fuel',
      input: z.object({
        city: z.string().optional(), // e.g. "Delhi" or "Chandigarh"
      }).optional(),
      responses: {
        200: z.union([fuelPriceSchema, z.array(fuelPriceSchema)]), // API might return one or list
        500: errorSchemas.internal,
      },
    },
  },
  weather: {
    get: {
      method: 'GET' as const,
      path: '/api/weather',
      input: z.object({
        city: z.string(), // "Delhi" or "Chandigarh"
      }),
      responses: {
        200: weatherSchema,
        500: errorSchemas.internal,
      },
    },
  },
  goldSilver: {
    get: {
      method: 'GET' as const,
      path: '/api/gold-silver',
      responses: {
        200: goldSilverSchema,
        500: errorSchemas.internal,
      },
    },
  },
  aqi: {
    get: {
      method: 'GET' as const,
      path: '/api/aqi',
      input: z.object({
        city: z.string(),
      }),
      responses: {
        200: aqiSchema,
        500: errorSchemas.internal,
      },
    },
  },
  alerts: {
    list: {
      method: 'GET' as const,
      path: '/api/alerts',
      input: z.object({
        location: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(alertSchema),
        500: errorSchemas.internal,
      },
    },
    report: {
      method: 'POST' as const,
      path: '/api/alerts/report',
      input: quickReportSchema,
      responses: {
        200: alertSchema,
        500: errorSchemas.internal,
      },
    },
    confirm: {
      method: 'POST' as const,
      path: '/api/alerts/:id/confirm',
      input: z.object({
        id: z.string(),
      }),
      responses: {
        200: alertSchema,
        500: errorSchemas.internal,
      },
    },
    resolve: {
      method: 'POST' as const,
      path: '/api/alerts/:id/resolve',
      input: z.object({
        id: z.string(),
      }),
      responses: {
        200: alertSchema,
        500: errorSchemas.internal,
      },
    },
  },
  vegetables: {
    get: {
      method: 'GET' as const,
      path: '/api/vegetables',
      input: z.object({
        city: z.string(),
      }),
      responses: {
        200: z.array(keyVegetableSchema),
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type Commodity = z.infer<typeof commoditySchema>;
export type FuelPrice = z.infer<typeof fuelPriceSchema>;
export type Weather = z.infer<typeof weatherSchema>;
export type GoldSilver = z.infer<typeof goldSilverSchema>;
export type AQI = z.infer<typeof aqiSchema>;
export type Alert = z.infer<typeof alertSchema>;
export type KeyVegetable = z.infer<typeof keyVegetableSchema>;
export type QuickReport = z.infer<typeof quickReportSchema>;
