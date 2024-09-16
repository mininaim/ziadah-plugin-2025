// plugin-element.js

import { createAdapter, getPlatform } from "./adapters/adapterFactory";
import { PopupFactory } from "./components/popups/PopupFactory";
import { campaign, restartCampaign } from "./campaign";
import { setState, getState } from "./store";
import { urlToCheck } from "./config";
import { initializeSettings } from "./settings";
import { t, notifyUser } from "./utils";
import { EVENT_IDS } from "./utils/constants";

let popupFactoryInstance = null;

class ZiadahPlugin extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._adapter = null;
    this.popupFactory = null;
    this.isInitialized = false;
  }

  get adapter() {
    if (!this._adapter) {
      console.log("Creating new adapter");
      const platform = this.getPlatform();
      this._adapter = createAdapter(platform);
      setState({ adapter: this._adapter });
    }
    return this._adapter;
  }

  getPlatform() {
    return getPlatform();
  }

  checkPluginState() {
    if (this.isInitialized) {
      console.warn("Plugin is already active, skipping initialization");
      return true;
    }
    return false;
  }

  async initializeAdapter() {
    console.log("Initializing adapter");
    const adapter = this.adapter;
    try {
      const state = getState();
      console.log(`Using language: ${state.language}`);

      // Set language on the adapter
      if (typeof adapter.setLanguage === "function") {
        adapter.setLanguage(state.language);
        console.log(`Set language on adapter: ${state.language}`);
      }

      // Set store ID on the adapter
      if (typeof adapter.setStoreId === "function") {
        const storeId = window.store_uuid || "default-store-id";
        adapter.setStoreId(storeId);
        console.log(`Set store ID on adapter: ${storeId}`);
      }

      if (!adapter.settingsInitialized) {
        console.log("Fetching adapter settings");
        await adapter.fetchSettings();
        adapter.settingsInitialized = true;
        console.log("Adapter settings initialized");
      } else {
        console.log("Adapter settings already initialized");
      }

      // Log the current adapter state
      console.log("Adapter state after initialization:", {
        language: adapter.getLanguage ? adapter.getLanguage() : "N/A",
        storeId: adapter.getStoreId ? adapter.getStoreId() : "N/A",
      });
    } catch (error) {
      console.error("Error initializing adapter:", error);
      setState({ language: "en" });
    }
  }

  // async initializeAdapter() {
  //   console.log("Initializing adapter");
  //   const adapter = this.adapter;
  //   try {
  //     // if (typeof adapter.getLanguage === "function") {
  //     //   const language = adapter.getLanguage();
  //     //   console.log(`Setting language to: ${language}`);
  //     //   setState({ language });
  //     // } else {
  //     //   console.warn(
  //     //     "getLanguage method not found on adapter, defaulting to 'en'"
  //     //   );
  //     //   setState({ language: "en" });
  //     // }

  //     const state = getState();
  //     console.log(`Using language: ${state.language}`);

  //     if (!adapter.settingsInitialized) {
  //       console.log("Fetching adapter settings");
  //       await adapter.fetchSettings();
  //       adapter.settingsInitialized = true;
  //       console.log("Adapter settings initialized");
  //     } else {
  //       console.log("Adapter settings already initialized");
  //     }
  //   } catch (error) {
  //     console.error("Error initializing adapter:", error);
  //     setState({ language: "en" });
  //   }
  // }

  initPopupFactory() {
    if (!popupFactoryInstance) {
      this.popupFactory = new PopupFactory(this.shadowRoot, this.adapter);
      popupFactoryInstance = this.popupFactory;
      console.log("Created PopupFactory:", this.popupFactory);
      setState({ popupFactory: this.popupFactory });
    } else {
      this.popupFactory = popupFactoryInstance;
      console.log("Using existing PopupFactory instance");
    }
  }

  async connectedCallback() {
    console.log("ZiadahPlugin connectedCallback called");
    if (this.checkPluginState()) {
      console.log("Skipping initialization due to plugin state");
      return;
    }

    this.isInitialized = true;
    setState({ pluginActive: true });

    const htmlLang = document.documentElement.lang || "en";
    console.log("Detected HTML lang:", htmlLang);
    setState({ language: htmlLang });

    try {
      await this.initializeAdapter();
      this.initPopupFactory();
      await this.initializePlugin();
      console.log("ZiadahPlugin initialization completed successfully");
      const currentState = getState();
      console.log("Current state after initialization:", currentState);
    } catch (error) {
      console.error("Error during ZiadahPlugin initialization:", error);
      setState({ pluginActive: false });
    }
  }

  async initializePlugin() {
    await initializeSettings();

    const currentPath = new URL(window.location.href).pathname;
    const lastPageUrl = sessionStorage.getItem("last_page_url") || "";
    sessionStorage.setItem("last_page_url", currentPath);

    if (currentPath === urlToCheck) {
      window.isCustomURL = true;
      await campaign.call(this, EVENT_IDS.START_CHECKOUT, "start-checkout");
    } else if (
      lastPageUrl !== currentPath &&
      lastPageUrl.includes("/products/") &&
      !currentPath.includes("/products/")
    ) {
      await campaign.call(this, EVENT_IDS.PRODUCT_VIEW, "product-page-leave", {
        id: sessionStorage.getItem("last_product_id"),
      });
    } else if (
      currentPath.includes("/order-completed/") ||
      currentPath.includes("/orders/")
    ) {
      await this.handleOrderPage();
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Store bound event handlers for later removal
    this.handleProductView = (e) =>
      campaign.call(
        this,
        EVENT_IDS.PRODUCT_VIEW,
        "product-view",
        e.detail,
        false
      );
    this.handleAddToCart = (e) =>
      campaign.call(
        this,
        EVENT_IDS.ADD_TO_CART,
        "add-remove-cart",
        e.detail,
        false
      );
    this.handleRemoveFromCart = (e) =>
      campaign.call(
        this,
        EVENT_IDS.REMOVE_FROM_CART,
        "add-remove-cart",
        e.detail,
        false
      );
    this.handleStartCheckout = () =>
      campaign.call(
        this,
        EVENT_IDS.START_CHECKOUT,
        "start-checkout",
        {},
        false
      );
    this.handlePurchaseEvent = (e) =>
      campaign.call(this, EVENT_IDS.PURCHASE, "purchase", e.detail, false);

    document.addEventListener("product-view", this.handleProductView);
    document.addEventListener("add-to-cart", this.handleAddToCart);
    document.addEventListener("remove-from-cart", this.handleRemoveFromCart);
    document.addEventListener("start-checkout", this.handleStartCheckout);
    document.addEventListener("purchase", this.handlePurchaseEvent);
  }
  async showPopup(campaignData) {
    try {
      console.log(
        "Showing popup for campaign:",
        JSON.stringify(campaignData, null, 2)
      );

      const popupType =
        campaignData?.style?.title?.en?.toLowerCase() || "modal";

      const adapter = this.adapter;
      const settings = await adapter.fetchSettings();
      console.log("Fetched settings:", settings);

      if (typeof settings.css !== "string") {
        console.warn("Invalid CSS in settings, using empty string");
        settings.css = "";
      }

      const popupInstance = await this.popupFactory.createPopup(
        popupType,
        campaignData,
        settings
      );

      if (!popupInstance) {
        throw new Error(`Failed to create popup of type: ${popupType}`);
      }

      await popupInstance.showProducts(
        campaignData.action_products,
        campaignData.trigger_products,
        { coupon: campaignData.coupon },
        campaignData.type?.id,
        campaignData.card,
        campaignData.alternative_products,
        campaignData.is_alternative_product_enabled,
        null,
        campaignData.campaign_settings
      );
    } catch (error) {
      console.error("Error showing popup:", error);
      console.error("Campaign data:", JSON.stringify(campaignData, null, 2));
      console.error("Stack trace:", error.stack);
    }
  }

  async handleOrderPage() {
    const orderId = this.getOrderIdFromDOM();
    if (!orderId) return;

    const processedOrders = JSON.parse(
      localStorage.getItem("processedOrders") || "[]"
    );
    if (processedOrders.includes(orderId)) return;

    const savedCampaigns = JSON.parse(
      localStorage.getItem("savedCampaigns") || "[]"
    );
    const modalAddedProducts = savedCampaigns.filter(
      (campaign) => campaign.source === "modal"
    );

    if (modalAddedProducts.length > 0) {
      const adapter = this.adapter; // Access once
      await adapter.sendConversionData(
        adapter.getStoreId(),
        modalAddedProducts
      );
      processedOrders.push(orderId);
      localStorage.setItem("processedOrders", JSON.stringify(processedOrders));
      localStorage.removeItem("savedCampaigns");
    }
  }

  getOrderIdFromDOM() {
    const selectors = [
      ".order-number",
      "#order-id",
      "[data-order-id]",
      ".order-details h1",
      ".invoice-body td.d-flex > div",
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const orderText = element.textContent.trim();
        const match = orderText.match(/(\d+)/);
        if (match) {
          return match[1];
        }
      }
    }

    console.error("Unable to find order ID in the DOM");
    return null;
  }

  async handlePurchase(purchaseData) {
    try {
      const state = getState();
      const adapter = state.adapter;
      const storeId = adapter.getStoreId();

      console.log("Purchase event:", purchaseData);

      if (!purchaseData || typeof purchaseData !== "object") {
        console.error("Invalid purchase data:", purchaseData);
        throw new Error("Invalid purchase data");
      }

      const analyticsData = {
        orderId: purchaseData.orderId || "unknown",
        total: purchaseData.total || 0,
        currency: purchaseData.currency || "USD",
        products: Array.isArray(purchaseData.products)
          ? purchaseData.products.map((product) => ({
              id: product.id || "unknown",
              name: product.name || "Unknown Product",
              price: product.price || 0,
              quantity: product.quantity || 1,
              category: product.category || "Uncategorized",
            }))
          : [],
      };

      const savedCampaigns = JSON.parse(
        localStorage.getItem("savedCampaigns") || "[]"
      );
      const campaignProducts = savedCampaigns.filter((campaign) =>
        analyticsData.products.some((product) => product.id === campaign.uuid)
      );

      if (campaignProducts.length > 0) {
        // Send conversion data
        await adapter.sendConversionData(storeId, campaignProducts);

        localStorage.removeItem("savedCampaigns");
      }

      this.updatePurchaseUI(analyticsData);

      // Trigger purchase campaigns
      await campaign.call(
        this,
        EVENT_IDS.PURCHASE,
        "post-purchase",
        analyticsData
      );
    } catch (error) {
      console.error("Error handling purchase:", error);
      notifyUser(t("error_processing_purchase"), true);
    }
  }

  updatePurchaseUI(purchaseData) {
    console.log("Updating UI with purchase data:", purchaseData);

    const purchaseConfirmation = document.getElementById(
      "purchase-confirmation"
    );
    if (purchaseConfirmation) {
      purchaseConfirmation.textContent = `Thank you for your purchase! Order ID: ${purchaseData.orderId}`;
    }
  }

  setLanguage(lang) {
    if (getState().languages[lang]) {
      setState({ language: lang });
      this.updateUI();
    } else {
      console.warn(
        `Language '${lang}' is not supported. Falling back to English.`
      );
      setState({ language: "en" });
    }
  }

  updateUI() {
    const state = getState();
    if (state.activePopup) {
      state.activePopup.updateContent();
    }
  }

  restartCampaign() {
    restartCampaign.call(this);
  }

  cleanup() {
    console.log("Cleaning up ZiadahPlugin");
    setState({ pluginActive: false });
    this._adapter = null;
    this.popupFactory = null;
    popupFactoryInstance = null;
  }

  disconnectedCallback() {
    console.log("ZiadahPlugin disconnectedCallback called");
    this.cleanup();
    // Remove event listeners
    document.removeEventListener("product-view", this.handleProductView);
    document.removeEventListener("add-to-cart", this.handleAddToCart);
    document.removeEventListener("remove-from-cart", this.handleRemoveFromCart);
    document.removeEventListener("start-checkout", this.handleStartCheckout);
    document.removeEventListener("purchase", this.handlePurchaseEvent);
  }
}

customElements.define("ziadah-plugin", ZiadahPlugin);
