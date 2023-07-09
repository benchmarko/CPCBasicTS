// DiskImage.ts - DiskImage
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/

// Extended DSK image definition
// https://www.cpcwiki.eu/index.php/Format:DSK_disk_image_file_format
// http://www.cpctech.org.uk/docs/extdsk.html

import { Utils } from "./Utils";


export interface DiskImageOptions {
	diskName: string,
	data: string,
	quiet?: boolean
}

interface SectorInfo {
	track: number
	head: number
	sector: number
	bps: number
	state1: number
	state2: number

	sectorSize: number
	length: number
	dataPos: number
}

type SectorNum2IndexMap = Record<number, number>;

interface TrackInfo {
	ident: string
	track: number
	head: number
	dataRate: number
	recMode: number
	bps: number
	spt: number
	gap3: number
	fill: number
	sectorInfo: SectorInfo[]
	dataPos: number
	sectorNum2Index: SectorNum2IndexMap
}

interface DiskInfo {
	ident: string
	creator: string
	tracks: number
	heads: number
	trackSize: number
	trackInfo: TrackInfo
	extended: boolean
	trackSizes: number[]
	trackPos: number[]
}

interface ExtentEntry {
	user: number
	name: string
	ext: string // extension with high bits set for special flags
	extent: number
	lastRecBytes: number
	extentHi: number // used for what?
	records: number
	blocks: number[]

	readOnly: boolean
	system: boolean
	backup: boolean
}

interface FormatDescriptor {
	tracks: number // number of tracks (1-85)
	heads: number // number of heads/sides (1-2)
	// head: 0, // head number?
	bps: number // Bytes per Sector (1-5)
	spt: number // Sectors per Track (1-18)
	gap3: number // gap between ID and data
	fill: number // filler byte
	firstSector: number // first sector number

	bls: number // BLS: data block allocaton size (1024, 2048, 4096, 8192, 16384)
	// bsh: 3, // log2 BLS - 7
	// blm: 7, // BLS / 128 - 1
	al0: number // bit significant representation of reserved directory blocks 0..7 (0x80=0, 0xc00=0 and 1,,...)
	al1: number // bit significant representation of reserved directory blocks 8..15 (0x80=8,...)
	off: number// number of reserved tracks (also the track where the directory starts)
	parentRef?: string // reference to parent format definition
}

type PartialFormatDescriptorMap = Record<string, Partial<FormatDescriptor>>;

export interface AmsdosHeader {
	user: number
	name: string
	ext: string
	typeNumber: number
	start: number
	pseudoLen: number
	entry: number
	length: number
	typeString: string
}

type DirectoryListType = Record<string, ExtentEntry[]>;

interface SectorPos {
	track: number
	head: number, // currently always 0
	sector: number
}

export class DiskImage {
	private readonly options: DiskImageOptions;
	private diskInfo: DiskInfo;
	private format: FormatDescriptor;

	setOptions(options: DiskImageOptions): void {
		if (options.quiet !== undefined) {
			this.options.quiet = options.quiet;
		}
	}

	constructor(options: DiskImageOptions) {
		this.options = {
			diskName: options.diskName,
			data: options.data,
			quiet: false
		};
		this.setOptions(options);

		// reset
		this.diskInfo = DiskImage.getInitialDiskInfo();
		this.format = DiskImage.getInitialFormat();
	}

	private static readonly formatDescriptors: PartialFormatDescriptorMap = {
		data: {
			tracks: 40, // number of tracks (1-85)
			heads: 1, // number of heads/sides (1-2)
			// head: 0, // head number?
			bps: 2, // Bytes per Sector (1-5)
			spt: 9, // Sectors per Track (1-18)
			gap3: 0x4e, // gap between ID and data
			fill: 0xe5, // filler byte
			firstSector: 0xc1, // first sector number

			bls: 1024, // BLS: data block allocaton size (1024, 2048, 4096, 8192, 16384)
			// bsh: 3, // log2 BLS - 7
			// blm: 7, // BLS / 128 - 1
			al0: 0xc0, // bit significant representation of reserved directory blocks 0..7 (0x80=0, 0xc00=0 and 1,,...)
			al1: 0x00, // bit significant representation of reserved directory blocks 8..15 (0x80=8,...)
			off: 0 // number of reserved tracks (also the track where the directory starts)
		},
		// double sided data
		data2: {
			parentRef: "data",
			heads: 2
		},

		system: {
			parentRef: "data",
			firstSector: 0x41,
			off: 2
		},

		// double sided system
		system2: {
			parentRef: "system",
			heads: 2
		},

		vortex: {
			parentRef: "data",
			tracks: 80,
			heads: 2,
			firstSector: 0x01
		},

		"3dos": {
			parentRef: "data",
			firstSector: 0x00
		},

		big780k: {
			parentRef: "data",
			al0: 0x80, // block 0 reserved
			tracks: 80,
			off: 1,
			firstSector: 0x01
		},

		big780k2: {
			parentRef: "big780k",
			heads: 2
		}
	}

