import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setProducts, setConfig } from "@/store";
import { MOCK_PRODUCTS, MOCK_CONFIG } from "@/data/mock";
import { ProductList } from "@/components/ProductList";
import { ProductDetail } from "@/components/ProductDetail";
import { CheckoutModal } from "@/components/CheckoutModal";
import { SummaryBackdrop } from "@/components/SummaryBackdrop";
import { ResultScreen } from "@/components/ResultScreen";
import { useAppSelector } from "@/store/useAppSelector";

function App() {
  const dispatch = useDispatch();
  const { products, step } = useAppSelector((s) => s.checkout);

  useEffect(() => {
    dispatch(setProducts(MOCK_PRODUCTS));
    dispatch(setConfig(MOCK_CONFIG));
  }, [dispatch]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Tienda</h1>
      </header>
      <main className="app__main">
        {products.length > 0 && step === "list" && <ProductList />}
        {step === "detail" && <ProductDetail />}
      </main>
      {step === "modal" && <CheckoutModal />}
      {step === "summary" && <SummaryBackdrop />}
      {step === "result" && <ResultScreen />}
    </div>
  );
}

export default App;
