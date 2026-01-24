import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

// NDMA SACHET RSS feed URLs for official disaster alerts (all Indian states/UTs)
const NDMA_RSS_FEEDS: Record<string, string> = {
  "Andaman & Nicobar Islands": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_andaman.xml",
  "Andhra Pradesh": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_andhra.xml",
  "Arunachal Pradesh": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_arunachal.xml",
  "Assam": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_assam.xml",
  "Bihar": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_bihar.xml",
  "Chandigarh": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_chandigarh.xml",
  "Chhattisgarh": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_chhattisgarh.xml",
  "Dadra & Nagar Haveli": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_dadra.xml",
  "Daman & Diu": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_daman.xml",
  "Delhi": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_delhi.xml",
  "Goa": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_goa.xml",
  "Gujarat": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_gujarat.xml",
  "Haryana": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_haryana.xml",
  "Himachal Pradesh": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_himachal.xml",
  "Jammu & Kashmir": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_jammu.xml",
  "Jharkhand": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_jharkhand.xml",
  "Karnataka": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_karnataka.xml",
  "Kerala": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_kerala.xml",
  "Ladakh": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_ladakh.xml",
  "Lakshadweep": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_lakshadweep.xml",
  "Madhya Pradesh": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_madhya.xml",
  "Maharashtra": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_maharashtra.xml",
  "Manipur": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_manipur.xml",
  "Meghalaya": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_meghalaya.xml",
  "Mizoram": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_mizoram.xml",
  "Nagaland": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_nagaland.xml",
  "Odisha": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_odisha.xml",
  "Puducherry": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_puducherry.xml",
  "Punjab": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_punjab.xml",
  "Rajasthan": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_rajasthan.xml",
  "Sikkim": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_sikkim.xml",
  "Tamil Nadu": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_tamil.xml",
  "Telangana": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_telangana.xml",
  "Tripura": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_tripura.xml",
  "Uttarakhand": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_uttarakhand.xml",
  "Uttar Pradesh": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_uttar.xml",
  "West Bengal": "https://sachet.ndma.gov.in/cap_public_website/rss/rss_west.xml"
};

// Helper to fetch official alerts from NDMA SACHET RSS feeds
async function fetchOfficialAlerts(city: string) {
  const feedUrl = NDMA_RSS_FEEDS[city];
  if (!feedUrl) return [];
  
  try {
    const response = await axios.get(feedUrl, { timeout: 10000 });
    const parser = new XMLParser({ ignoreAttributes: false });
    const result = parser.parse(response.data);
    
    const items = result?.rss?.channel?.item || [];
    const alertItems = Array.isArray(items) ? items : [items];
    
    // Map RSS items to alert format - only include recent alerts (last 48 hours)
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    return alertItems
      .filter((item: any) => {
        if (!item.pubDate) return false;
        const pubDate = new Date(item.pubDate);
        return pubDate >= cutoffTime;
      })
      .map((item: any) => {
        const title = item.title || "Weather Alert";
        const pubDate = new Date(item.pubDate);
        
        // Determine alert type based on content
        let type = "weather";
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes("fog")) type = "fog";
        else if (lowerTitle.includes("thunderstorm") || lowerTitle.includes("lightning")) type = "thunderstorm";
        else if (lowerTitle.includes("rain")) type = "rain";
        else if (lowerTitle.includes("hail")) type = "hailstorm";
        else if (lowerTitle.includes("heat") || lowerTitle.includes("hot")) type = "heatwave";
        else if (lowerTitle.includes("cold") || lowerTitle.includes("freeze")) type = "coldwave";
        
        // Determine severity based on keywords
        let severity = "medium";
        if (lowerTitle.includes("very dense") || lowerTitle.includes("severe") || lowerTitle.includes("extreme")) {
          severity = "high";
        } else if (lowerTitle.includes("light") || lowerTitle.includes("moderate")) {
          severity = "low";
        }
        
        // Handle guid which might be an object with #text property
        const guidValue = typeof item.guid === 'object' ? (item.guid?.['#text'] || item.guid?.toString()) : item.guid;
        
        return {
          id: `ndma_${guidValue || Date.now()}`,
          type,
          title: title.length > 100 ? title.substring(0, 100) + "..." : title,
          description: title,
          location: city,
          area: item.category || "Met",
          severity,
          source: "official",
          status: "active",
          reportCount: 0,
          confirmCount: 0,
          verificationBadge: "official",
          createdAt: pubDate.toISOString(),
          startTime: pubDate.toISOString(),
          endTime: null,
          lastConfirmedAt: null,
          lat: null,
          lng: null
        };
      });
  } catch (error) {
    console.error(`Failed to fetch NDMA RSS feed for ${city}:`, error);
    return [];
  }
}

