import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPaymentError, backToModal } from "@/store";
import { createPaymentLink } from "@/api/client";
import "./SummaryBackdrop.css";

export function SummaryBackdrop() {
  const dispatch = useDispatch();
  const {
    selectedProduct,
    selectedQuantity,
    config,
    delivery,
    customerEmail,
    customerFullName,
  } = useSelector((s: import("@/store").RootState) => s.checkout);
  const [loading, setLoading] = useState(false);

  if (!selectedProduct || !config) return null;

  const baseFee = config.baseFeeInCents;
  const deliveryFee = config.deliveryFeeInCents;
  const productAmount = selectedProduct.priceInCents * selectedQuantity;
  const total = productAmount + baseFee + deliveryFee;

  const canPay = Boolean(
    customerEmail &&
      customerFullName &&
      delivery.address &&
      delivery.city &&
      delivery.phone
  );

  const handlePay = async () => {
    if (!canPay) return;
    setLoading(true);
    try {
      const { paymentLinkUrl } = await createPaymentLink({
        productId: selectedProduct.id,
        quantity: selectedQuantity,
        baseFeeInCents: baseFee,
        deliveryFeeInCents: deliveryFee,
        customerEmail,
        customerFullName,
        delivery: {
          address: delivery.address,
          city: delivery.city,
          region: delivery.region || undefined,
          phone: delivery.phone,
          postalCode: delivery.postalCode || undefined,
        },
      });
      window.location.href = paymentLinkUrl;
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : e && typeof e === "object" && "message" in e
              ? String((e as { message: unknown }).message)
              : "Error al generar el link de pago";
      dispatch(setPaymentError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop" role="dialog" aria-modal="true" aria-labelledby="summary-title">
      <div className="backdrop__panel">
        <h2 id="summary-title" className="backdrop__title">Resumen del pago</h2>
        <div className="backdrop__summary">
          <p className="backdrop__line backdrop__product">
            {selectedProduct.name} {selectedQuantity > 1 && `(×${selectedQuantity})`}: <strong>${(productAmount / 100).toLocaleString("es-CO")} COP</strong>
          </p>
          <p className="backdrop__line">Fee base: ${(baseFee / 100).toLocaleString("es-CO")} COP</p>
          <p className="backdrop__line">Envío: ${(deliveryFee / 100).toLocaleString("es-CO")} COP</p>
          <p className="backdrop__total">
            Total: <strong>${(total / 100).toLocaleString("es-CO")} COP</strong>
          </p>
        </div>
        <div className="backdrop__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => dispatch(backToModal())}
            disabled={loading}
          >
            Volver
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handlePay}
            disabled={loading || !canPay}
          >
            {loading ? "Redirigiendo a Wompi..." : canPay ? "Pagar" : "Completa los datos de entrega"}
          </button>
        </div>
      </div>
    </div>
  );
}
