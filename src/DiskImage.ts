// DiskImage.ts - DiskImage
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/

// Extended DSK image definition
// https://www.cpcwiki.eu/index.php/Format:DSK_disk_image_file_format
// http://www.cpctech.org.uk/docs/extdsk.html

import { Utils } from "./Utils";


export interface DiskImageOptions {
	sDiskName: string,
	sData: string
}

interface SectorInfo {
	iTrack: number
	iHead: number
	iSector: number
	iBps: number
	iState1: number
	iState2: number

	iSectorSize: number
	length: number
	iDataPos: number
}

type SectorNum2IndexMap = { [k in number]: number };

interface TrackInfo {
	sIdent: string
	iTrack: number
	iHead: number
	iDataRate: number
	iRecMode: number
	iBps: number
	iSpt: number
	iGap3: number
	iFill: number
	aSectorInfo: SectorInfo[]
	iDataPos: number
	oSectorNum2Index: SectorNum2IndexMap
}

interface DiskInfo {
	sIdent: string
	sCreator: string
	iTracks: number
	iHeads: number
	iTrackSize: number
	oTrackInfo: TrackInfo
	bExtended: boolean
	aTrackSizes: number[]
	aTrackPos: number[]
}

interface ExtentEntry {
	iUser: number
	sName: string
	sExt: string // extension with high bits set for special flags
	iExtent: number
	iLastRecBytes: number
	iExtentHi: number // used for what?
	iRecords: number
	aBlocks: number[]

	bReadOnly: boolean
	bSystem: boolean
	bBackup: boolean
}

interface FormatDescriptor {
	iTracks: number // number of tracks (1-85)
	iHeads: number // number of heads/sides (1-2)
	// head: 0, // head number?
	iBps: number // Bytes per Sector (1-5)
	iSpt: number // Sectors per Track (1-18)
	iGap3: number // gap between ID and data
	iFill: number // filler byte
	iFirstSector: number // first sector number

	iBls: number // BLS: data block allocaton size (1024, 2048, 4096, 8192, 16384)
	// bsh: 3, // log2 BLS - 7
	// blm: 7, // BLS / 128 - 1
	iAl0: number // bit significant representation of reserved directory blocks 0..7 (0x80=0, 0xc00=0 and 1,,...)
	iAl1: number // bit significant representation of reserved directory blocks 8..15 (0x80=8,...)
	iOff: number// number of reserved tracks (also the track where the directory starts)
	sParentRef?: string // reference to parent format definition
}

type PartialFormatDescriptorMap = {[k in string]: Partial<FormatDescriptor>};

export interface AmsdosHeader {
	iUser: number
	sName: string
	sExt: string
	iType: number
	iStart: number
	iPseudoLen: number
	iEntry: number
	iLength: number
	sType: string
}

type DirectoryListType = {[k in string]: ExtentEntry[]};

interface SectorPos {
	iTrack: number
	iHead: number, // currently always 0
	iSector: number
}

export class DiskImage {
	private sDiskName: string;
	private sData: string;
	private oDiskInfo: DiskInfo;
	private oFormat: FormatDescriptor;

	constructor(oConfig: DiskImageOptions) {
		this.sDiskName = oConfig.sDiskName;
		this.sData = oConfig.sData;

		// reset
		this.oDiskInfo = DiskImage.getInitialDiskInfo();
		this.oFormat = DiskImage.getInitialFormat();
	}

