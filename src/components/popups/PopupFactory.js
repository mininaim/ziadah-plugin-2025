import { ModalPopup } from "./ModalPopup.js";
import { OffcanvasPopup } from "./OffcanvasPopup.js"; // Assuming you have this
import { sanitizeCSS } from "../../utils/cssSanitizer.js";
import { getStoreFontFamily, loadRubikFont } from "../../utils";

export class PopupFactory {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
    this.popupInstances = {};
  }

  async createPopup(type, campaignData, settings) {
    console.log("Creating popup of type:", type);
    console.log("Campaign data:", JSON.stringify(campaignData, null, 2));

    if (this.popupInstances[type]) {
      return this.popupInstances[type];
    }

    const fontFamily = getStoreFontFamily();
    if (fontFamily.includes("Rubik")) {
      loadRubikFont();

      await new Promise((resolve) => setTimeout(resolve, 100));
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

    const sanitizedCSS = sanitizeCSS(settings.css || "");

    const popupInstance = new PopupClass(this.shadowRoot, this.adapter);

    const safeData =
      typeof campaignData === "object" && campaignData !== null
        ? campaignData
        : {};

    await popupInstance.create(safeData, { ...settings, css: sanitizedCSS });
    this.popupInstances[type] = popupInstance;
    return popupInstance;
  }
}