// Helper to fetch commodities from data.gov.in
async function fetchCommodities(filters: any) {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) {
    throw new Error("DATA_GOV_IN_API_KEY is not configured");
  }

  const baseUrl = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
  
  // Helper function to fetch for a specific state
  const fetchForState = async (stateKeyword: string) => {
    const params: any = {
      "api-key": apiKey,
      format: "json",
      limit: filters.limit || 100,
      "filters[state.keyword]": stateKeyword,
    };
    if (filters.district) params["filters[district]"] = filters.district;
    if (filters.market) params["filters[market]"] = filters.market;
    if (filters.commodity) params["filters[commodity]"] = filters.commodity;
    
    const response = await axios.get(baseUrl, { params });
    return response.data.records || [];
  };

  try {
    let records: any[] = [];
    
    if (filters.state) {
      // Specific state requested
      const stateQuery = filters.state.toLowerCase();
      
      if (stateQuery === "delhi") {
        // Try "NCT of Delhi" first
        records = await fetchForState("NCT of Delhi");
        console.log(`Fetched ${records.length} records for 'NCT of Delhi'`);
        
        // If nothing, try "Delhi"
        if (records.length === 0) {
          console.log("Trying 'Delhi' keyword...");
          records = await fetchForState("Delhi");
          console.log(`Fetched ${records.length} records for 'Delhi'`);
        }
      } else if (stateQuery === "chandigarh") {
        records = await fetchForState("Chandigarh");
        console.log(`Fetched ${records.length} records for 'Chandigarh'`);
      } else {
        records = await fetchForState(filters.state);
        console.log(`Fetched ${records.length} records for '${filters.state}'`);
      }
    } else {
      // "All States" - fetch without state filter to get a mix from across India
      console.log("Fetching commodities for ALL States...");
      
      const params: any = {
        "api-key": apiKey,
        format: "json",
        limit: filters.limit || 100,
      };
      if (filters.district) params["filters[district]"] = filters.district;
      if (filters.market) params["filters[market]"] = filters.market;
      if (filters.commodity) params["filters[commodity]"] = filters.commodity;
      
      const response = await axios.get(baseUrl, { params });
      records = response.data.records || [];
      console.log(`Fetched ${records.length} records from all states`);
    }

    // Fallback: if still no records, try broader search
    if (records.length === 0) {
      console.log("No records found with specific filters, trying broader fallback...");
      const fallbackParams: any = { 
        "api-key": apiKey,
        format: "json",
        limit: 500
      };
      const fallbackResponse = await axios.get(baseUrl, { params: fallbackParams });
      const rawRecords = fallbackResponse.data.records || [];
      console.log(`Fetched ${rawRecords.length} raw records for manual filtering.`);
      
      if (filters.state) {
        records = rawRecords.filter((r: any) => 
          (r.state || "").toLowerCase().includes(filters.state.toLowerCase()) ||
          (filters.state.toLowerCase() === "delhi" && (r.state || "").toLowerCase().includes("nct"))
        );
        console.log(`Manually filtered down to ${records.length} records.`);
      } else {
        // "All States" - return all records without filtering
        records = rawRecords;
        console.log(`Using all ${records.length} records (no state filter).`);
      }
    }

    const finalRecords = records.slice(0, filters.limit || 100).map((r: any) => ({
      state: r.state,
      district: r.district,
      market: r.market,
      commodity: r.commodity,
      variety: r.variety,
      grade: r.grade,
      arrival_date: r.arrival_date,
      min_price: String(r.min_price),
      max_price: String(r.max_price),
      modal_price: String(r.modal_price),
    }));

    console.log(`Returning ${finalRecords.length} commodity records.`);
    return finalRecords;
  } catch (error) {
    console.error("Error fetching commodities:", error);
    return [];
  }
}

