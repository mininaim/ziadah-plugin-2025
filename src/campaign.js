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
    console.log("Event ID:", eventID);
    console.log("Event name:", eventName);

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
          highestPriorityCampaign.action_products.map((p) => p.uuid)
        );

        // console.log("Campaign data:", result);

        if (!result) {
          console.error("Failed to get campaign data");
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
  console.log("Filtering campaigns:", campaigns);
  console.log("Target product ID:", targetProductId);
  console.log("Event name:", eventName);

  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    console.log("No campaigns available");
    return null;
  }

  const activeCampaigns = campaigns.filter((campaign) => {
    // Check if the campaign is active
    if (campaign.status?.value !== 1) {
      console.log(`Campaign ${campaign.id} is not active`);
      return false;
    }

    const triggerType =
      campaign.trigger_product_type?.value_string?.toLowerCase();
    console.log(`Campaign ${campaign.id} trigger type:`, triggerType);

    // Check if the campaign applies to all products
    if (triggerType === "all products") {
      console.log(`Campaign ${campaign.id} applies to all products`);
      return true;
    }

    // If it's not "all products", we need a target product ID
    if (!targetProductId) {
      console.log("No target product ID provided");
      return false;
    }

    // Check if the campaign's trigger products include the target product
    const matchesTriggerProduct = campaign.trigger_products?.some(
      (product) => product.uuid === targetProductId
    );
    console.log(
      `Campaign ${campaign.id} matches trigger product:`,
      matchesTriggerProduct
    );

    return matchesTriggerProduct;
  });

  console.log("Active campaigns after filtering:", activeCampaigns);

  if (activeCampaigns.length === 0) {
    console.log("No active campaigns found");
    return null;
  }

  // Find the campaign with the highest priority
  const highestPriorityCampaign = activeCampaigns.reduce((prev, current) =>
    (current.priority || 0) > (prev.priority || 0) ? current : prev
  );

  // console.log("Highest priority campaign:", highestPriorityCampaign); // This is the first log
  return highestPriorityCampaign;
}
async function showCampaignPopup(campaignData) {
  console.log("Showing campaign popup with data:", campaignData);
  // console.log(
  //   "showCampaignPopup called with data:",
  //   JSON.stringify(campaignData, null, 2)
  // );

  if (!campaignData || !campaignData.id) {
    console.error("Invalid campaign data");
    notifyUser(t("campaign_error"), true);
    return;
  }

  const state = getState();
  console.log("Current state:", state);

  try {
    const popupType = campaignData.style?.title?.en?.toLowerCase() || "modal";
    const PopupComponent = await state.popupFactory.createPopup(
      popupType,
      campaignData,
      state.settings
    );

    if (!PopupComponent) {
      throw new Error("Failed to create popup component");
    }

    await PopupComponent.showProducts(
      campaignData.action_products || [],
      campaignData.trigger_products || [],
      {
        has_coupon: campaignData.is_product_coupon_enabled,
        coupon: campaignData.coupon,
      },
      campaignData.type?.id,
      campaignData.card,
      campaignData.alternative_products,
      campaignData.is_alternative_product_enabled,
      state.lastEventName === "add-remove-cart"
        ? state.lastEventData?.id
        : null,
      campaignData.campaign_settings
    );
  } catch (error) {
    console.error("Error showing popup:", error);
    notifyUser(t("campaign_error"), true);
  }
}

export function restartCampaign() {
  const state = getState();
  campaign(state.lastEventID, state.lastEventName, state.lastEventData, true);
  setState({ isRestarted: true });
}
