// ZipFile.ts - ZIP file handling
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//

// Idea based on: https://github.com/frash23/jzsip/blob/master/jzsip.js
// (and Cpcemu: zip.cpp)
// https://en.wikipedia.org/wiki/Zip_(file_format)

import { Utils } from "./Utils";


type CodeType = {
	count: number[],
	symbol: number[]
};

interface CentralDirFileHeader {
	signature: number
	version: number // version needed to extract (minimum)
	flag: number // General purpose bit flag
	compressionMethod: number // compression method
	modificationTime: number // File last modification time (DOS time)
	crc: number // CRC-32 of uncompressed data
	compressedSize: number // compressed size
	size: number // Uncompressed size
	fileNameLength: number // file name length
	extraFieldLength: number // extra field length
	fileCommentLength: number // file comment length
	localOffset:number // relative offset of local file header
	name: string
	isDirectory: boolean
	extra: Uint8Array
	comment: string
	timestamp: number
	dataStart: number
}

type ZipDirectoryType = {[k in string]: CentralDirFileHeader}

interface EndOfCentralDir {
	signature: number
	entries: number // total number of central directory records
	cdfhOffset: number // offset of start of central directory, relative to start of archive
	cdSize: number // size of central directory (just for information)
}


export class ZipFile {
	private data: Uint8Array;
	private zipName: string; // for error messages
	private entryTable: ZipDirectoryType;

	constructor(data: Uint8Array, zipName: string) {
		this.data = data;
		this.zipName = zipName; // for error messages
		this.entryTable = this.readZipDirectory();
	}

	getZipDirectory(): ZipDirectoryType {
		return this.entryTable;
	}

	private composeError(error: Error, message: string, value: string, pos: number) {
		message = this.zipName + ": " + message; // put zipname in message
		return Utils.composeError("ZipFile", error, message, value, pos, undefined);
	}

	private subArr(begin: number, length: number) {
		const data = this.data,
			end = begin + length;

		return data.slice ? data.slice(begin, end) : data.subarray(begin, end); // array.slice on Uint8Array not for IE11
	}

	private readUTF(offset: number, len: number) {
		const callSize = 25000; // use call window to avoid "maximum call stack error" for e.g. size 336461
		let out = "";

		while (len) {
			const chunkLen = Math.min(len, callSize),
				nums = this.subArr(offset, chunkLen) as unknown as number[];

			out += String.fromCharCode.apply(null, nums); // on Chrome this is faster than single character processing
			offset += chunkLen;
			len -= chunkLen;
		}
		return out;
	}

	private readUInt(i: number) {
		const data = this.data;

		return (data[i + 3] << 24) | (data[i + 2] << 16) | (data[i + 1] << 8) | data[i]; // eslint-disable-line no-bitwise
	}

	private readUShort(i: number) {
		const data = this.data;

		return ((data[i + 1]) << 8) | data[i]; // eslint-disable-line no-bitwise
	}

	private readEocd(eocdPos: number) { // read End of central directory
		const eocd: EndOfCentralDir = {
			signature: this.readUInt(eocdPos),
			entries: this.readUShort(eocdPos + 10), // total number of central directory records
			cdfhOffset: this.readUInt(eocdPos + 16), // offset of start of central directory, relative to start of archive
			cdSize: this.readUInt(eocdPos + 20) // size of central directory (just for information)
		};

		return eocd;
	}

	private readCdfh(pos: number) { // read Central directory file header
		const cdfh: CentralDirFileHeader = {
			signature: this.readUInt(pos),
			version: this.readUShort(pos + 6), // version needed to extract (minimum)
			flag: this.readUShort(pos + 8), // General purpose bit flag
			compressionMethod: this.readUShort(pos + 10), // compression method
			modificationTime: this.readUShort(pos + 12), // File last modification time (DOS time)
			crc: this.readUInt(pos + 16), // CRC-32 of uncompressed data
			compressedSize: this.readUInt(pos + 20), // compressed size
			size: this.readUInt(pos + 24), // Uncompressed size
			fileNameLength: this.readUShort(pos + 28), // file name length
			extraFieldLength: this.readUShort(pos + 30), // extra field length
			fileCommentLength: this.readUShort(pos + 32), // file comment length
			localOffset: this.readUInt(pos + 42), // relative offset of local file header

			// set later...
			name: "",
			isDirectory: false,
			extra: [] as unknown as Uint8Array,
			comment: "",
			timestamp: 0,
			dataStart: 0
		};

		return cdfh;
	}

