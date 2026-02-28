import {
  checkoutSlice,
  setProducts,
  setConfig,
  setProductsLoading,
  setProductsError,
  selectProduct,
  setQuantity,
  openProductDetail,
  backToList,
  openModal,
  closeModal,
  confirmCardAndDelivery,
  setCard,
  setDelivery,
  setCustomer,
  backToModal,
  setPaymentSuccess,
  setPaymentError,
  setWompiAcceptance,
  setPaymentMethodToken,
  goToProducts,
  backToProductDetail,
} from "../index";

describe("checkout slice", () => {
  const reducer = checkoutSlice.reducer;
  const initialState = checkoutSlice.getInitialState();

  it("setProducts updates products and clears loading", () => {
    const products = [{ id: "1", name: "P1", description: "D", priceInCents: 100, stock: 5, imageUrls: [] }];
    const state = reducer(initialState, setProducts(products));
    expect(state.products).toEqual(products);
    expect(state.productsLoading).toBe(false);
    expect(state.productsError).toBeNull();
  });

  it("setConfig sets config", () => {
    const config = { baseFeeInCents: 500, deliveryFeeInCents: 1500, wompiPublicKey: undefined, wompiBaseUrl: undefined };
    const state = reducer(initialState, setConfig(config));
    expect(state.config).toEqual(config);
  });

  it("setProductsLoading sets loading flag", () => {
    const state = reducer(initialState, setProductsLoading(true));
    expect(state.productsLoading).toBe(true);
    const state2 = reducer(state, setProductsLoading(false));
    expect(state2.productsLoading).toBe(false);
  });

  it("setProductsError sets error and clears loading", () => {
    const state = reducer(initialState, setProductsError("Network error"));
    expect(state.productsError).toBe("Network error");
    expect(state.productsLoading).toBe(false);
  });

  it("selectProduct sets selectedProduct and resets quantity to 1", () => {
    const product = { id: "1", name: "P", description: "", priceInCents: 100, stock: 5, imageUrls: [] };
    const state = reducer(initialState, selectProduct(product));
    expect(state.selectedProduct).toEqual(product);
    expect(state.selectedQuantity).toBe(1);
  });

  it("setQuantity clamps between 1 and product stock", () => {
    const withProduct = reducer(initialState, setProducts([{ id: "1", name: "P", description: "", priceInCents: 100, stock: 5, imageUrls: [] }]));
    const selected = reducer(withProduct, openProductDetail({ id: "1", name: "P", description: "", priceInCents: 100, stock: 5, imageUrls: [] }));
    const state = reducer(selected, setQuantity(3));
    expect(state.selectedQuantity).toBe(3);
    const stateMax = reducer(selected, setQuantity(10));
    expect(stateMax.selectedQuantity).toBe(5);
  });

  it("setQuantity uses max 99 when no product selected", () => {
    const state = reducer(initialState, setQuantity(50));
    expect(state.selectedQuantity).toBe(50);
    const stateHigh = reducer(initialState, setQuantity(200));
    expect(stateHigh.selectedQuantity).toBe(99);
  });

  it("openProductDetail sets step to detail", () => {
    const product = { id: "1", name: "P", description: "", priceInCents: 100, stock: 5, imageUrls: [] };
    const state = reducer(initialState, openProductDetail(product));
    expect(state.step).toBe("detail");
    expect(state.selectedProduct).toEqual(product);
  });

  it("backToList resets to list", () => {
    const state = reducer(initialState, openProductDetail({ id: "1", name: "P", description: "", priceInCents: 100, stock: 5, imageUrls: [] }));
    const next = reducer(state, backToList());
    expect(next.step).toBe("list");
    expect(next.selectedProduct).toBeNull();
  });

  it("openModal sets step to modal", () => {
    const state = reducer(initialState, openModal());
    expect(state.step).toBe("modal");
  });

  it("closeModal sets step to detail", () => {
    const state = reducer(initialState, closeModal());
    expect(state.step).toBe("detail");
  });

  it("confirmCardAndDelivery sets step to summary", () => {
    const state = reducer(initialState, confirmCardAndDelivery());
    expect(state.step).toBe("summary");
  });

  it("setCard merges card partial", () => {
    const state = reducer(initialState, setCard({ number: "4111" }));
    expect(state.card.number).toBe("4111");
  });

  it("setDelivery merges delivery partial", () => {
    const state = reducer(initialState, setDelivery({ address: "Calle 1" }));
    expect(state.delivery.address).toBe("Calle 1");
  });

  it("setCustomer updates email and fullName", () => {
    const state = reducer(initialState, setCustomer({ email: "a@b.co", fullName: "Name" }));
    expect(state.customerEmail).toBe("a@b.co");
    expect(state.customerFullName).toBe("Name");
  });

  it("backToModal sets step to modal", () => {
    const state = reducer(initialState, backToModal());
    expect(state.step).toBe("modal");
  });

  it("setPaymentSuccess sets step to result", () => {
    const state = reducer(initialState, setPaymentSuccess(true));
    expect(state.step).toBe("result");
    expect(state.paymentSuccess).toBe(true);
  });

  it("setPaymentError sets step to result and error", () => {
    const state = reducer(initialState, setPaymentError("Failed"));
    expect(state.step).toBe("result");
    expect(state.paymentError).toBe("Failed");
  });

  it("setWompiAcceptance sets acceptance data", () => {
    const state = reducer(initialState, setWompiAcceptance({ acceptanceToken: "at", acceptPersonalAuth: "apa" }));
    expect(state.wompiAcceptance).toEqual({ acceptanceToken: "at", acceptPersonalAuth: "apa" });
    const stateNull = reducer(state, setWompiAcceptance(null));
    expect(stateNull.wompiAcceptance).toBeNull();
  });

  it("setPaymentMethodToken sets token", () => {
    const state = reducer(initialState, setPaymentMethodToken("tok_123"));
    expect(state.paymentMethodToken).toBe("tok_123");
  });

  it("goToProducts updates stock on success and resets", () => {
    const withProduct = reducer(initialState, setProducts([
      { id: "1", name: "P", description: "", priceInCents: 100, stock: 10, imageUrls: [] },
    ]));
    const selected = reducer(withProduct, openProductDetail({ id: "1", name: "P", description: "", priceInCents: 100, stock: 10, imageUrls: [] }));
    const withQty = reducer(selected, setQuantity(3));
    const success = reducer(withQty, setPaymentSuccess(true));
    const next = reducer(success, goToProducts());
    expect(next.step).toBe("list");
    expect(next.products[0]?.stock).toBe(7);
  });

  it("goToProducts resets without updating stock when paymentSuccess is false", () => {
    const withProduct = reducer(initialState, setProducts([
      { id: "1", name: "P", description: "", priceInCents: 100, stock: 10, imageUrls: [] },
    ]));
    const selected = reducer(withProduct, openProductDetail({ id: "1", name: "P", description: "", priceInCents: 100, stock: 10, imageUrls: [] }));
    const withError = reducer(selected, setPaymentError("Failed"));
    const next = reducer(withError, goToProducts());
    expect(next.step).toBe("list");
    expect(next.products[0]?.stock).toBe(10);
  });

  it("backToProductDetail returns to detail step and clears payment state", () => {
    const withProduct = reducer(initialState, setProducts([
      { id: "1", name: "P", description: "", priceInCents: 100, stock: 10, imageUrls: [] },
    ]));
    const selected = reducer(withProduct, openProductDetail({ id: "1", name: "P", description: "", priceInCents: 100, stock: 10, imageUrls: [] }));
    const success = reducer(selected, setPaymentSuccess(true));
    const next = reducer(success, backToProductDetail());
    expect(next.step).toBe("detail");
    expect(next.selectedProduct).not.toBeNull();
    expect(next.paymentSuccess).toBeNull();
    expect(next.paymentError).toBeNull();
  });
});
