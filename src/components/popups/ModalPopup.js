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
    styles.textContent = this.getDefaultStyles(settings.fontFamily);

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
      type: campaignTypeId,
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

  getDefaultStyles(fontFamily) {
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
    this.state = getState();
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
      ${this.generateProductList(
        campaignData.action_products,
        campaignData.type
      )}
    </div>
    ${this.generateCouponSection(campaignData.coupon)}
    `;
  }

  generateProductList(products, type) {
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

        // Determine button text and class based on product type
        let buttonText;
        let buttonClass = "add-to-cart";
        if (type === 1) {
          buttonText = t("replace");
          buttonClass += " replace-product";
        } else {
          buttonText = t("add_to_cart");
          buttonClass += " add-to-cart";
        }

        // price
        let priceDisplay = "N/A";
        if (product.price !== undefined) {
          priceDisplay = `${product.price}`;
          if (product.currency) {
            priceDisplay += ` ${product.currency}`;
          }
        }

        // variant dropdown
        const variantDropdown = this.generateVariantDropdown(product);

        return `
          <div class="product" data-product-id="${this.escapeHtml(
            product.uuid
          )}">
            ${
              imageUrl
                ? `<img src="${imageUrl}" alt="${this.escapeHtml(
                    name
                  )}" class="product-image" loading="lazy" onerror="this.src='path/to/default-image.png'"/>`
                : ""
            }
            <div class="product-details">
              <h3>${this.escapeHtml(name)}</h3>
               <p>${priceDisplay}</p>
              <p>${quantityInfo}</p>
              ${variantDropdown}
              <button class="${buttonClass}" data-product-id="${this.escapeHtml(
          product.uuid || ""
        )}" ${product.quantity === 0 ? "disabled" : ""}>
                ${buttonText}
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  generateVariantDropdown(product) {
    if (
      !product.attributes ||
      !Array.isArray(product.attributes) ||
      product.attributes.length === 0
    ) {
      return "";
    }

    const optionsLabel = this.t("options");
    const attributeSelectors = product.attributes
      .map((attr, attrIndex) => {
        const attributeName =
          attr.name[this.getLanguage()] || attr.name.en || "Unnamed Attribute";

        const options = attr.presets
          .map((preset) => {
            const presetName =
              preset.value[this.getLanguage()] ||
              preset.value.en ||
              "Unnamed Preset";
            return `<option value="${this.escapeHtml(
              presetName
            )}">${this.escapeHtml(presetName)}</option>`;
          })
          .join("");

        return `
        <div style="width: 100%; margin-bottom: 8px;">
          <label style="width: 100%; font-size: 0.75rem; text-align: start; display: block; margin-bottom: 4px;">
            ${this.escapeHtml(
              attributeName.replace(/^\w/, (c) => c.toUpperCase())
            )}
          </label>
          <select 
            data-product-id="${this.escapeHtml(product.uuid)}-${attrIndex}"
            data-attribute-id="${attr.id}"
            class="product-attribute"
            style="font-size: 14px; width: 100%; border-radius: 4px; border: 1px solid #ccc; padding: 6px; outline: none;"
          >
            ${options}
          </select>
        </div>
      `;
      })
      .join("");

    return `
      <div class="variant-dropdown" style="width: 100%; position: relative; margin-bottom: 10px;">
        <div class="dropdown-header" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
          <span>${optionsLabel}</span>
          <span class="chevron">▼</span>
        </div>
        <div class="dropdown-content" style="display: none; position: absolute; width: 100%; max-height: 200px; overflow-y: auto; background-color: white; border: 1px solid #ccc; border-top: none; border-radius: 0 0 4px 4px; z-index: 1;">
          ${attributeSelectors}
        </div>
      </div>
    `;
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

    this.popupElement.addEventListener("click", (e) => {
      const dropdownHeader = e.target.closest(".dropdown-header");
      if (dropdownHeader) {
        const dropdown = dropdownHeader.closest(".variant-dropdown");
        const dropdownContent = dropdown.querySelector(".dropdown-content");
        const chevron = dropdown.querySelector(".chevron");

        if (dropdownContent.style.display === "none") {
          dropdownContent.style.display = "block";
          chevron.textContent = "▲";
        } else {
          dropdownContent.style.display = "none";
          chevron.textContent = "▼";
        }
      } else if (!e.target.closest(".dropdown-content")) {
        // Close all dropdowns when clicking outside
        const openDropdowns = this.popupElement.querySelectorAll(
          '.dropdown-content[style="display: block;"]'
        );
        openDropdowns.forEach((dropdown) => {
          dropdown.style.display = "none";
          dropdown
            .closest(".variant-dropdown")
            .querySelector(".chevron").textContent = "▼";
        });
      }
    });

    this.popupElement.addEventListener("change", (e) => {
      if (e.target.classList.contains("product-attribute")) {
        const productId = e.target.dataset.productId;
        const attributeId = e.target.dataset.attributeId;
        const selectedValue = e.target.value;
        this.handleAttributeChange(productId, attributeId, selectedValue);
      }
    });
  }
  async handleAttributeChange(event) {
    if (!event || !event.target) {
      console.error("Invalid event object");
      return;
    }

    const select = event.target;
    const productId = select.getAttribute("data-product-id");
    const attributeId = select.getAttribute("data-attribute-id");
    const selectedValue = select.value;

    if (!productId || !attributeId) {
      console.error("Missing product ID or attribute ID");
      return;
    }

    console.log(
      `Attribute changed for product ${productId}, attribute ${attributeId} to value ${selectedValue}`
    );

    try {
      const product = this.products.find(
        (p) => p.uuid === productId.split("-")[0]
      );
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

      const selectedPreset = attribute.presets.find(
        (p) => p.value[this.getLanguage()] === selectedValue
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

      const response = await this.apiClient.post(
        "/zid/store-front/variant",
        variantData
      );
      console.log("Variant updated successfully:", response.data);

      this.updateProductVariantInfo(productId, response.data);
    } catch (error) {
      console.error("Error updating variant:", error);
    }
  }

  updateProductVariantInfo(productId, variantData) {
    const productElement = this.popupElement.querySelector(
      `.product[data-product-id="${productId}"]`
    );
    if (!productElement) return;

    const priceElement = productElement.querySelector(".product-price");
    if (priceElement && variantData.price) {
      priceElement.textContent = this.formatPrice(
        variantData.price,
        variantData.currency
      );
    }

    const quantityElement = productElement.querySelector(".product-quantity");
    if (quantityElement && variantData.quantity !== undefined) {
      quantityElement.textContent =
        variantData.quantity > 0
          ? `${this.t("in_stock")}: ${variantData.quantity}`
          : this.t("out_of_stock");
    }

    const addToCartButton = productElement.querySelector(".add-to-cart");
    if (addToCartButton) {
      addToCartButton.disabled = variantData.quantity === 0;
    }
  }

  getLanguage() {
    return this.adapter.getLanguage();
  }
}