	private static mFormatDescriptors: PartialFormatDescriptorMap = {
		data: {
			iTracks: 40, // number of tracks (1-85)
			iHeads: 1, // number of heads/sides (1-2)
			// head: 0, // head number?
			iBps: 2, // Bytes per Sector (1-5)
			iSpt: 9, // Sectors per Track (1-18)
			iGap3: 0x4e, // gap between ID and data
			iFill: 0xe5, // filler byte
			iFirstSector: 0xc1, // first sector number

			iBls: 1024, // BLS: data block allocaton size (1024, 2048, 4096, 8192, 16384)
			// bsh: 3, // log2 BLS - 7
			// blm: 7, // BLS / 128 - 1
			iAl0: 0xc0, // bit significant representation of reserved directory blocks 0..7 (0x80=0, 0xc00=0 and 1,,...)
			iAl1: 0x00, // bit significant representation of reserved directory blocks 8..15 (0x80=8,...)
			iOff: 0 // number of reserved tracks (also the track where the directory starts)
		},
		// double sided data
		data2: {
			sParentRef: "data",
			iHeads: 2
		},

		system: {
			sParentRef: "data",
			iFirstSector: 0x41,
			iOff: 2
		},

		// double sided system
		system2: {
			sParentRef: "system",
			iHeads: 2
		},

		vortex: {
			sParentRef: "data",
			iTracks: 80,
			iHeads: 2,
			iFirstSector: 0x01
		},

		"3dos": {
			sParentRef: "data",
			iFirstSector: 0x00
		},

		big780k: {
			sParentRef: "data",
			iAl0: 0x80, // block 0 reserved
			iTracks: 80,
			iOff: 1,
			iFirstSector: 0x01
		},

		big780k2: {
			sParentRef: "big780k",
			iHeads: 2
		}
	}

	private static getInitialDiskInfo() {
		return {
			oTrackInfo: {
				aSectorInfo: [] as SectorInfo[]
			}
		} as DiskInfo;
	}

	private static getInitialFormat() {
		return {} as FormatDescriptor;
	}

	reset(): void {
		this.oDiskInfo = DiskImage.getInitialDiskInfo();
		this.oFormat = DiskImage.getInitialFormat();
	}

	private composeError(oError: Error, message: string, value: string, pos?: number) {
		return Utils.composeError("DiskImage", oError, this.sDiskName + ": " + message, value, pos || 0);
	}

	static testDiskIdent(sIdent: string): number {
		let iDiskType = 0;

		if (sIdent === "MV - CPC") {
			iDiskType = 1;
		} else if (sIdent === "EXTENDED") {
			iDiskType = 2;
		}
		return iDiskType;
	}

	private readUtf(iPos: number, iLen: number) {
		const sOut = this.sData.substr(iPos, iLen);

		if (sOut.length !== iLen) {
			throw this.composeError(new Error(), "End of File", "", iPos);
		}

		return sOut;
	}

	private readUInt8(iPos: number) {
		const iNum = this.sData.charCodeAt(iPos);

		if (isNaN(iNum)) {
			throw this.composeError(new Error(), "End of File", String(iNum), iPos);
		}

		return iNum;
	}

	private readUInt16(iPos: number) {
		return this.readUInt8(iPos) + this.readUInt8(iPos + 1) * 256;
	}

	private readDiskInfo(iPos: number) {
		const iDiskInfoSize = 0x100,
			oDiskInfo = this.oDiskInfo,
			sIdent = this.readUtf(iPos, 8), // check first 8 characters as characteristic
			iDiskType = DiskImage.testDiskIdent(sIdent);

		if (!iDiskType) {
			throw this.composeError(Error(), "Ident not found", sIdent, iPos);
		}
		oDiskInfo.bExtended = (iDiskType === 2);

		oDiskInfo.sIdent = sIdent + this.readUtf(iPos + 8, 34 - 8); // read remaining ident

		if (oDiskInfo.sIdent.substr(34 - 11, 9) !== "Disk-Info") { // some tools use "Disk-Info  " instead of "Disk-Info\r\n", so compare without "\r\n"
			// "Disk-Info" string is optional
			Utils.console.warn(this.composeError({} as Error, "Disk ident not found", oDiskInfo.sIdent.substr(34 - 11, 9), iPos + 34 - 11).message);
		}

		oDiskInfo.sCreator = this.readUtf(iPos + 34, 14);
		oDiskInfo.iTracks = this.readUInt8(iPos + 48);
		oDiskInfo.iHeads = this.readUInt8(iPos + 49);
		oDiskInfo.iTrackSize = this.readUInt16(iPos + 50);

		const aTrackSizes = [],
			aTrackPos = [],
			iTrackSizeCount = oDiskInfo.iTracks * oDiskInfo.iHeads; // number of track sizes
		let	iTrackPos = iDiskInfoSize;

		iPos += 52; // track sizes high bytes start at offset 52 (0x35)
		for (let i = 0; i < iTrackSizeCount; i += 1) {
			aTrackPos.push(iTrackPos);
			const iTrackSize = oDiskInfo.iTrackSize || (this.readUInt8(iPos + i) * 256); // take common track size or read individual track size (extended)

			aTrackSizes.push(iTrackSize);
			iTrackPos += iTrackSize;
		}
		oDiskInfo.aTrackSizes = aTrackSizes;
		oDiskInfo.aTrackPos = aTrackPos;
	}

