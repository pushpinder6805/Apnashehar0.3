import { db } from "./db";
import { apiCache, alerts, type InsertAlert } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getCachedData(key: string): Promise<any | undefined>;
  getCachedDataWithTimestamp(key: string): Promise<{ data: any; updatedAt: Date } | undefined>;
  setCachedData(key: string, data: any): Promise<void>;
  isCacheValid(key: string, maxAgeHours?: number): Promise<boolean>;
  getAlerts(location?: string): Promise<any[]>;
  createAlert(alert: InsertAlert): Promise<any>;
  confirmAlert(id: number): Promise<any>;
  resolveAlert(id: number): Promise<any>;
  findSimilarAlert(type: string, location: string, area?: string): Promise<any | undefined>;
  incrementReportCount(id: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getCachedData(key: string): Promise<any | undefined> {
    const [entry] = await db.select().from(apiCache).where(eq(apiCache.key, key));
    return entry?.data;
  }

  async getCachedDataWithTimestamp(key: string): Promise<{ data: any; updatedAt: Date } | undefined> {
    const [entry] = await db.select().from(apiCache).where(eq(apiCache.key, key));
    if (entry && entry.updatedAt) {
      return { data: entry.data, updatedAt: entry.updatedAt };
    }
    return undefined;
  }

  async setCachedData(key: string, data: any): Promise<void> {
    const existing = await this.getCachedData(key);
    if (existing) {
      await db.update(apiCache).set({ data, updatedAt: new Date() }).where(eq(apiCache.key, key));
    } else {
      await db.insert(apiCache).values({ key, data });
    }
  }

  async isCacheValid(key: string, maxAgeHours: number = 24): Promise<boolean> {
    const cached = await this.getCachedDataWithTimestamp(key);
    if (!cached) return false;
    
    const now = new Date();
    const cacheAge = (now.getTime() - cached.updatedAt.getTime()) / (1000 * 60 * 60);
    return cacheAge < maxAgeHours;
  }

  async getAlerts(location?: string): Promise<any[]> {
    const query = location 
      ? db.select().from(alerts).where(and(eq(alerts.location, location), eq(alerts.status, "active"))).orderBy(desc(alerts.createdAt))
      : db.select().from(alerts).where(eq(alerts.status, "active")).orderBy(desc(alerts.createdAt));
    return query;
  }

  async createAlert(alert: InsertAlert): Promise<any> {
    const [newAlert] = await db.insert(alerts).values({
      ...alert,
      verificationBadge: alert.source === "official" ? "official" : "reported",
    }).returning();
    return newAlert;
  }

  async confirmAlert(id: number): Promise<any> {
    const [updated] = await db.update(alerts)
      .set({ 
        confirmCount: sql`${alerts.confirmCount} + 1`,
        lastConfirmedAt: new Date(),
        verificationBadge: sql`CASE WHEN ${alerts.confirmCount} + 1 >= 3 THEN 'confirmed' ELSE ${alerts.verificationBadge} END`
      })
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }

  async resolveAlert(id: number): Promise<any> {
    const [updated] = await db.update(alerts)
      .set({ status: "resolved" })
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }

  async findSimilarAlert(type: string, location: string, area?: string): Promise<any | undefined> {
    const conditions = [
      eq(alerts.type, type),
      eq(alerts.location, location),
      eq(alerts.status, "active"),
    ];
    if (area) {
      conditions.push(eq(alerts.area, area));
    }
    const [existing] = await db.select().from(alerts).where(and(...conditions));
    return existing;
  }

  async incrementReportCount(id: number): Promise<any> {
    const [updated] = await db.update(alerts)
      .set({ 
        reportCount: sql`${alerts.reportCount} + 1`,
        verificationBadge: sql`CASE WHEN ${alerts.reportCount} + 1 >= 3 THEN 'confirmed' ELSE ${alerts.verificationBadge} END`
      })
      .where(eq(alerts.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
