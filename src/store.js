class Store {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const store = new Store({
  campaigns: [],
  activePopup: null,
  cart: [],
  language: document.documentElement.lang || "en",
  currentCampaignID: "",
  lastEventID: "",
  lastEventName: "",
  lastEventData: {},
  lowerCampaign: {},
  isRestarted: false,
  killThePopup: false,
  allAddedSuccessfully: true,
  replacableProduct: [],
  productAdded: false,
  settings: {},
  popupType: "modal",
  pluginActive: false,
  campaignActive: false,
});

export const getState = () => store.getState();
export const setState = (newState) => store.setState(newState);
export const subscribe = (listener) => store.subscribe(listener);
