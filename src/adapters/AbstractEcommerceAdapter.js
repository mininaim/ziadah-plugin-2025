export class AbstractEcommerceAdapter {
  async fetchCart() {
    throw new Error("fetchCart method must be implemented");
  }

  async addToCart(productData) {
    throw new Error("addToCart method must be implemented");
  }

  async removeFromCart(productId) {
    throw new Error("removeFromCart method must be implemented");
  }

  async fetchProduct(productId) {
    throw new Error("fetchProduct method must be implemented");
  }

  async fetchCampaigns(eventId) {
    throw new Error("fetchCampaigns method must be implemented");
  }

  async getCampaignData(campaignId, eventId, actionProducts) {
    throw new Error("getCampaignData method must be implemented");
  }

  async sendClickData(storeUUID, campaignID, clickType, productId, quantity) {
    throw new Error("sendClickData method must be implemented");
  }

  async sendConversionData(storeUUID, products) {
    throw new Error("sendConversionData method must be implemented");
  }

  async fetchSettings() {
    throw new Error("fetchSettings method must be implemented");
  }

  logApiCall(endpoint, params) {
    console.log(`API Call: ${endpoint}`, params);
  }

  getLanguage() {
    throw new Error("Method 'getLanguage' must be implemented.");
  }

  getStoreId() {
    throw new Error("getStoreId method must be implemented");
  }

  async fetchProductVariants(uuid, selectedAttributes, lang) {
    throw new Error("fetchProductVariants method must be implemented");
  }

  async handleOrderPage() {
    throw new Error("handleOrderPage method must be implemented");
  }
  // addAllProducts
  async addAllProducts(products, type) {
    throw new Error("addAllProducts method must be implemented");
  }
}
