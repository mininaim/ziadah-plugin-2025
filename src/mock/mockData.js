export const mockProducts = [
  {
    id: 45,
    uuid: "413d8d37-73fd-4b55-a1f9-814ffa92f9ef",
    sku: "Z.251073.16823625197568638",
    store_id: 251073,
    name: {
      en: "test 28",
      ar: "تيست 28",
    },
    quantity: null,
    is_infinite: true,
    price: 120,
    sale_price: null,
    currency: "SAR",
    weight: {
      value: 0,
      unit: "kg",
    },
    product_class: null,
    images: [
      {
        id: 23,
        images: {
          medium:
            "https://media.zid.store/thumbs/.../e0b1c8c5-thumbnail-500x500-70.jpg",
          small:
            "https://media.zid.store/thumbs/.../e0b1c8c5-thumbnail-370x370-70.jpg",
          full_size:
            "https://media.zid.store/thumbs/.../e0b1c8c5-thumbnail-770x770-70.jpg",
          thumbnail:
            "https://media.zid.store/thumbs/.../e0b1c8c5-thumbnail-100x100-70.jpg",
          large:
            "https://media.zid.store/thumbs/.../e0b1c8c5-thumbnail-770x770-70.jpg",
        },
      },
    ],
    child_products: [],
    attributes: [],
  },
  {
    id: 32,
    uuid: "052b288f-2d2c-4456-b2b9-f8265c552d1a",
    sku: "Z.431553.16958708551310303",
    store_id: 431553,
    name: {
      en: "Musk perfume from Salam",
      ar: "عطر المسك من سلام",
    },
    quantity: 0,
    is_infinite: false,
    price: 1425.78,
    sale_price: null,
    currency: "SAR",
    weight: {
      value: 0,
      unit: "kg",
    },
    product_class: null,
    images: [
      {
        id: 11,
        images: {
          medium:
            "https://media.zid.store/thumbs/.../dfc8e2f5-thumbnail-770x770-70.jpg",
          small:
            "https://media.zid.store/thumbs/.../dfc8e2f5-thumbnail-500x500-70.jpg",
          full_size:
            "https://media.zid.store/thumbs/.../dfc8e2f5-thumbnail-1000x1000-70.jpg",
          thumbnail:
            "https://media.zid.store/thumbs/.../dfc8e2f5-thumbnail-370x370-70.jpg",
          large:
            "https://media.zid.store/thumbs/.../dfc8e2f5-thumbnail-1000x1000-70.jpg",
        },
      },
    ],
    child_products: [],
    attributes: [],
  },
];

export const mockCampaigns = {
  is_success: true,
  status_code: 200,
  message: "",
  data: [
    {
      id: 1,
      title: "National Day 1 Add To Cart",
      status: {
        value: 1,
        value_string: "Active",
      },
      trigger_product_type: {
        value: 1,
        value_string: "All Products",
      },
      priority: 1,
      event: {
        id: 2,
        title: {
          en: "Add product to cart",
          ar: "إضافة منتج للسلة",
        },
        description: {
          en: "Once a product is added to the cart, you can target customer directly.",
          ar: "بمجرد إضافة المنتج المحدد للسلة يمكنك استهداف العميل مباشرة.",
        },
      },
      type: {
        id: 1,
        title: {
          en: "Up-Selling",
          ar: "البيع المكمل",
        },
        description: {
          en: "Encouraging customers to purchase a higher-end product.",
          ar: "تشجيع العملاء على شراء منتج ذو قيمة أعلى.",
        },
      },
      style: {
        id: 2,
        title: {
          en: "Popup Card",
          ar: "نافذة منبثقة",
        },
        description: {
          en: "A card will appear after the customer adds a product to the cart.",
          ar: "ستظهر النافذة بعد إضافة المنتج للسلة.",
        },
      },
      action_products: [
        {
          id: 45,
          uuid: "413d8d37-73fd-4b55-a1f9-814ffa92f9ef",
          store_id: 251073,
          name: {
            en: "test 28",
            ar: "تيست 28",
          },
          price: 120,
        },
        {
          id: 32,
          uuid: "052b288f-2d2c-4456-b2b9-f8265c552d1a",
          store_id: 431553,
          name: {
            en: "Musk perfume from Salam",
            ar: "عطر المسك من سلام",
          },
          price: 1425.78,
        },
      ],
    },
  ],
};

export const mockCart = {
  id: "mock-cart-id",
  products: [
    {
      id: 45,
      uuid: "413d8d37-73fd-4b55-a1f9-814ffa92f9ef",
      name: {
        en: "test 28",
        ar: "تيست 28",
      },
      quantity: 2,
      price: 120,
      sale_price: null,
      currency: "SAR",
      weight: {
        value: 0,
        unit: "kg",
      },
    },
    {
      id: 32,
      uuid: "052b288f-2d2c-4456-b2b9-f8265c552d1a",
      name: {
        en: "Musk perfume from Salam",
        ar: "عطر المسك من سلام",
      },
      quantity: 1,
      price: 1425.78,
      sale_price: null,
      currency: "SAR",
      weight: {
        value: 0,
        unit: "kg",
      },
    },
  ],
  products_count: 3,
  total: 1665.78,
  currency: "SAR",
};

export const mockProductVariants = {
  "413d8d37-73fd-4b55-a1f9-814ffa92f9ef": [
    {
      id: 1,
      name: "Size",
      values: ["Small", "Medium", "Large"],
    },
    {
      id: 2,
      name: "Color",
      values: ["Red", "Blue", "Green"],
    },
  ],
  "23555451-e570-47f5-af48-bed960fe972f": [
    {
      id: 1,
      name: "Size",
      values: ["Small", "Large"],
    },
    {
      id: 2,
      name: "Color",
      values: ["Green", "Yellow", "White", "Black"],
    },
  ],
};

export const mockOrders = [
  {
    id: "mock-order-1",
    products: [
      {
        id: "mock-product-1",
        uuid: "413d8d37-73fd-4b55-a1f9-814ffa92f9ef",
        name: "test 28",
        quantity: 2,
        price: 120,
        total: 240,
        source: "modal",
      },
      {
        id: "mock-product-2",
        uuid: "052b288f-2d2c-4456-b2b9-f8265c552d1a",
        name: "Musk perfume from Salam",
        quantity: 1,
        price: 1425.78,
        total: 1425.78,
        source: "popup",
      },
    ],
    total: 1665.78,
    currency: "SAR",
  },
];

export const mockSettings = {
  store: {
    id: 251073,
    name: "My E-commerce Store",
    logo: "https://media.zid.store/logos/mystore-logo.png",
    currency: "SAR",
    language: {
      default: "en",
      supported: ["en", "ar"],
    },
    contact: {
      email: "support@mystore.com",
      phone: "+966123456789",
    },
  },
  checkout: {
    minimum_order_value: 50,
    allow_guest_checkout: true,
    payment_methods: ["credit_card", "cash_on_delivery", "bank_transfer"],
  },
  shipping: {
    free_shipping_threshold: 500,
    default_shipping_fee: 20,
  },
  product: {
    show_out_of_stock: true,
    allow_backorders: false,
  },
  ui: {
    theme: "light",
    product_list_view: "grid",
    items_per_page: 20,
  },
  features: {
    enable_wishlist: true,
    enable_reviews: true,
    enable_compare: false,
  },
};