	private readTrackInfo(iPos: number) {
		const iTrackInfoSize = 0x100,
			oTrackInfo = this.oDiskInfo.oTrackInfo,
			aSectorInfo = oTrackInfo.aSectorInfo;

		oTrackInfo.iDataPos = iPos + iTrackInfoSize;

		oTrackInfo.sIdent = this.readUtf(iPos, 12);
		if (oTrackInfo.sIdent.substr(0, 10) !== "Track-Info") { // some tools use "Track-Info  " instead of "Track-Info\r\n", so compare without "\r\n"
			// "Track-Info" string is optional
			Utils.console.warn(this.composeError({} as Error, "Track ident not found", oTrackInfo.sIdent.substr(0, 10), iPos).message);
		}
		// 4 unused bytes
		oTrackInfo.iTrack = this.readUInt8(iPos + 16);
		oTrackInfo.iHead = this.readUInt8(iPos + 17);
		oTrackInfo.iDataRate = this.readUInt8(iPos + 18);
		oTrackInfo.iRecMode = this.readUInt8(iPos + 19);
		oTrackInfo.iBps = this.readUInt8(iPos + 20);
		oTrackInfo.iSpt = this.readUInt8(iPos + 21);
		oTrackInfo.iGap3 = this.readUInt8(iPos + 22);
		oTrackInfo.iFill = this.readUInt8(iPos + 23);

		aSectorInfo.length = oTrackInfo.iSpt;

		const oSectorNum2Index: SectorNum2IndexMap = {};

		oTrackInfo.oSectorNum2Index = oSectorNum2Index;

		iPos += 24; // start sector info

		let iSectorPos = oTrackInfo.iDataPos;

		for (let i = 0; i < oTrackInfo.iSpt; i += 1) {
			const oSectorInfo = aSectorInfo[i] || {} as SectorInfo; // resue SectorInfo object if possible

			aSectorInfo[i] = oSectorInfo;

			oSectorInfo.iDataPos = iSectorPos;

			oSectorInfo.iTrack = this.readUInt8(iPos);
			oSectorInfo.iHead = this.readUInt8(iPos + 1);
			oSectorInfo.iSector = this.readUInt8(iPos + 2);
			oSectorInfo.iBps = this.readUInt8(iPos + 3);
			oSectorInfo.iState1 = this.readUInt8(iPos + 4);
			oSectorInfo.iState2 = this.readUInt8(iPos + 5);

			const iSectorSize = this.readUInt16(iPos + 6) || (0x0080 << oTrackInfo.iBps); // eslint-disable-line no-bitwise

			oSectorInfo.iSectorSize = iSectorSize;
			iSectorPos += iSectorSize;

			oSectorNum2Index[oSectorInfo.iSector] = i;
			iPos += 8;
		}
	}

	private seekTrack(iTrack: number, iHead: number) {
		const oDiskInfo = this.oDiskInfo,
			oTrackInfo = oDiskInfo.oTrackInfo;

		if (oTrackInfo.iTrack === iTrack && oTrackInfo.iHead === iHead) { // already positionend?
			return;
		}

		if (!oDiskInfo.sIdent) {
			this.readDiskInfo(0);
		}

		const iTrackInfoPos = oDiskInfo.aTrackPos[iTrack * oDiskInfo.iHeads + iHead];

		this.readTrackInfo(iTrackInfoPos);
	}

