import { ModalPopup } from "./ModalPopup.js";
import { OffcanvasPopup } from "./OffcanvasPopup.js";
import { sanitizeCSS } from "../../utils/cssSanitizer.js";
import { getStoreFontFamily, loadRubikFont } from "../../utils";

export class PopupFactory {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
    this.popupInstances = {}; // Cached popups by type
  }

  async createPopup(type, campaignData, settings) {
    console.log("Creating popup of type:", type);
    console.log("Campaign data:", JSON.stringify(campaignData, null, 2));

    // Validate campaignData
    if (
      !campaignData ||
      !campaignData.is_success ||
      !Array.isArray(campaignData.data) ||
      campaignData.data.length === 0
    ) {
      console.error("Invalid or empty campaign data passed to createPopup");
      return null;
    }

    // Reuse existing popup if available
    if (this.popupInstances[type]) {
      console.log("Reusing existing popup instance for type:", type);
      return this.popupInstances[type];
    }

    // Load Rubik font if required
    const fontFamily = getStoreFontFamily();
    if (fontFamily.includes("Rubik")) {
      loadRubikFont();
      await new Promise((resolve) => setTimeout(resolve, 100)); // Allow time for the font to load
    }

    let PopupClass;
    switch (type) {
      case "offcanvas":
        PopupClass = OffcanvasPopup;
        break;
      case "modal":
      default:
        PopupClass = ModalPopup;
        break;
    }

    // Ensure settings contain valid CSS and sanitize it
    const sanitizedCSS = sanitizeCSS(settings?.css || "");

    // Create the popup instance
    const popupInstance = new PopupClass(this.shadowRoot, this.adapter);

    // Initialize the popup with campaign data and sanitized settings
    await popupInstance.create(campaignData, {
      ...settings,
      css: sanitizedCSS,
    });

    // Cache the instance for future reuse
    this.popupInstances[type] = popupInstance;

    return popupInstance;
  }
}
