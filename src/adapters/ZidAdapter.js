import { AbstractEcommerceAdapter } from "./AbstractEcommerceAdapter";
import { baseURL } from "../config";
import { cachedFetch, clearCache } from "../utils";

const API_ENDPOINTS = {
  STORE_EVENTS: `${baseURL}/zid/store-events`,
  CAMPAIGN: `${baseURL}/zid/store-events/campaign`,
  CAMPAIGN_CLICKS: `${baseURL}/zid/store-front/campaign/clicks`,
  CAMPAIGN_CONVERSIONS: `${baseURL}/zid/store-front/campaign/conversions`,
  PRODUCT_VARIANT: `${baseURL}/zid/store-front/variant`,
  PLUGIN_SETTINGS: `${baseURL}/zid/store-front/plugin-settings`,
};

export class ZidAdapter extends AbstractEcommerceAdapter {
  constructor() {
    super();
    this.zid = window.zid;
    // if (!this.zid || !this.zid.store || !this.zid.store.cart) {
    //   console.error("Zid SDK is not initialized properly.");
    //   throw new Error("Zid SDK is not available.");
    // }
    // this.storeId = window.store_uuid || 'test-store-id';
    if (!window.store_uuid) {
      console.error("store_uuid is not defined. Please set window.store_uuid.");
      throw new Error("store_uuid is required.");
    }
    this.storeId = window.store_uuid;

    this.language = document.documentElement.lang || "en";
    console.log("ZidAdapter initialized with language:", this.language);
    this.settingsInitialized = false;
    this.cachedSettings = null;
  }

  getLanguage() {
    const state = getState();
    const language = state.language || this.language;
    console.log("getLanguage called, returning:", language);
    return language;
  }

  setLanguage(lang) {
    this.language = lang;
    console.log(`ZidAdapter: Language set to ${lang}`);
  }

  setStoreId(id) {
    this.storeId = id;
    console.log(`ZidAdapter: Store ID set to ${id}`);
  }

  getStoreId() {
    return this.storeId;
  }

  // clone pluginActive for other methods
  // async fetchCart() {
  //   if (getState().pluginActive) {
  //     console.log("Plugin is active, skipping fetchCart");
  //     return null;
  //   }

  //   setState({ pluginActive: true });

  //   try {
  //     const response = await this.zid.store.cart.fetch();
  //     return response.data.cart;
  //   } catch (error) {
  //     console.error("Error fetching cart:", error);
  //     throw error;
  //   } finally {
  //     setState({ pluginActive: false });
  //   }
  // }

  async fetchCart() {
    try {
      const response = await this.zid.store.cart.fetch();
      return response.data.cart;
    } catch (error) {
      console.error("Error fetching cart:", error);
      throw error;
    }
  }

  async addToCart(productData) {
    try {
      const response = await this.zid.store.cart.addProduct(productData);

      if (!response || !response.data) {
        console.error("Unexpected response from addToCart:", response);
        throw new Error("Invalid response from addToCart");
      }

      return response.data;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  async removeFromCart(productId) {
    try {
      const response = await this.zid.store.cart.removeProduct(productId);

      if (!response || !response.data) {
        console.error("Unexpected response from removeFromCart:", response);
        throw new Error("Invalid response from removeFromCart");
      }

      return response.data;
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  }

  async fetchCampaigns(eventId) {
    const url = `${API_ENDPOINTS.STORE_EVENTS}?store-id=${this.storeId}&event-id=${eventId}`;
    try {
      console.log(
        `Fetching campaigns for store ID: ${this.storeId}, event ID: ${eventId}`
      );
      return await cachedFetch(url);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      throw error;
    }
  }

  async refreshCampaigns(eventId) {
    const url = `${API_ENDPOINTS.STORE_EVENTS}?store-id=${this.storeId}&event-id=${eventId}`;
    clearCache(url);
    return this.fetchCampaigns(eventId);
  }

  async getCampaignData(campaignId, eventId, actionProducts) {
    try {
      const requestBody = {
        campaign_id: campaignId,
        event_id: eventId,
        store_id: this.storeId,
        action_product_ids: actionProducts,
      };

      console.log("Sending request to getCampaignData with body:", requestBody);

      const response = await fetch(API_ENDPOINTS.CAMPAIGN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          `Server error ${response.status}: ${JSON.stringify(result)}`
        );
      }

      // console.log("Campaign data:", result);
      return result;
    } catch (error) {
      console.error("Error getting campaign data:", error);
      throw error;
    }
  }

  async sendClickData(storeUUID, campaignID, clickType, productId, quantity) {
    try {
      const response = await fetch(API_ENDPOINTS.CAMPAIGN_CLICKS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_uuid: storeUUID,
          campaign_id: campaignID,
          click_type: clickType,
          product_uuid: productId,
          quantity,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Server responded with status ${response.status}: ${errorText}`
        );
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending click data:", error);
      throw error;
    }
  }

  async sendConversionData(storeUUID, products) {
    try {
      const response = await fetch(API_ENDPOINTS.CAMPAIGN_CONVERSIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_uuid: storeUUID,
          products: products.map((product) => ({
            uuid: product.uuid,
            campaign_id: product.campaign_id,
            quantity: product.quantity,
            gross_price: product.gross_price,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Server responded with status ${response.status}: ${errorText}`
        );
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending conversion data:", error);
      throw error;
    }
  }

  async fetchSettings() {
    if (this.settingsInitialized) {
      return this.cachedSettings;
    }

    try {
      const response = await cachedFetch(API_ENDPOINTS.PLUGIN_SETTINGS);
      this.cachedSettings = response;
      this.settingsInitialized = true;
      return this.cachedSettings;
    } catch (error) {
      console.warn("Settings endpoint not available, using fallback settings");
      this.cachedSettings = this.getDefaultSettings();
      this.settingsInitialized = true;
      return this.cachedSettings;
    }
  }

  async refreshSettings() {
    clearCache(API_ENDPOINTS.PLUGIN_SETTINGS);
    this.settingsInitialized = false;
    return this.fetchSettings();
  }

  getDefaultSettings() {
    return {
      enabled: true,
      display_type: "popup",
      trigger_type: "exit_intent",
      delay: 5000,
      frequency: "once_per_session",
      modalRadius: "10px",
      modalBackground: "#ffffff",
      mainColor: "#4CAF50",
      subColor: "#2196F3",
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      buttonRadius: "5px",
      animationDuration: "0.3s",
      maxWidth: "600px",
      customCSS: "",
      userCSS: "",
    };
  }

  getStoreId() {
    return this.storeId;
  }

  async fetchProductVariants(uuid, selectedAttributes, lang) {
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCT_VARIANT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: uuid,
          lang: lang,
          names: selectedAttributes,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Server responded with status ${response.status}: ${errorText}`
        );
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching product variants:", error);
      throw error;
    }
  }

  async handleOrderPage() {
    try {
      const cart = await this.fetchCart();

      if (cart.status === "completed") {
        const products = cart.items.map((item) => ({
          product_uuid: item.product_id,
          quantity: item.quantity,
          campaign_id: item.campaign_id,
        }));

        await this.sendConversionData(this.storeId, products);
      }
    } catch (error) {
      console.error("Error handling order page:", error);
      throw error;
    }
  }
}
