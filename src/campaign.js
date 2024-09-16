// campaign.js
import { getState, setState } from "./store";
import { t, notifyUser, logError } from "./utils";

export async function campaign(
  eventID,
  eventName,
  eventData,
  restartWithLower = false
) {
  const state = getState();
  if (state.campaignActive && !restartWithLower) {
    console.log("Campaign is already active, skipping campaign");
    return;
  }

  setState({ campaignActive: true });

  try {
    console.log("Event data:", JSON.stringify(eventData, null, 2));

    setState({
      lastEventID: eventID,
      lastEventName: eventName,
      lastEventData: eventData,
    });

    const adapter = state.adapter;

    console.log("Current adapter:", adapter);

    if (!restartWithLower) {
      const data = await adapter.fetchCampaigns(eventID);

      console.log("Fetched campaigns data:", data);

      if (data.is_success) {
        let highestPriorityCampaign = filterCampaignsByTriggerProductId(
          data.data,
          eventData?.id,
          eventName
        );

        console.log("Highest priority campaign:", highestPriorityCampaign);

        if (!highestPriorityCampaign) {
          console.log("No matching campaign found");
          return;
        }

        const result = await adapter.getCampaignData(
          highestPriorityCampaign.id,
          eventID,
          highestPriorityCampaign.action_products
        );

        console.log("Campaign data:", result);

        if (!result.is_success) {
          console.error("Failed to get campaign data:", result.message);
          notifyUser(t("campaign_error"), true);
          return;
        }

        setState({
          currentCampaignID: result.id,
          lowerCampaign:
            data.data.find(
              (c) => c.priority < highestPriorityCampaign.priority
            ) || {},
        });

        await showCampaignPopup(result);
      } else {
        console.log("API did not return success");
        notifyUser(t("no_campaigns_available"), false);
      }
    } else {
      const lowerCampaign = state.lowerCampaign;
      if (!lowerCampaign.id) {
        notifyUser(t("no_more_campaigns"), false);
        return;
      }

      const result = await adapter.getCampaignData(
        lowerCampaign.id,
        eventID,
        lowerCampaign.action_products
      );

      setState({ currentCampaignID: result.id });

      await showCampaignPopup(result);
    }
  } catch (error) {
    console.error("Error in campaign:", error);
    logError(error, "Campaign Execution");
    notifyUser(t("campaign_error"), true);
  } finally {
    setState({ campaignActive: false });
  }
}

function filterCampaignsByTriggerProductId(
  campaigns,
  targetProductId,
  eventName
) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    console.log("No campaigns available");
    return null;
  }

  const activeCampaigns = campaigns.filter((campaign) => {
    if (campaign.status?.value !== 1) return false;
    if (
      campaign.trigger_product_type?.value_string?.toLowerCase() ===
      "all products"
    )
      return true;
    if (!targetProductId) return false;
    return campaign.trigger_products?.some(
      (product) => product.uuid === targetProductId
    );
  });

  if (activeCampaigns.length === 0) return null;

  return activeCampaigns.reduce((prev, current) =>
    (current.priority || 0) > (prev.priority || 0) ? current : prev
  );
}

async function showCampaignPopup(campaignData) {
  console.log("showCampaignPopup called with data:", campaignData);

  // Ensure campaignData is valid
  if (!campaignData || !campaignData.is_success) {
    console.error("Invalid campaign data");
    notifyUser(t("campaign_error"), true);
    return;
  }

  const state = getState();
  console.log("Current state:", state);

  const PopupComponent = await state.popupFactory.createPopup(
    state.popupType,
    campaignData,
    state.settings
  );

  // Ensure PopupComponent exists and has the showProducts method
  if (PopupComponent && typeof PopupComponent.showProducts === "function") {
    await PopupComponent.showProducts(
      campaignData.data.action_products || [],
      campaignData.data.trigger_products || [],
      {
        has_coupon: campaignData.data.is_product_coupon_enabled,
        coupon: campaignData.data.coupon,
      },
      campaignData.data.type?.id,
      campaignData.data.card,
      campaignData.data.alternative_products,
      campaignData.data.is_alternative_product_enabled,
      state.lastEventName === "add-remove-cart"
        ? state.lastEventData?.id
        : null,
      campaignData.data.campaign_settings
    );
  } else {
    console.error("PopupComponent or showProducts method is not available");
  }
}

export function restartCampaign() {
  const state = getState();
  campaign(state.lastEventID, state.lastEventName, state.lastEventData, true);
  setState({ isRestarted: true });
}