	private static getInitialDiskInfo() {
		return {
			trackInfo: {
				sectorInfo: [] as SectorInfo[]
			}
		} as DiskInfo;
	}

	private static getInitialFormat() {
		return {} as FormatDescriptor;
	}

	reset(): void {
		this.diskInfo = DiskImage.getInitialDiskInfo();
		this.format = DiskImage.getInitialFormat();
	}

	private composeError(error: Error, message: string, value: string, pos?: number) {
		const len = 0;

		return Utils.composeError("DiskImage", error, this.options.diskName + ": " + message, value, pos || 0, len);
	}

	static testDiskIdent(ident: string): number {
		let diskType = 0;

		if (ident === "MV - CPC") {
			diskType = 1;
		} else if (ident === "EXTENDED") {
			diskType = 2;
		}
		return diskType;
	}

	private readUtf(pos: number, len: number) {
		const out = this.options.data.substring(pos, pos + len);

		if (out.length !== len) {
			throw this.composeError(new Error(), "End of File", "", pos);
		}

		return out;
	}

	private readUInt8(pos: number) {
		const num = this.options.data.charCodeAt(pos);

		if (isNaN(num)) {
			throw this.composeError(new Error(), "End of File", String(num), pos);
		}

		return num;
	}

	private readUInt16(pos: number) {
		return this.readUInt8(pos) + this.readUInt8(pos + 1) * 256;
	}

	private readDiskInfo(pos: number) {
		const diskInfoSize = 0x100,
			diskInfo = this.diskInfo,
			ident = this.readUtf(pos, 8), // check first 8 characters as characteristic
			diskType = DiskImage.testDiskIdent(ident);

		if (!diskType) {
			throw this.composeError(Error(), "Ident not found", ident, pos);
		}
		diskInfo.extended = (diskType === 2);

		diskInfo.ident = ident + this.readUtf(pos + 8, 34 - 8); // read remaining ident

		if (diskInfo.ident.substring(34 - 11, 34 - 11 + 9) !== "Disk-Info") { // some tools use "Disk-Info  " instead of "Disk-Info\r\n", so compare without "\r\n"
			// "Disk-Info" string is optional
			if (!this.options.quiet) {
				Utils.console.warn(this.composeError({} as Error, "Disk ident not found", diskInfo.ident.substring(34 - 11, 34 - 11 + 9), pos + 34 - 11).message);
			}
		}

		diskInfo.creator = this.readUtf(pos + 34, 14);
		diskInfo.tracks = this.readUInt8(pos + 48);
		diskInfo.heads = this.readUInt8(pos + 49);
		diskInfo.trackSize = this.readUInt16(pos + 50);

		const trackSizes = [],
			trackPosList = [],
			trackSizeCount = diskInfo.tracks * diskInfo.heads; // number of track sizes
		let	trackPos = diskInfoSize;

		pos += 52; // track sizes high bytes start at offset 52 (0x35)
		for (let i = 0; i < trackSizeCount; i += 1) {
			trackPosList.push(trackPos);
			const trackSize = diskInfo.trackSize || (this.readUInt8(pos + i) * 256); // take common track size or read individual track size (extended)

			trackSizes.push(trackSize);
			trackPos += trackSize;
		}
		diskInfo.trackSizes = trackSizes;
		diskInfo.trackPos = trackPosList;
	}

