"use client";

import React, { useState } from "react";
import DynamicGeofenceMap from "@/components/maps/DynamicGeofenceMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { GeofenceZone } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { Crosshair, MapPin, Save } from "lucide-react";

interface ZoneFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneToEdit?: GeofenceZone | null;
  onSuccess: () => void;
}

export function ZoneForm({
  open,
  onOpenChange,
  zoneToEdit,
  onSuccess,
}: ZoneFormProps) {
  // Default to central coordinates if not provided (e.g., standard campus coordinate)
  const [name, setName] = useState(zoneToEdit?.name || "");
  const [description, setDescription] = useState(zoneToEdit?.description || "");
  const [latitude, setLatitude] = useState<number>(zoneToEdit?.latitude || 28.545123);
  const [longitude, setLongitude] = useState<number>(zoneToEdit?.longitude || 77.192345);
  const [radiusMeters, setRadiusMeters] = useState<number>(
    zoneToEdit?.radius_meters || 50
  );
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // Sync state if editing
  React.useEffect(() => {
    if (zoneToEdit) {
      setName(zoneToEdit.name);
      setDescription(zoneToEdit.description || "");
      setLatitude(zoneToEdit.latitude);
      setLongitude(zoneToEdit.longitude);
      setRadiusMeters(zoneToEdit.radius_meters);
    } else {
      setName("");
      setDescription("");
      setLatitude(28.545123);
      setLongitude(77.192345);
      setRadiusMeters(50);
    }
  }, [zoneToEdit, open]);

  // Use current GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
        toast.success("Location set to current GPS coordinates!");
      },
      (err) => {
        setLocating(false);
        toast.error(`Could not get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    setLatitude(Number(lat.toFixed(6)));
    setLongitude(Number(lng.toFixed(6)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a zone name");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (zoneToEdit) {
        // Update
        const { error } = await supabase
          .from("zones")
          .update({
            name,
            description,
            latitude,
            longitude,
            radius_meters: radiusMeters,
          })
          .eq("id", zoneToEdit.id);

        if (error) throw error;
        toast.success("Geofence zone updated successfully!");
      } else {
        // Insert
        const { error } = await supabase.from("zones").insert({
          name,
          description,
          latitude,
          longitude,
          radius_meters: radiusMeters,
          created_by: user?.id,
        });

        if (error) throw error;
        toast.success("Geofence zone created successfully!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save zone";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>
          {zoneToEdit ? "Edit Geofence Zone" : "Create Geofence Zone"}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Map Preview & Placement */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-blue-500" />
                Boundary Center & Live Circle Preview
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="h-7 text-xs gap-1.5 rounded-lg"
              >
                <Crosshair className={`h-3 w-3 ${locating ? "animate-spin" : ""}`} />
                {locating ? "Locating..." : "Use My GPS"}
              </Button>
            </div>

            <DynamicGeofenceMap
              latitude={latitude}
              longitude={longitude}
              radiusMeters={radiusMeters}
              interactive={true}
              onLocationChange={handleMapLocationChange}
            />
          </div>

          {/* Coordinates Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="lat" className="text-xs">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lng" className="text-xs">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Radius Slider (20m to 1000m) */}
          <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <Label htmlFor="radius" className="text-xs font-semibold">
                Geofence Radius
              </Label>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {radiusMeters} meters
              </span>
            </div>
            <input
              id="radius"
              type="range"
              min={20}
              max={1000}
              step={5}
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>20m (Small Room)</span>
              <span>150m (Hall)</span>
              <span>1000m (Campus)</span>
            </div>
          </div>

          {/* Zone Name */}
          <div className="space-y-1.5">
            <Label htmlFor="zoneName">Zone Name</Label>
            <Input
              id="zoneName"
              placeholder="e.g. Science Auditorium Hall B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="zoneDesc">Description (Optional)</Label>
            <Input
              id="zoneDesc"
              placeholder="e.g. Floor 2, East Academic Wing"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </DialogContent>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : zoneToEdit ? "Update Zone" : "Create Zone"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
