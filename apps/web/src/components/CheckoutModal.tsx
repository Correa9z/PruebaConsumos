import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closeModal,
  confirmCardAndDelivery,
  setCard,
  setDelivery,
  setCustomer,
} from "@/store";
import {
  luhnCheck,
  detectCardType,
  formatCardNumber,
  formatExpiry,
  formatCvc,
} from "@/utils/cardValidation";
import "./CheckoutModal.css";

export function CheckoutModal() {
  const dispatch = useDispatch();
  const { card, delivery, customerEmail, customerFullName } = useSelector(
    (s: import("@/store").RootState) => s.checkout
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cardType = detectCardType(card.number);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!card.number.trim()) e.cardNumber = "Número requerido";
    else if (!luhnCheck(card.number)) e.cardNumber = "Número de tarjeta inválido";
    if (!card.cvc.trim()) e.cvc = "CVC requerido";
    else if (card.cvc.length < 3) e.cvc = "CVC inválido";
    if (!card.expMonth || !card.expYear) e.exp = "Fecha de vencimiento requerida";
    else if (card.expMonth.length !== 2 || card.expYear.length !== 2) e.exp = "Formato MM/AA";
    if (!card.cardholderName.trim()) e.name = "Nombre en tarjeta requerido";
    if (!customerEmail.trim()) e.email = "Email requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) e.email = "Email inválido";
    if (!customerFullName.trim()) e.fullName = "Nombre completo requerido";
    if (!delivery.address.trim()) e.address = "Dirección requerida";
    if (!delivery.city.trim()) e.city = "Ciudad requerida";
    if (!delivery.phone.trim()) e.phone = "Teléfono requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(setCustomer({ email: customerEmail, fullName: customerFullName }));
    dispatch(confirmCardAndDelivery());
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        <div className="modal__header">
          <h2 id="modal-title">Datos de pago y entrega</h2>
          <button
            type="button"
            className="modal__close"
            onClick={() => dispatch(closeModal())}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal__form">
          <fieldset className="modal__section">
            <legend>Tarjeta</legend>
            <div className="modal__card-logos">
              <span className={`card-logo card-logo--visa ${cardType === "visa" ? "card-logo--active" : ""}`}>VISA</span>
              <span className={`card-logo card-logo--mc ${cardType === "mastercard" ? "card-logo--active" : ""}`}>Mastercard</span>
            </div>
            <label>
              Número de tarjeta
              <input
                type="text"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={card.number}
                onChange={(e) => dispatch(setCard({ number: formatCardNumber(e.target.value) }))}
                className={errors.cardNumber ? "input--error" : ""}
              />
              {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
            </label>
            <div className="modal__row">
              <label>
                Vencimiento (MM/AA)
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={card.expMonth && card.expYear ? `${card.expMonth}/${card.expYear}` : ""}
                  onChange={(e) => {
                    const f = formatExpiry(e.target.value);
                    const [mm, yy] = f.split("/");
                    dispatch(setCard({ expMonth: mm ?? "", expYear: yy ?? "" }));
                  }}
                  className={errors.exp ? "input--error" : ""}
                />
                {errors.exp && <span className="form-error">{errors.exp}</span>}
              </label>
              <label>
                CVC
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={card.cvc}
                  onChange={(e) => dispatch(setCard({ cvc: formatCvc(e.target.value) }))}
                  className={errors.cvc ? "input--error" : ""}
                />
                {errors.cvc && <span className="form-error">{errors.cvc}</span>}
              </label>
            </div>
            <label>
              Nombre en la tarjeta
              <input
                type="text"
                placeholder="Como aparece en la tarjeta"
                value={card.cardholderName}
                onChange={(e) => dispatch(setCard({ cardholderName: e.target.value }))}
                className={errors.name ? "input--error" : ""}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </label>
          </fieldset>
          <fieldset className="modal__section">
            <legend>Entrega</legend>
            <label>
              Email
              <input
                type="email"
                placeholder="tu@email.com"
                value={customerEmail}
                onChange={(e) => dispatch(setCustomer({ email: e.target.value, fullName: customerFullName }))}
                className={errors.email ? "input--error" : ""}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </label>
            <label>
              Nombre completo
              <input
                type="text"
                placeholder="Nombre completo"
                value={customerFullName}
                onChange={(e) => dispatch(setCustomer({ email: customerEmail, fullName: e.target.value }))}
                className={errors.fullName ? "input--error" : ""}
              />
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </label>
            <label>
              Dirección
              <input
                type="text"
                placeholder="Calle, número"
                value={delivery.address}
                onChange={(e) => dispatch(setDelivery({ address: e.target.value }))}
                className={errors.address ? "input--error" : ""}
              />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </label>
            <div className="modal__row">
              <label>
                Ciudad
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={delivery.city}
                  onChange={(e) => dispatch(setDelivery({ city: e.target.value }))}
                  className={errors.city ? "input--error" : ""}
                />
                {errors.city && <span className="form-error">{errors.city}</span>}
              </label>
              <label>
                Teléfono
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={delivery.phone}
                  onChange={(e) => dispatch(setDelivery({ phone: e.target.value }))}
                  className={errors.phone ? "input--error" : ""}
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </label>
            </div>
          </fieldset>
          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={() => dispatch(closeModal())}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Continuar al resumen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