	private readTrackInfo(pos: number) {
		const trackInfoSize = 0x100,
			trackInfo = this.diskInfo.trackInfo,
			sectorInfoList = trackInfo.sectorInfo;

		trackInfo.dataPos = pos + trackInfoSize;

		trackInfo.ident = this.readUtf(pos, 12);
		if (trackInfo.ident.substring(0, 10) !== "Track-Info") { // some tools use "Track-Info  " instead of "Track-Info\r\n", so compare without "\r\n"
			// "Track-Info" string is optional
			if (!this.options.quiet) {
				Utils.console.warn(this.composeError({} as Error, "Track ident not found", trackInfo.ident.substring(0, 10), pos).message);
			}
		}
		// 4 unused bytes
		trackInfo.track = this.readUInt8(pos + 16);
		trackInfo.head = this.readUInt8(pos + 17);
		trackInfo.dataRate = this.readUInt8(pos + 18);
		trackInfo.recMode = this.readUInt8(pos + 19);
		trackInfo.bps = this.readUInt8(pos + 20);
		trackInfo.spt = this.readUInt8(pos + 21);
		trackInfo.gap3 = this.readUInt8(pos + 22);
		trackInfo.fill = this.readUInt8(pos + 23);

		sectorInfoList.length = trackInfo.spt;

		const sectorNum2Index: SectorNum2IndexMap = {};

		trackInfo.sectorNum2Index = sectorNum2Index;

		pos += 24; // start sector info

		let sectorPos = trackInfo.dataPos;

		for (let i = 0; i < trackInfo.spt; i += 1) {
			const sectorInfo = sectorInfoList[i] || {} as SectorInfo; // resue SectorInfo object if possible

			sectorInfoList[i] = sectorInfo;

			sectorInfo.dataPos = sectorPos;

			sectorInfo.track = this.readUInt8(pos);
			sectorInfo.head = this.readUInt8(pos + 1);
			sectorInfo.sector = this.readUInt8(pos + 2);
			sectorInfo.bps = this.readUInt8(pos + 3);
			sectorInfo.state1 = this.readUInt8(pos + 4);
			sectorInfo.state2 = this.readUInt8(pos + 5);

			const sectorSize = this.readUInt16(pos + 6) || (0x0080 << trackInfo.bps); // eslint-disable-line no-bitwise

			sectorInfo.sectorSize = sectorSize;
			sectorPos += sectorSize;

			sectorNum2Index[sectorInfo.sector] = i;
			pos += 8;
		}
	}

	private seekTrack(track: number, head: number) {
		const diskInfo = this.diskInfo,
			trackInfo = diskInfo.trackInfo;

		if (trackInfo.track === track && trackInfo.head === head) { // already positionend?
			return;
		}

		if (!diskInfo.ident) {
			this.readDiskInfo(0);
		}

		const trackInfoPos = diskInfo.trackPos[track * diskInfo.heads + head];

		if (trackInfoPos === undefined) {
			throw this.composeError(new Error(), "Track not found", String(track));
		}

		this.readTrackInfo(trackInfoPos);
	}

	private sectorNum2Index(sector: number) {
		const trackInfo = this.diskInfo.trackInfo,
			sectorIndex = trackInfo.sectorNum2Index[sector];

		return sectorIndex;
	}

	private seekSector(sectorIndex: number) {
		const sectorInfoList = this.diskInfo.trackInfo.sectorInfo,
			sectorInfo = sectorInfoList[sectorIndex];

		return sectorInfo;
	}

	private readSector(sector: number) {
		const trackInfo = this.diskInfo.trackInfo,
			sectorIndex = this.sectorNum2Index(sector);

		if (sectorIndex === undefined) {
			throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
		}
		const sectorInfo = this.seekSector(sectorIndex),
			out = this.readUtf(sectorInfo.dataPos, sectorInfo.sectorSize);

		return out;
	}

	// ...

	private getFormatDescriptor(format: string) {
		const derivedFormat = DiskImage.formatDescriptors[format];

		if (!derivedFormat) {
			throw this.composeError(Error(), "Unknown format", format);
		}

		let formatDescriptor: FormatDescriptor;

		if (derivedFormat.parentRef) {
			const parentFormat = this.getFormatDescriptor(derivedFormat.parentRef); // recursive

			formatDescriptor = Object.assign({}, parentFormat, derivedFormat);
		} else {
			formatDescriptor = Object.assign({} as FormatDescriptor, derivedFormat); // get a copy
		}
		return formatDescriptor;
	}