	private readZipDirectory() {
		const eocdLen = 22, // End of central directory (EOCD)
			maxEocdCommentLen = 0xffff,
			eocdSignature = 0x06054B50, // EOCD signature: "PK\x05\x06"
			cdfhSignature = 0x02014B50, // Central directory file header signature: PK\x01\x02"
			cdfhLen = 46, // Central directory file header length
			lfhSignature = 0x04034b50, // Local file header signature
			lfhLen = 30, // Local file header length
			data = this.data,
			entryTable: ZipDirectoryType = {};

		// find End of central directory (EOCD) record
		let i = data.length - eocdLen + 1, // +1 because of loop
			eocd: EndOfCentralDir | undefined;

		const n = Math.max(0, i - maxEocdCommentLen);

		while (i >= n) {
			i -= 1;
			if (this.readUInt(i) === eocdSignature) {
				eocd = this.readEocd(i);
				if (this.readUInt(eocd.cdfhOffset) === cdfhSignature) {
					break; // looks good, so we assume that we have found the EOCD
				}
			}
		}
		if (!eocd) {
			throw this.composeError(Error(), "Zip: File ended abruptly: EOCD not found", "", (i >= 0) ? i : 0);
		}

		const entries = eocd.entries;
		let offset = eocd.cdfhOffset;

		for (i = 0; i < entries; i += 1) {
			const cdfh = this.readCdfh(offset);

			if (cdfh.signature !== cdfhSignature) {
				throw this.composeError(Error(), "Zip: Bad CDFH signature", "", offset);
			}
			if (!cdfh.fileNameLength) {
				throw this.composeError(Error(), "Zip Entry name missing", "", offset);
			}
			offset += cdfhLen;

			cdfh.name = this.readUTF(offset, cdfh.fileNameLength);
			offset += cdfh.fileNameLength;
			cdfh.isDirectory = cdfh.name.charAt(cdfh.name.length - 1) === "/";

			cdfh.extra = this.subArr(offset, cdfh.extraFieldLength);
			offset += cdfh.extraFieldLength;

			cdfh.comment = this.readUTF(offset, cdfh.fileCommentLength);
			offset += cdfh.fileCommentLength;

			if ((cdfh.flag & 1) === 1) { // eslint-disable-line no-bitwise
				throw this.composeError(Error(), "Zip encrypted entries not supported", "", i);
			}

			const dostime = cdfh.modificationTime;

			// year, month, day, hour, minute, second
			cdfh.timestamp = new Date(((dostime >> 25) & 0x7F) + 1980, ((dostime >> 21) & 0x0F) - 1, (dostime >> 16) & 0x1F, (dostime >> 11) & 0x1F, (dostime >> 5) & 0x3F, (dostime & 0x1F) << 1).getTime(); // eslint-disable-line no-bitwise

			// local file header... much more info
			if (this.readUInt(cdfh.localOffset) !== lfhSignature) {
				Utils.console.error("Zip: readZipDirectory: LFH signature not found at offset", cdfh.localOffset);
			}

			const lfhExtrafieldLength = this.readUShort(cdfh.localOffset + 28); // extra field length

			cdfh.dataStart = cdfh.localOffset + lfhLen + cdfh.name.length + lfhExtrafieldLength;

			entryTable[cdfh.name] = cdfh;
		}
		return entryTable;
	}

	private static fnInflateConstruct(codes: CodeType, lens2: number[], n: number) {
		let i: number;

		for (i = 0; i <= 0xF; i += 1) {
			codes.count[i] = 0;
		}

		for (i = 0; i < n; i += 1) {
			codes.count[lens2[i]] += 1;
		}

		if (codes.count[0] === n) {
			return 0;
		}

		let left = 1;

		for (i = 1; i <= 0xF; i += 1) {
			if ((left = (left << 1) - codes.count[i]) < 0) { // eslint-disable-line no-bitwise
				return left;
			}
		}

		const offs = [
			undefined,
			0
		];

		for (i = 1; i < 0xF; i += 1) {
			offs[i + 1] = offs[i]! + codes.count[i];
		}

		for (i = 0; i < n; i += 1) {
			if (lens2[i] !== 0) {
				codes.symbol[offs[lens2[i]] as number] = i; // TTT
				(offs[lens2[i]] as number) += 1; // TTT
			}
		}
		return left;
	}

