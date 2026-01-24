import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useFuelPrices } from "@/hooks/use-fuel";
import { useWeather } from "@/hooks/use-weather";
import { useAQI } from "@/hooks/use-aqi";
import { useAlerts } from "@/hooks/use-alerts";
import { useVegetables } from "@/hooks/use-vegetables";
import { useGoldSilver } from "@/hooks/use-gold-silver";
import { QuickReport, AlertActions } from "@/components/QuickReport";
import { 
  Fuel, 
  CloudSun, 
  Wind, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Zap,
  Car,
  Droplet,
  ThermometerSun,
  ThermometerSnowflake,
  Plus,
  CheckCircle,
  Users,
  Gem,
  Heart
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// All Indian states/UTs (36 states + 1 merged UT)
const INDIAN_STATES = [
  "Delhi",
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli",
  "Daman & Diu",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttarakhand",
  "Uttar Pradesh",
  "West Bengal",
];

export default function Dashboard() {
  const [city, setCity] = useState<string>("Delhi");
  
  const { data: fuelData, isLoading: isFuelLoading, isError: isFuelError } = useFuelPrices(city);
  const { data: weather, isLoading: isWeatherLoading } = useWeather(city);
  const { data: aqi, isLoading: isAqiLoading } = useAQI(city);
  const { data: alerts, isLoading: isAlertsLoading } = useAlerts(city);
  const { data: vegetables, isLoading: isVegetablesLoading } = useVegetables(city);
  const { data: goldSilver, isLoading: isGoldSilverLoading, isError: isGoldSilverError } = useGoldSilver();

  const fuel = fuelData?.[0];
  const [showReportForm, setShowReportForm] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "power_cut": return <Zap className="w-4 h-4" />;
      case "traffic": return <Car className="w-4 h-4" />;
      case "water": return <Droplet className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {getGreeting()}, Citizen
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {format(new Date(), 'EEEE, MMMM do, yyyy')} • City Pulse
              </p>
            </div>
            
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-48" data-testid="select-city">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          <Card className="lg:row-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-600" />
                Fuel Prices
              </CardTitle>
              <span className="text-xs text-muted-foreground">Today</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFuelLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-12 bg-muted rounded"></div>
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              ) : isFuelError ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Unable to fetch fuel prices</p>
                  <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-100 dark:border-orange-900/30">
                    <div>
                      <p className="text-sm text-muted-foreground">Petrol</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-petrol-price">
                        ₹{fuel?.petrol || "--"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Fuel className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-100 dark:border-green-900/30">
                    <div>
                      <p className="text-sm text-muted-foreground">Diesel</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-diesel-price">
                        ₹{fuel?.diesel || "--"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Fuel className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-blue-500" />
                Weather
              </CardTitle>
              <span className="text-xs text-muted-foreground">{city}</span>
            </CardHeader>
            <CardContent>
              {isWeatherLoading ? (
                <div className="h-24 bg-muted rounded animate-pulse"></div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-foreground" data-testid="text-current-temp">
                        {weather ? Math.round(weather.temperature) : "--"}°C
                      </p>
                      <p className="text-sm text-muted-foreground">{weather?.condition}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="font-semibold">{weather?.humidity || "--"}%</p>
                    </div>
                  </div>
                  
                  {weather?.forecast && weather.forecast.length > 1 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Tomorrow</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ThermometerSun className="w-4 h-4 text-red-400" />
                          <span className="font-medium" data-testid="text-tomorrow-max">{weather.forecast[1]?.maxTemp}°</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ThermometerSnowflake className="w-4 h-4 text-blue-400" />
                          <span className="font-medium" data-testid="text-tomorrow-min">{weather.forecast[1]?.minTemp}°</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{weather.forecast[1]?.condition}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wind className="w-5 h-5" style={{ color: aqi?.color || "#FBBF24" }} />
                Air Quality
              </CardTitle>
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ backgroundColor: aqi?.color ? `${aqi.color}20` : undefined, color: aqi?.color }}
                data-testid="badge-aqi-category"
              >
                {aqi?.category || "Loading..."}
              </Badge>
            </CardHeader>
            <CardContent>
              {isAqiLoading ? (
                <div className="h-20 bg-muted rounded animate-pulse"></div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold" style={{ color: aqi?.color }} data-testid="text-aqi-value">
                        {aqi?.aqi || "--"}
                      </p>
                      <p className="text-xs text-muted-foreground">US AQI</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-2 text-sm">
                        <span className="text-muted-foreground">PM2.5</span>
                        <span className="font-medium">{aqi?.pm25?.toFixed(1) || "--"}</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 text-sm">
                        <span className="text-muted-foreground">PM10</span>
                        <span className="font-medium">{aqi?.pm10?.toFixed(1) || "--"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Gem className="w-5 h-5 text-yellow-500" />
                Gold & Silver
              </CardTitle>
              <span className="text-xs text-muted-foreground">Per Gram</span>
            </CardHeader>
            <CardContent>
              {isGoldSilverLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              ) : isGoldSilverError ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Unable to fetch prices</p>
                  <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-100 dark:border-yellow-900/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Gold 24K</p>
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-gold-24k">
                        ₹{goldSilver?.gold24k?.toLocaleString() || "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gold 22K</p>
                      <p className="text-lg font-bold text-yellow-500 dark:text-yellow-300" data-testid="text-gold-22k">
                        ₹{goldSilver?.gold22k?.toLocaleString() || "--"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border border-slate-100 dark:border-slate-900/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Silver</p>
                      <p className="text-lg font-bold text-slate-600 dark:text-slate-300" data-testid="text-silver-price">
                        ₹{goldSilver?.silver?.toLocaleString() || "--"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{goldSilver?.source || ""}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Key Vegetable Prices
              </CardTitle>
              <span className="text-xs text-muted-foreground">per kg</span>
            </CardHeader>
            <CardContent>
              {isVegetablesLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {vegetables?.map((veg) => (
                    <div
                      key={veg.name}
                      className="p-3 rounded-lg bg-muted/50 border border-border text-center"
                      data-testid={`card-vegetable-${veg.name.toLowerCase()}`}
                    >
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        veg.name === "Tomato" ? "bg-red-100 dark:bg-red-900/30" : 
                        veg.name === "Onion" ? "bg-purple-100 dark:bg-purple-900/30" : 
                        "bg-amber-100 dark:bg-amber-900/30"
                      }`}>
                        <svg className={`w-5 h-5 ${
                          veg.name === "Tomato" ? "text-red-600" : 
                          veg.name === "Onion" ? "text-purple-600" : 
                          "text-amber-600"
                        }`} viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                      </div>
                      <p className="font-semibold text-sm">{veg.name}</p>
                      <p className="text-lg font-bold text-primary">₹{veg.price}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {getTrendIcon(veg.trend)}
                        {veg.change !== undefined && veg.change !== 0 && (
                          <span className={`text-xs ${veg.change > 0 ? "text-red-500" : "text-green-500"}`}>
                            {veg.change > 0 ? "+" : ""}{veg.change}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  City Alerts
                  <Badge variant="secondary" className="ml-1">
                    {alerts?.length || 0}
                  </Badge>
                </CardTitle>
                <Button 
                    size="sm" 
                    onClick={() => setShowReportForm(!showReportForm)}
                    data-testid="button-toggle-report"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Report
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showReportForm && (
                <div className="mb-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <h4 className="font-semibold text-sm mb-3">Quick Report (one-tap)</h4>
                  <QuickReport city={city} onClose={() => setShowReportForm(false)} />
                </div>
              )}
              
              {isAlertsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg border border-border bg-card"
                      data-testid={`card-alert-${alert.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{alert.title}</h4>
                                {alert.verificationBadge === "confirmed" && (
                                  <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Confirmed
                                  </Badge>
                                )}
                                {alert.verificationBadge === "official" && (
                                  <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    Official
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                            </div>
                          </div>
                          {(alert.startTime || alert.area) && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {alert.area && <span>{alert.area}</span>}
                              {alert.startTime && alert.endTime && (
                                <span>{alert.startTime} - {alert.endTime}</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{alert.reportCount || 1} reported</span>
                            {(alert.confirmCount || 0) > 0 && (
                              <span>• {alert.confirmCount} confirmed</span>
                            )}
                          </div>
                          <AlertActions 
                            alertId={alert.id} 
                            city={city} 
                            reportCount={alert.reportCount || 1} 
                            confirmCount={alert.confirmCount || 0} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active alerts for {city}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setShowReportForm(true)}
                    data-testid="button-report-first"
                  >
                    Be the first to report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
        
        <footer className="mt-8 pb-6 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Made with <Heart className="w-4 h-4 text-destructive fill-destructive" /> in India
          </p>
        </footer>
      </main>
    </div>
  );
}