	private	determineFormat() {
		const diskInfo = this.diskInfo,
			track = 0,
			head = 0;

		this.seekTrack(track, head);

		const trackInfo = diskInfo.trackInfo;

		let firstSector = 0xff;

		for (let i = 0; i < trackInfo.spt; i += 1) {
			const sector = trackInfo.sectorInfo[i].sector;

			if (sector < firstSector) {
				firstSector = sector;
			}
		}

		let format = "";

		if (firstSector === 0xc1) {
			format = "data";
		} else if (firstSector === 0x41) {
			format = "system";
		} else if ((firstSector === 0x01) && (diskInfo.tracks === 80)) { // big780k
			format = "big780k";
		} else {
			throw this.composeError(Error(), "Unknown format with sector", String(firstSector));
		}

		if (diskInfo.heads > 1) { // maybe 2
			format += String(diskInfo.heads); // e.g. "data": "data2"
		}

		return this.getFormatDescriptor(format);
	}

	private static fnRemoveHighBit7(str: string) {
		let out = "";

		for (let i = 0; i < str.length; i += 1) {
			const char = str.charCodeAt(i);

			out += String.fromCharCode(char & 0x7f); // eslint-disable-line no-bitwise
		}
		return out;
	}

	private readDirectoryExtents(extents: ExtentEntry[], pos: number, endPos: number) {
		while (pos < endPos) {
			const extWithFlags = this.readUtf(pos + 9, 3), // extension with high bits set for special flags
				extent: ExtentEntry = {
					user: this.readUInt8(pos),
					name: DiskImage.fnRemoveHighBit7(this.readUtf(pos + 1, 8)),
					ext: DiskImage.fnRemoveHighBit7(extWithFlags), // extension
					extent: this.readUInt8(pos + 12),
					lastRecBytes: this.readUInt8(pos + 13),
					extentHi: this.readUInt8(pos + 14), // used for what?
					records: this.readUInt8(pos + 15),
					blocks: [],

					readOnly: Boolean(extWithFlags.charCodeAt(0) & 0x80), /* eslint-disable-line no-bitwise */
					system: Boolean(extWithFlags.charCodeAt(1) & 0x80), /* eslint-disable-line no-bitwise */
					backup: Boolean(extWithFlags.charCodeAt(2) & 0x80) /* eslint-disable-line no-bitwise */
				};

			pos += 16;

			const blocks = extent.blocks;

			for (let i = 0; i < 16; i += 1) {
				const block = this.readUInt8(pos + i);

				if (block) {
					blocks.push(block);
				} else { // last block
					break;
				}
			}
			pos += 16;
			extents.push(extent);
		}
		return extents;
	}

	private static fnSortByExtentNumber(a: ExtentEntry, b: ExtentEntry) {
		return a.extent - b.extent;
	}

	// do not know if we need to sort the extents per file, but...
	private static sortFileExtents(dir: DirectoryListType) {
		for (const name in dir) {
			if (dir.hasOwnProperty(name)) {
				const fileExtents = dir[name];

				fileExtents.sort(DiskImage.fnSortByExtentNumber);
			}
		}
	}

	private static prepareDirectoryList(extents: ExtentEntry[], fill: number, reFilePattern?: RegExp) {
		const dir: DirectoryListType = {};

		for (let i = 0; i < extents.length; i += 1) {
			const extent = extents[i];

			if (fill === null || extent.user !== fill) {
				const name = extent.name + "." + extent.ext; // and extent.user?

				// (do not convert filename here (to display messages in filenames))
				if (!reFilePattern || reFilePattern.test(name)) {
					if (!(name in dir)) {
						dir[name] = [];
					}
					dir[name].push(extent);
				}
			}
		}
		DiskImage.sortFileExtents(dir);
		return dir;
	}

	private convertBlock2Sector(block: number) {
		const format = this.format,
			spt = format.spt,
			blockSectors = 2,
			logSec = block * blockSectors, // directory is in block 0-1
			pos: SectorPos = {
				track: Math.floor(logSec / spt) + format.off,
				head: 0, // currently always 0
				sector: (logSec % spt) + format.firstSector
			};

		return pos;
	}

