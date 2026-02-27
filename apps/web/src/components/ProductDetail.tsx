import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { backToList, openModal, setQuantity } from "@/store";
import "./ProductDetail.css";

export function ProductDetail() {
  const dispatch = useDispatch();
  const { selectedProduct, selectedQuantity } = useSelector(
    (s: import("@/store").RootState) => s.checkout
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!selectedProduct) return null;

  const images = selectedProduct.imageUrls?.length
    ? selectedProduct.imageUrls
    : ["https://picsum.photos/seed/placeholder/400/300"];
  const currentImage = images[currentImageIndex];
  const subtotal = selectedProduct.priceInCents * selectedQuantity;
  const maxQty = Math.min(selectedProduct.stock, 99);

  return (
    <article className="product-detail">
      <button
        type="button"
        className="product-detail__back"
        onClick={() => dispatch(backToList())}
        aria-label="Volver al listado"
      >
        ← Volver
      </button>

      <div className="product-detail__gallery">
        <div className="product-detail__main-image">
          <img
            src={currentImage}
            alt={selectedProduct.name}
            loading="lazy"
          />
        </div>
        {images.length > 1 && (
          <div className="product-detail__thumbs">
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                className={`product-detail__thumb ${i === currentImageIndex ? "product-detail__thumb--active" : ""}`}
                onClick={() => setCurrentImageIndex(i)}
                aria-label={`Ver imagen ${i + 1}`}
              >
                <img src={url} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-detail__info">
        <h1 className="product-detail__name">{selectedProduct.name}</h1>
        <p className="product-detail__price">
          ${(selectedProduct.priceInCents / 100).toLocaleString("es-CO")} COP
          <span className="product-detail__unit"> / unidad</span>
        </p>
        <p className="product-detail__stock">Disponibles: {selectedProduct.stock}</p>
        <p className="product-detail__description">{selectedProduct.description}</p>

        <div className="product-detail__quantity">
          <label htmlFor="qty">Cantidad</label>
          <div className="product-detail__quantity-controls">
            <button
              type="button"
              onClick={() => dispatch(setQuantity(selectedQuantity - 1))}
              disabled={selectedQuantity <= 1}
              aria-label="Menos"
            >
              −
            </button>
            <input
              id="qty"
              type="number"
              min={1}
              max={maxQty}
              value={selectedQuantity}
              onChange={(e) => dispatch(setQuantity(parseInt(e.target.value, 10) || 1))}
            />
            <button
              type="button"
              onClick={() => dispatch(setQuantity(selectedQuantity + 1))}
              disabled={selectedQuantity >= maxQty}
              aria-label="Más"
            >
              +
            </button>
          </div>
        </div>

        <div className="product-detail__total">
          <span>Total:</span>
          <strong>${(subtotal / 100).toLocaleString("es-CO")} COP</strong>
        </div>

        <button
          type="button"
          className="product-detail__pay"
          onClick={() => dispatch(openModal())}
          disabled={selectedProduct.stock < 1}
        >
          Pagar con tarjeta
        </button>
      </div>
    </article>
  );
}
