import { getState } from "./store";
import { notifyUser, t } from "./utils";

export async function fetchCampaigns(eventID, adapter) {
  try {
    const state = getState();
    const storeId = state.storeId || adapter.getStoreId();
    return await adapter.fetchCampaigns(eventID, storeId);
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
    const state = getState();
    const storeId = state.storeId || adapter.getStoreId();
    return await adapter.getCampaignData(
      campaign_id,
      event_id,
      action_products,
      storeId
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
    const state = getState();
    const storeUUID = state.storeId || adapter.getStoreId();
    return await adapter.sendClickData(
      storeUUID,
      campaignID,
      clickType,
      productId,
      quantity
    );
  } catch (error) {
    console.error("Error sending click data:", error);
    return { success: false };
  }
}

export async function sendConversionData(products, adapter) {
  try {
    const state = getState();
    const storeUUID = state.storeId || adapter.getStoreId();
    return await adapter.sendConversionData(storeUUID, products);
  } catch (error) {
    console.error("Error sending conversion data:", error);
    return { success: false };
  }
}

export async function fetchProductVariants(
  uuid,
  selectedAttributes,
  lang,
  adapter
) {
  try {
    return await adapter.fetchProductVariants(uuid, selectedAttributes, lang);
  } catch (error) {
    console.error("Error fetching product variants:", error);
    notifyUser(t("error_fetching_variants"), true);
    return [];
  }
}

export async function fetchSettings(adapter) {
  try {
    return await adapter.fetchSettings();
  } catch (error) {
    console.error("Error fetching settings:", error);
    notifyUser(t("error_fetching_settings"), true);
    return {};
  }
}