	readDirectory(): DirectoryListType {
		const directorySectors = 4,
			extents: ExtentEntry[] = [],
			format = this.determineFormat(),
			off = format.off,
			firstSector = format.firstSector;

		this.format = format;
		this.seekTrack(off, 0);

		for (let i = 0; i < directorySectors; i += 1) {
			const sectorIndex = this.sectorNum2Index(firstSector + i);

			if (sectorIndex === undefined) {
				throw this.composeError(Error(), "Cannot read directory at track " + off + " sector", String(firstSector));
			}
			const sectorInfo = this.seekSector(sectorIndex);

			this.readDirectoryExtents(extents, sectorInfo.dataPos, sectorInfo.dataPos + sectorInfo.sectorSize);
		}

		return DiskImage.prepareDirectoryList(extents, format.fill);
	}

	private nextSector(pos: SectorPos) {
		const format = this.format;

		pos.sector += 1;
		if (pos.sector >= format.firstSector + format.spt) {
			pos.track += 1;
			pos.sector = format.firstSector;
		}
	}

	private readBlock(block: number) {
		const diskInfo = this.diskInfo,
			blockSectors = 2,
			pos = this.convertBlock2Sector(block);
		let	out = "";

		if (pos.track >= diskInfo.tracks) {
			Utils.console.error(this.composeError({} as Error, "Block " + block + ": Track out of range", String(pos.track)));
		}
		if (pos.head >= diskInfo.heads) {
			Utils.console.error(this.composeError({} as Error, "Block " + block + ": Head out of range", String(pos.track)));
		}

		for (let i = 0; i < blockSectors; i += 1) {
			this.seekTrack(pos.track, pos.head);
			out += this.readSector(pos.sector);
			this.nextSector(pos);
		}
		return out;
	}

