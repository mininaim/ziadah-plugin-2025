import { supportedLanguages, defaultLanguage } from "./config";
import languages from "./languages";
import { getState } from "./store";

export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

export function removeDashes(data) {
  return String(data).split("-").join("");
}

export function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

export function getFromLocalStorage(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Error getting from localStorage:", error);
    return null;
  }
}

export function t(key, params = {}) {
  const state = getState();
  const lang = supportedLanguages.includes(state.language)
    ? state.language
    : defaultLanguage;
  const translations = languages[lang];

  let translation = translations[key] || key;
  // console.log(
  //   `Translating key "${key}" to "${translation}" in language "${lang}"`
  // );

  Object.entries(params).forEach(([param, value]) => {
    translation = translation.replace(
      new RegExp(`{{\\s*${param}\\s*}}`, "g"),
      value
    );
  });
  return translation;
}

export function notifyUser(msg, err) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      createNotification(msg, err);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          createNotification(msg, err);
        } else {
          createFallbackToast(msg, err);
        }
      });
    } else {
      createFallbackToast(msg, err);
    }
  } else {
    createFallbackToast(msg, err);
  }

  console.log(err ? "Error:" : "Success:", msg);
}

function createNotification(msg, err) {
  new Notification(err ? "Error" : "Success", {
    body: msg,
    icon: err ? "/error-icon.png" : "/success-icon.png",
  });
}

function createFallbackToast(msg, err) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: ${err ? "#f44336" : "#4CAF50"};
      color: white;
      padding: 16px;
      border-radius: 4px;
      text-align: center;
      z-index: 1000;
      max-width: 80%;
    `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s ease-out";
    setTimeout(() => document.body.removeChild(toast), 500);
  }, 3000);
}

export function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => notifyUser(t("code_copied", { code: text }), false))
    .catch(() => notifyUser(t("copy_failed"), true));
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function logError(error, context = "") {
  console.error(
    `[Ziadah Plugin Error]${context ? ` (${context})` : ""}: `,
    error
  );
}

export function getStoreFontFamily() {
  try {
    const bodyFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");
    if (bodyFontFamily && bodyFontFamily !== "none") {
      return bodyFontFamily;
    }
  } catch (error) {
    console.warn("Error detecting store font:", error);
  }

  return "'Rubik', sans-serif";
}

export function loadRubikFont() {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Rubik&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

// Caching
const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map();
export function cachedFetch(url, options = {}) {
  const cacheKey = `ziadah_${url}${JSON.stringify(options)}`;
  const now = new Date().getTime();

  if (cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey);
    if (now - cachedData.timestamp < CACHE_DURATION) {
      return Promise.resolve(cachedData.data);
    }
  }

  const storedData = localStorage.getItem(cacheKey);
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    if (now - parsedData.timestamp < CACHE_DURATION) {
      cache.set(cacheKey, parsedData);
      return Promise.resolve(parsedData.data);
    }
  }

  return fetch(url, options)
    .then((response) => response.json())
    .then((data) => {
      const cacheData = { timestamp: now, data };
      cache.set(cacheKey, cacheData);
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return data;
    });
}

export function clearCache(url = null) {
  if (url) {
    const cacheKey = `ziadah_${url}`;
    cache.delete(cacheKey);
    localStorage.removeItem(cacheKey);
  } else {
    cache.clear();
    Object.keys(localStorage)
      .filter((key) => key.startsWith("ziadah_"))
      .forEach((key) => localStorage.removeItem(key));
  }
}
