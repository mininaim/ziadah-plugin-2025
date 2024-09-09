import { t } from "../utils";

export class Product {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
  }

  create(productData) {
    const productElement = document.createElement("div");
    productElement.classList.add("ziadah-product");

    const styles = document.createElement("style");
    styles.textContent = this.getStyles();

    productElement.innerHTML = this.generateProductContent(productData);

    productElement.prepend(styles);
    this.productElement = productElement;

    this.setupEventListeners();

    return productElement;
  }

  getStyles() {
    return `
      .ziadah-product {
        border: 1px solid #ddd;
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 5px;
      }
      .product-image {
        max-width: 100%;
        height: auto;
        margin-bottom: 10px;
      }
      .product-name {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .product-price {
        font-size: 16px;
        margin-bottom: 10px;
      }
      .product-description {
        margin-bottom: 10px;
      }
      .add-to-cart {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 5px;
      }
      .product-attributes {
        margin-bottom: 10px;
      }
      .attribute-select {
        margin-bottom: 5px;
      }
    `;
  }

  generateProductContent(productData) {
    const lang = this.adapter.getLanguage();
    return `
      <img class="product-image" src="${
        productData.images[0]?.images.small || ""
      }" alt="${productData.name[lang]}">
      <div class="product-name">${productData.name[lang]}</div>
      <div class="product-price">${productData.price} ${
      productData.currency
    }</div>
      <div class="product-description">${productData.description[lang]}</div>
      ${this.generateAttributesHTML(productData.attributes)}
      <button class="add-to-cart" data-product-id="${productData.uuid}">${t(
      "add_to_cart"
    )}</button>
    `;
  }

  generateAttributesHTML(attributes) {
    if (!attributes || attributes.length === 0) return "";

    const lang = this.adapter.getLanguage();
    return `
      <div class="product-attributes">
        ${attributes
          .map(
            (attr) => `
          <select class="attribute-select" data-attribute-id="${attr.id}">
            <option value="">${attr.name[lang]}</option>
            ${attr.presets
              .map(
                (preset) => `
              <option value="${preset.value[lang]}">${preset.value[lang]}</option>
            `
              )
              .join("")}
          </select>
        `
          )
          .join("")}
      </div>
    `;
  }

  setupEventListeners() {
    this.productElement.addEventListener("click", (e) => {
      if (e.target.classList.contains("add-to-cart")) {
        const productId = e.target.dataset.productId;
        this.handleAddToCart(productId);
      }
    });
  }

  async handleAddToCart(productId) {
    const selectedAttributes = this.getSelectedAttributes();
    const variants = await this.adapter.fetchProductVariants(
      productId,
      selectedAttributes,
      this.adapter.getLanguage()
    );

    const variantToAdd = variants.length > 0 ? variants[0] : { id: productId };

    this.adapter
      .addToCart({ productId: variantToAdd.id, quantity: 1 })
      .then(() => {
        console.log("Product added to cart");
        this.adapter.sendClickData(
          this.adapter.getStoreId(),
          null,
          1,
          productId,
          1
        );
      })
      .catch((err) => console.error("Failed to add product to cart: ", err));
  }

  getSelectedAttributes() {
    const selectedAttributes = [];
    this.productElement
      .querySelectorAll(".attribute-select")
      .forEach((select) => {
        if (select.value) {
          selectedAttributes.push(select.value);
        }
      });
    return selectedAttributes;
  }

  update(productData) {
    if (this.productElement) {
      this.productElement.innerHTML = this.generateProductContent(productData);
    }
  }
}