	private sectorNum2Index(iSector: number) {
		const oTrackInfo = this.oDiskInfo.oTrackInfo,
			iSectorIndex = oTrackInfo.oSectorNum2Index[iSector];

		return iSectorIndex;
	}

	private seekSector(iSectorIndex: number) {
		const aSectorInfo = this.oDiskInfo.oTrackInfo.aSectorInfo,
			oSectorInfo = aSectorInfo[iSectorIndex];

		return oSectorInfo;
	}

	private readSector(iSector: number) {
		const oTrackInfo = this.oDiskInfo.oTrackInfo,
			iSectorIndex = this.sectorNum2Index(iSector);

		if (iSectorIndex === undefined) {
			throw this.composeError(Error(), "Track " + oTrackInfo.iTrack + ": Sector not found", String(iSector), 0);
		}
		const oSectorInfo = this.seekSector(iSectorIndex),
			sOut = this.readUtf(oSectorInfo.iDataPos, oSectorInfo.iSectorSize);

		return sOut;
	}

	// ...

	private getFormatDescriptor(sFormat: string) {
		const oDerivedFormat = DiskImage.mFormatDescriptors[sFormat];

		if (!oDerivedFormat) {
			throw this.composeError(Error(), "Unknown format", sFormat);
		}

		let oFormat: FormatDescriptor;

		if (oDerivedFormat.sParentRef) {
			const oParentFormat = this.getFormatDescriptor(oDerivedFormat.sParentRef); // recursive

			oFormat = Object.assign({}, oParentFormat, oDerivedFormat);
		} else {
			oFormat = Object.assign({} as FormatDescriptor, oDerivedFormat); // get a copy
		}
		return oFormat;
	}

	private	determineFormat() {
		const oDiskInfo = this.oDiskInfo,
			iTrack = 0,
			iHead = 0;

		this.seekTrack(iTrack, iHead);

		const oTrackInfo = oDiskInfo.oTrackInfo;

		let iFirstSector = 0xff;

		for (let i = 0; i < oTrackInfo.iSpt; i += 1) {
			const iSector = oTrackInfo.aSectorInfo[i].iSector;

			if (iSector < iFirstSector) {
				iFirstSector = iSector;
			}
		}

		let sFormat = "";

		if (iFirstSector === 0xc1) {
			sFormat = "data";
		} else if (iFirstSector === 0x41) {
			sFormat = "system";
		} else if ((iFirstSector === 0x01) && (oDiskInfo.iTracks === 80)) { // big780k
			sFormat = "big780k";
		} else {
			throw this.composeError(Error(), "Unknown format with sector", String(iFirstSector));
		}

		if (oDiskInfo.iHeads > 1) { // maybe 2
			sFormat += String(oDiskInfo.iHeads); // e.g. "data": "data2"
		}

		return this.getFormatDescriptor(sFormat);
	}

	private static fnRemoveHighBit7(sStr: string) {
		let sOut = "";

		for (let i = 0; i < sStr.length; i += 1) {
			const iChar = sStr.charCodeAt(i);

			sOut += String.fromCharCode(iChar & 0x7f); // eslint-disable-line no-bitwise
		}
		return sOut;
	}

