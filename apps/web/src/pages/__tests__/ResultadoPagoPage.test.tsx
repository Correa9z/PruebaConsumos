import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultadoPagoPage } from "../ResultadoPagoPage";
import * as client from "@/api/client";

jest.mock("@/api/client");

describe("ResultadoPagoPage", () => {
  beforeEach(() => {
    jest.mocked(client.getTransactionStatus).mockReset();
  });

  it("shows success when status=APPROVED in URL and no id", () => {
    render(<ResultadoPagoPage searchString="?status=APPROVED" onBack={() => {}} />);
    expect(screen.getByText("Payment successful")).toBeInTheDocument();
  });

  it("shows error when status is not APPROVED in URL", () => {
    render(<ResultadoPagoPage searchString="?status=DECLINED" onBack={() => {}} />);
    expect(screen.getByText("Payment declined or pending")).toBeInTheDocument();
  });

  it("calls onBack when button clicked", async () => {
    const onBack = jest.fn();
    render(<ResultadoPagoPage searchString="?status=APPROVED" onBack={onBack} />);
    await userEvent.click(screen.getByText("Back to store"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("when id in URL, fetches status and shows transaction number", async () => {
    jest.mocked(client.getTransactionStatus).mockResolvedValue({
      status: "APPROVED",
      transactionNumber: "TXN-1",
    });
    render(<ResultadoPagoPage searchString="?id=wompi-123&status=PENDING" onBack={() => {}} />);
    await screen.findByText("Payment successful");
    expect(screen.getByText(/Transaction: TXN-1/)).toBeInTheDocument();
  });

  it("when id in URL and fetch returns null, shows id from URL", async () => {
    jest.mocked(client.getTransactionStatus).mockResolvedValue(null);
    render(<ResultadoPagoPage searchString="?id=wompi-123&status=PENDING" onBack={() => {}} />);
    await screen.findByText(/Transaction: wompi-123/);
    expect(screen.getByText(/Transaction: wompi-123/)).toBeInTheDocument();
  });

  it("when productId in sessionStorage, shows Back to product and calls onBack with productId", async () => {
    const getItem = jest.spyOn(Storage.prototype, "getItem").mockReturnValue("product-123");
    const removeItem = jest.spyOn(Storage.prototype, "removeItem");
    const onBack = jest.fn();
    render(<ResultadoPagoPage searchString="?status=APPROVED" onBack={onBack} />);
    expect(screen.getByText("Back to product")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Back to product"));
    expect(onBack).toHaveBeenCalledWith("product-123");
    expect(removeItem).toHaveBeenCalled();
    getItem.mockRestore();
    removeItem.mockRestore();
  });
});
