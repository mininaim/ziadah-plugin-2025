// outdated

import { AbstractPopup } from "./AbstractPopup";
import { parseCustomCSS } from "../../utils/cssParser";
import { sanitizeCSS } from "../../utils/cssSanitizer";
import { getStoreFontFamily, loadRubikFont, t } from "../../utils";

export class OffcanvasPopup extends AbstractPopup {
  constructor(shadowRoot, adapter, position = "right") {
    super(shadowRoot, adapter);
    this.position = position;
  }

  async create(campaignData, settings) {
    const customStyles = settings?.customCSS
      ? parseCustomCSS(settings.customCSS)
      : {};

    const modalElement = document.createElement("div");
    modalElement.classList.add(
      "ziadah-popup",
      "ziadah-modal",
      "ziadah-offcanvas",
      `ziadah-offcanvas-${this.position}`
    );

    const styles = document.createElement("style");
    styles.textContent = `
    ${this.getDefaultStyles()}
    ${sanitizeCSS(customStyles)}
  `;

    modalElement.innerHTML = this.generateModalContent(campaignData);

    modalElement.prepend(styles);
    this.popupElement = modalElement;
    this.shadowRoot.appendChild(modalElement);

    this.setupEventListeners();
  }

  show() {
    if (this.popupElement) {
      this.popupElement.style.transform = "translateX(0)";
    }
  }

  hide() {
    if (this.popupElement) {
      this.popupElement.style.transform =
        this.position === "left" ? "translateX(-100%)" : "translateX(100%)";
    }
  }

  update(content) {
    if (this.popupElement) {
      const contentElement =
        this.popupElement.querySelector(".offcanvas-content");
      if (contentElement) {
        contentElement.innerHTML = content;
      }
    }
  }

  updateContent(campaignData) {
    this.update(this.generateOffcanvasContent(campaignData));
  }

  handleAddToCart(productData) {
    console.log("Adding to cart:", productData);
    this.adapter.addToCart(productData);
  }

  handleReplaceProduct(oldProductId, newProductData) {
    console.log("Replacing product:", oldProductId, "with", newProductData);
    this.adapter
      .removeFromCart(oldProductId)
      .then(() => this.adapter.addToCart(newProductData));
  }

  handleCouponCopy(couponCode) {
    console.log("Copying coupon:", couponCode);
    navigator.clipboard
      .writeText(couponCode)
      .then(() => console.log("Coupon copied to clipboard"))
      .catch((err) => console.error("Failed to copy coupon: ", err));
  }

  getDefaultStyles() {
    const fontFamily = getStoreFontFamily();
    if (fontFamily.includes("Rubik")) {
      loadRubikFont();
    }
    return `
      .ziadah-offcanvas {
       font-family: ${fontFamily};
        position: fixed;
        top: 0;
        ${this.position}: 0;
        width: 300px;
        height: 100%;
        background-color: #fff;
        transition: transform 0.3s ease-in-out;
        transform: translateX(${this.position === "left" ? "-100%" : "100%"});
        z-index: 1000;
        overflow-y: auto;
      }
      .offcanvas-content {
        padding: 20px;
      }
      .close {
        position: absolute;
        top: 10px;
        ${this.position === "left" ? "right" : "left"}: 10px;
        font-size: 24px;
        cursor: pointer;
      }
    `;
  }

  generateOffcanvasContent(campaignData) {
    return `
      <div class="offcanvas-content">
        <span class="close">&times;</span>
        <h2>${campaignData.title[this.adapter.getLanguage()]}</h2>
        <p>${campaignData.description[this.adapter.getLanguage()]}</p>
        ${this.generateProductList(campaignData.action_products)}
        ${this.generateCouponSection(campaignData.coupon)}
      </div>
    `;
  }

  generateProductList(products) {
    return products
      .map(
        (product) => `
      <div class="product">
        <h3>${product.name[this.adapter.getLanguage()]}</h3>
        <p>${product.price} ${product.currency}</p>
        <button class="add-to-cart" data-product-id="${product.uuid}">${t(
          "add_to_cart"
        )}</button>
      </div>
    `
      )
      .join("");
  }

  generateCouponSection(coupon) {
    if (!coupon) return "";
    return `
      <div class="coupon">
        <p>${coupon.code}</p>
        <button class="copy-coupon" data-coupon-code="${coupon.code}">${t(
      "copy_coupon"
    )}</button>
      </div>
    `;
  }

  setupEventListeners() {
    this.popupElement.addEventListener("click", (e) => {
      if (e.target.classList.contains("close")) {
        this.hide();
      } else if (e.target.classList.contains("add-to-cart")) {
        const productId = e.target.dataset.productId;
        this.handleAddToCart({ productId, quantity: 1 });
      } else if (e.target.classList.contains("copy-coupon")) {
        const couponCode = e.target.dataset.couponCode;
        this.handleCouponCopy(couponCode);
      }
    });
  }
}
