"use client";

import { useState } from "react";
import {
  RefreshCw,
  Trash2,
  FileText,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import { ChangePasswordModal } from "./ChangePasswordModal";

interface QuickActionsProps {
  onActionComplete?: () => void;
}

interface ActionButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "blue" | "yellow" | "red";
  action: () => Promise<void> | void;
  placeholder?: boolean;
}

export function QuickActions({ onActionComplete }: QuickActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string, ms = 3000) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), ms);
  };

  const handleRestartGateway = async () => {
    // Placeholder - would call openclaw gateway restart
    showNotification("success", "Gateway restart command sent (placeholder)");
  };

  const handleClearActivityLog = async () => {
    setLoadingAction("clear_log");
    try {
      const res = await fetch("/api/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_activity_log" }),
      });

      if (!res.ok) throw new Error("Failed to clear log");

      showNotification("success", "Activity log cleared successfully");
      onActionComplete?.();
    } catch {
      showNotification("error", "Failed to clear activity log");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewLogs = async () => {
    // Placeholder - would open gateway logs
    showNotification("success", "Opening gateway logs... (placeholder)");
  };

  const handleHelloWorldNotify = async () => {
    setLoadingAction("hello_notify");
    try {
      const res = await fetch("/api/notify/hello", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello world from TenacitOS" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        partial?: boolean;
        results?: {
          discord?: { ok: boolean; error?: string; status?: number };
          whatsapp?: { ok: boolean; error?: string; hint?: string; status?: number };
        };
      };
      const d = data.results?.discord;
      const w = data.results?.whatsapp;
      const parts = [
        d?.ok ? "Discord OK" : `Discord: ${d?.error || "failed"}`,
        w?.ok ? "WhatsApp OK" : `WhatsApp: ${w?.error || "failed"}`,
      ];
      if (!w?.ok && w?.hint) parts.push(w.hint);
      if (data.ok) {
        showNotification("success", parts.join(" · "), 8000);
      } else if (data.partial) {
        showNotification("error", parts.join(" · "), 12000);
      } else {
        showNotification("error", parts.join(" · "), 12000);
      }
      onActionComplete?.();
    } catch {
      showNotification("error", "Notify hello request failed", 5000);
    } finally {
      setLoadingAction(null);
    }
  };

  const actions: ActionButton[] = [
    {
      id: "restart",
      label: "Restart Gateway",
      icon: RefreshCw,
      color: "blue",
      action: handleRestartGateway,
      placeholder: true,
    },
    {
      id: "hello_notify",
      label: "Hello world (Discord + WhatsApp)",
      icon: Send,
      color: "emerald",
      action: handleHelloWorldNotify,
    },
    {
      id: "clear_log",
      label: "Clear Activity Log",
      icon: Trash2,
      color: "yellow",
      action: handleClearActivityLog,
    },
    {
      id: "view_logs",
      label: "View Gateway Logs",
      icon: FileText,
      color: "emerald",
      action: handleViewLogs,
      placeholder: true,
    },
    {
      id: "change_password",
      label: "Change Password",
      icon: Key,
      color: "red",
      action: () => setShowPasswordModal(true),
    },
  ];

  const colorClasses = {
    emerald:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
    yellow:
      "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
  };

  return (
    <>
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-emerald-400" />
          Quick Actions
        </h2>

        {/* Notification */}
        {notification && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              notification.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loadingAction === action.id;

            return (
              <button
                key={action.id}
                onClick={() => action.action()}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  colorClasses[action.color]
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="font-medium">{action.label}</span>
                {action.placeholder && (
                  <span className="text-xs opacity-50">(placeholder)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          showNotification("success", "Password changed successfully");
          setShowPasswordModal(false);
        }}
      />
    </>
  );
}
