"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect user's location using ipapi.co (free, no API key required)
 * Returns country code, country name, city, and loading/error states
 */
export function useLocationDetection() {
  const [location, setLocation] = useState({
    country: "",
    countryName: "",
    city: "",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Using ipapi.co - Free tier: 30,000 requests/month, no API key needed
        const response = await fetch("https://ipapi.co/json/");

        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }

        const data = await response.json();

        setLocation({
          country: data.country_code?.toLowerCase() || "",
          countryName: data.country_name || "",
          city: data.city || "",
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Location detection error:", error);
        setLocation({
          country: "",
          countryName: "",
          city: "",
          isLoading: false,
          error: error.message,
        });
      }
    };

    detectLocation();
  }, []);

  return location;
}

/**
 * Alternative: Using ip-api.com (backup option)
 * Free tier: 45 requests/minute
 */
export function useLocationDetectionAlt() {
  const [location, setLocation] = useState({
    country: "",
    countryName: "",
    city: "",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch("http://ip-api.com/json/");

        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }

        const data = await response.json();

        if (data.status === "fail") {
          throw new Error(data.message || "Location detection failed");
        }

        setLocation({
          country: data.countryCode?.toLowerCase() || "",
          countryName: data.country || "",
          city: data.city || "",
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Location detection error:", error);
        setLocation({
          country: "",
          countryName: "",
          city: "",
          isLoading: false,
          error: error.message,
        });
      }
    };

    detectLocation();
  }, []);

  return location;
}
