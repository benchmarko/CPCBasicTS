// Diff.ts - Diff strings
// (c) Slava Kim
// https://github.com/Slava/diff.js
//

import { Utils } from "./Utils";

type AtomEntryType = {
	operation: string,
	atom: string
};

type OverlapReturnType = [
	number[],
	number[],
	number,
	number
];

export class Diff {
	// Refer to http://www.xmailserver.org/diff2.pdf

	private static composeError(error: Error, message: string, value: string, pos: number) {
		return Utils.composeError("Diff", error, message, value, pos, undefined, 0);
	}

	private static inRange(x: number, l: number, r: number) {
		return (l <= x && x <= r) || (r <= x && x <= l);
	}

	private static fnEquals(a: string, b: string) {
		return a === b;
	}

	// Accepts custom comparator
	private static customIndexOf(arr: string[], item: string, start: number, fnEquals: (a: string, b: string) => boolean) {
		for (let i2 = start; i2 < arr.length; i2 += 1) {
			if (fnEquals(item, arr[i2])) {
				return i2;
			}
		}
		return -1;
	}

	/* can we use it here? need to define aA, aB, lcsAtoms, findMidSnake():
	private static lcs(startA: number, endA: number, startB: number, endB: number) {
		const N = endA - startA + 1,
			M = endB - startB + 1;

		if (N > 0 && M > 0) {
			const middleSnake = findMidSnake(startA, endA, startB, endB),
				// A[x;u] == B[y,v] and is part of LCS
				x = middleSnake[0][0],
				y = middleSnake[0][1],
				u = middleSnake[1][0],
				v = middleSnake[1][1],
				D = middleSnake[2];

			if (D > 1) {
				Diff.lcs(startA, x - 1, startB, y - 1);
				if (x <= u) {
					[].push.apply(lcsAtoms, aA.slice(x, u + 1));
				}
				lcs(u + 1, endA, v + 1, endB);
			} else if (M > N) {
				[].push.apply(lcsAtoms, aA.slice(startA, endA + 1));
			} else {
				[].push.apply(lcsAtoms, aB.slice(startB, endB + 1));
			}
		}
	}
	*/

