// src/adapters/adapterFactory.js

import { ZidAdapter } from "./ZidAdapter";
import { ShopifyAdapter } from "./ShopifyAdapter";
import { SallaAdapter } from "./SallaAdapter";
import { MockAdapter } from "./MockAdapter";

let adapterInstance = null;

export function getPlatform() {
  if (process.env.USE_MOCK_DATA === "true") {
    console.log("Using mock platform due to USE_MOCK_DATA flag");
    return "mock";
  }
  if (typeof window !== "undefined" && window.Shopify) return "shopify";
  if (typeof window !== "undefined" && window.Salla) return "salla";

  // Default to "zid"
  return "zid";
}

export function createAdapter(platform) {
  if (adapterInstance) {
    console.log("Returning existing adapter instance");
    return adapterInstance;
  }

  console.log("Creating adapter for platform:", platform);

  let AdapterClass;

  switch (platform.toLowerCase()) {
    case "zid":
      AdapterClass = ZidAdapter;
      break;
    case "shopify":
      AdapterClass = ShopifyAdapter;
      break;
    case "salla":
      AdapterClass = SallaAdapter;
      break;
    case "mock":
      AdapterClass = MockAdapter;
      break;
    default:
      console.error(`Unsupported platform: ${platform}`);
      if (process.env.NODE_ENV === "production") {
        throw new Error(`Unsupported platform in production: ${platform}`);
      }
      console.log("Falling back to ZidAdapter for unsupported platform");
      AdapterClass = ZidAdapter;
  }

  adapterInstance = new AdapterClass();
  return adapterInstance;
}
