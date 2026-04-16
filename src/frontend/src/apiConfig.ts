import { isNativePlatform } from "./utils/platform";

/**
 * Centralized API configuration.
 *
 * Resolution order:
 *  1. VITE_API_URL  env var  (e.g. "http://128.85.36.93:4000")
 *  2. VITE_BACKEND_BASE_URL  (legacy compat)
 *  3. ""  (same-origin — only valid for web builds served by the backend)
 *
 * For mobile (Capacitor) builds the env var MUST be set to an absolute URL
 * because the WebView has no "same origin" server.
 */
const API_BASE_STORAGE_KEY = "ledger_api_base_url";

function normalizeBase(input: string): string {
  return String(input || "").trim().replace(/\/+$/, "");
}

function getStoredRuntimeBase(): string {
  try {
    const stored = localStorage.getItem(API_BASE_STORAGE_KEY) || "";
    return normalizeBase(stored);
  } catch {
    return "";
  }
}

function getEnvBase(): string {
  return normalizeBase(
    import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_BASE_URL || "",
  );
}

export function getApiBase(): string {
  const runtimeBase = getStoredRuntimeBase();
  const envBase = getEnvBase();
  const base = runtimeBase || envBase;

  if (!base && isNativePlatform()) {
    console.warn(
      "[API] No API base configured. Set VITE_API_URL at build time",
      "or set a runtime API URL from the login screen.",
    );
  }

  return base;
}

export function getRuntimeApiBase(): string {
  return getStoredRuntimeBase();
}

export function setRuntimeApiBase(value: string): string {
  const normalized = normalizeBase(value);
  try {
    if (normalized) {
      localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(API_BASE_STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
  return normalized;
}

export function buildApiUrl(path: string): string {
  const base = getApiBase();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
