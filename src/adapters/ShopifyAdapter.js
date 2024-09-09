import { AbstractEcommerceAdapter } from "./AbstractEcommerceAdapter";
import { baseURL } from "../config";

export class ShopifyAdapter extends AbstractEcommerceAdapter {
  constructor() {
    super();
    this.storeId = window.Shopify?.shop || "";
    this.language = document.documentElement.lang || "en";
    this.settingsInitialized = false;
    this.cachedSettings = null;
  }

  getLanguage() {
    return this.language;
  }

  async fetchCart() {
    const response = await fetch("/cart.js");
    return response.json();
  }

  async addToCart(productData) {
    const response = await fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: productData.productId,
            quantity: productData.quantity,
          },
        ],
      }),
    });
    return response.json();
  }

  async removeFromCart(productId) {
    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: productId,
        quantity: 0,
      }),
    });
    return response.json();
  }

  async fetchProduct(productHandle) {
    const response = await fetch(`/products/${productHandle}.js`);
    return response.json();
  }

  async fetchCampaigns(eventId) {
    const response = await fetch(
      `${baseURL}/shopify/store-events?store-id=${this.storeId}&event-id=${eventId}`
    );
    return response.json();
  }

  async getCampaignData(campaignId, eventId, actionProducts) {
    const response = await fetch(`${baseURL}/shopify/store-events/campaign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaignId,
        event_id: eventId,
        store_id: this.storeId,
        action_product_ids: actionProducts,
      }),
    });
    return response.json();
  }

  async sendClickData(storeUUID, campaignID, clickType, productId, quantity) {
    const response = await fetch(
      `${baseURL}/shopify/store-front/campaign/clicks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_uuid: storeUUID,
          campaign_id: campaignID,
          click_type: clickType,
          product_uuid: productId,
          quantity,
        }),
      }
    );
    return response.json();
  }

  async sendConversionData(storeUUID, products) {
    const response = await fetch(
      `${baseURL}/shopify/store-front/campaign/conversions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_uuid: storeUUID,
          products: products,
        }),
      }
    );
    return response.json();
  }

  async fetchSettings() {
    if (this.settingsInitialized) {
      return this.cachedSettings;
    }

    const response = await fetch(
      `${baseURL}/shopify/store-front/plugin-settings`
    );
    if (response.ok) {
      this.cachedSettings = await response.json();
      this.settingsInitialized = true;
      return this.cachedSettings;
    }

    // Default settings if fetch fails
    this.cachedSettings = {
      enabled: true,
      display_type: "popup",
      trigger_type: "exit_intent",
      delay: 5000,
      frequency: "once_per_session",
      // ...
    };
    this.settingsInitialized = true;
    return this.cachedSettings;
  }

  getStoreId() {
    return this.storeId;
  }

  async fetchProductVariants(productHandle) {
    const response = await fetch(`/products/${productHandle}.js`);
    const product = await response.json();
    return product.variants;
  }

  handleOrderPage() {
    if (
      window.Shopify &&
      window.Shopify.Checkout &&
      window.Shopify.Checkout.step === "thank_you"
    ) {
      console.log("Order completed");
    }
  }
}
