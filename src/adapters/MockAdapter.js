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
    this.language = "ar";
    this.settingsInitialized = false;
    this.cachedSettings = null;
    this.delay = 100;

    //console.log("Mockup data loaded:", JSON.stringify(this.campaigns, null, 2));
    //console.log("Mock cart:", JSON.stringify(mockCart, null, 2));
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

  setLanguage(lang) {
    this.language = lang;
    console.log(`MockAdapter: Language set to ${lang}`);
  }

  setStoreId(id) {
    this.storeId = id;
    console.log(`MockAdapter: Store ID set to ${id}`);
  }

  getStoreId() {
    return this.storeId;
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

  async fetchCampaigns(eventId, storeId, language) {
    console.log(
      `MockAdapter.fetchCampaigns called with event ID: ${eventId}, store ID: ${storeId}, language: ${language}`
    );
    console.log("Available campaigns:", this.campaigns.data.length);

    await this.simulateDelay();

    const filteredCampaigns = this.campaigns.data.filter(
      (campaign) => campaign.event.id === parseInt(eventId)
    );

    console.log("Filtered campaigns:", filteredCampaigns);

    // Simulate language-specific content
    const localizedCampaigns = filteredCampaigns.map((campaign) => {
      console.log(`Campaign title for ${language}:`, campaign.title[language]);
      return {
        ...campaign,
        title: campaign.title[language] || campaign.title.en,
        description: campaign.description
          ? campaign.description[language] || campaign.description.en
          : undefined,
      };
    });

    return {
      ...this.campaigns,
      data: localizedCampaigns,
    };
  }

  async getCampaignData(
    campaignId,
    eventId,
    actionProducts,
    storeId,
    language
  ) {
    console.log(
      `MockAdapter.getCampaignData called with campaign ID: ${campaignId}, event ID: ${eventId}, store ID: ${storeId}, language: ${language}`
    );

    await this.simulateDelay();

    const campaign = this.campaigns.data.find(
      (c) => c.id === parseInt(campaignId)
    );
    console.log("Found campaign:", campaign);

    if (campaign) {
      const result = {
        ...campaign,
        title: campaign.title[language] || campaign.title.en,
        description: campaign.description
          ? campaign.description[language] || campaign.description.en
          : undefined,
        action_products: campaign.action_products
          .filter((product) => actionProducts.includes(product.uuid))
          .map((product) => {
            console.log(
              `Product name for ${language}:`,
              product.name[language]
            );
            return {
              ...product,
              name: product.name[language] || product.name.en,
            };
          }),
      };
      console.log("Returning localized campaign data:", result);
      return result;
    }

    console.log("No matching campaign found");
    return null;
  }

  async sendClickData(
    storeUUID,
    campaignID,
    clickType,
    productId,
    quantity,
    language
  ) {
    console.log("Mock: Click data sent", {
      storeUUID,
      campaignID,
      clickType,
      productId,
      quantity,
      language,
    });
    return { success: true };
  }

  async sendConversionData(storeUUID, products, language) {
    console.log("Mock: Conversion data sent", {
      storeUUID,
      products,
      language,
    });
    return { success: true };
  }

  async fetchSettings() {
    console.log("MockAdapter.fetchSettings called");
    if (this.settingsInitialized) {
      console.log("Returning cached settings");
      return this.cachedSettings;
    }

    await this.simulateDelay();

    this.settingsInitialized = true;
    this.cachedSettings = {
      ...mockSettings,
      language: {
        ...mockSettings.language,
        current: this.language,
      },
    };
    return this.cachedSettings;
  }

  getStoreId() {
    return this.storeId;
  }

  async fetchProductVariants(uuid, selectedAttributes, language) {
    await this.simulateDelay();
    const variants = mockProductVariants[uuid] || [];
    return variants.map((variant) => ({
      ...variant,
      name: variant.name[language] || variant.name.en,
    }));
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
        await this.sendConversionData(
          this.storeId,
          modalAddedProducts,
          this.language
        );
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
