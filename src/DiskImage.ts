// DiskImage.ts - DiskImage
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/

// Extended DSK image definition
// https://www.cpcwiki.eu/index.php/Format:DSK_disk_image_file_format
// http://www.cpctech.org.uk/docs/extdsk.html

import { Utils } from "./Utils";


export interface DiskImageOptions {
	diskName?: string,
	data: string, // we should convert it to Uint8Array for improved writing to DSK
	creator?: string,
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
	sectorInfoList: SectorInfo[]

	sectorNum2Index: SectorNum2IndexMap
}

interface DiskInfo {
	ident: string
	creator: string
	tracks: number
	heads: number
	trackSize: number
	trackSizes: number[]

	trackInfo: TrackInfo
	trackInfoPosList: number[]
	extended: boolean
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
	private formatDescriptor?: FormatDescriptor;

	constructor(options: DiskImageOptions) {
		this.diskInfo = DiskImage.getInitialDiskInfo();

		this.options = {
			data: "",
			quiet: false
		} as DiskImageOptions;
		this.setOptions(options);
	}

	getOptions(): DiskImageOptions {
		return this.options;
	}

	setOptions(options: Partial<DiskImageOptions>): void {
		const currentData = this.options.data;

		Object.assign(this.options, options);

		if (this.options.data !== currentData) { // changed?
			this.diskInfo.ident = ""; // invalidate diskinfo
			this.diskInfo.trackInfo.ident = ""; // invalidate trackinfo
		}
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

		data42t: {
			parentRef: "data",
			tracks: 42
		},

		// double sided data
		data2h: {
			parentRef: "data",
			heads: 2
		},

		system: {
			parentRef: "data",
			firstSector: 0x41,
			off: 2
		},

		// double sided system
		system2h: {
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

		parados80: { // 396K (https://www.cpcwiki.eu/imgs/0/0d/Parados.pdf)
			parentRef: "data",
			tracks: 80,
			firstSector: 0x91,
			spt: 10,
			bls: 2048
		},

		big780k: {
			parentRef: "data",
			al0: 0x80, // block 0 reserved
			tracks: 80,
			off: 1,
			firstSector: 0x01
		},

		big780k2h: {
			parentRef: "big780k",
			heads: 2
		}
	}

	private static getInitialDiskInfo() {
		const diskInfo: DiskInfo = {
			ident: "",
			creator: "",
			tracks: 0,
			heads: 0,
			trackSize: 0,
			trackInfo: {
				ident: "",
				sectorInfoList: [] as SectorInfo[]
			} as TrackInfo,
			trackSizes: [],
			trackInfoPosList: [],
			extended: false
		};

		return diskInfo;
	}

	private getFormatDescriptor() {
		const formatDescriptor = this.formatDescriptor;

		if (!formatDescriptor) {
			throw this.composeError(Error(), "getFormatDescriptor: formatDescriptor:", String(formatDescriptor));
		}
		return formatDescriptor;
	}

	private composeError(error: Error, message: string, value: string, pos?: number) {
		const len = 0;

		return Utils.composeError("DiskImage", error, this.options.diskName + ": " + message, value, pos || 0, len);
	}

	private static readonly diskInfoIdentMap: Record<string, number> = {
		"MV - CPC": 1,
		EXTENDED: 2
	}

	static testDiskIdent(ident: string): number {
		const diskType = DiskImage.diskInfoIdentMap[ident] || 0;

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

	private static uInt8ToString(value: number) {
		return String.fromCharCode(value);
	}

	private static uInt16ToString(value: number) {
		return DiskImage.uInt8ToString(value & 0xff) + DiskImage.uInt8ToString((value >> 8) & 0xff); // eslint-disable-line no-bitwise
	}

	private static uInt24ToString(value: number) {
		return DiskImage.uInt16ToString(value & 0xffff) + DiskImage.uInt8ToString(value >> 16); // eslint-disable-line no-bitwise
	}

	private static readonly diskInfoSize = 0x100;

	private readDiskInfo(diskInfo: DiskInfo, pos: number) {
		const ident = this.readUtf(pos, 8), // check first 8 characters as characteristic
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
			trackInfoPosList = [],
			trackSizeCount = diskInfo.tracks * diskInfo.heads; // number of track sizes
		let	trackInfoPos = DiskImage.diskInfoSize;

		pos += 52; // track sizes high bytes start at offset 52 (0x35)
		for (let i = 0; i < trackSizeCount; i += 1) {
			trackInfoPosList.push(trackInfoPos);
			const trackSize = diskInfo.trackSize || (this.readUInt8(pos + i) * 256); // take common track size or read individual track size (extended)

			trackSizes.push(trackSize);
			trackInfoPos += trackSize;
		}
		diskInfo.trackSizes = trackSizes;
		diskInfo.trackInfoPosList = trackInfoPosList;
		diskInfo.trackInfo.ident = ""; // make sure it is invalid

		if (Utils.debug > 1) {
			Utils.console.debug("readDiskInfo: extended=" + diskInfo.extended + ", tracks=" + diskInfo.tracks + ", heads=" + diskInfo.heads + ", trackSize=" + diskInfo.trackSize);
		}
	}

	private static createDiskInfoAsString(diskInfo: DiskInfo) {
		// only standard format
		const diskInfoString = diskInfo.ident // 34
			+ diskInfo.creator // 14
			+ DiskImage.uInt8ToString(diskInfo.tracks)
			+ DiskImage.uInt8ToString(diskInfo.heads)
			+ DiskImage.uInt16ToString(diskInfo.trackSize)
			+ DiskImage.uInt8ToString(0).repeat(204); // unused

		return diskInfoString;
	}

	private static readonly trackInfoSize = 0x100;

	private readTrackInfo(trackInfo: TrackInfo, pos: number) {
		const trackInfoSize = DiskImage.trackInfoSize,
			sectorInfoList = trackInfo.sectorInfoList,
			trackDataPos = pos + trackInfoSize;

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

		let sectorPos = trackDataPos;

		for (let i = 0; i < trackInfo.spt; i += 1) {
			const sectorInfo = sectorInfoList[i] || {} as SectorInfo; // reuse SectorInfo object if possible

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

	private static createTrackInfoAsString(trackInfo: TrackInfo) {
		const sectorInfoList = trackInfo.sectorInfoList;
		let trackInfoString = trackInfo.ident // 12
			+ DiskImage.uInt8ToString(0).repeat(4) // 4 unused
			+ DiskImage.uInt8ToString(trackInfo.track)
			+ DiskImage.uInt8ToString(trackInfo.head)
			+ DiskImage.uInt8ToString(trackInfo.dataRate)
			+ DiskImage.uInt8ToString(trackInfo.recMode)
			+ DiskImage.uInt8ToString(trackInfo.bps)
			+ DiskImage.uInt8ToString(trackInfo.spt)
			+ DiskImage.uInt8ToString(trackInfo.gap3)
			+ DiskImage.uInt8ToString(trackInfo.fill);

		for (let i = 0; i < trackInfo.spt; i += 1) {
			const sectorInfo = sectorInfoList[i],
				sectorinfoString = DiskImage.uInt8ToString(sectorInfo.track)
				+ DiskImage.uInt8ToString(sectorInfo.head)
				+ DiskImage.uInt8ToString(sectorInfo.sector)
				+ DiskImage.uInt8ToString(sectorInfo.bps)
				+ DiskImage.uInt8ToString(sectorInfo.state1)
				+ DiskImage.uInt8ToString(sectorInfo.state2)
				+ DiskImage.uInt16ToString(0); // We use 0 (sectorInfo.sectorSize only needed for extended format)

			trackInfoString += sectorinfoString;
		}

		// fill up
		trackInfoString += DiskImage.uInt8ToString(0).repeat(DiskImage.trackInfoSize - trackInfoString.length);

		return trackInfoString;
	}

	private seekTrack(diskInfo: DiskInfo, track: number, head: number) {
		if (!diskInfo.ident) {
			this.readDiskInfo(diskInfo, 0);
		}

		const trackInfo = diskInfo.trackInfo;

		if (trackInfo.ident && trackInfo.track === track && trackInfo.head === head) { // already positionend?
			return;
		}

		const trackInfoPos = diskInfo.trackInfoPosList[track * diskInfo.heads + head];

		if (trackInfoPos === undefined) {
			throw this.composeError(new Error(), "Track not found", String(track));
		}

		this.readTrackInfo(trackInfo, trackInfoPos);
	}

	private static sectorNum2Index(trackInfo: TrackInfo, sector: number) {
		const sectorIndex = trackInfo.sectorNum2Index[sector];

		return sectorIndex;
	}

	private static seekSector(sectorInfoList: SectorInfo[], sectorIndex: number) {
		return sectorInfoList[sectorIndex];
	}

	private readSector(trackInfo: TrackInfo, sector: number) {
		const sectorIndex = DiskImage.sectorNum2Index(trackInfo, sector);

		if (sectorIndex === undefined) {
			throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
		}
		const sectorInfo = DiskImage.seekSector(trackInfo.sectorInfoList, sectorIndex),
			out = this.readUtf(sectorInfo.dataPos, sectorInfo.sectorSize);

		return out;
	}

	private writeSector(trackInfo: TrackInfo, sector: number, sectorData: string) {
		const sectorIndex = DiskImage.sectorNum2Index(trackInfo, sector);

		if (sectorIndex === undefined) {
			throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
		}
		const sectorInfo = DiskImage.seekSector(trackInfo.sectorInfoList, sectorIndex),
			data = this.options.data;

		if (sectorData.length !== sectorInfo.sectorSize) {
			Utils.console.error(this.composeError({} as Error, "sectordata.length " + sectorData.length + " <> sectorSize " + sectorInfo.sectorSize, String(0)));
		}

		this.options.data = data.substring(0, sectorInfo.dataPos) + sectorData + data.substring(sectorInfo.dataPos + sectorInfo.sectorSize);
	}

	// ...

	private composeFormatDescriptor(format: string) {
		const derivedFormatDescriptor = DiskImage.formatDescriptors[format];

		if (!derivedFormatDescriptor) {
			throw this.composeError(Error(), "Unknown format", format);
		}

		let formatDescriptor: FormatDescriptor;

		if (derivedFormatDescriptor.parentRef) {
			const parentFormatDescriptor = this.composeFormatDescriptor(derivedFormatDescriptor.parentRef); // recursive

			formatDescriptor = Object.assign({}, parentFormatDescriptor, derivedFormatDescriptor);
		} else {
			formatDescriptor = Object.assign({} as FormatDescriptor, derivedFormatDescriptor); // get a copy
		}
		return formatDescriptor;
	}

	private	determineFormat(diskInfo: DiskInfo) {
		const trackInfo = diskInfo.trackInfo,
			track = 0,
			head = 0;

		this.seekTrack(diskInfo, track, head);

		let firstSector = 0xff;

		for (let i = 0; i < trackInfo.spt; i += 1) {
			const sector = trackInfo.sectorInfoList[i].sector;

			if (sector < firstSector) {
				firstSector = sector;
			}
		}

		let format = "";

		if (firstSector === 0xc1) {
			format = "data";
		} else if (firstSector === 0x41) {
			format = "system";
		} else if ((firstSector === 0x91) && (diskInfo.tracks === 80)) { // parados80
			format = "parados80";
		} else if ((firstSector === 0x01) && (diskInfo.tracks === 80)) { // big780k (usually diskInfo.heads: 2)
			format = "big780k";
		} else {
			throw this.composeError(Error(), "Unknown format with sector", String(firstSector));
		}

		if (diskInfo.heads > 1) { // maybe 2
			format += String(diskInfo.heads); // e.g. "data": "data2"
		}

		if (Utils.debug > 1) {
			Utils.console.debug("determineFormat: format=", format);
		}
		return format;
	}

	private createImage(format: string) {
		const formatDescriptor = this.composeFormatDescriptor(format),
			sectorInfoList: SectorInfo[] = [],
			sectorSize = (0x80 << formatDescriptor.bps), // eslint-disable-line no-bitwise
			sectorInfo: SectorInfo = {
				track: 0,
				head: 0,
				sector: 0,
				bps: formatDescriptor.bps,
				state1: 0,
				state2: 0,
				sectorSize: sectorSize,
				dataPos: 0
			},
			trackInfo: TrackInfo = {
				ident: "Track-Info\r\n",
				track: 0,
				head: 0,
				dataRate: 0,
				recMode: 0,
				bps: formatDescriptor.bps,
				spt: formatDescriptor.spt,
				gap3: formatDescriptor.gap3,
				fill: formatDescriptor.fill,
				sectorInfoList: sectorInfoList,
				sectorNum2Index: {}
			},
			diskInfo: DiskInfo = {
				ident: "MV - CPCEMU Disk-File\r\nDisk-Info\r\n", // 34
				creator: (this.options.creator || "CpcBasicTS").padEnd(14, " "), // 14
				tracks: formatDescriptor.tracks,
				heads: formatDescriptor.heads,
				trackSize: DiskImage.trackInfoSize + formatDescriptor.spt * sectorSize, // eslint-disable-line no-bitwise
				trackInfo: trackInfo,
				trackSizes: [], // only for extended DSK format
				trackInfoPosList: [],
				extended: false
			},
			emptySectorData = DiskImage.uInt8ToString(formatDescriptor.fill).repeat(sectorSize);

		for (let i = 0; i < trackInfo.spt; i += 1) {
			const sectorInfoClone = {
				...sectorInfo
			};

			sectorInfoClone.sector = formatDescriptor.firstSector + i;
			trackInfo.sectorNum2Index[sectorInfoClone.sector] = i;
			sectorInfoList.push(sectorInfoClone);
		}

		let image = DiskImage.createDiskInfoAsString(diskInfo),
			trackInfoPos = DiskImage.diskInfoSize;

		for (let track = 0; track < formatDescriptor.tracks; track += 1) {
			for (let head = 0; head < formatDescriptor.heads; head += 1) {
				trackInfo.track = track;
				trackInfo.head = head;
				diskInfo.trackInfoPosList.push(trackInfoPos);

				for (let sector = 0; sector < trackInfo.spt; sector += 1) {
					const sectorInfo2 = sectorInfoList[sector];

					sectorInfo2.track = track;
					sectorInfo2.head = head;
					// in case we want to use the formatted image...
					sectorInfo2.dataPos = trackInfoPos + DiskImage.trackInfoSize + sector * sectorInfo2.sectorSize;
				}

				const trackAsString = DiskImage.createTrackInfoAsString(trackInfo);

				image += trackAsString;
				for (let sector = 0; sector < formatDescriptor.spt; sector += 1) {
					image += emptySectorData;
				}

				trackInfoPos += diskInfo.trackSize;
			}
		}

		this.diskInfo = diskInfo;
		this.formatDescriptor = formatDescriptor;
		return image;
	}

	formatImage(format: string): string {
		const image = this.createImage(format);

		this.options.data = image;
		return image;
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
			const extent: ExtentEntry = {
				user: this.readUInt8(pos),
				name: this.readUtf(pos + 1, 8),
				ext: this.readUtf(pos + 9, 3), // extension with flags
				extent: this.readUInt8(pos + 12),
				lastRecBytes: this.readUInt8(pos + 13),
				extentHi: this.readUInt8(pos + 14), // used for what?
				records: this.readUInt8(pos + 15),
				blocks: []
			};

			pos += 16;

			const blocks = extent.blocks;

			for (let i = 0; i < 16; i += 1) {
				const block = this.readUInt8(pos + i);

				blocks.push(block);
			}
			pos += 16;
			extents.push(extent);
		}
		return extents;
	}

	private static createDirectoryExtentAsString(extent: ExtentEntry) {
		let	extentString = DiskImage.uInt8ToString(extent.user)
			+ extent.name
			+ extent.ext
			+ DiskImage.uInt8ToString(extent.extent)
			+ DiskImage.uInt8ToString(extent.lastRecBytes)
			+ DiskImage.uInt8ToString(extent.extentHi)
			+ DiskImage.uInt8ToString(extent.records),
			blockString = "";

		for (let i = 0; i < extent.blocks.length; i += 1) {
			blockString += DiskImage.uInt8ToString(extent.blocks[i]);
		}
		extentString += blockString;

		return extentString;
	}

	private static createSeveralDirectoryExtentsAsString(extents: ExtentEntry[], first: number, last: number) {
		let extentString = "";

		for (let i = first; i < last; i += 1) {
			extentString += DiskImage.createDirectoryExtentAsString(extents[i]);
		}
		return extentString;
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
				const name = DiskImage.fnRemoveHighBit7(extent.name) + "." + DiskImage.fnRemoveHighBit7(extent.ext); // and extent.user?

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

	private static convertBlock2Sector(formatDescriptor: FormatDescriptor, block: number) {
		const spt = formatDescriptor.spt,
			blockSectors = formatDescriptor.bls / 512, // usually 2
			logSec = block * blockSectors, // directory is in block 0-1
			pos: SectorPos = {
				track: Math.floor(logSec / spt) + formatDescriptor.off,
				head: 0, // currently always 0
				sector: (logSec % spt) + formatDescriptor.firstSector
			};

		return pos;
	}

	private readAllDirectoryExtents(diskInfo: DiskInfo, formatDescriptor: FormatDescriptor, extents: ExtentEntry[]) {
		const directorySectors = 4, // could be determined from al0,al1
			off = formatDescriptor.off,
			firstSector = formatDescriptor.firstSector,
			trackInfo = diskInfo.trackInfo,
			sectorInfoList = trackInfo.sectorInfoList;

		this.seekTrack(diskInfo, off, 0);

		for (let i = 0; i < directorySectors; i += 1) {
			const sectorIndex = DiskImage.sectorNum2Index(trackInfo, firstSector + i);

			if (sectorIndex === undefined) {
				throw this.composeError(Error(), "Cannot read directory at track " + off + " sector", String(firstSector));
			}
			const sectorInfo = DiskImage.seekSector(sectorInfoList, sectorIndex);

			this.readDirectoryExtents(extents, sectorInfo.dataPos, sectorInfo.dataPos + sectorInfo.sectorSize);
		}
		return extents;
	}

	private writeAllDirectoryExtents(diskInfo: DiskInfo, formatDescriptor: FormatDescriptor, extents: ExtentEntry[]) {
		const directoryBlocks = 2, // could be determined from al0,al1
			extentsPerBlock = extents.length / directoryBlocks;

		for (let i = 0; i < directoryBlocks; i += 1) {
			const blockData = DiskImage.createSeveralDirectoryExtentsAsString(extents, i * extentsPerBlock, (i + 1) * extentsPerBlock);

			this.writeBlock(diskInfo, formatDescriptor, i, blockData);
		}
	}

	readDirectory(): DirectoryListType {
		const diskInfo = this.diskInfo,
			format = this.determineFormat(diskInfo),
			formatDescriptor = this.composeFormatDescriptor(format),
			extents: ExtentEntry[] = [];

		this.formatDescriptor = formatDescriptor;
		this.readAllDirectoryExtents(diskInfo, formatDescriptor, extents);
		return DiskImage.prepareDirectoryList(extents, this.formatDescriptor.fill);
	}

	private static nextSector(formatDescriptor: FormatDescriptor, pos: SectorPos) {
		pos.sector += 1;
		if (pos.sector >= formatDescriptor.firstSector + formatDescriptor.spt) {
			pos.track += 1;
			pos.sector = formatDescriptor.firstSector;
		}
	}

	private readBlock(diskInfo: DiskInfo, formatDescriptor: FormatDescriptor, block: number) {
		const blockSectors = formatDescriptor.bls / 512, // usually 2
			pos = DiskImage.convertBlock2Sector(formatDescriptor, block);
		let	out = "";

		if (pos.track >= diskInfo.tracks) {
			Utils.console.error(this.composeError({} as Error, "Block " + block + ": Track out of range", String(pos.track)));
		}
		if (pos.head >= diskInfo.heads) {
			Utils.console.error(this.composeError({} as Error, "Block " + block + ": Head out of range", String(pos.track)));
		}

		for (let i = 0; i < blockSectors; i += 1) {
			this.seekTrack(diskInfo, pos.track, pos.head);
			out += this.readSector(diskInfo.trackInfo, pos.sector);
			DiskImage.nextSector(formatDescriptor, pos);
		}
		return out;
	}

	private writeBlock(diskInfo: DiskInfo, formatDescriptor: FormatDescriptor, block: number, blockData: string) {
		const blockSectors = formatDescriptor.bls / 512, // usually 2
			sectorSize = (0x80 << formatDescriptor.bps), // eslint-disable-line no-bitwise
			pos = DiskImage.convertBlock2Sector(formatDescriptor, block);

		if (pos.track >= diskInfo.tracks) {
			Utils.console.error(this.composeError({} as Error, "Block " + block + ": Track out of range", String(pos.track)));
		}
		if (pos.head >= diskInfo.heads) {
			Utils.console.error(this.composeError({} as Error, "Block " + block + ": Head out of range", String(pos.track)));
		}

		if (blockData.length !== (blockSectors * sectorSize)) {
			Utils.console.error(this.composeError({} as Error, "blockData.length " + blockData.length + " <> blockSize " + (blockSectors * sectorSize), String(0)));
		}

		for (let i = 0; i < blockSectors; i += 1) {
			this.seekTrack(diskInfo, pos.track, pos.head);

			const sectorData = blockData.substring(i * sectorSize, (i + 1) * sectorSize);

			this.writeSector(diskInfo.trackInfo, pos.sector, sectorData);
			DiskImage.nextSector(formatDescriptor, pos);
		}
	}

	private readExtents(diskInfo: DiskInfo, formatDescriptor: FormatDescriptor, fileExtents: ExtentEntry[]) {
		const recPerBlock = formatDescriptor.bls / 128; // usually 8
		let out = "";

		for (let i = 0; i < fileExtents.length; i += 1) {
			const extent = fileExtents[i],
				blocks = extent.blocks;
			let	records = extent.records;

			if (extent.extent > 0) {
				if (recPerBlock > 8) { // fast hack for parados: adapt records
					records += extent.extent * 128;
				}
			}

			for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
				let block = this.readBlock(diskInfo, formatDescriptor, blocks[blockIndex]);

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
		const diskInfo = this.diskInfo,
			formatDescriptor = this.getFormatDescriptor();
		let out = this.readExtents(diskInfo, formatDescriptor, fileExtents);

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


	private static getFreeExtents(extents: ExtentEntry[], fill: number) {
		const freeExtents: number[] = [];

		for (let i = 0; i < extents.length; i += 1) {
			if (extents[i].user === fill) {
				freeExtents.push(i);
			}
		}
		return freeExtents;
	}

	private static getBlockMask(extents: ExtentEntry[], fill: number, dsm: number, al0: number, al1: number) {
		const blockMask: boolean[] = [];

		for (let i = 0; i < dsm - 1; i += 1) {
			blockMask[i] = false;
		}

		// mark reserved blocks
		let mask = 0x80;

		for (let i = 0; i < 8; i += 1) {
			if (al0 & mask) { // eslint-disable-line no-bitwise
				blockMask[i] = true; // mark reserved block
			}
			mask >>= 1; // eslint-disable-line no-bitwise
		}

		mask = 0x80;

		for (let i = 8; i < 16; i += 1) {
			if (al1 & mask) { // eslint-disable-line no-bitwise
				blockMask[i] = true; // mark reserved block
			}
			mask >>= 1; // eslint-disable-line no-bitwise
		}

		for (let i = 0; i < extents.length; i += 1) {
			const extent = extents[i],
				blockList = extent.blocks;

			if (extent.user !== fill) {
				for (let blockindex = 0; blockindex < blockList.length; blockindex += 1) {
					const block = blockList[blockindex];

					if (block) {
						if (blockMask[block]) { // eslint-disable-line max-depth
							Utils.console.warn("getBlockMask: Block number already in use: ", block);
						}
						blockMask[block] = true;
					} else {
						break; // block=0 -> no more for this extent
					}
				}
			}
		}
		return blockMask;
	}

	private static getFreeBlocks(blockMask: boolean[], dsm: number) {
		const freeBlocks: number[] = [];

		for (let i = 0; i < dsm; i += 1) {
			if (!blockMask[i]) {
				freeBlocks.push(i);
			}
		}

		return freeBlocks;
	}

	static getFilenameAndExtension(filename: string): string[] {
		let [name1, ext1] = filename.split("."); // eslint-disable-line array-element-newline

		name1 = name1.substring(0, 8).toUpperCase().padEnd(8, " ");
		ext1 = ext1.substring(0, 3).toUpperCase().padEnd(3, " ");

		return [name1, ext1]; // eslint-disable-line array-element-newline
	}

	writeFile(filename: string, data: string): boolean {
		const diskInfo = this.diskInfo,
			formatDescriptor = this.getFormatDescriptor(),
			extents: ExtentEntry[] = [];

		this.readAllDirectoryExtents(diskInfo, formatDescriptor, extents);

		const fill = formatDescriptor.fill,
			freeExtents = DiskImage.getFreeExtents(extents, formatDescriptor.fill),
			sectors = (formatDescriptor.tracks - formatDescriptor.off) * formatDescriptor.spt,
			ssize = 0x80 << formatDescriptor.bps, // eslint-disable-line no-bitwise
			dsm = ((sectors * ssize) / formatDescriptor.bls) | 0, // eslint-disable-line no-bitwise
			// DSM: total size of disc in blocks excluding any reserved tracks
			al0 = formatDescriptor.al0,
			al1 = formatDescriptor.al1,
			blockMask = DiskImage.getBlockMask(extents, fill, dsm, al0, al1),
			freeBlocks = DiskImage.getFreeBlocks(blockMask, dsm);

		if (Utils.debug > 0) {
			Utils.console.debug("writeFile: freeExtents=", freeExtents.length, ", freeBlocks=", freeBlocks);
		}

		if (!freeBlocks.length) {
			Utils.console.warn("writeFile: " + filename + ": No space left!");
			return false;
		}
		if (!freeExtents.length) {
			Utils.console.warn("writeFile: " + filename + ": Directory full!");
			return false;
		}

		const [name1, ext1] = DiskImage.getFilenameAndExtension(filename), // eslint-disable-line array-element-newline
			fileSize = data.length,
			bls = formatDescriptor.bls,
			requiredBlocks = ((fileSize + bls - 1) / bls) | 0; // eslint-disable-line no-bitwise

		if (requiredBlocks > freeBlocks.length) {
			const requiredKB = ((requiredBlocks * bls) / 1024) | 0, // eslint-disable-line no-bitwise
				freeKB = ((freeBlocks.length * bls) / 1024) | 0; // eslint-disable-line no-bitwise

			Utils.console.warn("writeFile: " + filename + ": Not enough space left (" + requiredKB + "K > " + freeKB + "K). Ignoring.");
			return false;
		}

		const blocksPerExtent = 16,
			requiredExtents = ((requiredBlocks + blocksPerExtent - 1) / blocksPerExtent) | 0; // eslint-disable-line no-bitwise

		if (requiredExtents > freeExtents.length) {
			Utils.console.warn("writeFile: " + filename + ": Directory full!");
			return false;
		}

		let size = fileSize,
			extent: ExtentEntry | undefined,
			extentCnt = 0,
			blockCnt = 0;

		while (size > 0) {
			if (!extent || (blockCnt >= 16)) {
				const records = ((size + 0x80 - 1) / 0x80) | 0; // eslint-disable-line no-bitwise

				extent = extents[freeExtents[extentCnt]];
				extent.user = 0;
				extent.name = name1;
				extent.ext = ext1;
				extent.extent = extentCnt;
				extent.lastRecBytes = 0; // ($size >= 0x80) ? 0 : $size;
				extent.extentHi = 0;
				extent.records = (records > 0x80) ? 0x80 : records;
				extent.blocks.length = 0;
				for (let i = 0; i < 16; i += 1) {
					extent.blocks[i] = 0;
				}
				extentCnt += 1;
				blockCnt = 0;
			}

			const thisSize = (size > bls) ? bls : size;
			let	dataChunk = data.substring(fileSize - size, fileSize - size + thisSize);

			if (thisSize < bls) {
				dataChunk += DiskImage.uInt8ToString(0x1a); // add EOF (0x1a)
				const remain = bls - thisSize - 1;

				dataChunk += DiskImage.uInt8ToString(formatDescriptor.fill).repeat(remain); // fill up last block with fill byte
			}

			const block = freeBlocks[(extentCnt - 1) * 16 + blockCnt];

			this.writeBlock(diskInfo, formatDescriptor, block, dataChunk);
			extent.blocks[blockCnt] = block;
			blockCnt += 1;
			size -= thisSize;
		}

		this.writeAllDirectoryExtents(diskInfo, formatDescriptor, extents);
		return true;
	}

	private static isSectorEmpty(data: string, index: number, size: number, fill: number) {
		const endIndex = (index + size) <= data.length ? index + size : data.length - index;
		let isEmpty = true;

		for (let i = index; i < endIndex; i += 1) {
			if (data.charCodeAt(i) !== fill) {
				isEmpty = false;
				break;
			}
		}
		return isEmpty;
	}

	stripEmptyTracks(): string {
		const diskInfo = this.diskInfo,
			format = this.determineFormat(diskInfo),
			formatDescriptor = this.composeFormatDescriptor(format),
			tracks = diskInfo.tracks,
			firstDataTrack = formatDescriptor.off,
			head = 0;
		let data = this.options.data;

		this.formatDescriptor = formatDescriptor;

		for (let track = firstDataTrack; track < tracks; track += 1) {
			this.seekTrack(diskInfo, track, head);
			const trackInfo = diskInfo.trackInfo,
				fill = diskInfo.trackInfo.fill,
				sectorInfoList = trackInfo.sectorInfoList;
			let isEmpty = true;

			for (let i = 0; i < trackInfo.spt; i += 1) {
				const sectorInfo = sectorInfoList[i];

				if (!DiskImage.isSectorEmpty(data, sectorInfo.dataPos, sectorInfo.sectorSize, fill)) {
					isEmpty = false;
					break;
				}
			}
			if (isEmpty) {
				diskInfo.tracks = track; // set new number of tracks

				const trackDataPos = sectorInfoList[0].dataPos;

				data = DiskImage.createDiskInfoAsString(diskInfo) + data.substring(DiskImage.diskInfoSize, trackDataPos - DiskImage.trackInfoSize); // set new track count and remove empty track and rest
				this.options.data = data;
				break;
			}
		}
		return data;
	}

	// ...

	// see AMSDOS ROM, &D252
	/* eslint-disable array-element-newline */
	private static readonly protectTable = [
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

	private static hasAmsdosHeader(data: string) {
		let hasHeader = false;

		if (data.length >= 0x80) {
			const computed = DiskImage.computeChecksum(data.substring(0, 66)),
				sum = data.charCodeAt(67) + data.charCodeAt(68) * 256;

			hasHeader = computed === sum;
		}
		return hasHeader;
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
		// https://www.cpcwiki.eu/imgs/b/bc/S968se09.pdf (Firmware Guide Section 9)
		if (DiskImage.hasAmsdosHeader(data)) {
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
		return header;
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

		let length = header.pseudoLen || header.length; // logical length;

		if (length > 0xffff) { // 16 bit
			length = 0xffff;
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
			+ DiskImage.uInt8ToString(0x00) // first block (unused; always 0x00 or 0xff?)
			+ DiskImage.uInt16ToString(length) // logical length
			+ DiskImage.uInt16ToString(header.entry || 0)
			+ "\x00".repeat(36)
			+ DiskImage.uInt24ToString(header.length),

			checksum = DiskImage.computeChecksum(data1),

			data = data1
				+ DiskImage.uInt16ToString(checksum)
				+ "\x00".repeat(59);

		return data;
	}

	static createAmsdosHeader(parameter: Partial<AmsdosHeader>): AmsdosHeader {
		const header: AmsdosHeader = {
			user: 0,
			name: "",
			ext: "",
			typeNumber: 0,
			start: 0,
			pseudoLen: 0,
			entry: 0,
			length: 0,
			typeString: "",
			...parameter
		};

		return header;
	}
}
