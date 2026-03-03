#!/usr/bin/env node
/**
 * gen-qr-url.mjs — Generate a signed QR code URL for a table.
 *
 * Usage:
 *   QR_SIGNING_SECRET=mysecret node scripts/gen-qr-url.mjs \
 *     --shopId shop_demo \
 *     --tableCode A1 \
 *     --shopName "我的面馆"
 *
 * Environment variables (can also be set in .env):
 *   QR_SIGNING_SECRET      Required. HMAC signing secret (must match API).
 *   CUSTOMER_WEB_BASE_URL  Optional. Defaults to http://localhost:5174.
 */

import { createHmac } from 'crypto';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && i + 1 < argv.length) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

const shopId = args.shopId;
const tableCode = args.tableCode;
const shopName = args.shopName;
const secret = process.env.QR_SIGNING_SECRET;
const baseUrl = process.env.CUSTOMER_WEB_BASE_URL || 'http://localhost:5174';
const v = '1';

if (!shopId || !tableCode || !shopName) {
  console.error('Usage: node scripts/gen-qr-url.mjs --shopId <id> --tableCode <code> --shopName <name>');
  process.exit(1);
}

if (!secret) {
  console.error('Error: QR_SIGNING_SECRET environment variable is required.');
  process.exit(1);
}

const canonical = `shopId=${shopId}&tableCode=${tableCode}&shopName=${shopName}&v=${v}`;
const sig = createHmac('sha256', secret).update(canonical).digest('hex');

const params = new URLSearchParams({ shopId, tableCode, shopName, v, sig });
const url = `${baseUrl}/?${params.toString()}`;

console.log('Canonical string:', canonical);
console.log('Signature:       ', sig);
console.log('');
console.log('QR URL:');
console.log(url);