	private readDirectoryExtents(aExtents: ExtentEntry[], iPos: number, iEndPos: number) {
		while (iPos < iEndPos) {
			const sExtWithFlags = this.readUtf(iPos + 9, 3), // extension with high bits set for special flags
				oExtent: ExtentEntry = {
					iUser: this.readUInt8(iPos),
					sName: DiskImage.fnRemoveHighBit7(this.readUtf(iPos + 1, 8)),
					sExt: DiskImage.fnRemoveHighBit7(sExtWithFlags), // extension
					iExtent: this.readUInt8(iPos + 12),
					iLastRecBytes: this.readUInt8(iPos + 13),
					iExtentHi: this.readUInt8(iPos + 14), // used for what?
					iRecords: this.readUInt8(iPos + 15),
					aBlocks: [],

					bReadOnly: Boolean(sExtWithFlags.charCodeAt(0) & 0x80), /* eslint-disable-line no-bitwise */
					bSystem: Boolean(sExtWithFlags.charCodeAt(1) & 0x80), /* eslint-disable-line no-bitwise */
					bBackup: Boolean(sExtWithFlags.charCodeAt(2) & 0x80) /* eslint-disable-line no-bitwise */
				};

			iPos += 16;

			const aBlocks = oExtent.aBlocks;

			for (let i = 0; i < 16; i += 1) {
				const iBlock = this.readUInt8(iPos + i);

				if (iBlock) {
					aBlocks.push(iBlock);
				} else { // last block
					break;
				}
			}
			iPos += 16;
			aExtents.push(oExtent);
		}
		return aExtents;
	}

	private static fnSortByExtentNumber(a: ExtentEntry, b: ExtentEntry) {
		return a.iExtent - b.iExtent;
	}

	// do not know if we need to sort the extents per file, but...
	private static sortFileExtents(oDir: DirectoryListType) {
		for (const sName in oDir) {
			if (oDir.hasOwnProperty(sName)) {
				const aFileExtents = oDir[sName];

				aFileExtents.sort(DiskImage.fnSortByExtentNumber);
			}
		}
	}

	private static prepareDirectoryList(aExtents: ExtentEntry[], iFill: number, reFilePattern?: RegExp) {
		const oDir: DirectoryListType = {};

		for (let i = 0; i < aExtents.length; i += 1) {
			const oExtent = aExtents[i];

			if (iFill === null || oExtent.iUser !== iFill) {
				const sName = oExtent.sName + "." + oExtent.sExt; // and oExtent.iUser?

				// (do not convert filename here (to display messages in filenames))
				if (!reFilePattern || reFilePattern.test(sName)) {
					if (!(sName in oDir)) {
						oDir[sName] = [];
					}
					oDir[sName].push(oExtent);
				}
			}
		}
		DiskImage.sortFileExtents(oDir);
		return oDir;
	}

	private convertBlock2Sector(iBlock: number) {
		const oFormat = this.oFormat,
			iSpt = oFormat.iSpt,
			iBlockSectors = 2,
			iLogSec = iBlock * iBlockSectors, // directory is in block 0-1
			oPos: SectorPos = {
				iTrack: Math.floor(iLogSec / iSpt) + oFormat.iOff,
				iHead: 0, // currently always 0
				iSector: (iLogSec % iSpt) + oFormat.iFirstSector
			};

		return oPos;
	}

	readDirectory(): DirectoryListType {
		const iDirectorySectors = 4,
			aExtents: ExtentEntry[] = [],
			oFormat = this.determineFormat(),
			iOff = oFormat.iOff,
			iFirstSector = oFormat.iFirstSector;

		this.oFormat = oFormat;
		this.seekTrack(iOff, 0);

		for (let i = 0; i < iDirectorySectors; i += 1) {
			const iSectorIndex = this.sectorNum2Index(iFirstSector + i);

			if (iSectorIndex === undefined) {
				throw this.composeError(Error(), "Cannot read directory at track " + iOff + " sector", String(iFirstSector));
			}
			const oSectorInfo = this.seekSector(iSectorIndex);

			this.readDirectoryExtents(aExtents, oSectorInfo.iDataPos, oSectorInfo.iDataPos + oSectorInfo.iSectorSize);
		}

		const oDir = DiskImage.prepareDirectoryList(aExtents, oFormat.iFill);

		return oDir;
	}

	private nextSector(oPos: SectorPos) {
		const oFormat = this.oFormat;

		oPos.iSector += 1;
		if (oPos.iSector >= oFormat.iFirstSector + oFormat.iSpt) {
			oPos.iTrack += 1;
			oPos.iSector = oFormat.iFirstSector;
		}
	}