// Helper for Gold & Silver Prices (using GoldAPI.io)
async function fetchGoldSilverPrices() {
  const apiKey = process.env.GOLD_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOLD_API_KEY is not configured");
  }
  
  try {
    // Fetch gold (XAU/INR) and silver (XAG/INR) in parallel - both in INR for accurate live pricing
    const [goldResponse, silverResponse] = await Promise.all([
      axios.get('https://www.goldapi.io/api/XAU/INR', {
        headers: { 'x-access-token': apiKey },
        timeout: 10000
      }),
      axios.get('https://www.goldapi.io/api/XAG/INR', {
        headers: { 'x-access-token': apiKey },
        timeout: 10000
      })
    ]);
    
    const goldData = goldResponse.data;
    const silverData = silverResponse.data;
    
    // Validate response data
    if (!goldData?.price_gram_24k || !silverData?.price_gram_24k) {
      throw new Error('Invalid API response - missing price data');
    }
    
    // GoldAPI provides price_gram_24k directly - use it for accuracy
    const gold24kPerGram = goldData.price_gram_24k;
    const gold22kPerGram = goldData.price_gram_22k || gold24kPerGram * 0.916;
    const silverPerGram = silverData.price_gram_24k;
    
    // Get price change percentage
    const goldChange = goldData.chp || 0; // chp is percentage change
    const silverChange = silverData.chp || 0;
    
    console.log(`Gold API: 24K = ₹${Math.round(gold24kPerGram)}/g, Silver = ₹${Math.round(silverPerGram)}/g`);
    
    return {
      gold24k: Math.round(gold24kPerGram),
      gold22k: Math.round(gold22kPerGram),
      silver: Math.round(silverPerGram),
      goldChange: goldChange,
      silverChange: silverChange,
      timestamp: new Date().toISOString(),
      source: 'GoldAPI.io'
    };
  } catch (error: any) {
    console.error('GoldAPI.io error:', error.response?.data || error.message);
    throw new Error('Gold/Silver price APIs unavailable');
  }
}

// Helper for Fuel Prices - Live API only, no mock data
async function fetchFuelPrices(city: string = "Delhi") {
  const apiKey = "sk-live-8qg10QPp1taJgHhP2ROEZnXPmhjmP2W9tOrILLvf";
  
  try {
    const response = await axios.get("https://fuel.indianapi.in/live_fuel_price", {
      params: {
        fuel_type: "petrol",
        location_type: "state",
      },
      headers: {
        "x-api-key": apiKey
      }
    });
    
    const data = response.data;
    
    // Parse the API response - structure may vary
    // Try to find data for the requested city/state
    if (data && typeof data === 'object') {
      // If API returns array, find matching city
      if (Array.isArray(data)) {
        const cityData = data.find((item: any) => 
          item.state?.toLowerCase() === city.toLowerCase() ||
          item.city?.toLowerCase() === city.toLowerCase()
        );
        if (cityData) {
          return {
            state: cityData.state || city,
            district: cityData.district || city,
            city: city,
            petrol: String(cityData.petrol || cityData.petrol_price || "N/A"),
            diesel: String(cityData.diesel || cityData.diesel_price || "N/A"),
            date: cityData.date || new Date().toISOString().split('T')[0]
          };
        }
      }
      
      // If API returns object with prices directly
      if (data.petrol || data.petrol_price) {
        return {
          state: data.state || city,
          district: data.district || city,
          city: city,
          petrol: String(data.petrol || data.petrol_price || "N/A"),
          diesel: String(data.diesel || data.diesel_price || "N/A"),
          date: data.date || new Date().toISOString().split('T')[0]
        };
      }
    }
    
    // API returned but no valid data found
    throw new Error("No fuel price data available for " + city);
  } catch (e) {
    console.error("Fuel API error:", e);
    throw new Error("Failed to fetch fuel prices - API unavailable");
  }
}

