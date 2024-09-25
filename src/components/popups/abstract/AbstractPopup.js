import { getState } from "../../../store";

export class AbstractPopup {
  constructor(shadowRoot, adapter) {
    if (new.target === AbstractPopup) {
      throw new TypeError("Cannot construct AbstractPopup instances directly");
    }
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
    this.popupElement = null;
    this.state = getState();
  }

  async create(campaignData, settings) {
    throw new Error("Method 'create' must be implemented.");
  }

  getAdapter() {
    return this.adapter;
  }
  getLanguage() {
    const state = getState();
    return state.language || "en"; // Return 'en' as default if language is not set
  }

  show() {
    throw new Error("Method 'show' must be implemented.");
  }

  hide() {
    throw new Error("Method 'hide' must be implemented.");
  }

  update(campaignData) {
    throw new Error("Method 'update' must be implemented.");
  }

  updateContent(campaignData) {
    throw new Error("Method 'updateContent' must be implemented.");
  }

  destroy() {
    throw new Error("Method 'destroy' must be implemented.");
  }

  isOpen() {
    throw new Error("Method 'isOpen' must be implemented.");
  }

  getElement() {
    throw new Error("Method 'getElement' must be implemented.");
  }

  handleAddToCart(productData) {
    throw new Error("Method 'handleAddToCart' must be implemented.");
  }

  handleReplaceProduct(oldProductId, newProductData) {
    throw new Error("Method 'handleReplaceProduct' must be implemented.");
  }

  handleCouponCopy(couponCode) {
    throw new Error("Method 'handleCouponCopy' must be implemented.");
  }
}
