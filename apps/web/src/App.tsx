import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setProducts, setConfig, setProductsLoading, setProductsError, openProductDetail } from "@/store";
import { getProducts, getConfig } from "@/api/client";
import { ProductList } from "@/components/ProductList";
import { ProductDetail } from "@/components/ProductDetail";
import { CheckoutModal } from "@/components/CheckoutModal";
import { SummaryBackdrop } from "@/components/SummaryBackdrop";
import { ResultScreen } from "@/components/ResultScreen";
import { ResultadoPagoPage } from "@/pages/ResultadoPagoPage";
import { useAppSelector } from "@/store/useAppSelector";

function App() {
  const dispatch = useDispatch();
  const { products, step, productsLoading, productsError } = useAppSelector((s) => s.checkout);

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
        }
      } catch (e) {
        if (!cancelled)
          dispatch(setProductsError(e instanceof Error ? e.message : "Failed to load"));
      }
    })();
    return () => { cancelled = true; };
  }, [dispatch, isResultadoPago]);

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
