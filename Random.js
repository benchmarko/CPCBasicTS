// Random.ts - Random Number Generator
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Random = void 0;
    // Custom random number generator used in the CPC
    // Converted (and optimized) from Z80 ASM code in:
    // https://github.com/Bread80/CPC6128-Firmware-Source/blob/main/FPMaths.asm (starting line 399)
    // and: C6_last_random_number, last_random_number
    // https://github.com/Bread80/CPC6128-Firmware-Source/blob/main/Includes/MemoryFirmware.asm
    /* eslint-disable no-bitwise */
    var RandomCpc = /** @class */ (function () {
        function RandomCpc(seed) {
            this.state = 0x6c078965;
            this.init(seed);
        }
        RandomCpc.prototype.init = function (seed) {
            this.state = 0x6c078965;
            seed || (seed = 0);
            if (seed !== 0) {
                this.randomizeMantissa(RandomCpc.encodeCpcMantissa(seed));
            }
        };
        RandomCpc.encodeCpcMantissa = function (value) {
            if (!Number.isFinite(value)) {
                throw new Error("Seed must be a finite number");
            }
            var mantissa = 0, exponent = 0, sign = 0;
            if (value !== 0) {
                if (value < 0) {
                    sign = 0x80000000;
                    value = -value;
                }
                exponent = Math.ceil(Math.log(value) / Math.log(2));
                mantissa = Math.round(value / Math.pow(2, exponent - 32)) & ~0x80000000;
            }
            var signMantissa = sign + mantissa, result = [
                signMantissa & 0xff,
                (signMantissa >> 8) & 0xff,
                (signMantissa >> 16) & 0xff,
                (signMantissa >> 24) & 0xff
            ];
            return result;
        };
        RandomCpc.prototype.randomizeMantissa = function (bytes) {
            var xorMask = (((((bytes[1] << 8) | bytes[0]) << 16) | ((bytes[3] << 8) | bytes[2])) >>> 0);
            this.state = (this.state ^ xorMask) >>> 0;
        };
        RandomCpc.rndWord32 = function (oldWord, param) {
            var r = ((oldWord & 0xffff) << 16) >>> 0;
            for (var i = 0; i < 16; i += 1) {
                var msb = r >>> 31;
                r = (r << 1) >>> 0;
                if (msb) {
                    r = (r + param) >>> 0;
                }
            }
            return r >>> 0;
        };
        RandomCpc.prototype.random = function () {
            var high = this.state >>> 16, low = this.state & 0xffff, word1 = RandomCpc.rndWord32(low, 0x6c07) & 0xffff, r2 = RandomCpc.rndWord32(high, 0x8965), word2 = r2 & 0xffff, highWord2 = r2 >>> 16, word3 = RandomCpc.rndWord32(low, 0x8965) & 0xffff, highSum = word2 + 0x8965, newHigh = highSum & 0xffff, newLow = (word3 + 0x6c07 + (highSum >>> 16) + highWord2 + word1) & 0xffff;
            this.state = (((newHigh & 0xffff) << 16) | newLow) >>> 0;
            return ((((newLow & 0xffff) << 16) | (newHigh & 0xffff)) >>> 0) / 0x100000000;
        };
        return RandomCpc;
    }());
    /* eslint-enable no-bitwise */
    //
    // Implementation: Random number generator taken from:
    // Raj Jain: The Art of Computer Systems Performance Analysis, John Wiley & Sons, 1991, page 442-444
    // https://en.wikipedia.org/wiki/Lehmer_random_number_generator
    // Park-Miller "minimal standard" LCG (MINSTD) using Schrage method
    //
    var RandomMinStd = /** @class */ (function () {
        function RandomMinStd(seed) {
            this.init(seed);
        }
        // https://en.wikipedia.org/wiki/Jenkins_hash_function
        RandomMinStd.vmHashCode = function (s) {
            var hash = 0;
            /* eslint-disable no-bitwise */
            for (var i = 0; i < s.length; i += 1) {
                hash += s.charCodeAt(i);
                hash += hash << 10;
                hash ^= hash >> 6;
            }
            hash += hash << 3;
            hash ^= hash >> 11;
            hash += hash << 15;
            /* eslint-enable no-bitwise */
            return hash;
        };
        RandomMinStd.prototype.init = function (seed) {
            seed = RandomMinStd.vmHashCode(String(seed)); // to avoid simple seeds
            this.x = seed || 0x89656c07; // an arbitrary 32 bit number <> 0 (this one is used by the CPC)
        };
        RandomMinStd.prototype.random = function () {
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
        return RandomMinStd;
    }());
    var Random = /** @class */ (function () {
        function Random(useCpcRandom) {
            if (useCpcRandom === void 0) { useCpcRandom = true; }
            if (useCpcRandom) {
                this.rndGen = new RandomCpc();
            }
            else {
                this.rndGen = new RandomMinStd();
            }
        }
        Random.prototype.init = function (seed) {
            return this.rndGen.init(seed);
        };
        Random.prototype.random = function () {
            return this.rndGen.random();
        };
        return Random;
    }());
    exports.Random = Random;
});
//# sourceMappingURL=Random.js.map