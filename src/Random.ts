// Random.ts - Random Number Generator
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/

//
// Random number generator taken from:
// Raj Jain: The Art of Computer Systems Performance Analysis, John Wiley & Sons, 1991, page 442-444
//
export class Random {
	private x!: number;

	constructor(seed?: number) {
		this.init(seed);
	}

	init(seed?: number): void {
		this.x = seed || 1; // do not use 0
	}

	random(): number {
		const m = 2147483647, // prime number 2^31-1; modulus, do not change!
			a = 16807, // 7^5, one primitive root; multiplier
			q = 127773, // m div a
			r = 2836; // m mod a
		let x = this.x; // last random value

		x = a * (x % q) - r * ((x / q) | 0); // eslint-disable-line no-bitwise
		// we use "| 0" to get an integer div result
		if (x <= 0) {
			x += m; // x is new random number
		}
		this.x = x;
		return x / m;
	}
}
