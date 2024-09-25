import { AbstractPopup } from "../abstract/AbstractPopup";
import { ModalContent } from "./ModalContent";
import { ModalStyles } from "./ModalStyles";
import { modalConfig } from "../config/modalConfig";
import { getState } from "../../../store";

import { t, getLanguage } from "../../../utils"; // Import t from the main utils file
import { parseCustomCSS, sanitizeCSS } from "../../../utils/index";

export class ModalPopup extends AbstractPopup {
  constructor(shadowRoot, adapter) {
    super(shadowRoot, adapter);

    // We'll keep this check for now, but we'll use the utils.t function as a fallback
    if (typeof this.adapter.t !== "function") {
      console.warn(
        "Adapter does not have a t method for translations. Using fallback."
      );
      this.adapter.t = t;
    }

    this.config = modalConfig;
    this.content = new ModalContent(this.shadowRoot, this.adapter);
    this.styles = new ModalStyles();
    this.state = getState();
  }

  async create(campaignData, settings) {
    console.log("Creating modal popup");
    console.log("Settings:", settings);

    const customStyles = parseCustomCSS(settings.customCSS || "");
    const sanitizedStyles = sanitizeCSS(customStyles);

    const modalElement = document.createElement("div");
    modalElement.classList.add("ziadah-popup", "ziadah-modal");

    const styleElement = this.styles.getStyles(
      settings.fontFamily,
      sanitizedStyles
    );
    modalElement.appendChild(styleElement);

    const contentElement = document.createElement("div");
    contentElement.classList.add("modal-content");
    contentElement.innerHTML = this.content.render(campaignData);
    modalElement.appendChild(contentElement);

    this.popupElement = modalElement;
    this.contentElement = contentElement;
    this.shadowRoot.appendChild(modalElement);

    console.log("Content element created:", this.contentElement);

    this.content.setupEventListeners();
    this.setupEventListeners();

    return this;
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
    // Check if the method is being called correctly
    if (arguments.length === 0) {
      console.error("showProducts method called with no arguments");
      return;
    }
    console.log("2. Input parameters:", {
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

    // Log each parameter individually
    console.log("actionProducts:", actionProducts);
    console.log("triggerProducts:", triggerProducts);
    console.log("options:", options);
    console.log("campaignTypeId:", campaignTypeId);
    console.log("card:", card);
    console.log("alternativeProducts:", alternativeProducts);
    console.log("isAlternativeEnabled:", isAlternativeEnabled);
    console.log("lastEventProductId:", lastEventProductId);
    console.log("campaignSettings:", campaignSettings);

    // Check if any parameter is undefined
    if (!actionProducts) console.warn("actionProducts is undefined");
    if (!triggerProducts) console.warn("triggerProducts is undefined");
    if (!options) console.warn("options is undefined");
    if (!campaignTypeId) console.warn("campaignTypeId is undefined");
    if (!card) console.warn("card is undefined");
    if (!alternativeProducts) console.warn("alternativeProducts is undefined");
    if (!isAlternativeEnabled)
      console.warn("isAlternativeEnabled is undefined");
    if (!lastEventProductId) console.warn("lastEventProductId is undefined");
    if (!campaignSettings) console.warn("campaignSettings is undefined");

    const campaignData = {
      title: card?.title || { en: "No Title" },
      description: card?.description || { en: "No Description" },
      action_products: actionProducts.map((product, index) => ({
        ...product,
        type: campaignTypeId,
        isLastProduct: index === actionProducts.length - 1,
      })),
      coupon: options?.coupon,
      type: campaignTypeId,
      totalProducts: actionProducts.length,
    };

    // log type
    console.log("4. Campaign Data:", campaignData);
    console.log("5. Campaign Type:", campaignTypeId);

    if (!this.contentElement) {
      console.log("6. Content element doesn't exist, creating modal");
      await this.create(campaignData, campaignSettings);
    } else {
      console.log("6. Content element exists, updating content");
      this.updateContent(campaignData);
    }
    console.log("7. Showing modal");
    this.show();

    console.log("8. Exiting showProducts method");
  }

  updateContent(campaignData) {
    console.log("1. Entering updateContent method");
    console.log(
      "2. Updating modal content with data:",
      JSON.stringify(campaignData, null, 2)
    );

    console.log("3. Checking this.contentElement");
    if (this.contentElement) {
      console.log("4. this.contentElement exists");

      console.log("5. Getting language");
      const lang = getLanguage();
      console.log("6. Current language in ModalPopup:", lang);

      console.log("7. Testing translation");
      console.log("8. Testing translation in ModalPopup:", t("add_to_cart"));

      console.log("9. Rendering content");
      const renderedContent = this.content.render(campaignData);
      console.log("10. Rendered content:", renderedContent);

      console.log("11. Updating innerHTML");
      this.contentElement.innerHTML = renderedContent;

      console.log("12. Generating footer");
      const footerHtml = this.generateFooter(campaignData);
      console.log("13. Footer HTML:", footerHtml);

      console.log("14. Appending footer to content");
      this.contentElement.insertAdjacentHTML("beforeend", footerHtml);

      console.log("15. Setting up event listeners");
      this.content.setupEventListeners();
      this.setupFooterEventListeners();
    } else {
      console.log("4. this.contentElement does not exist");
    }

    console.log("16. Exiting updateContent method");
  }
  generateFooter(campaignData) {
    const { type, action_products } = campaignData;
    const totalProducts = action_products.length;
    const showAddAllButton = type !== 1 || totalProducts === 1;

    let addAllButtonText;
    if (type === 1) {
      addAllButtonText = this.adapter.t("replace");
    } else if (type === 2 && totalProducts === 1) {
      addAllButtonText = this.adapter.t("add");
    } else {
      addAllButtonText = this.adapter.t("add_them_all");
    }

    return `
      <div class="modal-footer">
        ${
          showAddAllButton
            ? `
          <button type="button" id="addAllToCart" class="add-all-button">
            ${addAllButtonText}
          </button>
        `
            : ""
        }
        <button type="button" class="continue-button" id="pluginModalContinue">
          ${this.adapter.t("continue")}
        </button>
      </div>
    `;
  }
  setupFooterEventListeners() {
    const addAllButton = this.contentElement.querySelector("#addAllToCart");
    if (addAllButton) {
      addAllButton.addEventListener("click", () => this.handleAddAllToCart());
    }

    const continueButton = this.contentElement.querySelector(
      "#pluginModalContinue"
    );
    if (continueButton) {
      continueButton.addEventListener("click", () => this.handleContinue());
    }
  }
  handleAddAllToCart() {
    console.log("Add all to cart clicked");
    // Implement the logic to add all products to cart
    // This might involve calling a method on your adapter or emitting an event
  }

  handleContinue() {
    console.log("Continue clicked");
    this.hide();
    // Implement any additional logic for continue button
    // This might involve emitting an event or calling a method on your adapter
  }
  setupEventListeners() {
    this.shadowRoot.addEventListener("modalClose", () => this.hide());
  }

  show() {
    if (this.popupElement) {
      this.popupElement.style.display = "block";
    }
  }

  hide() {
    if (this.popupElement) {
      this.popupElement.style.display = "none";
    }
  }

  update(campaignData) {
    this.content.update(campaignData);
  }

  destroy() {
    if (this.popupElement && this.popupElement.parentNode) {
      this.popupElement.parentNode.removeChild(this.popupElement);
    }
    this.popupElement = null;
  }

  isOpen() {
    return this.popupElement && this.popupElement.style.display === "block";
  }

  getElement() {
    return this.popupElement;
  }
}
