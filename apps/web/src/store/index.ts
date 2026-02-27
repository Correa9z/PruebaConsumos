import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product, Config, DeliveryInfo, CardInfo } from "@/types";

type Step = "list" | "detail" | "modal" | "summary" | "result";

interface CheckoutState {
  products: Product[];
  config: Config | null;
  selectedProduct: Product | null;
  selectedQuantity: number;
  step: Step;
  card: CardInfo;
  delivery: DeliveryInfo;
  customerEmail: string;
  customerFullName: string;
  paymentSuccess: boolean | null;
  paymentError: string | null;
}

const initialState: CheckoutState = {
  products: [],
  config: null,
  selectedProduct: null,
  selectedQuantity: 1,
  step: "list",
  card: { number: "", cvc: "", expMonth: "", expYear: "", cardholderName: "" },
  delivery: { address: "", city: "", region: "", phone: "", postalCode: "" },
  customerEmail: "",
  customerFullName: "",
  paymentSuccess: null,
  paymentError: null,
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.products = action.payload;
    },
    setConfig(state, action: PayloadAction<Config>) {
      state.config = action.payload;
    },
    selectProduct(state, action: PayloadAction<Product | null>) {
      state.selectedProduct = action.payload;
      state.selectedQuantity = 1;
    },
    setQuantity(state, action: PayloadAction<number>) {
      const max = state.selectedProduct ? Math.min(state.selectedProduct.stock, 99) : 99;
      state.selectedQuantity = Math.max(1, Math.min(action.payload, max));
    },
    openProductDetail(state, action: PayloadAction<Product>) {
      state.selectedProduct = action.payload;
      state.selectedQuantity = 1;
      state.step = "detail";
    },
    backToList(state) {
      state.step = "list";
      state.selectedProduct = null;
      state.selectedQuantity = 1;
    },
    openModal(state) {
      state.step = "modal";
    },
    closeModal(state) {
      state.step = "detail";
    },
    confirmCardAndDelivery(state) {
      state.step = "summary";
    },
    setCard(state, action: PayloadAction<Partial<CardInfo>>) {
      state.card = { ...state.card, ...action.payload };
    },
    setDelivery(state, action: PayloadAction<Partial<DeliveryInfo>>) {
      state.delivery = { ...state.delivery, ...action.payload };
    },
    setCustomer(state, action: PayloadAction<{ email: string; fullName: string }>) {
      state.customerEmail = action.payload.email;
      state.customerFullName = action.payload.fullName;
    },
    backToModal(state) {
      state.step = "modal";
    },
    setPaymentSuccess(state, action: PayloadAction<boolean>) {
      state.paymentSuccess = action.payload;
      state.paymentError = null;
      state.step = "result";
    },
    setPaymentError(state, action: PayloadAction<string>) {
      state.paymentError = action.payload;
      state.paymentSuccess = false;
      state.step = "result";
    },
    goToProducts(state) {
      if (state.paymentSuccess && state.selectedProduct && state.selectedQuantity > 0) {
        state.products = state.products.map((p) =>
          p.id === state.selectedProduct!.id
            ? { ...p, stock: Math.max(0, p.stock - state.selectedQuantity) }
            : p
        );
      }
      state.step = "list";
      state.selectedProduct = null;
      state.selectedQuantity = 1;
      state.paymentSuccess = null;
      state.paymentError = null;
    },
  },
});

export const {
  setProducts,
  setConfig,
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
  goToProducts,
} = checkoutSlice.actions;

export const store = configureStore({ reducer: { checkout: checkoutSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
