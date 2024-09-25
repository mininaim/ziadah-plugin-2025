import modalStyles from "../../../css/styles/ModalPopup.css";
import { modalConfig } from "../config/modalConfig";

export class ModalStyles {
  constructor() {
    this.config = modalConfig;
  }

  getStyles(settings) {
    const styleElement = document.createElement("style");
    styleElement.textContent = modalStyles;

    // Apply custom settings
    const customStyles = `
      .${this.config.classNames.modal} {
        font-family: ${settings.fontFamily || "var(--modal-font-family)"};
        --modal-background-color: ${settings.backgroundColor || "#ffffff"};
        --modal-text-color: ${settings.textColor || "#000000"};
        --modal-button-color: ${settings.buttonColor || "#007BFF"};
        --modal-button-text-color: ${settings.buttonTextColor || "#ffffff"};
      }
    `;

    styleElement.textContent += customStyles;

    return styleElement;
  }
}
