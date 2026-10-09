// Run: node scripts/verify-discount-amount.mjs
import assert from "node:assert/strict";
import { computeDiscountedAmount } from "../src/lib/server/discount.js";

const UNIT = 35000; // 350.00 MXN in cents

// 15% off: exact 85% for 1-10 tickets
for (let qty = 1; qty <= 10; qty++) {
  const subtotal = UNIT * qty;
  assert.equal(computeDiscountedAmount(subtotal, 15), (subtotal * 85) / 100, `qty ${qty}`);
}
assert.equal(computeDiscountedAmount(35000, 15), 29750);
assert.equal(computeDiscountedAmount(350000, 15), 297500);
assert.equal(computeDiscountedAmount(35000, "15.00"), 29750);

// Rounding to the nearest cent
assert.equal(computeDiscountedAmount(333, 10), 300); // 33.3 off -> 33 off
assert.equal(computeDiscountedAmount(1, 50), 0); // 0.5 rounds up to 1 off

// Invalid input
assert.throws(() => computeDiscountedAmount(100.5, 15));
assert.throws(() => computeDiscountedAmount(-1, 15));
assert.throws(() => computeDiscountedAmount(100, 0));
assert.throws(() => computeDiscountedAmount(100, 100));
assert.throws(() => computeDiscountedAmount(100, "abc"));

console.log("verify-discount-amount: OK");
