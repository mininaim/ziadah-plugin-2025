// index.js or main entry point

import "./plugin-element.js";
import { getState, setState } from "./store.js";
import { notifyUser } from "./utils.js";

let isZiadahInitialized = false;

function initZiadahPlugin() {
  console.log("Attempting to initialize Ziadah plugin");

  if (isZiadahInitialized) {
    console.warn("Ziadah plugin already initialized");
    return;
  }

  let ziadahPlugin = document.querySelector("ziadah-plugin");

  if (!ziadahPlugin) {
    ziadahPlugin = document.createElement("ziadah-plugin");
    document.body.appendChild(ziadahPlugin);
  }

  // Expose global functions to interact with the plugin
  window.restartZiadahCampaign = () => {
    ziadahPlugin.restartCampaign();
  };

  window.setZiadahLanguage = (lang) => {
    ziadahPlugin.setLanguage(lang);
  };

  window.triggerZiadahCampaign = (eventId, eventName, eventData) => {
    const event = new CustomEvent(eventName, { detail: eventData });
    document.dispatchEvent(event);
  };

  window.resetZiadahPlugin = () => {
    setState({ pluginActive: false });
    isZiadahInitialized = false;
    console.log("Ziadah plugin state reset");
  };

  window.isZiadahPluginActive = () => {
    return getState().pluginActive;
  };

  function getZiadahPlugin() {
    return ziadahPlugin;
  }

  window.ZiadahPlugin = window.ZiadahPlugin || {};
  window.ZiadahPlugin.notifyUser = notifyUser;
  window.ZiadahPlugin.getZiadahPlugin = getZiadahPlugin;

  isZiadahInitialized = true;
  console.log("Ziadah plugin initialized successfully");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initZiadahPlugin);
} else {
  initZiadahPlugin();
}

window.ZIADAH_PLUGIN_VERSION = "1.0.0";