	// Longest Common Subsequence
	// @param A - sequence of atoms - Array
	// @param B - sequence of atoms - Array
	// @param equals - optional comparator of atoms - returns true or false,
	//                 if not specified, triple equals operator is used
	// @returns Array - sequence of atoms, one of LCSs, edit script from A to B
	private static fnLCS(aA: string[], aB: string[], equals: (a: string, b: string) => boolean) {
		// Helpers
		const // Takes X-component as argument, diagonal as context, returns array-pair of form x, y
			toPoint = function (this: any, x: number) {
				return [
					x,
					x - this // eslint-disable-line no-invalid-this
				]; // XXX context is not the best way to pass diagonal
			},

			// NOTE: all intervals from now on are both sides inclusive
			// Get the points in Edit Graph, one of the LCS paths goes through.
			// The points are located on the same diagonal and represent the middle
			// snake ([D/2] out of D+1) in the optimal edit path in edit graph.
			// @param startA, endA - substring of A we are working on
			// @param startB, endB - substring of B we are working on
			// @returns Array - [
			//                   [x, y], - beginning of the middle snake
			//                   [u, v], - end of the middle snake
			//                    D,     - optimal edit distance
			//                    LCS ]  - length of LCS
			findMidSnake = function (startA: number, endA: number, startB: number, endB: number) { // eslint-disable-line complexity
				const iN = endA - startA + 1,
					iM = endB - startB + 1,
					max = iN + iM,
					delta = iN - iM,
					hhalfMaxCeil = (max + 1) / 2 | 0, // eslint-disable-line no-bitwise
					// Maps -Max .. 0 .. +Max, diagonal index to endpoints for furthest reaching D-path on current iteration.
					oV: {[k: number]: number} = {},
					// Same but for reversed paths.
					oU: {[k: number]: number} = {};
				let	overlap: number[][] | undefined,
					iD: number;

				// Special case for the base case, D = 0, k = 0, x = y = 0
				oV[1] = 0;
				// Special case for the base case reversed, D = 0, k = 0, x = N, y = M
				oU[delta - 1] = iN;

				// Iterate over each possible length of edit script
				for (iD = 0; iD <= hhalfMaxCeil; iD += 1) {
					// Iterate over each diagonal
					for (let k = -iD; k <= iD && !overlap; k += 2) {
						let x: number;

						// Positions in sequences A and B of furthest going D-path on diagonal k.
						// Choose from each diagonal we extend
						if (k === -iD || (k !== iD && oV[k - 1] < oV[k + 1])) {
							// Extending path one point down, that's why x doesn't change, y
							// increases implicitly
							x = oV[k + 1];
						} else {
							// Extending path one point to the right, x increases
							x = oV[k - 1] + 1;
						}

						// We can calculate the y out of x and diagonal index.
						let y = x - k;

						if (isNaN(y) || x > iN || y > iM) {
							continue;
						}

						const xx = x;

						// Try to extend the D-path with diagonal paths. Possible only if atoms
						// A_x match B_y
						while (x < iN && y < iM // if there are atoms to compare
							&& equals(aA[startA + x], aB[startB + y])) {
							x += 1;
							y += 1;
						}

						// We can safely update diagonal k, since on every iteration we consider
						// only even or only odd diagonals and the result of one depends only on
						// diagonals of different iteration.
						oV[k] = x;

						// Check feasibility, Delta is checked for being odd.
						if ((delta & 1) === 1 && Diff.inRange(k, delta - (iD - 1), delta + (iD - 1))) { // eslint-disable-line no-bitwise
							// Forward D-path can overlap with reversed D-1-path
							if (oV[k] >= oU[k]) {
								// Found an overlap, the middle snake, convert X-components to dots
								overlap = [
									xx,
									x
								].map(toPoint, k); // XXX ES5
							}
						}
					}

					let SES: number | undefined;

					if (overlap) {
						SES = iD * 2 - 1;
					}

					// Iterate over each diagonal for reversed case
					for (let k = -iD; k <= iD && !overlap; k += 2) {
						// The real diagonal we are looking for is k + Delta
						const K = k + delta;
						let x: number;

						if (k === iD || (k !== -iD && oU[K - 1] < oU[K + 1])) {
							x = oU[K - 1];
						} else {
							x = oU[K + 1] - 1;
						}

						let y = x - K;

						if (isNaN(y) || x < 0 || y < 0) {
							continue;
						}

						const xx = x;

						while (x > 0 && y > 0 && equals(aA[startA + x - 1], aB[startB + y - 1])) {
							x -= 1;
							y -= 1;
						}
						oU[K] = x;

						if (delta % 2 === 0 && Diff.inRange(K, -iD, iD)) {
							if (oU[K] <= oV[K]) {
								overlap = [
									x,
									xx
								].map(toPoint, K); // XXX ES5
							}
						}
					}

					if (overlap) {
						SES = SES || iD * 2;
						// Remember we had offset of each sequence?
						for (let i = 0; i < 2; i += 1) {
							for (let j = 0; j < 2; j += 1) {
								overlap[i][j] += [
									startA,
									startB
								][j] - i;
							}
						}
						return overlap.concat([
							SES,
							(max - SES) / 2
						]) as OverlapReturnType;
					}
				}
				throw Diff.composeError(Error(), "Programming error in findMidSnake", "", 0); // should not occur
			},

			lcsAtoms: string[] = [],
			lcs = function (startA: number, endA: number, startB: number, endB: number) {
				const N = endA - startA + 1,
					M = endB - startB + 1;

				if (N > 0 && M > 0) {
					const middleSnake = findMidSnake(startA, endA, startB, endB),
						// A[x;u] == B[y,v] and is part of LCS
						x = middleSnake[0][0],
						y = middleSnake[0][1],
						u = middleSnake[1][0],
						v = middleSnake[1][1],
						D = middleSnake[2];

					if (D > 1) {
						lcs(startA, x - 1, startB, y - 1);
						if (x <= u) {
							([] as string[]).push.apply(lcsAtoms, aA.slice(x, u + 1));
						}
						lcs(u + 1, endA, v + 1, endB);
					} else if (M > N) {
						([] as string[]).push.apply(lcsAtoms, aA.slice(startA, endA + 1));
					} else {
						([] as string[]).push.apply(lcsAtoms, aB.slice(startB, endB + 1));
					}
				}
			};

		lcs(0, aA.length - 1, 0, aB.length - 1);
		return lcsAtoms;
	}

