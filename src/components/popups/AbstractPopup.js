export class AbstractPopup {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
    this.popupElement = null;
    this.state = getState();

    if (new.target === AbstractPopup) {
      throw new TypeError("Cannot construct AbstractPopup instances directly");
    }
  }

  async create(content, settings) {
    throw new Error("Method 'create' must be implemented.");
  }

  show() {
    throw new Error("Method 'show' must be implemented.");
  }

  hide() {
    throw new Error("Method 'hide' must be implemented.");
  }

  update(content) {
    throw new Error("Method 'update' must be implemented.");
  }

  updateContent(campaignData) {
    throw new Error("Method 'updateContent' must be implemented.");
  }

  // updateContent(content) {
  //   if (this.contentElement) {
  //     this.contentElement.innerHTML = content;
  //   }
  // }

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
