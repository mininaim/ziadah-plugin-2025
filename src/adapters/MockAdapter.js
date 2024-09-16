import { AbstractEcommerceAdapter } from "./AbstractEcommerceAdapter";
import mockupData from "../mock/mockup.json";
import {
  mockCart,
  mockProductVariants,
  mockOrders,
  mockSettings,
} from "../mock/mockData";

export class MockAdapter extends AbstractEcommerceAdapter {
  constructor() {
    console.log("MockAdapter constructed.");
    super();
    this.campaigns = mockupData;

    this.cart = { ...mockCart };
    this.storeId = "c6e9b54f-60d1-4d10-9349-3edac4ac130d";
    this.language = "en";
    this.settingsInitialized = false;
    this.cachedSettings = null;
    this.delay = 100;

    console.log("Mockup data loaded:", JSON.stringify(this.campaigns, null, 2));
    console.log("Mock cart:", JSON.stringify(mockCart, null, 2));
  }

  async simulateDelay() {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }

  async fetchCart() {
    console.log("MockAdapter.fetchCart called");
    return this.cart;
  }

  getLanguage() {
    return this.language;
  }

  async addToCart(productData) {
    const { productId, quantity } = productData;
    const product = this.campaigns.data
      .flatMap((campaign) => [
        ...campaign.action_products,
        ...campaign.trigger_products,
      ])
      .find((p) => p.uuid === productId);

    if (product) {
      this.cart.products.push({
        id: Date.now().toString(),
        product_id: productId,
        quantity,
        price: product.price,
      });
      this.cart.products_count += quantity;
      this.cart.total += product.price * quantity;
    }
    return { cart: this.cart, product };
  }

  async removeFromCart(productId) {
    const index = this.cart.products.findIndex(
      (p) => p.product_id === productId
    );
    if (index !== -1) {
      const removedProduct = this.cart.products[index];
      this.cart.products.splice(index, 1);
      this.cart.products_count -= removedProduct.quantity;
      this.cart.total -= removedProduct.price * removedProduct.quantity;
    }
    return { cart: this.cart };
  }

  async fetchCampaigns(eventId, storeId) {
    console.log(
      `MockAdapter.fetchCampaigns called with event ID: ${eventId}, store ID: ${storeId}`
    );
    console.log("Available campaigns:", this.campaigns.data.length);

    await this.simulateDelay();

    const filteredCampaigns = this.campaigns.data.filter(
      (campaign) => campaign.event.id === parseInt(eventId)
    );

    console.log("Filtered campaigns:", filteredCampaigns);

    return {
      ...this.campaigns,
      data: filteredCampaigns,
    };
  }
  async getCampaignData(campaignId, eventId, actionProducts, storeId) {
    console.log(
      `MockAdapter.getCampaignData called with campaign ID: ${campaignId}, event ID: ${eventId}, store ID: ${storeId}`
    );

    await this.simulateDelay();

    const campaign = this.campaigns.data.find(
      (c) => c.id === parseInt(campaignId)
    );
    console.log("Found campaign:", campaign);

    if (campaign) {
      const result = {
        ...campaign,
        action_products: campaign.action_products.filter((product) =>
          actionProducts.includes(product.uuid)
        ),
      };
      console.log("Returning campaign data:", result);
      return result;
    }

    console.log("No matching campaign found");
    return null;
  }

  async sendClickData(storeUUID, campaignID, clickType, productId, quantity) {
    console.log("Mock: Click data sent", {
      storeUUID,
      campaignID,
      clickType,
      productId,
      quantity,
    });
    return { success: true };
  }

  async sendConversionData(storeUUID, products) {
    console.log("Mock: Conversion data sent", { storeUUID, products });
    return { success: true };
  }

  async fetchSettings() {
    if (this.settingsInitialized) {
      console.log("Returning cached settings");
      return this.cachedSettings;
    }

    console.log("MockAdapter.fetchSettings called");
    this.settingsInitialized = true;
    this.cachedSettings = mockSettings;
    return this.cachedSettings;
  }

  getStoreId() {
    return this.storeId;
  }

  async fetchProductVariants(uuid, selectedAttributes, lang) {
    await this.simulateDelay();
    return mockProductVariants[uuid] || [];
  }

  async handleOrderPage() {
    const orderId = mockOrders[0].id;
    const processedOrders = JSON.parse(
      localStorage.getItem("processedOrders") || "[]"
    );

    if (!processedOrders.includes(orderId)) {
      const modalAddedProducts = mockOrders[0].products.filter(
        (p) => p.source === "modal"
      );

      if (modalAddedProducts.length > 0) {
        await this.sendConversionData(this.storeId, modalAddedProducts);
        processedOrders.push(orderId);
        localStorage.setItem(
          "processedOrders",
          JSON.stringify(processedOrders)
        );
        localStorage.removeItem("savedCampaigns");
      }
    }
  }
}
