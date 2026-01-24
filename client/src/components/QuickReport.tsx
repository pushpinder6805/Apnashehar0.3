import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Zap, Car, Droplet, AlertTriangle, Construction, X, Check, MapPin } from "lucide-react";

interface QuickReportProps {
  city: string;
  onClose?: () => void;
}

const reportTypes = [
  { type: "power_cut", label: "Power Cut", icon: Zap, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  { type: "traffic", label: "Traffic Jam", icon: Car, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  { type: "water", label: "Water Issue", icon: Droplet, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  { type: "accident", label: "Accident", icon: AlertTriangle, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  { type: "road_block", label: "Road Block", icon: Construction, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
] as const;

export function QuickReport({ city, onClose }: QuickReportProps) {
  const [area, setArea] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async (report: { type: string; location: string; area?: string }) => {
      const res = await apiRequest("POST", "/api/alerts/report", report);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts", city] });
      toast({
        title: "Report submitted",
        description: "Thank you for helping your community!",
      });
      setArea("");
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Failed to submit",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickReport = (type: string) => {
    reportMutation.mutate({
      type,
      location: city,
      area: area || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{city}</span>
        </div>
        {onClose && (
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-report">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="mb-3">
        <Input
          type="text"
          placeholder="Area/Sector (optional)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          data-testid="input-report-area"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {reportTypes.map((report) => (
          <Button
            key={report.type}
            variant="outline"
            size="lg"
            onClick={() => handleQuickReport(report.type)}
            disabled={reportMutation.isPending}
            className={`flex flex-col items-center gap-2 ${report.bgColor}`}
            data-testid={`button-report-${report.type}`}
          >
            <report.icon className={`w-6 h-6 ${report.color}`} />
            <span className="text-sm font-medium">{report.label}</span>
          </Button>
        ))}
      </div>

      {reportMutation.isPending && (
        <div className="text-center text-sm text-muted-foreground">
          Submitting report...
        </div>
      )}
    </div>
  );
}

interface AlertActionsProps {
  alertId: string;
  city: string;
  reportCount: number;
  confirmCount: number;
}

export function AlertActions({ alertId, city, reportCount, confirmCount }: AlertActionsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/alerts/${alertId}/confirm`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts", city] });
      toast({ title: "Confirmed", description: "Thank you for the update!" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/alerts/${alertId}/resolve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts", city] });
      toast({ title: "Marked as resolved", description: "Thank you!" });
    },
  });

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => confirmMutation.mutate()}
        disabled={confirmMutation.isPending}
        data-testid={`button-confirm-${alertId}`}
      >
        Still affected
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => resolveMutation.mutate()}
        disabled={resolveMutation.isPending}
        data-testid={`button-resolve-${alertId}`}
      >
        <Check className="w-3 h-3 mr-1" />
        Resolved
      </Button>
      <div className="flex-1" />
      <Badge variant="secondary" className="text-xs">
        {reportCount} reports
      </Badge>
      {confirmCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {confirmCount} confirmed
        </Badge>
      )}
    </div>
  );
}