	private readExtents(fileExtents: ExtentEntry[]) {
		const recPerBlock = 8;
		let out = "";

		for (let i = 0; i < fileExtents.length; i += 1) {
			const extent = fileExtents[i],
				blocks = extent.blocks;
			let	records = extent.records;

			for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
				let block = this.readBlock(blocks[blockIndex]);

				if (records < recPerBlock) { // block with some remaining data
					block = block.substring(0, 0x80 * records);
				}

				out += block;
				records -= recPerBlock;
				if (records <= 0) {
					break;
				}
			}
		}
		return out;
	}

	readFile(fileExtents: ExtentEntry[]): string {
		let out = this.readExtents(fileExtents);

		const header = DiskImage.parseAmsdosHeader(out);
		let realLen: number | undefined;

		if (header) {
			const amsdosHeaderLength = 0x80;

			realLen = header.length + amsdosHeaderLength;
		}

		if (realLen === undefined) { // no real length: ASCII: find EOF (0x1a) in last record
			const fileLen = out.length,
				lastRecPos = fileLen > 0x80 ? (fileLen - 0x80) : 0,
				index = out.indexOf(String.fromCharCode(0x1a), lastRecPos);

			if (index >= 0) {
				realLen = index;
				if (Utils.debug > 0) {
					Utils.console.debug("readFile: ASCII file length " + fileLen + " truncated to " + realLen);
				}
			}
		}

		if (realLen !== undefined) { // now real length (from header or ASCII)?
			out = out.substring(0, realLen);
		}
		return out;
	}

	// ...

	// see AMSDOS ROM, &D252
	/* eslint-disable array-element-newline */
	private static protectTable = [
		[0xe2, 0x9d, 0xdb, 0x1a, 0x42, 0x29, 0x39, 0xc6, 0xb3, 0xc6, 0x90, 0x45, 0x8a], // 13 bytes
		[0x49, 0xb1, 0x36, 0xf0, 0x2e, 0x1e, 0x06, 0x2a, 0x28, 0x19, 0xea] // 11 bytes
	];
	/* eslint-enable array-element-newline */

	static unOrProtectData(data: string): string {
		const table1 = DiskImage.protectTable[0],
			table2 = DiskImage.protectTable[1];
		let out = "";

		for (let i = 0; i < data.length; i += 1) {
			let byte = data.charCodeAt(i);

			byte ^= table1[(i & 0x7f) % table1.length] ^ table2[(i & 0x7f) % table2.length]; // eslint-disable-line no-bitwise
			out += String.fromCharCode(byte);
		}
		return out;
	}

	// ...

	private static computeChecksum(data: string) {
		let sum = 0;

		for (let i = 0; i < data.length; i += 1) {
			sum += data.charCodeAt(i);
		}
		return sum;
	}

	static parseAmsdosHeader(data: string): AmsdosHeader | undefined {
		const typeMap: Record<number, string> = {
			0: "T", // tokenized BASIC (T=not official)
			1: "P", // protected BASIC (also tokenized)
			2: "B", // Binary
			8: "G", // GENA3 Assember (G=not official)
			0x16: "A" // ASCII
		};

		let header: AmsdosHeader | undefined;

		// http://www.benchmarko.de/cpcemu/cpcdoc/chapter/cpcdoc7_e.html#I_AMSDOS_HD
		// http://www.cpcwiki.eu/index.php/AMSDOS_Header
		if (data.length >= 0x80) {
			const computed = DiskImage.computeChecksum(data.substring(0, 66)),
				sum = data.charCodeAt(67) + data.charCodeAt(68) * 256;

			if (computed === sum) {
				header = {
					user: data.charCodeAt(0),
					name: data.substring(1, 1 + 8),
					ext: data.substring(9, 9 + 3),
					typeNumber: data.charCodeAt(18),
					start: data.charCodeAt(21) + data.charCodeAt(22) * 256,
					pseudoLen: data.charCodeAt(24) + data.charCodeAt(25) * 256,
					entry: data.charCodeAt(26) + data.charCodeAt(27) * 256,
					length: data.charCodeAt(64) + data.charCodeAt(65) * 256 + data.charCodeAt(66) * 65536,
					typeString: ""
				};

				header.typeString = typeMap[header.typeNumber] || typeMap[16]; // default: ASCII
			}
		}
		return header;
	}

	private static uInt8ToString(value: number) {
		return String.fromCharCode(value);
	}

	private static uInt16ToString(value: number) {
		return DiskImage.uInt8ToString(value & 0xff) + DiskImage.uInt8ToString((value >> 8) & 0xff); // eslint-disable-line no-bitwise
	}

	private static uInt24ToString(value: number) {
		return DiskImage.uInt16ToString(value & 0xffff) + DiskImage.uInt8ToString(value >> 16); // eslint-disable-line no-bitwise
	}

	static combineAmsdosHeader(header: AmsdosHeader): string {
		const typeMap: Record<string, number> = {
			T: 0, // tokenized BASIC (T=not official)
			P: 1, // protected BASIC
			B: 2, // Binary
			G: 8, // GENA3 Assember (G=not official)
			A: 0x16 // ASCII
		};
		let type = header.typeNumber;

		if (header.typeString) { // overwrite type form type
			type = typeMap[header.typeString];
			if (type === undefined) {
				type = typeMap.A;
			}
		}

		const data1
			= DiskImage.uInt8ToString(header.user || 0)
			+ (header.name || "").padEnd(8, " ")
			+ (header.ext || "").padEnd(3, " ")
			+ DiskImage.uInt16ToString(0)
			+ DiskImage.uInt16ToString(0)
			+ DiskImage.uInt8ToString(0) // block number (unused)
			+ DiskImage.uInt8ToString(0) // last block (unused)
			+ DiskImage.uInt8ToString(type)
			+ DiskImage.uInt16ToString(0) // data location (unused)
			+ DiskImage.uInt16ToString(header.start || 0)
			+ DiskImage.uInt8ToString(0xff) // first block (unused, always 0xff)
			+ DiskImage.uInt16ToString(header.pseudoLen || header.length) // logical length
			+ DiskImage.uInt16ToString(header.entry || 0)
			+ " ".repeat(36)
			+ DiskImage.uInt24ToString(header.length),

			checksum = DiskImage.computeChecksum(data1),

			data = data1
				+ DiskImage.uInt16ToString(checksum)
				+ "\x00".repeat(59);

		return data;
	}
}
