// src/components/popups/PopupFactory.js

import { ModalPopup } from "./ModalPopup.js";
import { OffcanvasPopup } from "./OffcanvasPopup.js";
import { sanitizeCSS } from "../../utils/cssSanitizer.js";
import { getStoreFontFamily, loadRubikFont } from "../../utils";

export class PopupFactory {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
    this.popupInstances = {}; // Cached popups by type
    this.fontFamily = getStoreFontFamily();
    this.fontLoaded = false;
  }

  async loadFontIfNeeded() {
    if (!this.fontLoaded && this.fontFamily.includes("Rubik")) {
      loadRubikFont();
      await new Promise((resolve) => setTimeout(resolve, 100)); // Allow time for the font to load
      this.fontLoaded = true;
    }
  }

  async createPopup(type, campaignData, settings) {
    console.log("Creating popup of type:", type);

    // Validate campaignData
    if (
      !campaignData ||
      typeof campaignData !== "object" ||
      Object.keys(campaignData).length === 0
    ) {
      console.error("Invalid or empty campaign data passed to createPopup");
      return null;
    }

    // Reuse existing popup if available
    if (this.popupInstances[type]) {
      console.log("Reusing existing popup instance for type:", type);
      return this.popupInstances[type];
    }

    // Load font if needed
    await this.loadFontIfNeeded();

    let PopupClass;
    switch (type) {
      case "offcanvas":
        PopupClass = OffcanvasPopup;
        break;
      case "popup card":
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
      fontFamily: this.fontFamily,
    });

    // Cache the instance for future reuse
    this.popupInstances[type] = popupInstance;

    return popupInstance;
  }
}
