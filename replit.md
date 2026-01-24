# CityPulse - Urban Services Dashboard

## Overview

CityPulse is a civic information dashboard that aggregates real-time data about commodities (mandi prices), fuel prices, weather, and local offers for all 37 Indian states and Union Territories. The application fetches data from government APIs (data.gov.in) and other external services to provide citizens with a unified view of essential daily information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with HMR support

The frontend follows a page-based structure with two main views:
- Dashboard (home) - **City Pulse** daily cost-of-living snapshot
- Commodities - Agricultural mandi prices (supports all 37 states/UTs)

### City Pulse Dashboard (Home Screen)
The main dashboard is designed as a "Daily Cost-of-Living Snapshot" showing:
- **City/State Dropdown**: Select any of the 37 Indian states/UTs (default: Delhi)
- **Fuel Prices**: Petrol, Diesel prices (from indianapi.in - live data only, no fallback)
- **Weather**: Current conditions + tomorrow's forecast (OpenMeteo)
- **Air Quality Index (AQI)**: Color-coded category with PM2.5/PM10 values
- **Key Vegetables**: Tomato, Onion, Potato prices per kg (from data.gov.in)
- **City Alerts**: Power cuts, traffic, water disruptions (database + crowdsourced reports)

Custom hooks encapsulate API calls and provide typed data to components:
- `use-commodities.ts` - Mandi commodity prices
- `use-fuel.ts` - Fuel prices
- `use-weather.ts` - Weather data
- `use-offers.ts` - Local offers
- `use-aqi.ts` - Air quality index
- `use-alerts.ts` - City alerts
- `use-vegetables.ts` - Key vegetable prices

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation

The server acts as a proxy to external APIs, adding caching and error handling. Routes are defined declaratively with input/output schemas shared between client and server.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Primary Use**: API response caching (not user data)

The `apiCache` table stores fetched external API data to reduce redundant calls and improve response times.

### External API Integration
- **Commodities**: data.gov.in API (requires `DATA_GOV_IN_API_KEY`) - supports all 35+ Indian states/UTs
- **Key Vegetables**: data.gov.in API - specifically Tomato, Onion, Potato
- **Fuel Prices**: indianapi.in fuel price API (petrol/diesel only - no CNG data available)
- **Weather**: OpenMeteo forecast API (free, no key required)
- **Air Quality**: OpenMeteo Air Quality API (free, no key required)
- **Gold & Silver**: GoldAPI.io (requires `GOLD_API_KEY`) - XAU/INR and XAG/INR endpoints for live INR pricing per gram
- **City Alerts**: 
  - **Official**: NDMA SACHET RSS feeds (https://sachet.ndma.gov.in) - real-time disaster alerts from IMD
  - **Crowdsourced**: User-submitted reports with community validation (stored in database)

**Note**: All data is from live APIs only - no mock or sample data. If an API fails or returns no data, the UI shows an appropriate error/empty state.

### API Caching Strategy
To prevent rate limiting and reduce API calls, all external APIs are cached in the database:
- **Fuel Prices**: Cached for 24 hours (fetched once daily)
- **AQI Data**: Cached for 24 hours (fetched once daily)
- **Mandi Prices**: Cached for 24 hours (fetched once daily)
- **Vegetables**: Cached for 24 hours (fetched once daily)
- **Gold & Silver**: Cached for 24 hours (fetched once daily)
- **Weather**: Cached for 1 hour (weather changes more frequently)
- **NDMA Alerts**: Cached for 1 hour (refreshes every hour from RSS feeds)

The cache is stored in the `api_cache` table with timestamps. If an API fails and cached data exists, stale cache is returned as fallback.

API keys are managed through environment variables.

### Shared Code
The `shared/` directory contains code used by both client and server:
- `schema.ts` - Database tables and Zod validation schemas
- `routes.ts` - API endpoint definitions with request/response types

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `DATA_GOV_IN_API_KEY` - API key for Indian government data portal

### Third-Party Services
- **data.gov.in** - Agricultural commodity prices from Indian government
- **Weather API** - Weather data service (endpoint configured in routes)
- **Fuel Price API** - Daily fuel price updates

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Data fetching and caching
- `axios` - HTTP client for external APIs
- `zod` - Schema validation
- `shadcn/ui` components via Radix UI primitives
- `date-fns` - Date formatting
- `wouter` - Client-side routing