import { MockAdapter } from "./MockAdapter";

import { ZidAdapter } from "./ZidAdapter";
import { ShopifyAdapter } from "./ShopifyAdapter";
import { SallaAdapter } from "./SallaAdapter";

let adapterInstance = null;

export function getPlatform() {
  if (process.env.USE_MOCK_DATA === "true") {
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

  // if (
  //   process.env.NODE_ENV === "production" &&
  //   (process.env.USE_MOCK_DATA === "true" || platform === "mock")
  // ) {
  //   throw new Error("MockAdapter should not be used in production");
  // }

  let AdapterClass;

  if (process.env.USE_MOCK_DATA === "true") {
    console.log("Using MockAdapter due to USE_MOCK_DATA environment variable");
    AdapterClass = MockAdapter;
  } else {
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
      default:
        console.error(`Unsupported platform: ${platform}`);
        if (process.env.NODE_ENV === "production") {
          throw new Error(`Unsupported platform in production: ${platform}`);
        }
        AdapterClass = MockAdapter;
    }
  }

  const adapter = new AdapterClass();

  const requiredMethods = ["getLanguage", "fetchSettings", "getStoreId"];
  requiredMethods.forEach((method) => {
    if (typeof adapter[method] !== "function") {
      adapter[method] = () => {
        console.warn(`${method} method not implemented`);
        return method === "getLanguage" ? "en" : null;
      };
    }
  });

  adapterInstance = adapter;
  return adapter;
}
