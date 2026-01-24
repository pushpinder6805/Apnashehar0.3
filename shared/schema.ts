import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We primarily use external APIs, so we might not need extensive DB storage.
// However, we can store user preferences or cached data if needed.
// For now, we will define the API contract types here.

// === External API Data Schemas ===

// 1. Commodities (Data.gov.in)
export const commoditySchema = z.object({
  state: z.string(),
  district: z.string(),
  market: z.string(),
  commodity: z.string(),
  variety: z.string(),
  grade: z.string(),
  arrival_date: z.string(),
  min_price: z.string(), // API returns strings often
  max_price: z.string(),
  modal_price: z.string(),
});

export type Commodity = z.infer<typeof commoditySchema>;

// 2. Fuel Prices
export const fuelPriceSchema = z.object({
  state: z.string(),
  district: z.string(),
  city: z.string(),
  petrol: z.string().or(z.number()),
  diesel: z.string().or(z.number()),
  date: z.string().optional(),
});

export type FuelPrice = z.infer<typeof fuelPriceSchema>;

// 3. Weather
export const weatherSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.string(),
  humidity: z.number().optional(),
  windSpeed: z.number().optional(),
  forecast: z.array(z.object({
    date: z.string(),
    maxTemp: z.number(),
    minTemp: z.number(),
    condition: z.string(),
  })).optional(),
});

export type Weather = z.infer<typeof weatherSchema>;

// 4. Gold & Silver Prices
export const goldSilverSchema = z.object({
  gold24k: z.number(), // per gram in INR
  gold22k: z.number(), // per gram in INR
  silver: z.number(), // per gram in INR
  goldChange: z.number().optional(), // % change from yesterday
  silverChange: z.number().optional(), // % change from yesterday
  timestamp: z.string(),
  source: z.string(),
});

export type GoldSilver = z.infer<typeof goldSilverSchema>;

// 5. Air Quality Index
export const aqiSchema = z.object({
  city: z.string(),
  aqi: z.number(),
  pm25: z.number().optional(),
  pm10: z.number().optional(),
  category: z.string(), // "Good", "Moderate", "Unhealthy", etc.
  color: z.string(), // For UI display
});

export type AQI = z.infer<typeof aqiSchema>;

// 6. City Alerts (power cuts, traffic, etc.) - Hybrid Civic Intelligence System
export const alertSchema = z.object({
  id: z.string(),
  type: z.string(), // "power_cut", "traffic", "water", "accident", "road_block", "general"
  title: z.string(),
  description: z.string(),
  location: z.string(), // "Delhi" or "Chandigarh"
  area: z.string().nullable().optional(), // Sector, colony, locality
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  severity: z.string(), // "low", "medium", "high"
  source: z.string(), // "official", "crowdsourced", "passive"
  status: z.string(), // "active", "resolved", "expired"
  reportCount: z.number(), // Number of users who reported this
  confirmCount: z.number(), // Number of "still affected" confirmations
  lastConfirmedAt: z.string().nullable().optional(), // For time decay
  verificationBadge: z.string().nullable().optional(), // "official", "confirmed", "reported"
  createdAt: z.string(),
});

export type Alert = z.infer<typeof alertSchema>;

// Schema for submitting a quick report (one-tap)
export const quickReportSchema = z.object({
  type: z.enum(["power_cut", "traffic", "water", "accident", "road_block", "other"]),
  location: z.string(), // "Delhi" or "Chandigarh"
  area: z.string().optional(), // Auto-detected or manual
  lat: z.number().optional(),
  lng: z.number().optional(),
  description: z.string().optional(), // Optional detail
});

export type QuickReport = z.infer<typeof quickReportSchema>;

// 7. Key Vegetables (simplified price display)
export const keyVegetableSchema = z.object({
  name: z.string(),
  price: z.number(), // per kg
  change: z.number().optional(), // +/- from yesterday
  trend: z.string().optional(), // "up", "down", "stable"
});

export type KeyVegetable = z.infer<typeof keyVegetableSchema>;

// === Database Tables (Optional/Cache) ===
// We can store generic cached responses to avoid hitting rate limits
export const apiCache = pgTable("api_cache", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g. "commodities_delhi"
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alerts table for crowdsourced data (Hybrid Civic Intelligence)
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // power_cut, traffic, water, accident, road_block, other
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(), // Delhi or Chandigarh
  area: text("area"), // Specific area/sector
  lat: text("lat"), // Latitude for geo-tagging
  lng: text("lng"), // Longitude for geo-tagging
  startTime: text("start_time"),
  endTime: text("end_time"),
  severity: text("severity").notNull().default("medium"),
  source: text("source").notNull().default("crowdsourced"), // official, crowdsourced, passive
  status: text("status").notNull().default("active"), // active, resolved, expired
  reportCount: integer("report_count").notNull().default(1), // How many users reported
  confirmCount: integer("confirm_count").notNull().default(0), // "Still affected" clicks
  lastConfirmedAt: timestamp("last_confirmed_at"),
  verificationBadge: text("verification_badge"), // official, confirmed, reported
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schema for alerts
export const insertAlertSchema = createInsertSchema(alerts).omit({ 
  id: true, 
  createdAt: true,
  reportCount: true,
  confirmCount: true,
  lastConfirmedAt: true,
});
export type InsertAlert = z.infer<typeof insertAlertSchema>;
