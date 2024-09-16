import { AbstractPopup } from "./AbstractPopup";
import { parseCustomCSS } from "../../utils/cssParser";
import { sanitizeCSS } from "../../utils/cssSanitizer";
import { getStoreFontFamily, loadRubikFont, t } from "../../utils";

export class ModalPopup extends AbstractPopup {
  async create(campaignData, settings) {
    console.log(
      "Creating modal popup with data:",
      JSON.stringify(campaignData, null, 2)
    );

    const customStyles = parseCustomCSS(settings.customCSS);

    const modalElement = document.createElement("div");
    modalElement.classList.add("ziadah-popup", "ziadah-modal");

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

  async showProducts(
    actionProducts,
    triggerProducts,
    options,
    campaignTypeId,
    card,
    alternativeProducts,
    isAlternativeEnabled,
    lastEventProductId,
    campaignSettings
  ) {
    console.log("Showing products in modal popup");

    // Construct campaignData in the format expected by generateModalContent
    const campaignData = {
      title: {
        [this.adapter.getLanguage()]: card?.title || "No Title",
      },
      description: {
        [this.adapter.getLanguage()]: card?.description || "No Description",
      },
      action_products: actionProducts,
      coupon: options?.coupon,
    };

    // Update the content and show the modal
    this.updateContent(campaignData);
    this.show();
  }

  updateContent(data) {
    // Generate the modal content based on the data provided
    const content = this.generateModalContent(data);
    this.update(content);
  }

  show() {
    console.log("Showing modal popup");
    if (this.popupElement) {
      this.popupElement.style.display = "block";
    }
  }

  hide() {
    if (this.popupElement) {
      this.popupElement.style.display = "none";
    }
  }

  update(content) {
    if (this.popupElement) {
      const contentElement = this.popupElement.querySelector(".modal-content");
      if (contentElement) {
        contentElement.innerHTML = content;
      }
    }
  }

  updateContent(campaignData) {
    this.update(this.generateModalContent(campaignData));
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
      .ziadah-modal {
        font-family: ${fontFamily};
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.4);
      }
      .modal-content {
        background-color: #fefefe;
        margin: 15% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 80%;
        max-width: 600px;
      }
      .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
      }
      .close:hover,
      .close:focus {
        color: black;
        text-decoration: none;
        cursor: pointer;
      }
    `;
  }

  generateModalContent(campaignData) {
    const language = this.adapter.getLanguage();

    const title =
      campaignData.title?.[language] || campaignData.title?.en || "No Title";
    const description =
      campaignData.description?.[language] ||
      campaignData.description?.en ||
      "No Description";

    const actionProducts = campaignData.action_products || [];
    const coupon = campaignData.coupon || null;

    return `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>${title}</h2>
        <p>${description}</p>
        ${this.generateProductList(actionProducts)}
        ${this.generateCouponSection(coupon)}
      </div>
    `;
  }

  generateProductList(products) {
    if (!Array.isArray(products) || products.length === 0) {
      return `<p>${this.t("no_products_available")}</p>`;
    }

    return products
      .map((product) => {
        const name =
          product.name?.[this.adapter.getLanguage()] ||
          product.name?.en ||
          "Unnamed Product";
        let quantityInfo;
        if (product.is_infinite) {
          quantityInfo = this.t("unlimited_stock");
        } else if (product.quantity > 0) {
          quantityInfo = `${this.t("in_stock")}: ${product.quantity} ${this.t(
            "items_left"
          )}`;
        } else {
          quantityInfo = this.t("out_of_stock");
        }
        return `
          <div class="product">
            <h3>${name}</h3>
            <p>${product.price || "N/A"} ${product.currency || ""}</p>
            <p>${quantityInfo}</p>
            <button class="add-to-cart" data-product-id="${
              product.uuid || ""
            }" ${product.quantity === 0 ? "disabled" : ""}>${this.t(
          "add_to_cart"
        )}</button>
          </div>
        `;
      })
      .join("");
  }

  generateCouponSection(coupon) {
    if (!coupon || !coupon.code) {
      return "";
    }
    return `
      <div class="coupon">
        <p>${coupon.code}</p>
        <button class="copy-coupon" data-coupon-code="${coupon.code}">${this.t(
      "copy_coupon"
    )}</button>
      </div>
    `;
  }

  t(key) {
    return key;
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
