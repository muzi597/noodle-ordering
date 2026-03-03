import { createHmac } from 'crypto';

export function buildCanonicalString(
  shopId: string,
  tableCode: string,
  shopName: string,
  v: string,
): string {
  return `shopId=${shopId}&tableCode=${tableCode}&shopName=${shopName}&v=${v}`;
}

export function verifyQrSignature(
  shopId: string,
  tableCode: string,
  shopName: string,
  v: string,
  sig: string,
  secret: string,
): boolean {
  const canonical = buildCanonicalString(shopId, tableCode, shopName, v);
  const expected = createHmac('sha256', secret).update(canonical).digest('hex');
  return expected === sig;
}