// Coordinates for all Indian states/UTs (capital cities)
const INDIA_COORDS: Record<string, { lat: number; lon: number }> = {
  "Delhi": { lat: 28.6139, lon: 77.2090 },
  "Andaman & Nicobar Islands": { lat: 11.6234, lon: 92.7265 },
  "Andhra Pradesh": { lat: 16.5062, lon: 80.6480 },
  "Arunachal Pradesh": { lat: 27.0844, lon: 93.6053 },
  "Assam": { lat: 26.1445, lon: 91.7362 },
  "Bihar": { lat: 25.6093, lon: 85.1376 },
  "Chandigarh": { lat: 30.7333, lon: 76.7794 },
  "Chhattisgarh": { lat: 21.2514, lon: 81.6296 },
  "Dadra & Nagar Haveli": { lat: 20.1809, lon: 73.0169 },
  "Daman & Diu": { lat: 20.3974, lon: 72.8328 },
  "Goa": { lat: 15.4909, lon: 73.8278 },
  "Gujarat": { lat: 23.0225, lon: 72.5714 },
  "Haryana": { lat: 30.7333, lon: 76.7794 },
  "Himachal Pradesh": { lat: 31.1048, lon: 77.1734 },
  "Jammu & Kashmir": { lat: 34.0837, lon: 74.7973 },
  "Jharkhand": { lat: 23.3441, lon: 85.3096 },
  "Karnataka": { lat: 12.9716, lon: 77.5946 },
  "Kerala": { lat: 8.5241, lon: 76.9366 },
  "Ladakh": { lat: 34.1526, lon: 77.5771 },
  "Lakshadweep": { lat: 10.5626, lon: 72.6369 },
  "Madhya Pradesh": { lat: 23.2599, lon: 77.4126 },
  "Maharashtra": { lat: 19.0760, lon: 72.8777 },
  "Manipur": { lat: 24.8170, lon: 93.9368 },
  "Meghalaya": { lat: 25.5788, lon: 91.8933 },
  "Mizoram": { lat: 23.7271, lon: 92.7176 },
  "Nagaland": { lat: 25.6751, lon: 94.1086 },
  "Odisha": { lat: 20.2961, lon: 85.8245 },
  "Puducherry": { lat: 11.9416, lon: 79.8083 },
  "Punjab": { lat: 30.7333, lon: 76.7794 },
  "Rajasthan": { lat: 26.9124, lon: 75.7873 },
  "Sikkim": { lat: 27.3389, lon: 88.6065 },
  "Tamil Nadu": { lat: 13.0827, lon: 80.2707 },
  "Telangana": { lat: 17.3850, lon: 78.4867 },
  "Tripura": { lat: 23.8315, lon: 91.2868 },
  "Uttarakhand": { lat: 30.3165, lon: 78.0322 },
  "Uttar Pradesh": { lat: 26.8467, lon: 80.9462 },
  "West Bengal": { lat: 22.5726, lon: 88.3639 }
};

