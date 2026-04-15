"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/client/context/AuthContext";
import { useSessions } from "@/src/client/hooks/useSessions";

const STORAGE_KEY = "ev_vehicle_info";

interface VehicleInfo {
  make:     string;
  model:    string;
  year:     string;
  battery:  string;
  range:    string;
  color:    string;
}

const DEFAULT_VEHICLE: VehicleInfo = {
  make:    "",
  model:   "",
  year:    "",
  battery: "",
  range:   "",
  color:   "",
};

function loadVehicle(): VehicleInfo {
  if (typeof window === "undefined") return DEFAULT_VEHICLE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_VEHICLE, ...JSON.parse(raw) } : DEFAULT_VEHICLE;
  } catch {
    return DEFAULT_VEHICLE;
  }
}

export default function ProfileClient() {
  const { user, signOut } = useAuth();
  const { sessions, stats } = useSessions();

  const [vehicle, setVehicle] = useState<VehicleInfo>(DEFAULT_VEHICLE);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<VehicleInfo>(DEFAULT_VEHICLE);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    const v = loadVehicle();
    setVehicle(v);
    setDraft(v);
  }, []);

  function handleEdit() {
    setDraft({ ...vehicle });
    setEditing(true);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setVehicle({ ...draft });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleCancel() {
    setDraft({ ...vehicle });
    setEditing(false);
  }

  const hasVehicle = vehicle.make || vehicle.model;

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition";

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">

      {/* heading */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>
        <p className="text-xs text-gray-400 mt-0.5">Your account and vehicle details</p>
      </div>

      {/* account card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {user?.email ?? "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Signed in</p>
          </div>
        </div>

        {/* quick stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
              <p className="text-xs text-gray-400 mt-0.5">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalKwh.toFixed(0)}
                <span className="text-sm font-normal text-gray-400 ml-1">kWh</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Total energy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalCost.toFixed(0)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Total spent</p>
            </div>
          </div>
        )}

        {/* sign out */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium transition-all duration-150 active:scale-95"
          >
            <span>🚪</span> Sign out
          </button>
        </div>
      </div>

      {/* vehicle card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Vehicle</h3>
            <p className="text-xs text-gray-400 mt-0.5">Stored locally on this device</p>
          </div>
          {!editing && (
            <button
              onClick={handleEdit}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {hasVehicle ? "✏️ Edit" : "+ Add vehicle"}
            </button>
          )}
        </div>

        {!editing ? (
          hasVehicle ? (
            <div className="space-y-1 animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                  🔋
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "My EV"}
                  </p>
                  {vehicle.color && (
                    <p className="text-xs text-gray-400">{vehicle.color}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {vehicle.battery && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Battery</p>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{vehicle.battery} kWh</p>
                  </div>
                )}
                {vehicle.range && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Est. range</p>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{vehicle.range} km</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-3">🔋</p>
              <p className="text-sm">No vehicle added yet</p>
              <button
                onClick={handleEdit}
                className="mt-3 text-sm text-green-600 hover:underline"
              >
                Add your vehicle
              </button>
            </div>
          )
        ) : (
          <div className="space-y-4 animate-scale-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Make</label>
                <input
                  type="text"
                  value={draft.make}
                  onChange={(e) => setDraft({ ...draft, make: e.target.value })}
                  placeholder="e.g. Tesla, BYD, Hyundai"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Model</label>
                <input
                  type="text"
                  value={draft.model}
                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                  placeholder="e.g. Model 3, Atto 3"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Year</label>
                <input
                  type="text"
                  value={draft.year}
                  onChange={(e) => setDraft({ ...draft, year: e.target.value })}
                  placeholder="2024"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Battery (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={draft.battery}
                  onChange={(e) => setDraft({ ...draft, battery: e.target.value })}
                  placeholder="82"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Range (km)</label>
                <input
                  type="number"
                  value={draft.range}
                  onChange={(e) => setDraft({ ...draft, range: e.target.value })}
                  placeholder="500"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Colour</label>
              <input
                type="text"
                value={draft.color}
                onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                placeholder="e.g. Midnight Silver"
                className={inputClass}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                Save vehicle
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* save toast */}
      {saved && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg animate-scale-in">
          ✓ Vehicle saved
        </div>
      )}

    </main>
  );
}
