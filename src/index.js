import "./plugin-element.js";

// Initialize the Ziadah plugin
function initZiadahPlugin() {
  const ziadahPlugin = document.createElement("ziadah-plugin");
  document.body.appendChild(ziadahPlugin);

  // Global functions to restart the campaign and set the language
  window.restartZiadahCampaign = () => {
    ziadahPlugin.restartCampaign();
  };

  window.setZiadahLanguage = (lang) => {
    ziadahPlugin.setLanguage(lang);
  };

  // Global function to manually trigger a campaign
  window.triggerZiadahCampaign = (eventId, eventName, eventData) => {
    const event = new CustomEvent(eventName, { detail: eventData });
    document.dispatchEvent(event);
  };

  // Global function to reset the plugin state
  window.resetZiadahPlugin = () => {
    setState({ pluginActive: false });
  };

  // Global function to check plugin state
  window.isZiadahPluginActive = () => {
    return getState().pluginActive;
  };
}

// Check if the DOM is already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initZiadahPlugin);
} else {
  initZiadahPlugin();
}

// Expose the version of the plugin
window.ZIADAH_PLUGIN_VERSION = "1.0.0";
