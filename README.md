# Ziadah Plugin

A customizable e-commerce plugin for enhancing the shopping experience on Ziadah-powered stores.

## Features

- Dynamic product recommendations
- Customizable popups (Modal and Offcanvas)
- Campaign management
- Multi-language support (English and Arabic)
- Coupon handling
- Adaptable to different e-commerce platforms

## Installation

1. Clone this repository:
git clone https://github.com/mininam/ziadah-plugin.git

2. Install dependencies:
npm install

3. Build the plugin:
npm run build

4. Copy the generated `bundle.js` file to your Ziadah store's `assets` folder.

## Usage

Include the built plugin in your HTML:

```html
<script src="path/to/ziadah-plugin.js"></script>
```

Then, add the custom element to your page:

```html
<ziadah-plugin></ziadah-plugin>
```

## Development

To develop the plugin, run the development server:

```bash
npm run dev
```

## Testing

Open test/test.html in your browser to test the plugin functionality.
```

Customization
The plugin can be customized by modifying the following files:

`src/config.js`: Configuration settings
`src/languages/`: Language translations
`src/components/`: UI components
`src/adapters/`: E-commerce platform adapters


## Configuration

You can configure the plugin by passing options to the `ZiadahPlugin` constructor:

```javascript
const plugin = new ZiadahPlugin({
    // Your configuration options here
});
```

## Customization

You can customize the plugin's behavior by extending the `ZiadahPlugin` class and overriding the desired methods.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

