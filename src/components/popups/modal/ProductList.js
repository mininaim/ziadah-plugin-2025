import { modalConfig } from "../config/modalConfig";
import { Product } from "../../Product";

export class ProductList {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
    this.config = modalConfig;
  }

  render(products, campaignData) {
    console.log(
      "ProductList render method called with:",
      JSON.stringify(products, null, 2),
      "Campaign data:",
      JSON.stringify(campaignData, null, 2)
    );

    if (!Array.isArray(products)) {
      console.error("Products is not an array:", products);
      return "";
    }

    return products
      .map((product) => this.renderProduct(product, campaignData))
      .join("");
  }

  renderProduct(productData, campaignData) {
    console.log(
      "Rendering product:",
      productData.uuid,
      "with campaign data:",
      campaignData
    );
    if (!productData) {
      console.error("Product data is undefined");
      return "";
    }
    const product = new Product(this.shadowRoot, this.adapter);
    return product.create(productData, campaignData);
  }

  renderProduct(productData) {
    const product = new Product(this.shadowRoot, this.adapter);
    return product.create(productData);
  }

  setupEventListeners() {
    const productsContainer = this.shadowRoot.querySelector(
      `.${this.config.classNames.productsContainer}`
    );
    if (productsContainer) {
      productsContainer.addEventListener("click", (e) =>
        this.handleProductClick(e)
      );
    }
  }

  handleProductClick(event) {
    const addToCartButton = event.target.closest(
      `.${this.config.classNames.addToCart}`
    );
    if (addToCartButton) {
      const productId = addToCartButton.dataset.productId;
      this.addToCart(productId);
    }
  }

  async addToCart(productId) {
    try {
      await this.adapter.addToCart({ productId, quantity: 1 });
      console.log("Product added to cart");
      this.adapter.sendClickData(
        this.adapter.getStoreId(),
        null,
        1,
        productId,
        1
      );
      // You might want to show a success message or update the UI here
    } catch (err) {
      console.error("Failed to add product to cart: ", err);
      // You might want to show an error message here
    }
  }

  update(products) {
    const productsContainer = this.shadowRoot.querySelector(
      `.${this.config.classNames.productsContainer}`
    );
    if (productsContainer) {
      productsContainer.innerHTML = this.render(products);
      this.setupEventListeners();
    }
  }

  getProductById(productId) {
    return this.products.find((product) => product.uuid === productId);
  }
}
