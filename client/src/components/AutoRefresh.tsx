"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/utils";

export default function AutoRefresh() {
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    let checkCount = 0;
    let interval: NodeJS.Timeout;

    const checkHealth = async () => {
      try {
        // Construct the health endpoint URL based on the API_BASE_URL
        const rootUrl = API_BASE_URL.endsWith('/api') 
           ? API_BASE_URL.substring(0, API_BASE_URL.length - 4) 
           : API_BASE_URL;
           
        const res = await fetch(`${rootUrl}/health`);
        if (res.ok) {
           if (checkCount > 0) {
             // If we were waiting for the connection, reload to fetch data
             window.location.reload(); 
           }
           setIsConnecting(false);
           if (interval) clearInterval(interval);
           return true;
        }
      } catch (e) {
        // Fetch failed, backend is still starting up
        setIsConnecting(true);
      }
      return false;
    };

    checkHealth().then((isUp) => {
      if (!isUp) {
        setIsConnecting(true);
        interval = setInterval(async () => {
          checkCount++;
          await checkHealth();
        }, 3000);
      }
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!isConnecting) return null;

  return (
    <div className="mt-4 flex items-center gap-3 bg-black/20 p-4 rounded-lg w-max shadow-sm border border-white/20">
      <div className="w-5 h-5 border-2 border-t-white border-white/20 rounded-full animate-spin" />
      <span className="text-sm font-medium text-white">Connecting to backend... The page will autorefresh when ready.</span>
    </div>
  );
}
