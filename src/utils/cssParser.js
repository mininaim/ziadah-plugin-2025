export function parseCustomCSS(customCSS) {
  const styleElement = document.createElement("style");
  styleElement.textContent = customCSS;

  const tempDiv = document.createElement("div");
  tempDiv.appendChild(styleElement);
  document.body.appendChild(tempDiv);

  const styles = {};
  try {
    for (const rule of styleElement.sheet.cssRules) {
      if (rule instanceof CSSStyleRule) {
        styles[rule.selectorText] = {};
        for (let i = 0; i < rule.style.length; i++) {
          const property = rule.style[i];
          const value = rule.style.getPropertyValue(property);
          styles[rule.selectorText][property] = value;
        }
      } else if (rule instanceof CSSMediaRule) {
        styles[`@media ${rule.conditionText}`] = parseMediaRule(rule);
      }
    }
  } catch (error) {
    console.error("Error parsing CSS:", error);
  }

  document.body.removeChild(tempDiv);
  return styles;
}

function parseMediaRule(mediaRule) {
  const mediaStyles = {};
  for (const rule of mediaRule.cssRules) {
    if (rule instanceof CSSStyleRule) {
      mediaStyles[rule.selectorText] = {};
      for (let i = 0; i < rule.style.length; i++) {
        const property = rule.style[i];
        const value = rule.style.getPropertyValue(property);
        mediaStyles[rule.selectorText][property] = value;
      }
    }
  }
  return mediaStyles;
}

export function generateCSSString(styles) {
  let cssString = "";
  for (const [selector, properties] of Object.entries(styles)) {
    if (selector.startsWith("@media")) {
      cssString += `${selector} {\n`;
      cssString += generateCSSString(properties);
      cssString += "}\n";
    } else {
      cssString += `${selector} {\n`;
      for (const [property, value] of Object.entries(properties)) {
        cssString += `  ${property}: ${value};\n`;
      }
      cssString += "}\n";
    }
  }
  return cssString;
}
