import { t, sanitizeInput } from "../utils";

export class Coupon {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
  }

  create(couponData) {
    if (!couponData) return null;

    const couponElement = document.createElement("div");
    couponElement.classList.add("ziadah-coupon");

    const styles = document.createElement("style");
    styles.textContent = this.getStyles();

    couponElement.innerHTML = this.generateCouponContent(couponData);

    couponElement.prepend(styles);
    this.couponElement = couponElement;

    this.setupEventListeners();

    return couponElement;
  }

  getStyles() {
    return `
      .ziadah-coupon {
        border: 1px solid #ddd;
        padding: 15px;
        margin-top: 20px;
        border-radius: 5px;
      }
      .coupon-code {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .coupon-description {
        margin-bottom: 10px;
      }
      .copy-coupon {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 5px;
      }
    `;
  }

  generateCouponContent(couponData) {
    const lang = this.adapter.getLanguage();
    return `
      <div class="coupon-code">${sanitizeInput(couponData.code)}</div>
      <div class="coupon-description">${couponData.description[lang]}</div>
      <div class="coupon-discount">${this.formatDiscount(couponData)}</div>
      <button class="copy-coupon" data-coupon-code="${couponData.code}">${t(
      "copy_coupon"
    )}</button>
    `;
  }

  formatDiscount(couponData) {
    if (couponData.discount_type.value === 2) {
      return `${couponData.discount}% ${t("off")}`;
    } else {
      return `${couponData.discount} ${couponData.currency} ${t("off")}`;
    }
  }

  setupEventListeners() {
    this.couponElement.addEventListener("click", (e) => {
      if (e.target.classList.contains("copy-coupon")) {
        const couponCode = e.target.dataset.couponCode;
        this.handleCouponCopy(couponCode);
      }
    });
  }

  handleCouponCopy(couponCode) {
    navigator.clipboard
      .writeText(couponCode)
      .then(() => {
        console.log("Coupon copied to clipboard");
        this.adapter.sendClickData(
          this.adapter.getStoreId(),
          null,
          5,
          null,
          null
        );
      })
      .catch((err) => console.error("Failed to copy coupon: ", err));
  }

  update(couponData) {
    if (this.couponElement) {
      this.couponElement.innerHTML = this.generateCouponContent(couponData);
    }
  }
}
