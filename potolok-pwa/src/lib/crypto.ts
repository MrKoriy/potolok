/**
 * Cryptographic helpers for client anonymous appointment tokens
 * Tokens are stored in full on the client (or URL hash)
 * In DB, only sha256(token) is stored for verification
 */

export function generateAccessToken(): string {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function saveClientBookingToken(bookingId: string, token: string): void {
  try {
    const existing = JSON.parse(localStorage.getItem("potolok_client_tokens") || "{}");
    existing[bookingId] = token;
    localStorage.setItem("potolok_client_tokens", JSON.stringify(existing));
  } catch (e) {
    console.warn("Could not save token to localStorage", e);
  }
}

export function getClientBookingToken(bookingId: string): string | null {
  try {
    const existing = JSON.parse(localStorage.getItem("potolok_client_tokens") || "{}");
    return existing[bookingId] || null;
  } catch {
    return null;
  }
}
