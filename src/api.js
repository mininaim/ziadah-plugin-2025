import { getState } from "./store";
import { notifyUser, t } from "./utils";

function getLanguageAndStoreId(adapter) {
  const state = getState();
  const storeId = state.storeId || adapter.getStoreId();
  const language = state.language;
  return { storeId, language };
}

export async function fetchCampaigns(eventID, adapter) {
  try {
    const { storeId, language } = getLanguageAndStoreId(adapter);
    return await adapter.fetchCampaigns(eventID, storeId, language);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    notifyUser(t("error_fetching_campaigns"), true);
    return { is_success: false, data: [] };
  }
}

export async function getCampaignData(
  campaign_id,
  event_id,
  action_products,
  adapter
) {
  try {
    const { storeId, language } = getLanguageAndStoreId(adapter);
    return await adapter.getCampaignData(
      campaign_id,
      event_id,
      action_products,
      storeId,
      language
    );
  } catch (error) {
    console.error("Error getting campaign data:", error);
    notifyUser(t("error_getting_campaign_data"), true);
    return null;
  }
}

export async function addProductToCart(productData, adapter) {
  try {
    const response = await adapter.addToCart(productData);
    if (response.status === "success") {
      notifyUser(t("added_to_cart"), false);
      return response.data;
    } else {
      throw new Error(response.data?.message || "Unknown error");
    }
  } catch (error) {
    console.error("Error adding product to cart:", error);
    notifyUser(t("error_adding_to_cart"), true);
    return null;
  }
}

export async function removeProductFromCart(productId, adapter) {
  try {
    const response = await adapter.removeFromCart(productId);
    if (response.status === "success") {
      notifyUser(t("removed_from_cart"), false);
      return response.data;
    } else {
      throw new Error(response.data?.message || "Unknown error");
    }
  } catch (error) {
    console.error("Error removing product from cart:", error);
    notifyUser(t("error_removing_from_cart"), true);
    return null;
  }
}

export async function sendClickData(
  campaignID,
  clickType,
  productId,
  quantity,
  adapter
) {
  try {
    const { storeId: storeUUID, language } = getLanguageAndStoreId(adapter);
    return await adapter.sendClickData(
      storeUUID,
      campaignID,
      clickType,
      productId,
      quantity,
      language
    );
  } catch (error) {
    console.error("Error sending click data:", error);
    return { success: false };
  }
}

export async function sendConversionData(products, adapter) {
  try {
    const { storeId: storeUUID, language } = getLanguageAndStoreId(adapter);
    return await adapter.sendConversionData(storeUUID, products, language);
  } catch (error) {
    console.error("Error sending conversion data:", error);
    return { success: false };
  }
}

export async function fetchProductVariants(uuid, selectedAttributes, adapter) {
  try {
    const { language } = getLanguageAndStoreId(adapter);
    return await adapter.fetchProductVariants(
      uuid,
      selectedAttributes,
      language
    );
  } catch (error) {
    console.error("Error fetching product variants:", error);
    notifyUser(t("error_fetching_variants"), true);
    return [];
  }
}

export async function fetchSettings(adapter) {
  try {
    const { language } = getLanguageAndStoreId(adapter);
    return await adapter.fetchSettings(language);
  } catch (error) {
    console.error("Error fetching settings:", error);
    notifyUser(t("error_fetching_settings"), true);
    return {};
  }
}
