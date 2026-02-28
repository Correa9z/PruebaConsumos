import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setProducts, setConfig, setProductsLoading, setProductsError } from "@/store";
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
          dispatch(setProductsError(e instanceof Error ? e.message : "Error al cargar"));
      }
    })();
    return () => { cancelled = true; };
  }, [dispatch, isResultadoPago]);

  if (isResultadoPago) {
    return (
      <ResultadoPagoPage
        searchString={typeof window !== "undefined" ? window.location.search : ""}
        onBack={() => { window.location.href = "/"; }}
      />
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Tienda</h1>
      </header>
      <main className="app__main">
        {productsLoading && <p className="app__loading">Cargando productos…</p>}
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
