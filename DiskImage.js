"use strict";
// DiskImage.ts - DiskImage
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiskImage = void 0;
// Extended DSK image definition
// https://www.cpcwiki.eu/index.php/Format:DSK_disk_image_file_format
// http://www.cpctech.org.uk/docs/extdsk.html
var Utils_1 = require("./Utils");
var DiskImage = /** @class */ (function () {
    function DiskImage(oConfig) {
        this.sDiskName = oConfig.sDiskName;
        this.sData = oConfig.sData;
        // reset
        this.oDiskInfo = DiskImage.getInitialDiskInfo();
        this.oFormat = DiskImage.getInitialFormat();
    }
    DiskImage.getInitialDiskInfo = function () {
        return {
            oTrackInfo: {
                aSectorInfo: []
            }
        };
    };
    DiskImage.getInitialFormat = function () {
        return {};
    };
    DiskImage.prototype.reset = function () {
        this.oDiskInfo = DiskImage.getInitialDiskInfo();
        this.oFormat = DiskImage.getInitialFormat();
    };
    DiskImage.prototype.composeError = function (oError, message, value, pos) {
        return Utils_1.Utils.composeError("DiskImage", oError, this.sDiskName + ": " + message, value, pos || 0, undefined);
    };
    DiskImage.testDiskIdent = function (sIdent) {
        var iDiskType = 0;
        if (sIdent === "MV - CPC") {
            iDiskType = 1;
        }
        else if (sIdent === "EXTENDED") {
            iDiskType = 2;
        }
        return iDiskType;
    };
    DiskImage.prototype.readUtf = function (iPos, iLen) {
        var sOut = this.sData.substr(iPos, iLen);
        if (sOut.length !== iLen) {
            throw this.composeError(new Error(), "End of File", "", iPos);
        }
        return sOut;
    };
    DiskImage.prototype.readUInt8 = function (iPos) {
        var iNum = this.sData.charCodeAt(iPos);
        if (isNaN(iNum)) {
            throw this.composeError(new Error(), "End of File", String(iNum), iPos);
        }
        return iNum;
    };
    DiskImage.prototype.readUInt16 = function (iPos) {
        return this.readUInt8(iPos) + this.readUInt8(iPos + 1) * 256;
    };
    DiskImage.prototype.readDiskInfo = function (iPos) {
        var iDiskInfoSize = 0x100, oDiskInfo = this.oDiskInfo, sIdent = this.readUtf(iPos, 8), // check first 8 characters as characteristic
        iDiskType = DiskImage.testDiskIdent(sIdent);
        if (!iDiskType) {
            throw this.composeError(Error(), "Ident not found", sIdent, iPos);
        }
        oDiskInfo.bExtended = (iDiskType === 2);
        oDiskInfo.sIdent = sIdent + this.readUtf(iPos + 8, 34 - 8); // read remaining ident
        if (oDiskInfo.sIdent.substr(34 - 11, 9) !== "Disk-Info") { // some tools use "Disk-Info  " instead of "Disk-Info\r\n", so compare without "\r\n"
            // "Disk-Info" string is optional
            Utils_1.Utils.console.warn(this.composeError({}, "Disk ident not found", oDiskInfo.sIdent.substr(34 - 11, 9), iPos + 34 - 11).message);
        }
        oDiskInfo.sCreator = this.readUtf(iPos + 34, 14);
        oDiskInfo.iTracks = this.readUInt8(iPos + 48);
        oDiskInfo.iHeads = this.readUInt8(iPos + 49);
        oDiskInfo.iTrackSize = this.readUInt16(iPos + 50);
        var aTrackSizes = [], aTrackPos = [], iTrackSizeCount = oDiskInfo.iTracks * oDiskInfo.iHeads; // number of track sizes
        var iTrackPos = iDiskInfoSize;
        iPos += 52; // track sizes high bytes start at offset 52 (0x35)
        for (var i = 0; i < iTrackSizeCount; i += 1) {
            aTrackPos.push(iTrackPos);
            var iTrackSize = oDiskInfo.iTrackSize || (this.readUInt8(iPos + i) * 256); // take common track size or read individual track size (extended)
            aTrackSizes.push(iTrackSize);
            iTrackPos += iTrackSize;
        }
        oDiskInfo.aTrackSizes = aTrackSizes;
        oDiskInfo.aTrackPos = aTrackPos;
    };
    DiskImage.prototype.readTrackInfo = function (iPos) {
        var iTrackInfoSize = 0x100, oTrackInfo = this.oDiskInfo.oTrackInfo, aSectorInfo = oTrackInfo.aSectorInfo;
        oTrackInfo.iDataPos = iPos + iTrackInfoSize;
        oTrackInfo.sIdent = this.readUtf(iPos, 12);
        if (oTrackInfo.sIdent.substr(0, 10) !== "Track-Info") { // some tools use "Track-Info  " instead of "Track-Info\r\n", so compare without "\r\n"
            // "Track-Info" string is optional
            Utils_1.Utils.console.warn(this.composeError({}, "Track ident not found", oTrackInfo.sIdent.substr(0, 10), iPos).message);
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
        var oSectorNum2Index = {};
        oTrackInfo.oSectorNum2Index = oSectorNum2Index;
        iPos += 24; // start sector info
        var iSectorPos = oTrackInfo.iDataPos;
        for (var i = 0; i < oTrackInfo.iSpt; i += 1) {
            var oSectorInfo = aSectorInfo[i] || {}; // resue SectorInfo object if possible
            aSectorInfo[i] = oSectorInfo;
            oSectorInfo.iDataPos = iSectorPos;
            oSectorInfo.iTrack = this.readUInt8(iPos);
            oSectorInfo.iHead = this.readUInt8(iPos + 1);
            oSectorInfo.iSector = this.readUInt8(iPos + 2);
            oSectorInfo.iBps = this.readUInt8(iPos + 3);
            oSectorInfo.iState1 = this.readUInt8(iPos + 4);
            oSectorInfo.iState2 = this.readUInt8(iPos + 5);
            var iSectorSize = this.readUInt16(iPos + 6) || (0x0080 << oTrackInfo.iBps); // eslint-disable-line no-bitwise
            oSectorInfo.iSectorSize = iSectorSize;
            iSectorPos += iSectorSize;
            oSectorNum2Index[oSectorInfo.iSector] = i;
            iPos += 8;
        }
    };
    DiskImage.prototype.seekTrack = function (iTrack, iHead) {
        var oDiskInfo = this.oDiskInfo, oTrackInfo = oDiskInfo.oTrackInfo;
        if (oTrackInfo.iTrack === iTrack && oTrackInfo.iHead === iHead) { // already positionend?
            return;
        }
        if (!oDiskInfo.sIdent) {
            this.readDiskInfo(0);
        }
        var iTrackInfoPos = oDiskInfo.aTrackPos[iTrack * oDiskInfo.iHeads + iHead];
        this.readTrackInfo(iTrackInfoPos);
    };
    DiskImage.prototype.sectorNum2Index = function (iSector) {
        var oTrackInfo = this.oDiskInfo.oTrackInfo, iSectorIndex = oTrackInfo.oSectorNum2Index[iSector];
        return iSectorIndex;
    };
    DiskImage.prototype.seekSector = function (iSectorIndex) {
        var aSectorInfo = this.oDiskInfo.oTrackInfo.aSectorInfo, oSectorInfo = aSectorInfo[iSectorIndex];
        return oSectorInfo;
    };
    DiskImage.prototype.readSector = function (iSector) {
        var oTrackInfo = this.oDiskInfo.oTrackInfo, iSectorIndex = this.sectorNum2Index(iSector);
        if (iSectorIndex === undefined) {
            throw this.composeError(Error(), "Track " + oTrackInfo.iTrack + ": Sector not found", String(iSector), 0);
        }
        var oSectorInfo = this.seekSector(iSectorIndex), sOut = this.readUtf(oSectorInfo.iDataPos, oSectorInfo.iSectorSize);
        return sOut;
    };
    // ...
    DiskImage.prototype.getFormatDescriptor = function (sFormat) {
        var oDerivedFormat = DiskImage.mFormatDescriptors[sFormat];
        if (!oDerivedFormat) {
            throw this.composeError(Error(), "Unknown format", sFormat);
        }
        var oFormat;
        if (oDerivedFormat.sParentRef) {
            var oParentFormat = this.getFormatDescriptor(oDerivedFormat.sParentRef); // recursive
            oFormat = Object.assign({}, oParentFormat, oDerivedFormat);
        }
        else {
            oFormat = Object.assign({}, oDerivedFormat); // get a copy
        }
        return oFormat;
    };
    DiskImage.prototype.determineFormat = function () {
        var oDiskInfo = this.oDiskInfo, iTrack = 0, iHead = 0;
        this.seekTrack(iTrack, iHead);
        var oTrackInfo = oDiskInfo.oTrackInfo;
        var iFirstSector = 0xff;
        for (var i = 0; i < oTrackInfo.iSpt; i += 1) {
            var iSector = oTrackInfo.aSectorInfo[i].iSector;
            if (iSector < iFirstSector) {
                iFirstSector = iSector;
            }
        }
        var sFormat = "";
        if (iFirstSector === 0xc1) {
            sFormat = "data";
        }
        else if (iFirstSector === 0x41) {
            sFormat = "system";
        }
        else if ((iFirstSector === 0x01) && (oDiskInfo.iTracks === 80)) { // big780k
            sFormat = "big780k";
        }
        else {
            throw this.composeError(Error(), "Unknown format with sector", String(iFirstSector));
        }
        if (oDiskInfo.iHeads > 1) { // maybe 2
            sFormat += String(oDiskInfo.iHeads); // e.g. "data": "data2"
        }
        return this.getFormatDescriptor(sFormat);
    };
    DiskImage.fnRemoveHighBit7 = function (sStr) {
        var sOut = "";
        for (var i = 0; i < sStr.length; i += 1) {
            var iChar = sStr.charCodeAt(i);
            sOut += String.fromCharCode(iChar & 0x7f); // eslint-disable-line no-bitwise
        }
        return sOut;
    };
    DiskImage.prototype.readDirectoryExtents = function (aExtents, iPos, iEndPos) {
        while (iPos < iEndPos) {
            var sExtWithFlags = this.readUtf(iPos + 9, 3), // extension with high bits set for special flags
            oExtent = {
                iUser: this.readUInt8(iPos),
                sName: DiskImage.fnRemoveHighBit7(this.readUtf(iPos + 1, 8)),
                sExt: DiskImage.fnRemoveHighBit7(sExtWithFlags),
                iExtent: this.readUInt8(iPos + 12),
                iLastRecBytes: this.readUInt8(iPos + 13),
                iExtentHi: this.readUInt8(iPos + 14),
                iRecords: this.readUInt8(iPos + 15),
                aBlocks: [],
                bReadOnly: Boolean(sExtWithFlags.charCodeAt(0) & 0x80),
                bSystem: Boolean(sExtWithFlags.charCodeAt(1) & 0x80),
                bBackup: Boolean(sExtWithFlags.charCodeAt(2) & 0x80) /* eslint-disable-line no-bitwise */
            };
            iPos += 16;
            var aBlocks = oExtent.aBlocks;
            for (var i = 0; i < 16; i += 1) {
                var iBlock = this.readUInt8(iPos + i);
                if (iBlock) {
                    aBlocks.push(iBlock);
                }
                else { // last block
                    break;
                }
            }
            iPos += 16;
            aExtents.push(oExtent);
        }
        return aExtents;
    };
    DiskImage.fnSortByExtentNumber = function (a, b) {
        return a.iExtent - b.iExtent;
    };
    // do not know if we need to sort the extents per file, but...
    DiskImage.sortFileExtents = function (oDir) {
        for (var sName in oDir) {
            if (oDir.hasOwnProperty(sName)) {
                var aFileExtents = oDir[sName];
                aFileExtents.sort(DiskImage.fnSortByExtentNumber);
            }
        }
    };
    DiskImage.prepareDirectoryList = function (aExtents, iFill, reFilePattern) {
        var oDir = {};
        for (var i = 0; i < aExtents.length; i += 1) {
            var oExtent = aExtents[i];
            if (iFill === null || oExtent.iUser !== iFill) {
                var sName = oExtent.sName + "." + oExtent.sExt; // and oExtent.iUser?
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
    };
    DiskImage.prototype.convertBlock2Sector = function (iBlock) {
        var oFormat = this.oFormat, iSpt = oFormat.iSpt, iBlockSectors = 2, iLogSec = iBlock * iBlockSectors, // directory is in block 0-1
        oPos = {
            iTrack: Math.floor(iLogSec / iSpt) + oFormat.iOff,
            iHead: 0,
            iSector: (iLogSec % iSpt) + oFormat.iFirstSector
        };
        return oPos;
    };
    DiskImage.prototype.readDirectory = function () {
        var iDirectorySectors = 4, aExtents = [], oFormat = this.determineFormat(), iOff = oFormat.iOff, iFirstSector = oFormat.iFirstSector;
        this.oFormat = oFormat;
        this.seekTrack(iOff, 0);
        for (var i = 0; i < iDirectorySectors; i += 1) {
            var iSectorIndex = this.sectorNum2Index(iFirstSector + i);
            if (iSectorIndex === undefined) {
                throw this.composeError(Error(), "Cannot read directory at track " + iOff + " sector", String(iFirstSector));
            }
            var oSectorInfo = this.seekSector(iSectorIndex);
            this.readDirectoryExtents(aExtents, oSectorInfo.iDataPos, oSectorInfo.iDataPos + oSectorInfo.iSectorSize);
        }
        var oDir = DiskImage.prepareDirectoryList(aExtents, oFormat.iFill);
        return oDir;
    };
    DiskImage.prototype.nextSector = function (oPos) {
        var oFormat = this.oFormat;
        oPos.iSector += 1;
        if (oPos.iSector >= oFormat.iFirstSector + oFormat.iSpt) {
            oPos.iTrack += 1;
            oPos.iSector = oFormat.iFirstSector;
        }
    };
    DiskImage.prototype.readBlock = function (iBlock) {
        var iBlockSectors = 2, oPos = this.convertBlock2Sector(iBlock);
        var sOut = "";
        for (var i = 0; i < iBlockSectors; i += 1) {
            this.seekTrack(oPos.iTrack, oPos.iHead);
            sOut += this.readSector(oPos.iSector);
            this.nextSector(oPos);
        }
        return sOut;
    };
    DiskImage.prototype.readFile = function (aFileExtents) {
        var iRecPerBlock = 8;
        var sOut = "";
        for (var i = 0; i < aFileExtents.length; i += 1) {
            var oExtent = aFileExtents[i], aBlocks = oExtent.aBlocks;
            var iRecords = oExtent.iRecords;
            for (var iBlock = 0; iBlock < aBlocks.length; iBlock += 1) {
                var sBlock = this.readBlock(aBlocks[iBlock]);
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
        var oHeader = DiskImage.parseAmsdosHeader(sOut);
        var iRealLen;
        if (oHeader) {
            var iAmsdosHeaderLength = 0x80;
            iRealLen = oHeader.iLength + iAmsdosHeaderLength;
        }
        if (iRealLen === undefined) { // no real length: ASCII: find EOF (0x1a) in last record
            var iFileLen = sOut.length, iLastRecPos = iFileLen > 0x80 ? (iFileLen - 0x80) : 0, iIndex = sOut.indexOf(String.fromCharCode(0x1a), iLastRecPos);
            if (iIndex >= 0) {
                iRealLen = iIndex;
                if (Utils_1.Utils.debug > 0) {
                    Utils_1.Utils.console.debug("readFile: ASCII file length " + iFileLen + " truncated to " + iRealLen);
                }
            }
        }
        if (iRealLen !== undefined) { // now real length (from header or ASCII)?
            sOut = sOut.substr(0, iRealLen);
        }
        return sOut;
    };
    /* eslint-enable array-element-newline */
    DiskImage.unOrProtectData = function (sData) {
        var aTable1 = DiskImage.mProtectTable[0], aTable2 = DiskImage.mProtectTable[1];
        var sOut = "";
        for (var i = 0; i < sData.length; i += 1) {
            var iByte = sData.charCodeAt(i);
            iByte ^= aTable1[(i & 0x7f) % aTable1.length] ^ aTable2[(i & 0x7f) % aTable2.length]; // eslint-disable-line no-bitwise
            sOut += String.fromCharCode(iByte);
        }
        return sOut;
    };
    // ...
    DiskImage.computeChecksum = function (sData) {
        var iSum = 0;
        for (var i = 0; i < sData.length; i += 1) {
            iSum += sData.charCodeAt(i);
        }
        return iSum;
    };
    DiskImage.parseAmsdosHeader = function (sData) {
        var mTypeMap = {
            0: "T",
            1: "P",
            2: "B",
            8: "G",
            0x16: "A" // ASCII
        };
        var oHeader;
        // http://www.benchmarko.de/cpcemu/cpcdoc/chapter/cpcdoc7_e.html#I_AMSDOS_HD
        // http://www.cpcwiki.eu/index.php/AMSDOS_Header
        if (sData.length >= 0x80) {
            var iComputed = DiskImage.computeChecksum(sData.substr(0, 66)), iSum = sData.charCodeAt(67) + sData.charCodeAt(68) * 256;
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
    };
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
    DiskImage.uInt8ToString = function (iValue) {
        return String.fromCharCode(iValue);
    };
    DiskImage.uInt16ToString = function (iValue) {
        return DiskImage.uInt8ToString(iValue & 0xff) + DiskImage.uInt8ToString((iValue >> 8) & 0xff); // eslint-disable-line no-bitwise
    };
    DiskImage.uInt24ToString = function (iValue) {
        return DiskImage.uInt16ToString(iValue & 0xffff) + DiskImage.uInt8ToString(iValue >> 16); // eslint-disable-line no-bitwise
    };
    DiskImage.combineAmsdosHeader = function (oHeader) {
        var mTypeMap = {
            T: 0,
            P: 1,
            B: 2,
            G: 8,
            A: 0x16 // ASCII
        };
        var iType = oHeader.iType;
        if (oHeader.sType) { // overwrite iType form sType
            iType = mTypeMap[oHeader.sType];
            if (iType === undefined) {
                iType = mTypeMap.A;
            }
        }
        var sData1 = DiskImage.uInt8ToString(oHeader.iUser || 0)
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
            + DiskImage.uInt24ToString(oHeader.iLength), iChecksum = DiskImage.computeChecksum(sData1), sData = sData1
            + DiskImage.uInt16ToString(iChecksum)
            + "\x00".repeat(59);
        return sData;
    };
    DiskImage.mFormatDescriptors = {
        data: {
            iTracks: 40,
            iHeads: 1,
            // head: 0, // head number?
            iBps: 2,
            iSpt: 9,
            iGap3: 0x4e,
            iFill: 0xe5,
            iFirstSector: 0xc1,
            iBls: 1024,
            // bsh: 3, // log2 BLS - 7
            // blm: 7, // BLS / 128 - 1
            iAl0: 0xc0,
            iAl1: 0x00,
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
            iAl0: 0x80,
            iTracks: 80,
            iOff: 1,
            iFirstSector: 0x01
        },
        big780k2: {
            sParentRef: "big780k",
            iHeads: 2
        }
    };
    // ...
    // see AMSDOS ROM, &D252
    /* eslint-disable array-element-newline */
    DiskImage.mProtectTable = [
        [0xe2, 0x9d, 0xdb, 0x1a, 0x42, 0x29, 0x39, 0xc6, 0xb3, 0xc6, 0x90, 0x45, 0x8a],
        [0x49, 0xb1, 0x36, 0xf0, 0x2e, 0x1e, 0x06, 0x2a, 0x28, 0x19, 0xea] // 11 bytes
    ];
    return DiskImage;
}());
exports.DiskImage = DiskImage;
//# sourceMappingURL=DiskImage.js.map