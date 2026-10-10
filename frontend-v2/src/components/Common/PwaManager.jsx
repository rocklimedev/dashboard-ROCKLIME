import { useEffect } from "react";
import { Button, message, notification } from "antd";
import { useRegisterSW } from "virtual:pwa-register/react";

// How often to look for a new service worker while the app stays open.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Handles the service worker lifecycle for the PWA:
 * - registers the worker and periodically checks for updates
 * - tells the user when the app is cached for offline use
 * - asks before reloading into a new version (so unsaved forms are not lost)
 * - reports connectivity changes
 *
 * Renders nothing.
 */
export default function PwaManager() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS);
    },
    onRegisterError(error) {
      console.error("Service worker registration failed:", error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      message.success("CM Trading is ready to open offline.");
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;
    notification.open({
      key: "pwa-update",
      message: "Update available",
      description:
        "A newer version of CM Trading is ready. Reload when you have saved your work.",
      duration: 0,
      btn: (
        <Button
          type="primary"
          size="small"
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </Button>
      ),
      onClose: () => setNeedRefresh(false),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  useEffect(() => {
    const handleOffline = () =>
      message.warning({
        key: "connectivity",
        content:
          "You're offline. Live data and saving are unavailable until you reconnect.",
        duration: 5,
      });
    const handleOnline = () =>
      message.success({
        key: "connectivity",
        content: "Back online.",
        duration: 3,
      });

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
