// Borrowed from https://github.com/ai/nanoid/tree/master/non-secure and @reduxjs/toolkit
// This alphabet uses a-z A-Z 0-9 _- symbols.
// Symbols are generated for smaller size.
// -_zyxwvutsrqponmlkjihgfedcba9876543210ZYXWVUTSRQPONMLKJIHGFEDCBA
let url = '-_';
// Loop from 36 to 0 (from z to a and 9 to 0 in Base36).
let i = 36;
while (i--) {
  // 36 is radix. Number.prototype.toString(36) returns number
  // in Base36 representation. Base36 is like hex, but it uses 0–9 and a-z.
  url += i.toString(36);
}
// Loop from 36 to 10 (from Z to A in Base36).
i = 36;
while (i-- - 10) {
  url += i.toString(36).toUpperCase();
}

export const nanoid = (size = 21): string => {
  let id = '';
  // Compact alternative for `for (var i = 0; i < size; i++)`
  while (size--) {
    // `| 0` is compact and faster alternative for `Math.floor()`
    id += url[(Math.random() * 64) | 0];
  }
  return id;
};
