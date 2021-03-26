"use strict";
// Diff.ts - Diff strings
// (c) Slava Kim
// https://github.com/Slava/diff.js
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diff = void 0;
var Utils_1 = require("./Utils");
var Diff = /** @class */ (function () {
    function Diff() {
    }
    // Refer to http://www.xmailserver.org/diff2.pdf
    Diff.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("Diff", oError, message, value, pos, 0);
    };
    Diff.inRange = function (x, l, r) {
        return (l <= x && x <= r) || (r <= x && x <= l);
    };
    Diff.fnEquals = function (a, b) {
        return a === b;
    };
    // Accepts custom comparator
    Diff.customIndexOf = function (aArr, item, start, fnEquals) {
        for (var i2 = start; i2 < aArr.length; i2 += 1) {
            if (fnEquals(item, aArr[i2])) {
                return i2;
            }
        }
        return -1;
    };
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
    Diff.fnLCS = function (aA, aB, equals) {
        // Helpers
        var // Takes X-component as argument, diagonal as context, returns array-pair of form x, y
        toPoint = function (x) {
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
        findMidSnake = function (startA, endA, startB, endB) {
            var iN = endA - startA + 1, iM = endB - startB + 1, iMax = iN + iM, iDelta = iN - iM, iHhalfMaxCeil = (iMax + 1) / 2 | 0, // eslint-disable-line no-bitwise
            // Maps -Max .. 0 .. +Max, diagonal index to endpoints for furthest reaching D-path on current iteration.
            oV = {}, 
            // Same but for reversed paths.
            oU = {};
            var aOverlap, iD;
            // Special case for the base case, D = 0, k = 0, x = y = 0
            oV[1] = 0;
            // Special case for the base case reversed, D = 0, k = 0, x = N, y = M
            oU[iDelta - 1] = iN;
            // Iterate over each possible length of edit script
            for (iD = 0; iD <= iHhalfMaxCeil; iD += 1) {
                // Iterate over each diagonal
                for (var k = -iD; k <= iD && !aOverlap; k += 2) {
                    var x = void 0;
                    // Positions in sequences A and B of furthest going D-path on diagonal k.
                    // Choose from each diagonal we extend
                    if (k === -iD || (k !== iD && oV[k - 1] < oV[k + 1])) {
                        // Extending path one point down, that's why x doesn't change, y
                        // increases implicitly
                        x = oV[k + 1];
                    }
                    else {
                        // Extending path one point to the right, x increases
                        x = oV[k - 1] + 1;
                    }
                    // We can calculate the y out of x and diagonal index.
                    var y = x - k;
                    if (isNaN(y) || x > iN || y > iM) {
                        continue;
                    }
                    var xx = x;
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
                    if ((iDelta & 1) === 1 && Diff.inRange(k, iDelta - (iD - 1), iDelta + (iD - 1))) { // eslint-disable-line no-bitwise
                        // Forward D-path can overlap with reversed D-1-path
                        if (oV[k] >= oU[k]) {
                            // Found an overlap, the middle snake, convert X-components to dots
                            aOverlap = [
                                xx,
                                x
                            ].map(toPoint, k); // XXX ES5
                        }
                    }
                }
                var SES = void 0;
                if (aOverlap) {
                    SES = iD * 2 - 1;
                }
                // Iterate over each diagonal for reversed case
                for (var k = -iD; k <= iD && !aOverlap; k += 2) {
                    // The real diagonal we are looking for is k + Delta
                    var K = k + iDelta;
                    var x = void 0;
                    if (k === iD || (k !== -iD && oU[K - 1] < oU[K + 1])) {
                        x = oU[K - 1];
                    }
                    else {
                        x = oU[K + 1] - 1;
                    }
                    var y = x - K;
                    if (isNaN(y) || x < 0 || y < 0) {
                        continue;
                    }
                    var xx = x;
                    while (x > 0 && y > 0 && equals(aA[startA + x - 1], aB[startB + y - 1])) {
                        x -= 1;
                        y -= 1;
                    }
                    oU[K] = x;
                    if (iDelta % 2 === 0 && Diff.inRange(K, -iD, iD)) {
                        if (oU[K] <= oV[K]) {
                            aOverlap = [
                                x,
                                xx
                            ].map(toPoint, K); // XXX ES5
                        }
                    }
                }
                if (aOverlap) {
                    SES = SES || iD * 2;
                    // Remember we had offset of each sequence?
                    for (var i = 0; i < 2; i += 1) {
                        for (var j = 0; j < 2; j += 1) {
                            aOverlap[i][j] += [
                                startA,
                                startB
                            ][j] - i;
                        }
                    }
                    return aOverlap.concat([
                        SES,
                        (iMax - SES) / 2
                    ]);
                }
            }
            throw Diff.composeError(Error(), "Programming error in findMidSnake", "", 0); // should not occure
        }, lcsAtoms = [], lcs = function (startA, endA, startB, endB) {
            var N = endA - startA + 1, M = endB - startB + 1;
            if (N > 0 && M > 0) {
                var middleSnake = findMidSnake(startA, endA, startB, endB), 
                // A[x;u] == B[y,v] and is part of LCS
                x = middleSnake[0][0], y = middleSnake[0][1], u = middleSnake[1][0], v = middleSnake[1][1], D = middleSnake[2];
                if (D > 1) {
                    lcs(startA, x - 1, startB, y - 1);
                    if (x <= u) {
                        [].push.apply(lcsAtoms, aA.slice(x, u + 1));
                    }
                    lcs(u + 1, endA, v + 1, endB);
                }
                else if (M > N) {
                    [].push.apply(lcsAtoms, aA.slice(startA, endA + 1));
                }
                else {
                    [].push.apply(lcsAtoms, aB.slice(startB, endB + 1));
                }
            }
        };
        lcs(0, aA.length - 1, 0, aB.length - 1);
        return lcsAtoms;
    };
    // Diff sequence
    // @param A - sequence of atoms - Array
    // @param B - sequence of atoms - Array
    // [@param equals - optional comparator of atoms - returns true or false,
    //                 if not specified, triple equals operator is used]
    // @returns Array - sequence of objects in a form of:
    //   - operation: one of "none", "add", "delete"
    //   - atom: the atom found in either A or B
    // Applying operations from diff sequence you should be able to transform A to B
    Diff.diff = function (aA, aB) {
        var aDiff = [], fnEquals = Diff.fnEquals;
        /*
            // Accepts custom comparator
            customIndexOf = function (item: string, start: number, fnEquals2: (a: string, b: string) => boolean) {
                const aArr = this;

                for (let i2 = start; i2 < aArr.length; i2 += 1) {
                    if (fnEquals2(item, aArr[i2])) {
                        return i2;
                    }
                }
                return -1;
            };

        // We just compare atoms with default equals operator by default
        if (fnEquals === undefined) {
            fnEquals = function (a: string, b: string) {
                return a === b;
            };
        }
        */
        var i = 0, j = 0, iN = aA.length, iM = aB.length, iK = 0;
        while (i < iN && j < iM && fnEquals(aA[i], aB[j])) {
            i += 1;
            j += 1;
        }
        while (i < iN && j < iM && fnEquals(aA[iN - 1], aB[iM - 1])) {
            iN -= 1;
            iM -= 1;
            iK += 1;
        }
        [].push.apply(aDiff, aA.slice(0, i).map(function (sAtom2) {
            return {
                operation: "none",
                atom: sAtom2
            };
        }));
        var lcs = Diff.fnLCS(aA.slice(i, iN), aB.slice(j, iM), fnEquals);
        for (var k = 0; k < lcs.length; k += 1) {
            var atom = lcs[k], 
            //ni = customIndexOf.call(aA, atom, i, fnEquals),
            //nj = customIndexOf.call(aB, atom, j, fnEquals);
            ni = Diff.customIndexOf(aA, atom, i, fnEquals), nj = Diff.customIndexOf(aB, atom, j, fnEquals);
            // XXX ES5 map
            // Delete unmatched atoms from A
            [].push.apply(aDiff, aA.slice(i, ni).map(function (sAtom2) {
                return {
                    operation: "delete",
                    atom: sAtom2
                };
            }));
            // Add unmatched atoms from B
            [].push.apply(aDiff, aB.slice(j, nj).map(function (sAtom2) {
                return {
                    operation: "add",
                    atom: sAtom2
                };
            }));
            // Add the atom found in both sequences
            aDiff.push({
                operation: "none",
                atom: atom
            });
            i = ni + 1;
            j = nj + 1;
        }
        // Don't forget about the rest
        [].push.apply(aDiff, aA.slice(i, iN).map(function (atom2) {
            return {
                operation: "delete",
                atom: atom2
            };
        }));
        [].push.apply(aDiff, aB.slice(j, iM).map(function (atom2) {
            return {
                operation: "add",
                atom: atom2
            };
        }));
        [].push.apply(aDiff, aA.slice(iN, iN + iK).map(function (atom2) {
            return {
                operation: "none",
                atom: atom2
            };
        }));
        return aDiff;
    };
    Diff.testDiff = function (sText1, sText2) {
        var aText1 = sText1.split("\n"), aText2 = sText2.split("\n");
        var sDiff = Diff.diff(aText1, aText2).map(function (o) {
            var sResult = "";
            if (o.operation === "add") {
                sResult = "+ " + o.atom;
            }
            else if (o.operation === "delete") {
                sResult = "- " + o.atom;
            } // else "none"
            return sResult;
        }).join("\n");
        sDiff = sDiff.replace(/\n\n+/g, "\n");
        return sDiff;
    };
    return Diff;
}());
exports.Diff = Diff;
//# sourceMappingURL=Diff.js.map