	// Diff sequence
	// @param A - sequence of atoms - Array
	// @param B - sequence of atoms - Array
	// [@param equals - optional comparator of atoms - returns true or false,
	//                 if not specified, triple equals operator is used]
	// @returns Array - sequence of objects in a form of:
	//   - operation: one of "none", "add", "delete"
	//   - atom: the atom found in either A or B
	// Applying operations from diff sequence you should be able to transform A to B
	private static diff(aA: string[], aB: string[]) {
		const diff: AtomEntryType[] = [],
			fnEquals = Diff.fnEquals;
		let	i = 0,
			j = 0,
			iN = aA.length,
			iM = aB.length,
			iK = 0;

		while (i < iN && j < iM && fnEquals(aA[i], aB[j])) {
			i += 1;
			j += 1;
		}

		while (i < iN && j < iM && fnEquals(aA[iN - 1], aB[iM - 1])) {
			iN -= 1;
			iM -= 1;
			iK += 1;
		}

		([] as AtomEntryType[]).push.apply(diff, aA.slice(0, i).map(function (atom2) {
			return {
				operation: "none",
				atom: atom2
			};
		}));

		const lcs = Diff.fnLCS(aA.slice(i, iN), aB.slice(j, iM), fnEquals);

		for (let k = 0; k < lcs.length; k += 1) {
			const atom = lcs[k],
				ni = Diff.customIndexOf(aA, atom, i, fnEquals),
				nj = Diff.customIndexOf(aB, atom, j, fnEquals);

			// XXX ES5 map
			// Delete unmatched atoms from A
			([] as AtomEntryType[]).push.apply(diff, aA.slice(i, ni).map(function (atom2) {
				return {
					operation: "delete",
					atom: atom2
				};
			}));

			// Add unmatched atoms from B
			([] as AtomEntryType[]).push.apply(diff, aB.slice(j, nj).map(function (atom2) {
				return {
					operation: "add",
					atom: atom2
				};
			}));

			// Add the atom found in both sequences
			diff.push({
				operation: "none",
				atom: atom
			});

			i = ni + 1;
			j = nj + 1;
		}

		// Don't forget about the rest

		([] as AtomEntryType[]).push.apply(diff, aA.slice(i, iN).map(function (atom2) {
			return {
				operation: "delete",
				atom: atom2
			};
		}));

		([] as AtomEntryType[]).push.apply(diff, aB.slice(j, iM).map(function (atom2) {
			return {
				operation: "add",
				atom: atom2
			};
		}));

		([] as AtomEntryType[]).push.apply(diff, aA.slice(iN, iN + iK).map(function (atom2) {
			return {
				operation: "none",
				atom: atom2
			};
		}));

		return diff;
	}

	static testDiff(text1: string, text2: string): string {
		const textParts1 = text1.split("\n"),
			textParts2 = text2.split("\n");

		let diff = Diff.diff(textParts1, textParts2).map(function (o) {
			let result = "";

			if (o.operation === "add") {
				result = "+ " + o.atom;
			} else if (o.operation === "delete") {
				result = "- " + o.atom;
			} // else "none"
			return result;
		}).join("\n");

		diff = diff.replace(/\n\n+/g, "\n");
		return diff;
	}
}
