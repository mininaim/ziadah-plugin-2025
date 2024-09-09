import { createAdapter, getPlatform } from "./adapters/adapterFactory";
import { PopupFactory } from "./components/popups/PopupFactory";
import { campaign, restartCampaign } from "./campaign";
import { setState, getState } from "./store";
import { mainEvent, productPageLeaveEvent, urlToCheck } from "./config";
import { initializeSettings } from "./settings";
import { t, notifyUser } from "./utils";

let singletonAdapter = null;
let popupFactoryInstance = null;

class ZiadahPlugin extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._adapter = null;
    this.popupFactory = null;
  }

  get adapter() {
    if (!this._adapter) {
      const platform = this.getPlatform();
      this._adapter = createAdapter(platform);
      setState({ adapter: this._adapter });
    }
    return this._adapter;

    // if (!this._adapter) {
    //   // Use createAdapter function to get the appropriate adapter
    //   this._adapter = createAdapter(this.getPlatform());
    //   setState({ adapter: this._adapter });
    // }
    // return this._adapter;

    // if (!this._adapter) {
    //   if (!singletonAdapter) {
    //     singletonAdapter = createAdapter("mock");
    //     console.log("Created new adapter:", singletonAdapter);
    //   } else {
    //     console.log("Returning existing adapter instance");
    //   }
    //   this._adapter = singletonAdapter;
    //   setState({ adapter: this._adapter });
    // }
    // return this._adapter;
  }

  getPlatform() {
    return "mock";
  }

  checkPluginState() {
    const state = getState();
    if (state.pluginActive) {
      console.log("Plugin is already active, skipping initialization");
      return true;
    }
    setState({ pluginActive: true });
    return false;
  }

  // handleAddToCart(productId) {
  //   this.campaign(
  //     "add-to-cart",
  //     "add-to-cart",
  //     { id: productId },
  //     false
  //   );
  // }
  async initializeAdapter() {
    try {
      if (typeof this.adapter.getLanguage === "function") {
        setState({ language: this.adapter.getLanguage() });
      } else {
        console.warn("getLanguage method not found on adapter");
        setState({ language: "en" });
      }

      if (!this.adapter.settingsInitialized) {
        await this.adapter.fetchSettings();
        this.adapter.settingsInitialized = true;
      }
    } catch (error) {
      console.error("Error initializing adapter:", error);

      setState({ language: "en" });
    }
  }

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
    if (this.checkPluginState()) return;

    await this.initializeAdapter();
    this.initPopupFactory();
    await this.initializePlugin();
  }

  async initializePlugin() {
    await initializeSettings();

    const currentPath = new URL(window.location.href).pathname;
    const lastPageUrl = sessionStorage.getItem("last_page_url") || "";
    sessionStorage.setItem("last_page_url", currentPath);

    if (currentPath === urlToCheck) {
      window.isCustomURL = true;
      await campaign.call(this, mainEvent, "start-checkout");
    } else if (
      lastPageUrl !== currentPath &&
      lastPageUrl?.includes("/products/") &&
      lastPageUrl !== "/products/"
    ) {
      await campaign.call(this, productPageLeaveEvent, "product-page-leave", {
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
    document.addEventListener("product-view", (e) =>
      campaign.call(this, "1", "product-view", e.detail)
    );
    document.addEventListener("add-to-cart", (e) =>
      campaign.call(this, "2", "add-remove-cart", e.detail)
    );
    document.addEventListener("remove-from-cart", (e) =>
      campaign.call(this, "3", "add-remove-cart", e.detail)
    );
    document.addEventListener("start-checkout", () =>
      campaign.call(this, "4", "start-checkout")
    );
    document.addEventListener("purchase", (e) => this.handlePurchase(e.detail));
  }

  async showPopup(campaignData) {
    try {
      console.log("Showing popup for campaign:", campaignData);

      console.log("Campaign data:", JSON.stringify(campaignData, null, 2));

      const popupType =
        campaignData?.style?.title?.en?.toLowerCase() || "modal";

      const settings = await this.adapter.fetchSettings();
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

      popupInstance.show();
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
      await this.adapter.sendConversionData(
        this.adapter.getStoreId(),
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

      // await this.sendToAnalytics(analyticsData);

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
      await campaign.call(this, "5", "post-purchase", analyticsData);
    } catch (error) {
      console.error("Error handling purchase:", error);
      notifyUser(t("error_processing_purchase"), true);
    }
  }

  async sendToAnalytics(data) {
    console.log("Sending to analytics:", data);
    // await analyticsService.sendPurchaseEvent(data);
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

  disconnectedCallback() {
    // Set pluginActive to false
    setState({ pluginActive: false });
    // Remove event listeners
    document.removeEventListener("product-view", this.handleProductView);
    document.removeEventListener("add-to-cart", this.handleAddToCart);
    document.removeEventListener("remove-from-cart", this.handleRemoveFromCart);
    document.removeEventListener("start-checkout", this.handleStartCheckout);
    document.removeEventListener("purchase", this.handlePurchase);
  }
}

customElements.define("ziadah-plugin", ZiadahPlugin);
