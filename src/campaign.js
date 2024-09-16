import { getState, setState } from "./store";
import { getCampaignData, fetchCampaigns } from "./api";
import { t, notifyUser, logError } from "./utils";

export async function campaign(
  eventID,
  eventName,
  eventCallback,
  restartWithLower = false
) {
  const state = getState();

  // Check if a campaign is already active
  if (state.campaignActive && !restartWithLower) {
    console.log("Campaign is already active, skipping campaign");
    return;
  }

  // Set campaignActive to true to indicate a campaign is running
  setState({ campaignActive: true });

  try {
    console.log("Event callback:", JSON.stringify(eventCallback, null, 2));

    setState({
      lastEventID: eventID,
      lastEventName: eventName,
      lastEventCallback: eventCallback,
    });

    const adapter = state.adapter;

    console.log("Current adapter:", adapter);

    if (!restartWithLower) {
      const data = await fetchCampaigns(eventID, adapter);

      console.log("Fetched campaigns data:", data);

      if (data.is_success) {
        let highestPriorityCampaign = filterCampaignsByTriggerProductId(
          data.data,
          eventCallback?.id,
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
          highestPriorityCampaign.action_products,
          adapter
        );

        console.log("Campaign data:", result);

        setState({
          currentCampaignID: result.id,
          lowerCampaign:
            data.data.find(
              (c) => c.priority < highestPriorityCampaign.priority
            ) || {},
        });

        await showCampaignPopup(result);
      }
    } else {
      const lowerCampaign = state.lowerCampaign;
      if (!lowerCampaign.id) {
        notifyUser(t("no_more_campaigns"), false);
        return;
      }

      const result = await getCampaignData(
        lowerCampaign.id,
        eventID,
        lowerCampaign.action_products,
        adapter
      );

      setState({ currentCampaignID: result.id });

      await showCampaignPopup(result);
    }
  } catch (error) {
    console.error("Error in campaign:", error);
    logError(error, "Operation Context");
    notifyUser(t("campaign_error"), true);
  } finally {
    // Reset campaignActive to false when campaign ends
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

  if (!campaignData) {
    console.error("No campaign data to show");
    return;
  }

  const state = getState();
  console.log("Current state:", state);
  const PopupComponent = state.popupFactory.createPopup(state.popupType);
  console.log("Created PopupComponent:", PopupComponent);

  if (
    campaignData.action_products?.length === 0 &&
    campaignData.is_product_coupon_enabled
  ) {
    await PopupComponent.showCoupon(campaignData.coupon);
  } else {
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
        ? state.lastEventCallback?.id
        : null,
      campaignData.campaign_settings
    );
  }
}

export function restartCampaign() {
  const state = getState();
  campaign(
    this,
    state.lastEventID,
    state.lastEventName,
    state.lastEventCallback,
    true
  );
  setState({ isRestarted: true });
}

export default campaign;
