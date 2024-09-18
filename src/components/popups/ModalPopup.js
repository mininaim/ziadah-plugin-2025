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

        // Generate attribute selectors if available
        let attributeSelectors = "";
        if (product.attributes && Array.isArray(product.attributes)) {
          attributeSelectors = product.attributes
            .map((attribute) => {
              const attributeName =
                attribute.name && attribute.name[this.getLanguage()]
                  ? attribute.name[this.getLanguage()]
                  : "Unnamed Attribute";

              // Generate options safely
              const options = Array.isArray(attribute.presets)
                ? attribute.presets
                    .map((preset) => {
                      const presetName =
                        preset.value && preset.value[this.getLanguage()]
                          ? preset.value[this.getLanguage()]
                          : preset.slug || "Unnamed Preset";
                      return `<option value="${this.escapeHtml(
                        preset.id
                      )}">${this.escapeHtml(presetName)}</option>`;
                    })
                    .join("")
                : "";

              return `
  <div class="attribute-selector">
    <label for="${this.escapeHtml(product.uuid)}-${
                attribute.id
              }">${this.escapeHtml(attributeName)}:</label>
    <select 
      id="${this.escapeHtml(product.uuid)}-${attribute.id}" 
      class="product-attribute" 
      data-product-id="${this.escapeHtml(product.uuid)}" 
      data-attribute-id="${attribute.id}"
    >
      ${options}
    </select>
  </div>
`;
            })
            .join("");
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
               <p>${priceDisplay}</p>
              <p>${quantityInfo}</p>
              ${attributeSelectors}
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
    const select = event.target;
    const productId = select.getAttribute("data-product-id");
    const attributeId = select.getAttribute("data-attribute-id");
    const selectedValue = select.value;

    console.log(
      `Attribute changed for product ${productId}, attribute ${attributeId} to value ${selectedValue}`
    );

    try {
      const product = this.products.find((p) => p.uuid === productId);
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
        (p) => p.id.toString() === selectedValue
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
            value: selectedValue,
          },
        ],
      };

      const response = await this.apiClient.post(
        "/zid/store-front/variant",
        variantData
      );
      console.log("Variant updated successfully:", response.data);

      // Update the product price if necessary
      if (response.data && response.data.price) {
        const priceElement = document.querySelector(
          `#product-${productId} .product-price`
        );
        if (priceElement) {
          priceElement.textContent = this.formatPrice(response.data.price);
        }
      }
    } catch (error) {
      console.error("Error updating variant:", error);
    }
  }

  updateProductVariantInfo(productId, variantData) {
    // Find the product element
    const productElement = this.popupElement.querySelector(
      `.product[data-product-id="${productId}"]`
    );
    if (!productElement) return;

    // Update price
    const priceElement = productElement.querySelector(".product-price");
    if (priceElement && variantData.price) {
      priceElement.textContent = `${variantData.price} ${
        variantData.currency || ""
      }`;
    }

    // Update availability/quantity
    const quantityElement = productElement.querySelector(".product-quantity");
    if (quantityElement && variantData.quantity !== undefined) {
      quantityElement.textContent =
        variantData.quantity > 0
          ? `${t("in_stock")}: ${variantData.quantity}`
          : t("out_of_stock");
    }

    // Update add-to-cart button state
    const addToCartButton = productElement.querySelector(".add-to-cart");
    if (addToCartButton) {
      addToCartButton.disabled = variantData.quantity === 0;
    }

    // Update the product image
    // const imageElement = productElement.querySelector(".product-image");
    // if (imageElement && variantData.images && variantData.images.length > 0) {
    //   imageElement.src = variantData.images[0];
    // }
  }

  getLanguage() {
    return this.adapter.getLanguage();
  }
}
