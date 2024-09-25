import { modalConfig } from "../config/modalConfig";
import { escapeHtml, copyToClipboard } from "../utils/modalUtils";

export class CouponSection {
  constructor(shadowRoot, adapter) {
    this.shadowRoot = shadowRoot;
    this.adapter = adapter;
    this.config = modalConfig;
  }

  render(coupon) {
    if (!coupon || !coupon.code) return "";

    const couponCode = escapeHtml(coupon.code);
    return `
      <div class="${this.config.classNames.coupon}">
        <p>${this.adapter.t("coupon_code")}: <span class="${
      this.config.classNames.couponCode
    }">${couponCode}</span></p>
        <button class="${this.config.classNames.copyCoupon}">${this.adapter.t(
      "copy"
    )}</button>
      </div>
    `;
  }

  setupEventListeners() {
    const copyButton = this.shadowRoot.querySelector(
      `.${this.config.classNames.copyCoupon}`
    );
    const couponCodeElement = this.shadowRoot.querySelector(
      `.${this.config.classNames.couponCode}`
    );

    if (copyButton && couponCodeElement) {
      copyButton.addEventListener("click", () =>
        this.handleCopyClick(couponCodeElement.textContent)
      );
    }
  }

  async handleCopyClick(couponCode) {
    try {
      await copyToClipboard(couponCode);
      this.showCopiedMessage();
    } catch (error) {
      console.error("Failed to copy coupon code:", error);
    }
  }

  showCopiedMessage() {
    const copyButton = this.shadowRoot.querySelector(
      `.${this.config.classNames.copyCoupon}`
    );
    const originalText = copyButton.textContent;
    copyButton.textContent = this.adapter.t("copied");
    copyButton.disabled = true;

    setTimeout(() => {
      copyButton.textContent = originalText;
      copyButton.disabled = false;
    }, 2000);
  }

  update(coupon) {
    const couponContainer = this.shadowRoot.querySelector(
      `.${this.config.classNames.coupon}`
    );
    if (couponContainer) {
      couponContainer.innerHTML = this.render(coupon);
      this.setupEventListeners();
    }
  }
}
