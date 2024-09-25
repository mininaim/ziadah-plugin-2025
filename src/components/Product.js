import { t } from "../utils";
import { modalConfig } from "./popups/config/modalConfig";

export class Product {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
    this.config = modalConfig;
    this.productElement = null;
  }
  create(productData) {
    const lang = this.adapter.getLanguage();
    const name = productData.name?.[lang] || productData.name?.en || "";
    const buttonText = this.getButtonText(productData.type, false);
    const campaignTypeText = this.getCampaignTypeText(productData.type);

    const hasOptions =
      productData.attributes && productData.attributes.length > 0;
    const attributesHTML = hasOptions
      ? this.generateAttributesHTML(productData.attributes)
      : "";

    return `
      <div class="product" data-product-id="${productData.uuid || ""}">
        <img class="product-image" src="${
          productData.images[0]?.images.small || ""
        }" alt="${name}">
        <div class="product-name">${name}</div>
        <div class="product-price">${productData.price || ""} ${
      productData.currency || ""
    }</div>
        ${
          hasOptions
            ? `
          <div class="attributes-container">
            <div class="attributes-header">
              <span class="attributes-title">${
                this.adapter.t("options") || "الخيارات"
              }</span>
              <span class="chevron-icon">&#9660;</span>
            </div>
            <div class="attributes-content" style="display: none;">
              ${attributesHTML}
            </div>
          </div>
        `
            : ""
        }
        <div class="product-action-container">
          <button class="add-to-cart" data-product-id="${
            productData.uuid || ""
          }">${buttonText}</button>
          <span class="campaign-type" style="display: none;"> type is ${campaignTypeText}</span>
        </div>
      </div>
    `;
  }

  lazyLoadAttributes(attributes) {
    if (!attributes || attributes.length === 0) {
      this.productElement.querySelector(".attributes-content").textContent =
        "No options available";
      return;
    }

    const fragment = document.createDocumentFragment();
    const lang = this.adapter.getLanguage();

    attributes.forEach((attr) => {
      const attributeElement = document.createElement("div");
      attributeElement.className = "product-attribute";
      attributeElement.innerHTML = `
        <div class="attribute-header" data-attribute-id="${attr.id}">
          <span class="attribute-name">${
            attr.name[lang] || attr.name.en || ""
          }</span>
          <span class="chevron-icon">&#9660;</span>
        </div>
        <div class="attribute-options" style="display: none;"></div>
      `;

      fragment.appendChild(attributeElement);
    });

    this.productElement
      .querySelector(".attributes-content")
      .appendChild(fragment);
  }

  lazyLoadOptions(attributeElement, presets) {
    const optionsContainer =
      attributeElement.querySelector(".attribute-options");
    if (optionsContainer.children.length > 0) return; // Options already loaded

    const fragment = document.createDocumentFragment();
    const lang = this.adapter.getLanguage();

    presets.forEach((preset) => {
      const label = document.createElement("label");
      label.className = "attribute-option";
      label.innerHTML = `
        <input type="radio" name="attribute-${
          attributeElement.dataset.attributeId
        }" value="${preset.id}">
        ${preset.value[lang] || preset.value.en || ""}
      `;
      fragment.appendChild(label);
    });

    optionsContainer.appendChild(fragment);
  }

  setupEventListeners() {
    console.log("Setting up event listeners");

    this.productElement.addEventListener("click", (e) => {
      if (e.target.classList.contains("add-to-cart")) {
        const productId = e.target.dataset.productId;
        this.handleAddToCart(productId);
      } else if (e.target.closest(".attributes-header")) {
        this.toggleAttributesContent();
      } else if (e.target.closest(".attribute-header")) {
        this.toggleAttributeOptions(e.target.closest(".product-attribute"));
      }
    });
  }
  toggleAttributesContent() {
    const content = this.productElement.querySelector(".attributes-content");
    const chevron = this.productElement.querySelector(
      ".attributes-header .chevron-icon"
    );
    if (content && chevron) {
      this.toggleElement(content, chevron);
    } else {
      console.error("Attributes content or chevron not found");
    }
  }

  toggleAttributeOptions(attributeElement) {
    const options = attributeElement.querySelector(".attribute-options");
    const chevron = attributeElement.querySelector(
      ".attribute-header .chevron-icon"
    );
    this.toggleElement(options, chevron);
  }

  toggleElement(element, chevron) {
    if (element.style.display === "none") {
      element.style.display = "block";
      chevron.innerHTML = "&#9650;";
    } else {
      element.style.display = "none";
      chevron.innerHTML = "&#9660;";
    }
  }

  getButtonText(type, isLastProduct) {
    if (type === 1) {
      return this.adapter.t("replace");
    } else if (type === 2 && isLastProduct) {
      return this.adapter.t("add");
    } else {
      return this.adapter.t("add_to_cart");
    }
  }

  getCampaignTypeText(type) {
    switch (type) {
      case 1:
        return this.adapter.t("replace_campaign");
      case 2:
        return this.adapter.t("upsell_campaign");
      case 3:
        return this.adapter.t("cross_sell_campaign");
      default:
        console.log(`Unknown campaign type: ${type}`);
        return this.adapter.t("unknown_campaign");
    }
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

      .product-action-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 10px;
    }

    .campaign-type {
      font-size: 14px;
      color: #666;
      margin-left: 10px;
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

      ${this.generateAttributesHTML(productData.attributes)}
      <button class="add-to-cart" data-product-id="${
        productData.uuid
      }">${this.adapter.t("add_to_cart")}</button>
    `;
  }
  generateAttributesHTML(attributes) {
    const lang = this.adapter.getLanguage();
    return attributes
      .map(
        (attr) => `
      <div class="product-attribute">
        <div class="attribute-header" data-attribute-id="${attr.id}">
          <span class="attribute-name">${
            attr.name[lang] || attr.name.en || ""
          }</span>
          <span class="chevron-icon">&#9660;</span>
        </div>
        <div class="attribute-options" style="display: none;">
          ${this.generateOptionsHTML(attr.presets, attr.id, lang)}
        </div>
      </div>
    `
      )
      .join("");
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
      .querySelectorAll(".attribute-options")
      .forEach((optionsContainer) => {
        const selectedOption = optionsContainer.querySelector(
          'input[type="radio"]:checked'
        );
        if (selectedOption) {
          selectedAttributes.push(selectedOption.value);
        }
      });
    return selectedAttributes;
  }
  generateOptionsHTML(presets, attributeId, lang) {
    return presets
      .map(
        (preset) => `
      <label class="attribute-option">
        <input type="radio" name="attribute-${attributeId}" value="${
          preset.id
        }">
        ${preset.value[lang] || preset.value.en || ""}
      </label>
    `
      )
      .join("");
  }

  update(productData) {
    if (this.productElement) {
      this.productElement.innerHTML = this.generateProductContent(productData);
    }
  }
}
