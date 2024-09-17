import { AbstractPopup } from "./AbstractPopup";
import { parseCustomCSS } from "../../utils/cssParser";
import { sanitizeCSS } from "../../utils/cssSanitizer";
import { getStoreFontFamily, loadRubikFont, t } from "../../utils";
import { getState } from "../../store";

export class ModalPopup extends AbstractPopup {
  async create(campaignData, settings) {
    // console.log(
    //   "Creating modal popup with data:",
    //   JSON.stringify(campaignData, null, 2)
    // );

    const customStyles = parseCustomCSS(settings.customCSS || "");

    const modalElement = document.createElement("div");
    modalElement.classList.add("ziadah-popup", "ziadah-modal");

    const styles = document.createElement("style");
    styles.textContent = `
      ${this.getDefaultStyles()}
      ${sanitizeCSS(customStyles)}
    `;

    modalElement.innerHTML = '<div class="modal-content"></div>';

    modalElement.prepend(styles);
    this.popupElement = modalElement;
    this.contentElement = modalElement.querySelector(".modal-content");
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
    console.log("Showing products in modal popup", {
      actionProducts,
      triggerProducts,
      options,
      campaignTypeId,
      card,
      alternativeProducts,
      isAlternativeEnabled,
      lastEventProductId,
      campaignSettings,
    });

    const campaignData = {
      title: card?.title || { en: "No Title" },
      description: card?.description || { en: "No Description" },
      action_products: actionProducts,
      coupon: options?.coupon,
    };

    this.updateContent(campaignData);
    this.show();
  }

  updateContent(campaignData) {
    console.log("Updating modal content with data:", campaignData);
    const content = this.generateModalContent(campaignData);
    if (this.contentElement) {
      this.contentElement.innerHTML = content;
    }
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
    let fontFamily = getStoreFontFamily();

    if (!fontFamily) {
      fontFamily = "Rubik, sans-serif";
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
        margin: 5% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 90%;
        max-width: 800px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      }
      .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
      }
      .close:hover,
      .close:focus {
        color: black;
        text-decoration: none;
      }
      .products-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-around;
        gap: 20px;
      }
      .product {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: calc(33.33% - 20px);
        min-width: 200px;
        margin-bottom: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .product-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 10px;
      }
      .product-details {
        text-align: center;
        width: 100%;
      }
      .product h3 {
        margin: 0 0 10px 0;
        font-size: 1.2em;
      }
      .product p {
        margin: 5px 0;
      }
      .add-to-cart {
        padding: 10px 20px;
        background-color: #007BFF;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        font-family: ${fontFamily};
        width: 100%;
      }
      .add-to-cart:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      .coupon {
        margin-top: 20px;
        padding: 10px;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .coupon p {
        margin: 0 0 10px 0;
      }
      .copy-coupon {
        padding: 5px 10px;
        background-color: #28a745;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
  }

  generateModalContent(campaignData) {
    this.state = getState(); // Update the state before generating content
    const language = this.state.language;
    console.log("Current language from state:", language);

    let title =
      campaignData.title[language] || campaignData.title.en || "No Title";
    let description =
      campaignData.description[language] ||
      campaignData.description.en ||
      "No Description";

    console.log("Using title:", title);
    console.log("Using description:", description);

    const actionProducts = campaignData?.action_products || [];
    const coupon = campaignData?.coupon || null;

    console.log("Generating modal content with:", {
      title,
      description,
      actionProducts,
      coupon,
    });

    return `
      <span class="close">&times;</span>
      <h2>${title}</h2>
      <p>${description}</p>
      <div class="products-container">
        ${this.generateProductList(actionProducts)}
      </div>
      ${this.generateCouponSection(coupon)}
    `;
  }

  generateProductList(products) {
    if (!Array.isArray(products) || products.length === 0) {
      return `<p>${t("no_products_available")}</p>`;
    }

    return products
      .map((product) => {
        // Determine the product name based on its type
        let name;
        if (typeof product.name === "string") {
          name = product.name;
        } else if (typeof product.name === "object" && product.name !== null) {
          name =
            product.name[this.adapter.getLanguage()] ||
            product.name.en ||
            "Unnamed Product";
        } else {
          name = "Unnamed Product";
        }

        // Determine the product image
        let imageUrl = "";
        if (Array.isArray(product.images) && product.images.length > 0) {
          // Prefer 'small' size, fallback to 'thumbnail', then 'medium', etc.
          const imageSizes = [
            "small",
            "thumbnail",
            "medium",
            "large",
            "full_size",
          ];
          for (const size of imageSizes) {
            if (product.images[0].images[size]) {
              imageUrl = product.images[0].images[size];
              break;
            }
          }
        }

        // Determine quantity information
        let quantityInfo;
        if (product.is_infinite) {
          quantityInfo = t("unlimited_stock");
        } else if (product.quantity > 0) {
          quantityInfo = `${t("in_stock")}: ${product.quantity} ${t(
            "items_left"
          )}`;
        } else {
          quantityInfo = t("out_of_stock");
        }

        return `
          <div class="product">
            ${
              imageUrl
                ? `<img src="${imageUrl}" alt="${this.escapeHtml(
                    name
                  )}" class="product-image" loading="lazy" onerror="this.src='path/to/default-image.png'"/>`
                : ""
            }
            <div class="product-details">
              <h3>${this.escapeHtml(name)}</h3>
              <p>${
                product.price
                  ? this.formatPrice(product.price, product.currency)
                  : "N/A"
              }</p>
              <p>${quantityInfo}</p>
              <button class="add-to-cart" data-product-id="${this.escapeHtml(
                product.uuid || ""
              )}" ${product.quantity === 0 ? "disabled" : ""}>
                ${t("add_to_cart")}
              </button>
            </div>
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
        <p>${this.escapeHtml(coupon.code)}</p>
        <button class="copy-coupon" data-coupon-code="${this.escapeHtml(
          coupon.code
        )}">${t("copy_coupon")}</button>
      </div>
    `;
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, function (m) {
      return map[m];
    });
  }

  formatPrice(price, currency) {
    const formatter = new Intl.NumberFormat(this.adapter.getLanguage(), {
      style: "currency",
      currency: currency || "USD",
    });
    return formatter.format(price / 100); // Assuming price is in cents
  }

  // t(key) {
  //   // Implement your translation logic here.
  //   // For now, returning the key itself.
  //   const translations = {
  //     no_products_available: "No products available.",
  //     unlimited_stock: "Unlimited stock",
  //     in_stock: "In stock",
  //     items_left: "items left",
  //     out_of_stock: "Out of stock",
  //     add_to_cart: "Add to Cart",
  //     copy_coupon: "Copy Coupon",
  //     // Add other translations as needed
  //   };
  //   return translations[key] || key;
  // }

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