	private readBlock(iBlock: number) {
		const iBlockSectors = 2,
			oPos = this.convertBlock2Sector(iBlock);
		let	sOut = "";

		for (let i = 0; i < iBlockSectors; i += 1) {
			this.seekTrack(oPos.iTrack, oPos.iHead);
			sOut += this.readSector(oPos.iSector);
			this.nextSector(oPos);
		}
		return sOut;
	}

	readFile(aFileExtents: ExtentEntry[]): string {
		const iRecPerBlock = 8;
		let sOut = "";

		for (let i = 0; i < aFileExtents.length; i += 1) {
			const oExtent = aFileExtents[i],
				aBlocks = oExtent.aBlocks;
			let	iRecords = oExtent.iRecords;

			for (let iBlock = 0; iBlock < aBlocks.length; iBlock += 1) {
				let sBlock = this.readBlock(aBlocks[iBlock]);

				if (iRecords < iRecPerBlock) { // block with some remaining data
					sBlock = sBlock.substr(0, 0x80 * iRecords);
				}

				sOut += sBlock;
				iRecords -= iRecPerBlock;
				if (iRecords <= 0) {
					break;
				}
			}
		}

		const oHeader = DiskImage.parseAmsdosHeader(sOut);
		let iRealLen: number | undefined;

		if (oHeader) {
			const iAmsdosHeaderLength = 0x80;

			iRealLen = oHeader.iLength + iAmsdosHeaderLength;
		}

		if (iRealLen === undefined) { // no real length: ASCII: find EOF (0x1a) in last record
			const iFileLen = sOut.length,
				iLastRecPos = iFileLen > 0x80 ? (iFileLen - 0x80) : 0,
				iIndex = sOut.indexOf(String.fromCharCode(0x1a), iLastRecPos);

			if (iIndex >= 0) {
				iRealLen = iIndex;
				if (Utils.debug > 0) {
					Utils.console.debug("readFile: ASCII file length " + iFileLen + " truncated to " + iRealLen);
				}
			}
		}

		if (iRealLen !== undefined) { // now real length (from header or ASCII)?
			sOut = sOut.substr(0, iRealLen);
		}
		return sOut;
	}

	// ...

	// see AMSDOS ROM, &D252
	/* eslint-disable array-element-newline */
	private static mProtectTable = [
		[0xe2, 0x9d, 0xdb, 0x1a, 0x42, 0x29, 0x39, 0xc6, 0xb3, 0xc6, 0x90, 0x45, 0x8a], // 13 bytes
		[0x49, 0xb1, 0x36, 0xf0, 0x2e, 0x1e, 0x06, 0x2a, 0x28, 0x19, 0xea] // 11 bytes
	];
	/* eslint-enable array-element-newline */

	static unOrProtectData(sData: string): string {
		const aTable1 = DiskImage.mProtectTable[0],
			aTable2 = DiskImage.mProtectTable[1];
		let sOut = "";

		for (let i = 0; i < sData.length; i += 1) {
			let iByte = sData.charCodeAt(i);

			iByte ^= aTable1[(i & 0x7f) % aTable1.length] ^ aTable2[(i & 0x7f) % aTable2.length]; // eslint-disable-line no-bitwise
			sOut += String.fromCharCode(iByte);
		}
		return sOut;
	}

	// ...

	private static computeChecksum(sData: string) {
		let iSum = 0;

		for (let i = 0; i < sData.length; i += 1) {
			iSum += sData.charCodeAt(i);
		}
		return iSum;
	}

