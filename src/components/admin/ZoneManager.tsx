"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GeofenceZone, UserRole } from "@/types/database";
import { ZoneForm } from "@/components/admin/ZoneForm";
import DynamicGeofenceMap from "@/components/maps/DynamicGeofenceMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Edit2, ShieldAlert } from "lucide-react";

interface ZoneManagerProps {
  role: UserRole;
}

export function ZoneManager({ role }: ZoneManagerProps) {
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<GeofenceZone | null>(null);
  const [previewZone, setPreviewZone] = useState<GeofenceZone | null>(null);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("zones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setZones(data || []);
      if (data && data.length > 0 && !previewZone) {
        setPreviewZone(data[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load zones";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleDelete = async (zoneId: string, zoneName: string) => {
    if (!confirm(`Are you sure you want to delete the zone "${zoneName}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("zones").delete().eq("id", zoneId);
      if (error) throw error;

      toast.success("Zone deleted successfully");
      if (previewZone?.id === zoneId) {
        setPreviewZone(null);
      }
      fetchZones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete zone";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Geofence Zones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define classroom and campus boundaries with precision radius geofencing
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedZone(null);
            setIsFormOpen(true);
          }}
          className="gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create New Zone
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Zones List */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading geofence zones...
            </div>
          ) : zones.length === 0 ? (
            <Card className="text-center p-8">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base mb-1">No Geofence Zones Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Create your first geofence zone by picking a center point on the map and setting its radius.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedZone(null);
                  setIsFormOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Geofence Zone
              </Button>
            </Card>
          ) : (
            zones.map((zone) => {
              const isSelected = previewZone?.id === zone.id;
              return (
                <div
                  key={zone.id}
                  onClick={() => setPreviewZone(zone)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {zone.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {zone.radius_meters}m Radius
                        </Badge>
                      </div>
                      {zone.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {zone.description}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-slate-400">
                        Lat: {zone.latitude.toFixed(6)}, Lng: {zone.longitude.toFixed(6)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600"
                        onClick={() => {
                          setSelectedZone(zone);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-600"
                        onClick={() => handleDelete(zone.id, zone.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Map Inspection */}
        <div className="lg:col-span-5">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Selected Zone Preview</span>
                {previewZone && (
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {previewZone.radius_meters}m
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {previewZone
                  ? previewZone.name
                  : "Select a zone on the left to preview its geofence radius on the map"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewZone ? (
                <div className="space-y-3">
                  <DynamicGeofenceMap
                    key={previewZone.id}
                    latitude={previewZone.latitude}
                    longitude={previewZone.longitude}
                    radiusMeters={previewZone.radius_meters}
                    interactive={false}
                    className="h-[280px] w-full"
                  />
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Center Coordinates:</span>
                      <span className="font-mono font-medium">
                        {previewZone.latitude}, {previewZone.longitude}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Geofence Radius:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {previewZone.radius_meters} meters
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[280px] rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-700">
                  Select a zone to preview
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zone Form Dialog */}
      <ZoneForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        zoneToEdit={selectedZone}
        onSuccess={fetchZones}
      />
    </div>
  );
}
