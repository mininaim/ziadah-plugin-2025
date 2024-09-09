import { AbstractEcommerceAdapter } from "./AbstractEcommerceAdapter";
import { baseURL } from "../config";

export class SallaAdapter extends AbstractEcommerceAdapter {
  constructor() {
    super();
    this.salla = window.Salla || {};
    this.storeId = this.salla.config.get("store.id") || "";
    this.language = this.salla.config.get("language") || "ar";
    this.settingsInitialized = false;
    this.cachedSettings = null;
  }

  getLanguage() {
    return this.language;
  }

  async fetchCart() {
    return await this.salla.cart.getItems();
  }

  async addToCart(productData) {
    return await this.salla.cart.addItem({
      id: productData.productId,
      quantity: productData.quantity,
    });
  }

  async removeFromCart(productId) {
    return await this.salla.cart.deleteItem(productId);
  }

  async fetchProduct(productId) {
    return await this.salla.product.getDetails(productId);
  }

  async fetchCampaigns(eventId) {
    const response = await fetch(
      `${baseURL}/salla/store-events?store-id=${this.storeId}&event-id=${eventId}`
    );
    return response.json();
  }

  async getCampaignData(campaignId, eventId, actionProducts) {
    const response = await fetch(`${baseURL}/salla/store-events/campaign`, {
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
      `${baseURL}/salla/store-front/campaign/clicks`,
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
      `${baseURL}/salla/store-front/campaign/conversions`,
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
      `${baseURL}/salla/store-front/plugin-settings`
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

  async fetchProductVariants(uuid, selectedAttributes, lang) {
    return await this.salla.product.getOptions(uuid);
  }

  async handleOrderPage() {
    this.salla.event.on("order.completed", async (order) => {});
  }
}
