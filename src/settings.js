import { getState, setState } from "./store";
import { fetchSettings } from "./api";
import { notifyUser, t } from "./utils";
import { sanitizeCSS } from "./utils/cssSanitizer";

const defaultSettings = {
  modalRadius: "10px",
  modalBackground: "#ffffff",
  mainColor: "#4CAF50",
  subColor: "#2196F3",
  fontFamily: "Arial, sans-serif",
  fontSize: "16px",
  buttonRadius: "5px",
  animationDuration: "0.3s",
  maxWidth: "600px",
  customCSS: "",
  userCSS: "",
};

let cachedSettings = null;

export async function initializeSettings() {
  if (cachedSettings) {
    return cachedSettings;
  }

  const state = getState();
  try {
    const settings = await fetchSettings(state.adapter);
    const mergedSettings = {
      ...defaultSettings,
      ...settings,
    };
    setState({ settings: mergedSettings });
    applySettings(mergedSettings);
    cachedSettings = mergedSettings;
    return mergedSettings;
  } catch (error) {
    console.error("Error initializing settings:", error);
    notifyUser(t("error_initializing_settings"), true);
    setState({ settings: defaultSettings });
    applySettings(defaultSettings);
    cachedSettings = defaultSettings;
    return defaultSettings;
  }
}

function applySettings(settings) {
  const style = document.createElement("style");
  style.textContent = `
    :root {
      --ziadah-modal-radius: ${settings.modalRadius};
      --ziadah-modal-background: ${settings.modalBackground};
      --ziadah-main-color: ${settings.mainColor};
      --ziadah-sub-color: ${settings.subColor};
      --ziadah-font-family: ${settings.fontFamily};
      --ziadah-font-size: ${settings.fontSize};
      --ziadah-button-radius: ${settings.buttonRadius};
      --ziadah-animation-duration: ${settings.animationDuration};
      --ziadah-max-width: ${settings.maxWidth};
    }
    
    ${settings.customCSS}
    
    /* User-defined CSS overrides */
    ${sanitizeCSS(settings.userCSS)}
  `;

  const existingStyle = document.getElementById("ziadah-styles");
  if (existingStyle) {
    existingStyle.remove();
  }

  style.id = "ziadah-styles";
  document.head.appendChild(style);
}

export function updateSettings(newSettings) {
  const state = getState();
  const updatedSettings = {
    ...state.settings,
    ...newSettings,
  };
  setState({ settings: updatedSettings });
  applySettings(updatedSettings);
}

export function getPopupType() {
  const state = getState();
  return state.settings.popupType || "modal";
}

export function setPopupType(type) {
  if (["modal", "offcanvas"].includes(type)) {
    updateSettings({ popupType: type });
  } else {
    notifyUser(t("invalid_popup_type"), true);
  }
}

export function setUserCSS(css) {
  const sanitizedCSS = sanitizeCSS(css);
  updateSettings({ userCSS: sanitizedCSS });
}

export function getUserCSS() {
  const state = getState();
  return state.settings.userCSS || "";
}
