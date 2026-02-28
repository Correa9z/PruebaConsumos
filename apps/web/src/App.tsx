import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setProducts, setConfig, setProductsLoading, setProductsError, openProductDetail, openModal, setQuantity } from "@/store";
import { getProducts, getConfig } from "@/api/client";
import { ProductList } from "@/components/ProductList";
import { ProductDetail } from "@/components/ProductDetail";
import { CheckoutModal } from "@/components/CheckoutModal";
import { SummaryBackdrop } from "@/components/SummaryBackdrop";
import { ResultScreen } from "@/components/ResultScreen";
import { ResultadoPagoPage } from "@/pages/ResultadoPagoPage";
import { useAppSelector } from "@/store/useAppSelector";

const CHECKOUT_PROGRESS_KEY = "checkoutProgress";

function App() {
  const dispatch = useDispatch();
  const { products, step, productsLoading, productsError, selectedProduct, selectedQuantity } = useAppSelector((s) => s.checkout);
  const hasRestored = useRef(false);

  const isResultadoPago =
    typeof window !== "undefined" &&
    (window.location.pathname === "/resultado-pago" || window.location.pathname === "/resultado-pago/");

  useEffect(() => {
    if (isResultadoPago) return;
    let cancelled = false;
    dispatch(setProductsLoading(true));
    (async () => {
      try {
        const [productList, configData] = await Promise.all([
          getProducts(),
          getConfig(),
        ]);
        if (!cancelled) {
          dispatch(setProducts(productList));
          dispatch(setConfig(configData));
          // Restore progress after refresh (resilience)
          try {
            const raw = sessionStorage.getItem(CHECKOUT_PROGRESS_KEY);
            const saved = raw ? (JSON.parse(raw) as { step?: string; productId?: string | null; quantity?: number }) : null;
            if (saved?.productId && saved.step && saved.step !== "list" && !hasRestored.current) {
              const product = productList.find((p) => p.id === saved.productId);
              if (product) {
                hasRestored.current = true;
                dispatch(openProductDetail(product));
                const qty = typeof saved.quantity === "number" && saved.quantity >= 1 ? Math.min(saved.quantity, product.stock, 99) : 1;
                dispatch(setQuantity(qty));
                if (saved.step === "modal") dispatch(openModal());
              }
            }
          } catch {
            // ignore invalid stored data
          }
        }
      } catch (e) {
        if (!cancelled)
          dispatch(setProductsError(e instanceof Error ? e.message : "Failed to load"));
      }
    })();
    return () => { cancelled = true; };
  }, [dispatch, isResultadoPago]);

  // Persist checkout progress for recovery on refresh
  useEffect(() => {
    if (isResultadoPago || typeof sessionStorage === "undefined") return;
    try {
      const payload = {
        step,
        productId: selectedProduct?.id ?? null,
        quantity: selectedQuantity,
      };
      sessionStorage.setItem(CHECKOUT_PROGRESS_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [step, selectedProduct?.id, selectedQuantity, isResultadoPago]);

  // Open product detail when returning from result page with ?productId=xxx
  useEffect(() => {
    if (isResultadoPago || productsLoading || products.length === 0) return;
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const productId = params?.get("productId");
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (product) {
      dispatch(openProductDetail(product));
      window.history.replaceState({}, "", window.location.pathname || "/");
    }
  }, [isResultadoPago, productsLoading, products, dispatch]);

  if (isResultadoPago) {
    return (
      <ResultadoPagoPage
        searchString={typeof window !== "undefined" ? window.location.search : ""}
        onBack={(productId) => {
          const url = productId ? `/?productId=${encodeURIComponent(productId)}` : "/";
          window.location.href = url;
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Store</h1>
      </header>
      <main className="app__main">
        {productsLoading && <p className="app__loading">Loading products…</p>}
        {productsError && <p className="app__error">{productsError}</p>}
        {!productsLoading && !productsError && products.length > 0 && step === "list" && <ProductList />}
        {step === "detail" && <ProductDetail />}
      </main>
      {step === "modal" && <CheckoutModal />}
      {step === "summary" && <SummaryBackdrop />}
      {step === "result" && <ResultScreen />}
    </div>
  );
}

export default App;
