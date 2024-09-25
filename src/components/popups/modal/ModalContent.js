import { modalConfig } from "../config/modalConfig";
import { ProductList } from "./ProductList";
import { CouponSection } from "./CouponSection";
import { escapeHtml, formatPrice } from "../utils/modalUtils";
import chevronDownIcon from "../../../icons/chevronDownIcon";
import chevronUpIcon from "../../../icons/chevronUpIcon";
import { t, getLanguage } from "../../../utils";

export class ModalContent {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
    this.config = modalConfig;
    this.productList = new ProductList(shadowRoot, adapter);
    this.couponSection = new CouponSection(shadowRoot, adapter);
    this.t = t;
    this.getLanguage = getLanguage;

    if (typeof this.adapter.t !== "function") {
      this.adapter.t = (key) => key; // Simple fallback that just returns the key
    }
  }

  render(campaignData) {
    const lang = this.getLanguage();
    console.log(
      "ModalContent render method called with:",
      JSON.stringify(campaignData, null, 2)
    );
    console.log("Current language:", this.adapter.getLanguage());

    const closeButton = `<span class="${this.config.classNames.closeButton}">&times;</span>`;

    const title = `<h2>${this.adapter.t(
      campaignData.title && campaignData.title[lang]
        ? campaignData.title[lang]
        : ""
    )}</h2>`;
    console.log("Campaign title:", campaignData.title);

    const description = `<p>${
      campaignData.description && campaignData.description[lang]
        ? campaignData.description[lang]
        : campaignData.description?.en || ""
    }</p>`;

    console.log("Campaign description:", campaignData.description);

    let productListHtml = "";
    if (
      campaignData.action_products &&
      Array.isArray(campaignData.action_products)
    ) {
      console.log("Rendering product list");
      productListHtml = `<div class="products-container">${this.productList.render(
        campaignData.action_products
      )}</div>`;
    }

    let couponHtml = "";
    if (campaignData.coupon) {
      console.log("Rendering coupon section");
      couponHtml = this.couponSection.render(campaignData.coupon);
    }

    const result = `
 
        ${closeButton}
        ${title}
        ${description}
        ${productListHtml}
        ${couponHtml}

    `;

    console.log("Rendered HTML:", result);
    return result;
  }

  setupEventListeners() {
    const closeButton = this.shadowRoot.querySelector(
      `.${this.config.classNames.closeButton}`
    );
    if (closeButton) {
      closeButton.addEventListener("click", () => this.handleClose());
    }

    this.productList.setupEventListeners();
    this.couponSection.setupEventListeners();

    this.setupVariantEventListeners();
    this.setupAddToCartEventListener();
  }

  handleClose() {
    const closeEvent = new CustomEvent("modalClose", {
      bubbles: true,
      composed: true,
    });
    this.shadowRoot.dispatchEvent(closeEvent);
  }

  update(campaignData) {
    const contentContainer = this.shadowRoot.querySelector(
      `.${this.config.classNames.modalContent}`
    );
    if (contentContainer) {
      contentContainer.innerHTML = this.render(campaignData);
      this.setupEventListeners();
    }
  }

  setupVariantEventListeners() {
    this.shadowRoot.addEventListener("click", (e) => {
      const collapseHeader = e.target.closest(
        `.${this.config.classNames.collapseHeader}`
      );
      if (collapseHeader) {
        const collapse = collapseHeader.closest(
          `.${this.config.classNames.variantCollapse}`
        );
        const collapseContent = collapse.querySelector(
          `.${this.config.classNames.collapseContent}`
        );
        const chevron = collapse.querySelector(
          `.${this.config.classNames.chevron}`
        );

        if (collapseContent.style.display === "none") {
          collapseContent.style.display = "block";
          chevron.innerHTML = chevronUpIcon();
        } else {
          collapseContent.style.display = "none";
          chevron.innerHTML = chevronDownIcon();
        }
      }
    });

    this.shadowRoot.addEventListener("change", (e) => {
      if (
        e.target.classList.contains(this.config.classNames.productAttribute)
      ) {
        const productId = e.target.dataset.productId;
        const attributeId = e.target.dataset.attributeId;
        const selectedValue = e.target.value;
        this.handleAttributeChange(productId, attributeId, selectedValue);
      }
    });
  }

  setupAddToCartEventListener() {
    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.classList.contains(this.config.classNames.addToCart)) {
        const productId = e.target.dataset.productId;
        this.handleAddToCart(productId);
      }
    });
  }

  async handleAttributeChange(productId, attributeId, selectedValue) {
    console.log(
      `Attribute changed for product ${productId}, attribute ${attributeId} to value ${selectedValue}`
    );

    try {
      const product = this.productList.getProductById(productId);
      if (!product) {
        console.error("Product not found");
        return;
      }

      const attribute = product.attributes.find(
        (a) => a.id.toString() === attributeId
      );
      if (!attribute) {
        console.error("Attribute not found");
        return;
      }

      const language = this.adapter.getLanguage() || "en"; // Fallback to 'en' if undefined
      const selectedPreset = attribute.presets.find(
        (p) => p.value && p.value[language] === selectedValue
      );
      if (!selectedPreset) {
        console.error("Selected preset not found");
        return;
      }

      const variantData = {
        product_id: product.id,
        names: [selectedPreset.value.en || "", selectedPreset.value.ar || ""],
        attribute_values: [
          {
            attribute_id: parseInt(attributeId),
            value: selectedPreset.id.toString(),
          },
        ],
      };

      const response = await this.adapter.updateVariant(variantData);
      console.log("Variant updated successfully:", response);

      this.updateProductVariantInfo(productId, response);
      this.showUserFeedback(this.adapter.t("variant_updated_successfully"));
    } catch (error) {
      console.error("Error updating variant:", error);
      this.showUserFeedback(this.adapter.t("error_updating_variant"), true);
    }
  }

  updateProductVariantInfo(productId, variantData) {
    const productElement = this.shadowRoot.querySelector(
      `.product[data-product-id="${productId}"]`
    );
    if (!productElement) {
      console.error(`Product element not found for product ID: ${productId}`);
      return;
    }

    const priceElement = productElement.querySelector(
      `.${this.config.classNames.productPrice}`
    );
    if (priceElement && variantData.price) {
      priceElement.textContent = formatPrice(
        variantData.price,
        variantData.currency,
        this.adapter.getLanguage()
      );
    }

    const quantityElement = productElement.querySelector(
      `.${this.config.classNames.productQuantity}`
    );
    if (quantityElement && variantData.quantity !== undefined) {
      quantityElement.textContent =
        variantData.quantity > 0
          ? `${this.adapter.t("in_stock")}: ${variantData.quantity}`
          : this.adapter.t("out_of_stock");
    }

    const addToCartButton = productElement.querySelector(
      `.${this.config.classNames.addToCart}`
    );
    if (addToCartButton) {
      addToCartButton.disabled = variantData.quantity === 0;
    }
  }
  handleAddToCart(productId) {
    const product = this.productList.getProductById(productId);
    if (product) {
      this.adapter.addToCart({ productId, quantity: 1 });
      this.showUserFeedback(this.adapter.t("product_added_to_cart"));
    } else {
      console.error("Product not found");
      this.showUserFeedback(this.adapter.t("product_not_found"), true);
    }
  }

  showUserFeedback(message, isError = false) {
    const feedbackElement = document.createElement("div");
    feedbackElement.textContent = message;
    feedbackElement.classList.add(
      isError ? "error-message" : "success-message"
    );
    this.shadowRoot.appendChild(feedbackElement);
    setTimeout(() => feedbackElement.remove(), 3000);
  }
}
