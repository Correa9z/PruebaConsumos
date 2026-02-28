import { useDispatch, useSelector } from "react-redux";
import { backToProductDetail, setProducts } from "@/store";
import { getProducts } from "@/api/client";
import "./ResultScreen.css";

export function ResultScreen() {
  const dispatch = useDispatch();
  const { paymentSuccess, paymentError, selectedProduct } = useSelector(
    (s: import("@/store").RootState) => s.checkout
  );

  const success = paymentSuccess === true;

  const handleBack = async () => {
    if (selectedProduct?.id) {
      try {
        const list = await getProducts();
        dispatch(setProducts(list));
      } finally {
        dispatch(backToProductDetail());
      }
    } else {
      dispatch(backToProductDetail());
    }
  };

  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="result result--animated">
        <div className={`result__icon ${success ? "result__icon--success" : "result__icon--error"}`}>
          {success ? "✓" : "✕"}
        </div>
        <h2 id="result-title" className="result__title">
          {paymentError ? "Payment error" : success ? "Payment successful" : "Payment declined"}
        </h2>
        {paymentError && (
          <p className="result__message result__message--error">{paymentError}</p>
        )}
        {success && !paymentError && (
          <p className="result__message">
            Your transaction was completed successfully. You will receive a confirmation email shortly.
          </p>
        )}
        <button
          type="button"
          className="btn btn--primary result__btn"
          onClick={handleBack}
        >
          Back to product
        </button>
      </div>
    </div>
  );
}
