import { Sidebar } from "@/components/layout/Sidebar";
import { useCommodities } from "@/hooks/use-commodities";
import { Search, Sprout, Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INDIAN_STATES = [
  "All States",
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
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

export default function Commodities() {
  const [filterState, setFilterState] = useState<string>("All States");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: commodities, isLoading, isError } = useCommodities({ 
    limit: 100,
    state: filterState === "All States" ? undefined : filterState,
  });

  const filteredCommodities = (commodities || []).filter(item => {
    const matchesSearch = (item.commodity || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.market || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const displayData = filteredCommodities;

  const formatPricePerKg = (price: string) => {
    const p = parseFloat(price);
    if (isNaN(p)) return "N/A";
    return (p / 100).toFixed(2);
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <Sprout className="text-primary" /> Mandi Prices
              </h1>
              <p className="text-muted-foreground mt-2">
                Live updates from agricultural markets across India.
              </p>
            </div>
            
            <div className="w-full md:w-64">
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-full" data-testid="select-state">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state} data-testid={`option-${state.replace(/\s+/g, '-').toLowerCase()}`}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </header>

          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input 
                  type="text"
                  placeholder="Search commodity or market..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-white dark:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div className="text-sm text-muted-foreground self-center">
                {displayData.length} commodities found
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Commodity</th>
                    <th className="px-6 py-4">Market & District</th>
                    <th className="px-6 py-4">Variety & Grade</th>
                    <th className="px-6 py-4 text-right">Price (per kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-5 w-32 bg-muted rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-24 bg-muted rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-muted rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-5 w-16 bg-muted rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : displayData && displayData.length > 0 ? (
                    displayData.map((item, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors group" data-testid={`row-commodity-${i}`}>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{item.commodity}</div>
                          <div className="text-xs text-muted-foreground md:hidden">{item.arrival_date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-foreground">{item.market}</div>
                          <div className="text-xs text-muted-foreground">{item.district}, {item.state}</div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {item.variety} <span className="opacity-50">•</span> {item.grade}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex flex-col items-end">
                            <div className="font-bold text-primary tabular-nums bg-primary/10 px-2 py-1 rounded-md text-sm">
                              ₹{formatPricePerKg(item.modal_price)}/kg
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              Range: ₹{formatPricePerKg(item.min_price)} - ₹{formatPricePerKg(item.max_price)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Sprout size={48} className="mb-4 opacity-20" />
                          <p className="text-lg font-medium">No commodities found</p>
                          <p className="text-sm">Try selecting a different state or search term.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
