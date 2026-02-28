export function luhnCheck(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let even = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    const ch = digits[i];
    if (ch === undefined) continue;
    let n = parseInt(ch, 10);
    if (even) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    even = !even;
  }
  return sum % 10 === 0;
}

export function detectCardType(number: string): "visa" | "mastercard" | null {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits) || /^2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(digits)) return "mastercard";
  return null;
}

export function formatCardNumber(value: string): string {
  const v = value.replace(/\D/g, "").slice(0, 16);
  const parts = v.match(/.{1,4}/g) ?? [];
  return parts.join(" ");
}

export function formatExpiry(value: string): string {
  const v = value.replace(/\D/g, "").slice(0, 6);
  if (v.length === 6) return v.slice(0, 2) + "/" + v.slice(4, 6);
  if (v.length > 2) return v.slice(0, 2) + "/" + v.slice(2, 4);
  return v;
}

export function formatCvc(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}
