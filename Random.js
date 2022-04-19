// Random.ts - Random Number Generator
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Random = void 0;
    //
    // Random number generator taken from:
    // Raj Jain: The Art of Computer Systems Performance Analysis, John Wiley & Sons, 1991, page 442-444
    //
    var Random = /** @class */ (function () {
        function Random(seed) {
            this.init(seed);
        }
        Random.prototype.init = function (seed) {
            this.x = seed || 1; // do not use 0
        };
        Random.prototype.random = function () {
            var m = 2147483647, // prime number 2^31-1; modulus, do not change!
            a = 16807, // 7^5, one primitive root; multiplier
            q = 127773, // m div a
            r = 2836; // m mod a
            var x = this.x; // last random value
            x = a * (x % q) - r * ((x / q) | 0); // eslint-disable-line no-bitwise
            // we use "| 0" to get an integer div result
            if (x <= 0) {
                x += m; // x is new random number
            }
            this.x = x;
            return x / m;
        };
        return Random;
    }());
    exports.Random = Random;
});
//# sourceMappingURL=Random.js.map