	private static fnConstructFixedHuffman(lens: number[], lenCode: CodeType, distCode: CodeType) { //TTT untested?
		let symbol: number;

		for (symbol = 0; symbol < 0x90; symbol += 1) {
			lens[symbol] = 8;
		}
		for (; symbol < 0x100; symbol += 1) {
			lens[symbol] = 9;
		}
		for (; symbol < 0x118; symbol += 1) {
			lens[symbol] = 7;
		}
		for (; symbol < 0x120; symbol += 1) {
			lens[symbol] = 8;
		}
		ZipFile.fnInflateConstruct(lenCode, lens, 0x120);
		for (symbol = 0; symbol < 0x1E; symbol += 1) {
			lens[symbol] = 5;
		}
		ZipFile.fnInflateConstruct(distCode, lens, 0x1E);
	}

	private inflate(offset: number, compressedSize: number, finalSize: number) {
		/* eslint-disable array-element-newline */
		const startLens = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258],
			lExt = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0],
			dists = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577],
			dExt = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
			dynamicTableOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
			/* eslint-enable array-element-newline */
			that = this, // eslint-disable-line @typescript-eslint/no-this-alias
			data = this.data,
			bufEnd = offset + compressedSize,
			outBuf = new Uint8Array(finalSize);
		let	inCnt = offset, // read position
			outCnt = 0, // bytes written to outbuf
			bitCnt = 0, // helper to keep track of where we are in #bits
			bitBuf = 0,
			distCode: CodeType,
			lenCode: CodeType,
			lens: number[];

		const fnBits = function (need: number) {
				let out = bitBuf;

				while (bitCnt < need) {
					if (inCnt === bufEnd) {
						throw that.composeError(Error(), "Zip: inflate: Data overflow", that.zipName, -1);
					}
					out |= data[inCnt] << bitCnt; // eslint-disable-line no-bitwise
					inCnt += 1;
					bitCnt += 8;
				}
				bitBuf = out >> need; // eslint-disable-line no-bitwise
				bitCnt -= need;
				return out & ((1 << need) - 1); // eslint-disable-line no-bitwise
			},

			fnDecode = function (codes: CodeType) {
				let code = 0,
					first = 0,
					i = 0;

				for (let j = 1; j <= 0xF; j += 1) {
					code |= fnBits(1); // eslint-disable-line no-bitwise
					const count = codes.count[j];

					if (code < first + count) {
						return codes.symbol[i + (code - first)];
					}
					i += count;
					first += count;
					first <<= 1; // eslint-disable-line no-bitwise
					code <<= 1; // eslint-disable-line no-bitwise
				}
				return null;
			},

			fnInflateStored = function () {
				bitBuf = 0;
				bitCnt = 0;
				if (inCnt + 4 > bufEnd) {
					throw that.composeError(Error(), "Zip: inflate: Data overflow", "", inCnt);
				}

				let len = that.readUShort(inCnt);

				inCnt += 2;

				if (data[inCnt] !== (~len & 0xFF) || data[inCnt + 1] !== ((~len >> 8) & 0xFF)) { // eslint-disable-line no-bitwise
					throw that.composeError(Error(), "Zip: inflate: Bad length", "", inCnt);
				}
				inCnt += 2;

				if (inCnt + len > bufEnd) {
					throw that.composeError(Error(), "Zip: inflate: Data overflow", "", inCnt);
				}

				// Compatibility: Instead of: outbuf.push.apply(outbuf, outbuf.slice(incnt, incnt + len)); outcnt += len; incnt += len;
				while (len) {
					outBuf[outCnt] = data[inCnt];
					outCnt += 1;
					inCnt += 1;
					len -= 1;
				}
			},

			fnConstructDynamicHuffman = function () {
				const nLen = fnBits(5) + 257,
					nDist = fnBits(5) + 1,
					nCode = fnBits(4) + 4;

				if (nLen > 0x11E || nDist > 0x1E) {
					throw that.composeError(Error(), "Zip: inflate: length/distance code overflow", "", 0);
				}
				let i: number;

				for (i = 0; i < nCode; i += 1) {
					lens[dynamicTableOrder[i]] = fnBits(3);
				}
				for (; i < 19; i += 1) {
					lens[dynamicTableOrder[i]] = 0;
				}
				if (ZipFile.fnInflateConstruct(lenCode, lens, 19) !== 0) {
					throw that.composeError(Error(), "Zip: inflate: length codes incomplete", "", 0);
				}

				for (i = 0; i < nLen + nDist;) {
					let symbol = fnDecode(lenCode) as number; // TTT

					/* eslint-disable max-depth */
					if (symbol < 16) {
						lens[i] = symbol;
						i += 1;
					} else {
						let len = 0;

						if (symbol === 16) {
							if (i === 0) {
								throw that.composeError(Error(), "Zip: inflate: repeat lengths with no first length", "", 0);
							}
							len = lens[i - 1];
							symbol = 3 + fnBits(2);
						} else if (symbol === 17) {
							symbol = 3 + fnBits(3);
						} else {
							symbol = 11 + fnBits(7);
						}

						if (i + symbol > nLen + nDist) {
							throw that.composeError(Error(), "Zip: inflate: more lengths than specified", "", 0);
						}
						while (symbol) {
							lens[i] = len;
							symbol -= 1;
							i += 1;
						}
					}
					/* eslint-enable max-depth */
				}
				const err1 = ZipFile.fnInflateConstruct(lenCode, lens, nLen),
					err2 = ZipFile.fnInflateConstruct(distCode, lens.slice(nLen), nDist);

				if ((err1 < 0 || (err1 > 0 && nLen - lenCode.count[0] !== 1))
				|| (err2 < 0 || (err2 > 0 && nDist - distCode.count[0] !== 1))) {
					throw that.composeError(Error(), "Zip: inflate: bad literal or length codes", "", 0);
				}
			},

			fnInflateHuffmann = function () {
				let symbol: number;

				do { // decode deflated data
					symbol = fnDecode(lenCode) as number; // TTT
					if (symbol < 256) {
						outBuf[outCnt] = symbol;
						outCnt += 1;
					}
					if (symbol > 256) {
						symbol -= 257;
						if (symbol > 28) {
							throw that.composeError(Error(), "Zip: inflate: Invalid length/distance", "", 0);
						}
						let len = startLens[symbol] + fnBits(lExt[symbol]);

						symbol = fnDecode(distCode) as number; // TTT
						const dist = dists[symbol] + fnBits(dExt[symbol]);

						if (dist > outCnt) {
							throw that.composeError(Error(), "Zip: inflate: distance out of range", "", 0);
						}
						// instead of outbuf.slice, we use...
						while (len) {
							outBuf[outCnt] = outBuf[outCnt - dist];
							len -= 1;
							outCnt += 1;
						}
					}
				} while (symbol !== 256);
			};

		let last: number;

		do { // The actual inflation
			last = fnBits(1);
			const type = fnBits(2);

			switch (type) {
			case 0: // STORED
				fnInflateStored();
				break;
			case 1:
			case 2: // fixed (=1) or dynamic (=2) huffman
				lenCode = {
					count: [],
					symbol: []
				};
				distCode = {
					count: [],
					symbol: []
				};
				lens = [];
				if (type === 1) { // construct fixed huffman tables
					ZipFile.fnConstructFixedHuffman(lens, lenCode, distCode);
				} else { // construct dynamic huffman tables
					fnConstructDynamicHuffman();
				}

				fnInflateHuffmann();

				break;
			default:
				throw this.composeError(Error(), "Zip: inflate: unsupported compression type" + type, "", 0);
			}
		} while (!last);
		return outBuf;
	}

	readData(name: string): string {
		const cdfh = this.entryTable[name];

		if (!cdfh) {
			throw this.composeError(Error(), "Zip: readData: file does not exist:" + name, "", 0);
		}

		let dataUTF8 = "";

		if (cdfh.compressionMethod === 0) { // stored
			dataUTF8 = this.readUTF(cdfh.dataStart, cdfh.size);
		} else if (cdfh.compressionMethod === 8) { // deflated
			const fileData = this.inflate(cdfh.dataStart, cdfh.compressedSize, cdfh.size),
				savedData = this.data;

			this.data = fileData; // we need to switch this.data
			dataUTF8 = this.readUTF(0, fileData.length);
			this.data = savedData; // restore
		} else {
			throw this.composeError(Error(), "Zip: readData: compression method not supported:" + cdfh.compressionMethod, "", 0);
		}
		if (dataUTF8.length !== cdfh.size) { // assert
			Utils.console.error("Zip: readData: different length 2!");
		}
		return dataUTF8;
	}
}