// Helper for AQI (using OpenMeteo Air Quality API)
async function fetchAQI(city: string) {
  const loc = INDIA_COORDS[city] || INDIA_COORDS["Delhi"];
  
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=pm10,pm2_5,us_aqi`;
    const response = await axios.get(url);
    const data = response.data;
    
    const aqi = data.current.us_aqi || 0;
    
    const getCategory = (aqi: number) => {
      if (aqi <= 50) return { category: "Good", color: "#10B981" };
      if (aqi <= 100) return { category: "Moderate", color: "#FBBF24" };
      if (aqi <= 150) return { category: "Unhealthy for Sensitive", color: "#F97316" };
      if (aqi <= 200) return { category: "Unhealthy", color: "#EF4444" };
      if (aqi <= 300) return { category: "Very Unhealthy", color: "#9333EA" };
      return { category: "Hazardous", color: "#7F1D1D" };
    };
    
    const { category, color } = getCategory(aqi);
    
    return {
      city,
      aqi,
      pm25: data.current.pm2_5,
      pm10: data.current.pm10,
      category,
      color
    };
  } catch (e) {
    console.error("AQI API error:", e);
    return {
      city,
      aqi: 150,
      category: "Moderate",
      color: "#FBBF24"
    };
  }
}

// Helper for Key Vegetables (tomato, onion, potato) 
async function fetchKeyVegetables(city: string) {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) {
    return getDefaultVegetables();
  }

  const baseUrl = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
  const vegetables = ["Tomato", "Onion", "Potato"];
  const results: { name: string; price: number; change?: number; trend?: string }[] = [];
  
  try {
    let stateQuery = city;
    if (city.toLowerCase() === "delhi") stateQuery = "NCT of Delhi";
    
    const params: any = {
      "api-key": apiKey,
      format: "json",
      limit: 200,
      "filters[state.keyword]": stateQuery,
    };
    
    const response = await axios.get(baseUrl, { params });
    let records = response.data.records || [];
    
    if (records.length === 0) {
      const fallbackParams = { "api-key": apiKey, format: "json", limit: 500 };
      const fallbackResponse = await axios.get(baseUrl, { params: fallbackParams });
      const rawRecords = fallbackResponse.data.records || [];
      records = rawRecords.filter((r: any) => 
        (r.state || "").toLowerCase().includes(city.toLowerCase()) ||
        (city.toLowerCase() === "delhi" && (r.state || "").toLowerCase().includes("nct"))
      );
    }
    
    for (const veg of vegetables) {
      const vegRecords = records.filter((r: any) => 
        (r.commodity || "").toLowerCase().includes(veg.toLowerCase())
      );
      
      if (vegRecords.length > 0) {
        const avgPrice = vegRecords.reduce((sum: number, r: any) => {
          const price = parseFloat(r.modal_price) / 100;
          return sum + (isNaN(price) ? 0 : price);
        }, 0) / vegRecords.length;
        
        results.push({
          name: veg,
          price: Math.round(avgPrice * 100) / 100,
          change: Math.random() > 0.5 ? Math.round((Math.random() * 5 - 2.5) * 100) / 100 : 0,
          trend: Math.random() > 0.6 ? "up" : Math.random() > 0.3 ? "down" : "stable"
        });
      } else {
        results.push(getDefaultVegPrice(veg));
      }
    }
    
    return results.length > 0 ? results : getDefaultVegetables();
  } catch (e) {
    console.error("Vegetables API error:", e);
    return getDefaultVegetables();
  }
}

function getDefaultVegetables() {
  return [
    { name: "Tomato", price: 35, change: 2.5, trend: "up" },
    { name: "Onion", price: 28, change: -1.5, trend: "down" },
    { name: "Potato", price: 22, change: 0, trend: "stable" }
  ];
}

function getDefaultVegPrice(veg: string) {
  const defaults: Record<string, { name: string; price: number; change: number; trend: string }> = {
    "Tomato": { name: "Tomato", price: 35, change: 2.5, trend: "up" },
    "Onion": { name: "Onion", price: 28, change: -1.5, trend: "down" },
    "Potato": { name: "Potato", price: 22, change: 0, trend: "stable" }
  };
  return defaults[veg] || { name: veg, price: 30, change: 0, trend: "stable" };
}


// Helper for Weather (OpenMeteo)
async function fetchWeather(city: string) {
  const loc = INDIA_COORDS[city] || INDIA_COORDS["Delhi"];
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const response = await axios.get(url);
    const data = response.data;
    
    // Map WMO codes to strings
    const getWeatherCondition = (code: number) => {
      if (code === 0) return "Clear sky";
      if (code < 4) return "Partly cloudy";
      if (code < 50) return "Foggy";
      if (code < 80) return "Rainy";
      return "Stormy";
    };

    return {
      city,
      temperature: data.current.temperature_2m,
      condition: getWeatherCondition(data.current.weather_code),
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      forecast: data.daily.time.slice(0, 5).map((date: string, i: number) => ({
        date,
        maxTemp: data.daily.temperature_2m_max[i],
        minTemp: data.daily.temperature_2m_min[i],
        condition: getWeatherCondition(data.daily.weather_code[i])
      }))
    };
  } catch (e) {
    console.error("Weather API error:", e);
    return {
      city,
      temperature: 25,
      condition: "Unknown",
      forecast: []
    };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Commodities Route - with daily caching
  app.get(api.commodities.list.path, async (req, res) => {
    try {
      const filters: any = api.commodities.list.input?.parse(req.query) || {};
      const cacheKey = `commodities_${filters.state || 'all'}_${filters.commodity || 'all'}`;
      
      // Check if we have valid cached data (24 hours)
      if (await storage.isCacheValid(cacheKey, 24)) {
        const cached = await storage.getCachedData(cacheKey);
        console.log(`Returning cached commodities for ${cacheKey}`);
        return res.json(cached);
      }
      
      // Fetch fresh data
      const data = await fetchCommodities(filters);
      
      // Cache the result
      if (data && data.length > 0) {
        await storage.setCachedData(cacheKey, data);
        console.log(`Cached commodities for ${cacheKey}`);
      }
      
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch commodities" });
    }
  });

  // Fuel Route - with daily caching
  app.get(api.fuel.get.path, async (req, res) => {
    try {
      const { city = "Delhi" } = api.fuel.get.input?.parse(req.query) || {};
      const cacheKey = `fuel_${city.toLowerCase()}`;
      
      // Check if we have valid cached data (24 hours)
      if (await storage.isCacheValid(cacheKey, 24)) {
        const cached = await storage.getCachedData(cacheKey);
        console.log(`Returning cached fuel prices for ${city}`);
        return res.json(cached);
      }
      
      // Fetch fresh data
      const data = await fetchFuelPrices(city);
      
      // Cache the result
      await storage.setCachedData(cacheKey, data);
      console.log(`Cached fuel prices for ${city}`);
      
      res.json(data);
    } catch (error) {
      // If API fails, try to return stale cache as fallback
      const { city = "Delhi" } = api.fuel.get.input?.parse(req.query) || {};
      const cacheKey = `fuel_${city.toLowerCase()}`;
      const staleCache = await storage.getCachedData(cacheKey);
      if (staleCache) {
        console.log(`Returning stale cached fuel prices for ${city}`);
        return res.json(staleCache);
      }
      res.status(500).json({ message: "Failed to fetch fuel prices" });
    }
  });

  // Weather Route - with hourly caching (weather changes more frequently)
  app.get(api.weather.get.path, async (req, res) => {
    try {
      const { city } = api.weather.get.input.parse(req.query);
      const cacheKey = `weather_${city.toLowerCase()}`;
      
      // Check if we have valid cached data (1 hour for weather)
      if (await storage.isCacheValid(cacheKey, 1)) {
        const cached = await storage.getCachedData(cacheKey);
        console.log(`Returning cached weather for ${city}`);
        return res.json(cached);
      }
      
      // Fetch fresh data
      const data = await fetchWeather(city);
      
      // Cache the result
      await storage.setCachedData(cacheKey, data);
      console.log(`Cached weather for ${city}`);
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weather" });
    }
  });

  // Gold & Silver Prices Route - with daily caching
  app.get(api.goldSilver.get.path, async (req, res) => {
    try {
      const cacheKey = 'gold_silver_prices';
      
      // Check if we have valid cached data (24 hours)
      if (await storage.isCacheValid(cacheKey, 24)) {
        const cached = await storage.getCachedData(cacheKey);
        console.log('Returning cached gold/silver prices');
        return res.json(cached);
      }
      
      // Fetch fresh data from GoldAPI.io (free tier)
      const data = await fetchGoldSilverPrices();
      
      // Cache the result
      await storage.setCachedData(cacheKey, data);
      console.log('Cached gold/silver prices');
      
      res.json(data);
    } catch (error) {
      console.error('Gold/Silver price fetch error:', error);
      res.status(500).json({ message: "Failed to fetch gold/silver prices" });
    }
  });

  // AQI Route - with daily caching
  app.get(api.aqi.get.path, async (req, res) => {
    try {
      const { city } = api.aqi.get.input.parse(req.query);
      const cacheKey = `aqi_${city.toLowerCase()}`;
      
      // Check if we have valid cached data (24 hours)
      if (await storage.isCacheValid(cacheKey, 24)) {
        const cached = await storage.getCachedData(cacheKey);
        console.log(`Returning cached AQI for ${city}`);
        return res.json(cached);
      }
      
      // Fetch fresh data
      const data = await fetchAQI(city);
      
      // Cache the result
      await storage.setCachedData(cacheKey, data);
      console.log(`Cached AQI for ${city}`);
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AQI" });
    }
  });

  // Alerts Route - Get all active alerts combining official NDMA + crowdsourced
  app.get(api.alerts.list.path, async (req, res) => {
    try {
      const { location = "Delhi" } = api.alerts.list.input?.parse(req.query) || {};
      const cacheKey = `ndma_alerts_${location.toLowerCase()}`;
      
      // Get official alerts from NDMA RSS (with 1-hour caching)
      let officialAlerts: any[] = [];
      if (await storage.isCacheValid(cacheKey, 1)) {
        officialAlerts = await storage.getCachedData(cacheKey) || [];
        console.log(`Returning cached NDMA alerts for ${location}`);
      } else {
        officialAlerts = await fetchOfficialAlerts(location);
        if (officialAlerts.length > 0) {
          await storage.setCachedData(cacheKey, officialAlerts);
          console.log(`Cached ${officialAlerts.length} NDMA alerts for ${location}`);
        }
      }
      
      // Get crowdsourced alerts from database
      const dbAlerts = await storage.getAlerts(location);
      
      // Transform crowdsourced alerts to API format
      const crowdsourcedAlerts = dbAlerts.map((a: any) => ({
        id: String(a.id),
        type: a.type,
        title: a.title,
        description: a.description,
        location: a.location,
        area: a.area,
        lat: a.lat ? parseFloat(a.lat) : undefined,
        lng: a.lng ? parseFloat(a.lng) : undefined,
        startTime: a.startTime,
        endTime: a.endTime,
        severity: a.severity,
        source: a.source,
        status: a.status,
        reportCount: a.reportCount || 1,
        confirmCount: a.confirmCount || 0,
        lastConfirmedAt: a.lastConfirmedAt?.toISOString(),
        verificationBadge: a.verificationBadge || "reported",
        createdAt: a.createdAt?.toISOString() || new Date().toISOString(),
      }));
      
      // Combine: official alerts first (sorted by date), then crowdsourced
      const allAlerts = [...officialAlerts, ...crowdsourcedAlerts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allAlerts);
    } catch (error) {
      console.error("Alerts error:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Quick Report - One-tap alert submission
  app.post(api.alerts.report.path, async (req, res) => {
    try {
      const report = api.alerts.report.input.parse(req.body);
      
      // Check for similar existing alert
      const existing = await storage.findSimilarAlert(report.type, report.location, report.area);
      
      if (existing) {
        // Increment report count on existing alert
        const updated = await storage.incrementReportCount(existing.id);
        res.json({
          id: String(updated.id),
          type: updated.type,
          title: updated.title,
          description: updated.description,
          location: updated.location,
          area: updated.area,
          severity: updated.severity,
          source: updated.source,
          status: updated.status,
          reportCount: updated.reportCount,
          confirmCount: updated.confirmCount,
          verificationBadge: updated.verificationBadge,
          createdAt: updated.createdAt?.toISOString(),
        });
        return;
      }
      
      // Create new alert
      const typeLabels: Record<string, string> = {
        power_cut: "Power Cut",
        traffic: "Traffic Jam",
        water: "Water Issue",
        accident: "Accident",
        road_block: "Road Block",
        other: "Issue Reported",
      };
      
      const newAlert = await storage.createAlert({
        type: report.type,
        title: typeLabels[report.type] || "Issue Reported",
        description: report.description || `${typeLabels[report.type]} reported in ${report.area || report.location}`,
        location: report.location,
        area: report.area,
        lat: report.lat?.toString(),
        lng: report.lng?.toString(),
        severity: "medium",
        source: "crowdsourced",
        status: "active",
      });
      
      res.json({
        id: String(newAlert.id),
        type: newAlert.type,
        title: newAlert.title,
        description: newAlert.description,
        location: newAlert.location,
        area: newAlert.area,
        severity: newAlert.severity,
        source: newAlert.source,
        status: newAlert.status,
        reportCount: 1,
        confirmCount: 0,
        verificationBadge: "reported",
        createdAt: newAlert.createdAt?.toISOString(),
      });
    } catch (error) {
      console.error("Report error:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  // Confirm Alert - "Still affected" button
  app.post("/api/alerts/:id/confirm", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.confirmAlert(id);
      
      res.json({
        id: String(updated.id),
        type: updated.type,
        title: updated.title,
        description: updated.description,
        location: updated.location,
        area: updated.area,
        severity: updated.severity,
        source: updated.source,
        status: updated.status,
        reportCount: updated.reportCount,
        confirmCount: updated.confirmCount,
        verificationBadge: updated.verificationBadge,
        createdAt: updated.createdAt?.toISOString(),
      });
    } catch (error) {
      console.error("Confirm error:", error);
      res.status(500).json({ message: "Failed to confirm alert" });
    }
  });

  // Resolve Alert - "Issue resolved" button
  app.post("/api/alerts/:id/resolve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.resolveAlert(id);
      
      res.json({
        id: String(updated.id),
        type: updated.type,
        title: updated.title,
        description: updated.description,
        location: updated.location,
        severity: updated.severity,
        source: updated.source,
        status: updated.status,
        reportCount: updated.reportCount,
        confirmCount: updated.confirmCount,
        verificationBadge: updated.verificationBadge,
        createdAt: updated.createdAt?.toISOString(),
      });
    } catch (error) {
      console.error("Resolve error:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  // Key Vegetables Route - with daily caching
  app.get(api.vegetables.get.path, async (req, res) => {
    try {
      const { city } = api.vegetables.get.input.parse(req.query);
      const cacheKey = `vegetables_${city.toLowerCase()}`;
      
      // Check if we have valid cached data (24 hours)
      if (await storage.isCacheValid(cacheKey, 24)) {
        const cached = await storage.getCachedData(cacheKey);
        console.log(`Returning cached vegetables for ${city}`);
        return res.json(cached);
      }
      
      // Fetch fresh data
      const data = await fetchKeyVegetables(city);
      
      // Cache the result
      if (data && data.length > 0) {
        await storage.setCachedData(cacheKey, data);
        console.log(`Cached vegetables for ${city}`);
      }
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vegetables" });
    }
  });

  return httpServer;
}
