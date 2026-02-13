"use client";

import { useEffect } from "react";

const isLocalhost = () => {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
};

export default function ServiceWorkerReset() {
  useEffect(() => {
    if (!isLocalhost()) return;
    if (!("serviceWorker" in navigator)) return;

    const clear = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } catch {
        // Ignore cleanup failures in local dev.
      }
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {
        // Ignore cache cleanup failures in local dev.
      }
    };

    clear();
  }, []);

  return null;
}
