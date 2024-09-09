const allowedProperties = [
  "color",
  "background-color",
  "font-size",
  "font-family",
  "font-weight",
  "text-align",
  "line-height",
  "letter-spacing",
  "text-transform",
  "border",
  "border-radius",
  "padding",
  "margin",
  "width",
  "height",
  "display",
  "flex-direction",
  "justify-content",
  "align-items",
  "box-shadow",
  "opacity",
  "transition",
];

const allowedValues = [
  /^#([0-9A-Fa-f]{3}){1,2}$/,
  /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
  /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:0|1|0?\.\d+)\s*\)$/,
  /^(?:(?:0|[1-9]\d*)(?:\.\d+)?|\.\d+)(?:px|em|rem|%|vh|vw)$/,
  /^(?:normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900)$/,
  /^(?:left|center|right|justify)$/,
  /^(?:flex|block|inline|inline-block|none)$/,
  /^(?:row|column)$/,
  /^(?:flex-start|flex-end|center|space-between|space-around)$/,
];

export function sanitizeCSS(css) {
  if (typeof css !== "string") {
    console.warn("Invalid CSS input:", css);
    return "";
  }

  css = css.replace(/\/\*[\s\S]*?\*\//g, "");

  css = css.replace(/@import/gi, "");
  css = css.replace(/expression\s*\(/gi, "");
  css = css.replace(/@(document|charset|import|namespace|page|supports)/gi, "");

  const parsedCSS = parseCSS(css);

  for (const selector in parsedCSS) {
    const sanitizedProperties = {};
    for (const property in parsedCSS[selector]) {
      if (allowedProperties.includes(property)) {
        const value = parsedCSS[selector][property];
        if (isAllowedValue(value)) {
          sanitizedProperties[property] = value;
        }
      }
    }
    parsedCSS[selector] = sanitizedProperties;
  }

  return reconstructCSS(parsedCSS);
}

function parseCSS(css) {
  const rules = {};
  const rulesets = css.match(/[^\{\}]+\{[^\}]+\}/g) || [];

  rulesets.forEach((ruleset) => {
    const [selector, declarations] = ruleset.split("{");
    rules[selector.trim()] = {};
    const props = declarations.slice(0, -1).split(";");
    props.forEach((prop) => {
      const [property, value] = prop.split(":");
      if (property && value) {
        rules[selector.trim()][property.trim()] = value.trim();
      }
    });
  });

  return rules;
}

function isAllowedValue(value) {
  return allowedValues.some((pattern) => pattern.test(value));
}

function reconstructCSS(rules) {
  let css = "";
  for (const selector in rules) {
    css += `${selector} {\n`;
    for (const property in rules[selector]) {
      css += `  ${property}: ${rules[selector][property]};\n`;
    }
    css += "}\n";
  }
  return css;
}