	static parseAmsdosHeader(sData: string): AmsdosHeader | undefined {
		const mTypeMap: { [k in number]: string } = {
			0: "T", // tokenized BASIC (T=not official)
			1: "P", // protected BASIC (also tokenized)
			2: "B", // Binary
			8: "G", // GENA3 Assember (G=not official)
			0x16: "A" // ASCII
		};

		let oHeader: AmsdosHeader | undefined;

		// http://www.benchmarko.de/cpcemu/cpcdoc/chapter/cpcdoc7_e.html#I_AMSDOS_HD
		// http://www.cpcwiki.eu/index.php/AMSDOS_Header
		if (sData.length >= 0x80) {
			const iComputed = DiskImage.computeChecksum(sData.substr(0, 66)),
				iSum = sData.charCodeAt(67) + sData.charCodeAt(68) * 256;

			if (iComputed === iSum) {
				oHeader = {
					iUser: sData.charCodeAt(0),
					sName: sData.substr(1, 8),
					sExt: sData.substr(9, 3),
					iType: sData.charCodeAt(18),
					iStart: sData.charCodeAt(21) + sData.charCodeAt(22) * 256,
					iPseudoLen: sData.charCodeAt(24) + sData.charCodeAt(25) * 256,
					iEntry: sData.charCodeAt(26) + sData.charCodeAt(27) * 256,
					iLength: sData.charCodeAt(64) + sData.charCodeAt(65) * 256 + sData.charCodeAt(66) * 65536,
					sType: ""
				};

				oHeader.sType = mTypeMap[oHeader.iType] || mTypeMap[16]; // default: ASCII
			}
		}
		return oHeader;
	}


	// for testing only

	/*
	private static writeUInt8(aData: Uint8Array, iPos: number, iValue: number) {
		aData[iPos] = iValue;
	}

	private static writeUInt16(aData: Uint8Array, iPos: number, iValue: number) {
		aData[iPos] = iValue & 0xff;
		aData[iPos + 1] = (iValue >> 8) & 0xff;
	}
	*/

	private static uInt8ToString(iValue: number) {
		return String.fromCharCode(iValue);
	}

	private static uInt16ToString(iValue: number) {
		return DiskImage.uInt8ToString(iValue & 0xff) + DiskImage.uInt8ToString((iValue >> 8) & 0xff); // eslint-disable-line no-bitwise
	}

	private static uInt24ToString(iValue: number) {
		return DiskImage.uInt16ToString(iValue & 0xffff) + DiskImage.uInt8ToString(iValue >> 16); // eslint-disable-line no-bitwise
	}

	static combineAmsdosHeader(oHeader: AmsdosHeader): string {
		const mTypeMap: { [k in string]: number } = {
			T: 0, // tokenized BASIC (T=not official)
			P: 1, // protected BASIC
			B: 2, // Binary
			G: 8, // GENA3 Assember (G=not official)
			A: 0x16 // ASCII
		};
		let iType = oHeader.iType;

		if (oHeader.sType) { // overwrite iType form sType
			iType = mTypeMap[oHeader.sType];
			if (iType === undefined) {
				iType = mTypeMap.A;
			}
		}

		const sData1
			= DiskImage.uInt8ToString(oHeader.iUser || 0)
			+ (oHeader.sName || "").padEnd(8, " ")
			+ (oHeader.sExt || "").padEnd(3, " ")
			+ DiskImage.uInt16ToString(0)
			+ DiskImage.uInt16ToString(0)
			+ DiskImage.uInt8ToString(0) // block number (unused)
			+ DiskImage.uInt8ToString(0) // last block (unused)
			+ DiskImage.uInt8ToString(iType)
			+ DiskImage.uInt16ToString(0) // data location (unused)
			+ DiskImage.uInt16ToString(oHeader.iStart || 0)
			+ DiskImage.uInt8ToString(0xff) // first block (unused, always 0xff)
			+ DiskImage.uInt16ToString(oHeader.iPseudoLen || oHeader.iLength) // logical length
			+ DiskImage.uInt16ToString(oHeader.iEntry || 0)
			+ " ".repeat(36)
			+ DiskImage.uInt24ToString(oHeader.iLength),

			iChecksum = DiskImage.computeChecksum(sData1),

			sData = sData1
				+ DiskImage.uInt16ToString(iChecksum)
				+ "\x00".repeat(59);

		return sData;
	}
}
