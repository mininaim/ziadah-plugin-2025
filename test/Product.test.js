import { Product } from "../src/components/Product";

describe("Product", () => {
  it("should create a product element", () => {
    const product = new Product();
    const element = product.create({ name: "Test Product", price: 10 });
    expect(element).toBeDefined();
    expect(element.querySelector(".product-name").textContent).toBe(
      "Test Product"
    );
  });
});
