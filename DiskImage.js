// DiskImage.ts - DiskImage
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskImage = void 0;
    var DiskImage = /** @class */ (function () {
        function DiskImage(options) {
            this.quiet = false;
            this.diskName = options.diskName;
            this.data = options.data;
            this.quiet = options.quiet || false;
            // reset
            this.diskInfo = DiskImage.getInitialDiskInfo();
            this.format = DiskImage.getInitialFormat();
        }
        DiskImage.getInitialDiskInfo = function () {
            return {
                trackInfo: {
                    sectorInfo: []
                }
            };
        };
        DiskImage.getInitialFormat = function () {
            return {};
        };
        DiskImage.prototype.reset = function () {
            this.diskInfo = DiskImage.getInitialDiskInfo();
            this.format = DiskImage.getInitialFormat();
        };
        DiskImage.prototype.composeError = function (error, message, value, pos) {
            var len = 0;
            return Utils_1.Utils.composeError("DiskImage", error, this.diskName + ": " + message, value, pos || 0, len);
        };
        DiskImage.testDiskIdent = function (ident) {
            var diskType = 0;
            if (ident === "MV - CPC") {
                diskType = 1;
            }
            else if (ident === "EXTENDED") {
                diskType = 2;
            }
            return diskType;
        };
        DiskImage.prototype.readUtf = function (pos, len) {
            var out = this.data.substring(pos, pos + len);
            if (out.length !== len) {
                throw this.composeError(new Error(), "End of File", "", pos);
            }
            return out;
        };
        DiskImage.prototype.readUInt8 = function (pos) {
            var num = this.data.charCodeAt(pos);
            if (isNaN(num)) {
                throw this.composeError(new Error(), "End of File", String(num), pos);
            }
            return num;
        };
        DiskImage.prototype.readUInt16 = function (pos) {
            return this.readUInt8(pos) + this.readUInt8(pos + 1) * 256;
        };
        DiskImage.prototype.readDiskInfo = function (pos) {
            var diskInfoSize = 0x100, diskInfo = this.diskInfo, ident = this.readUtf(pos, 8), // check first 8 characters as characteristic
            diskType = DiskImage.testDiskIdent(ident);
            if (!diskType) {
                throw this.composeError(Error(), "Ident not found", ident, pos);
            }
            diskInfo.extended = (diskType === 2);
            diskInfo.ident = ident + this.readUtf(pos + 8, 34 - 8); // read remaining ident
            if (diskInfo.ident.substring(34 - 11, 34 - 11 + 9) !== "Disk-Info") { // some tools use "Disk-Info  " instead of "Disk-Info\r\n", so compare without "\r\n"
                // "Disk-Info" string is optional
                if (!this.quiet) {
                    Utils_1.Utils.console.warn(this.composeError({}, "Disk ident not found", diskInfo.ident.substring(34 - 11, 34 - 11 + 9), pos + 34 - 11).message);
                }
            }
            diskInfo.creator = this.readUtf(pos + 34, 14);
            diskInfo.tracks = this.readUInt8(pos + 48);
            diskInfo.heads = this.readUInt8(pos + 49);
            diskInfo.trackSize = this.readUInt16(pos + 50);
            var trackSizes = [], trackPosList = [], trackSizeCount = diskInfo.tracks * diskInfo.heads; // number of track sizes
            var trackPos = diskInfoSize;
            pos += 52; // track sizes high bytes start at offset 52 (0x35)
            for (var i = 0; i < trackSizeCount; i += 1) {
                trackPosList.push(trackPos);
                var trackSize = diskInfo.trackSize || (this.readUInt8(pos + i) * 256); // take common track size or read individual track size (extended)
                trackSizes.push(trackSize);
                trackPos += trackSize;
            }
            diskInfo.trackSizes = trackSizes;
            diskInfo.trackPos = trackPosList;
        };
        DiskImage.prototype.readTrackInfo = function (pos) {
            var trackInfoSize = 0x100, trackInfo = this.diskInfo.trackInfo, sectorInfoList = trackInfo.sectorInfo;
            trackInfo.dataPos = pos + trackInfoSize;
            trackInfo.ident = this.readUtf(pos, 12);
            if (trackInfo.ident.substring(0, 10) !== "Track-Info") { // some tools use "Track-Info  " instead of "Track-Info\r\n", so compare without "\r\n"
                // "Track-Info" string is optional
                if (!this.quiet) {
                    Utils_1.Utils.console.warn(this.composeError({}, "Track ident not found", trackInfo.ident.substring(0, 10), pos).message);
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
            var sectorNum2Index = {};
            trackInfo.sectorNum2Index = sectorNum2Index;
            pos += 24; // start sector info
            var sectorPos = trackInfo.dataPos;
            for (var i = 0; i < trackInfo.spt; i += 1) {
                var sectorInfo = sectorInfoList[i] || {}; // resue SectorInfo object if possible
                sectorInfoList[i] = sectorInfo;
                sectorInfo.dataPos = sectorPos;
                sectorInfo.track = this.readUInt8(pos);
                sectorInfo.head = this.readUInt8(pos + 1);
                sectorInfo.sector = this.readUInt8(pos + 2);
                sectorInfo.bps = this.readUInt8(pos + 3);
                sectorInfo.state1 = this.readUInt8(pos + 4);
                sectorInfo.state2 = this.readUInt8(pos + 5);
                var sectorSize = this.readUInt16(pos + 6) || (0x0080 << trackInfo.bps); // eslint-disable-line no-bitwise
                sectorInfo.sectorSize = sectorSize;
                sectorPos += sectorSize;
                sectorNum2Index[sectorInfo.sector] = i;
                pos += 8;
            }
        };
        DiskImage.prototype.seekTrack = function (track, head) {
            var diskInfo = this.diskInfo, trackInfo = diskInfo.trackInfo;
            if (trackInfo.track === track && trackInfo.head === head) { // already positionend?
                return;
            }
            if (!diskInfo.ident) {
                this.readDiskInfo(0);
            }
            var trackInfoPos = diskInfo.trackPos[track * diskInfo.heads + head];
            if (trackInfoPos === undefined) {
                throw this.composeError(new Error(), "Track not found", String(track));
            }
            this.readTrackInfo(trackInfoPos);
        };
        DiskImage.prototype.sectorNum2Index = function (sector) {
            var trackInfo = this.diskInfo.trackInfo, sectorIndex = trackInfo.sectorNum2Index[sector];
            return sectorIndex;
        };
        DiskImage.prototype.seekSector = function (sectorIndex) {
            var sectorInfoList = this.diskInfo.trackInfo.sectorInfo, sectorInfo = sectorInfoList[sectorIndex];
            return sectorInfo;
        };
        DiskImage.prototype.readSector = function (sector) {
            var trackInfo = this.diskInfo.trackInfo, sectorIndex = this.sectorNum2Index(sector);
            if (sectorIndex === undefined) {
                throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
            }
            var sectorInfo = this.seekSector(sectorIndex), out = this.readUtf(sectorInfo.dataPos, sectorInfo.sectorSize);
            return out;
        };
        // ...
        DiskImage.prototype.getFormatDescriptor = function (format) {
            var derivedFormat = DiskImage.formatDescriptors[format];
            if (!derivedFormat) {
                throw this.composeError(Error(), "Unknown format", format);
            }
            var formatDescriptor;
            if (derivedFormat.parentRef) {
                var parentFormat = this.getFormatDescriptor(derivedFormat.parentRef); // recursive
                formatDescriptor = Object.assign({}, parentFormat, derivedFormat);
            }
            else {
                formatDescriptor = Object.assign({}, derivedFormat); // get a copy
            }
            return formatDescriptor;
        };
        DiskImage.prototype.determineFormat = function () {
            var diskInfo = this.diskInfo, track = 0, head = 0;
            this.seekTrack(track, head);
            var trackInfo = diskInfo.trackInfo;
            var firstSector = 0xff;
            for (var i = 0; i < trackInfo.spt; i += 1) {
                var sector = trackInfo.sectorInfo[i].sector;
                if (sector < firstSector) {
                    firstSector = sector;
                }
            }
            var format = "";
            if (firstSector === 0xc1) {
                format = "data";
            }
            else if (firstSector === 0x41) {
                format = "system";
            }
            else if ((firstSector === 0x01) && (diskInfo.tracks === 80)) { // big780k
                format = "big780k";
            }
            else {
                throw this.composeError(Error(), "Unknown format with sector", String(firstSector));
            }
            if (diskInfo.heads > 1) { // maybe 2
                format += String(diskInfo.heads); // e.g. "data": "data2"
            }
            return this.getFormatDescriptor(format);
        };
        DiskImage.fnRemoveHighBit7 = function (str) {
            var out = "";
            for (var i = 0; i < str.length; i += 1) {
                var char = str.charCodeAt(i);
                out += String.fromCharCode(char & 0x7f); // eslint-disable-line no-bitwise
            }
            return out;
        };
        DiskImage.prototype.readDirectoryExtents = function (extents, pos, endPos) {
            while (pos < endPos) {
                var extWithFlags = this.readUtf(pos + 9, 3), // extension with high bits set for special flags
                extent = {
                    user: this.readUInt8(pos),
                    name: DiskImage.fnRemoveHighBit7(this.readUtf(pos + 1, 8)),
                    ext: DiskImage.fnRemoveHighBit7(extWithFlags),
                    extent: this.readUInt8(pos + 12),
                    lastRecBytes: this.readUInt8(pos + 13),
                    extentHi: this.readUInt8(pos + 14),
                    records: this.readUInt8(pos + 15),
                    blocks: [],
                    readOnly: Boolean(extWithFlags.charCodeAt(0) & 0x80),
                    system: Boolean(extWithFlags.charCodeAt(1) & 0x80),
                    backup: Boolean(extWithFlags.charCodeAt(2) & 0x80) /* eslint-disable-line no-bitwise */
                };
                pos += 16;
                var blocks = extent.blocks;
                for (var i = 0; i < 16; i += 1) {
                    var block = this.readUInt8(pos + i);
                    if (block) {
                        blocks.push(block);
                    }
                    else { // last block
                        break;
                    }
                }
                pos += 16;
                extents.push(extent);
            }
            return extents;
        };
        DiskImage.fnSortByExtentNumber = function (a, b) {
            return a.extent - b.extent;
        };
        // do not know if we need to sort the extents per file, but...
        DiskImage.sortFileExtents = function (dir) {
            for (var name_1 in dir) {
                if (dir.hasOwnProperty(name_1)) {
                    var fileExtents = dir[name_1];
                    fileExtents.sort(DiskImage.fnSortByExtentNumber);
                }
            }
        };
        DiskImage.prepareDirectoryList = function (extents, fill, reFilePattern) {
            var dir = {};
            for (var i = 0; i < extents.length; i += 1) {
                var extent = extents[i];
                if (fill === null || extent.user !== fill) {
                    var name_2 = extent.name + "." + extent.ext; // and extent.user?
                    // (do not convert filename here (to display messages in filenames))
                    if (!reFilePattern || reFilePattern.test(name_2)) {
                        if (!(name_2 in dir)) {
                            dir[name_2] = [];
                        }
                        dir[name_2].push(extent);
                    }
                }
            }
            DiskImage.sortFileExtents(dir);
            return dir;
        };
        DiskImage.prototype.convertBlock2Sector = function (block) {
            var format = this.format, spt = format.spt, blockSectors = 2, logSec = block * blockSectors, // directory is in block 0-1
            pos = {
                track: Math.floor(logSec / spt) + format.off,
                head: 0,
                sector: (logSec % spt) + format.firstSector
            };
            return pos;
        };
        DiskImage.prototype.readDirectory = function () {
            var directorySectors = 4, extents = [], format = this.determineFormat(), off = format.off, firstSector = format.firstSector;
            this.format = format;
            this.seekTrack(off, 0);
            for (var i = 0; i < directorySectors; i += 1) {
                var sectorIndex = this.sectorNum2Index(firstSector + i);
                if (sectorIndex === undefined) {
                    throw this.composeError(Error(), "Cannot read directory at track " + off + " sector", String(firstSector));
                }
                var sectorInfo = this.seekSector(sectorIndex);
                this.readDirectoryExtents(extents, sectorInfo.dataPos, sectorInfo.dataPos + sectorInfo.sectorSize);
            }
            return DiskImage.prepareDirectoryList(extents, format.fill);
        };
        DiskImage.prototype.nextSector = function (pos) {
            var format = this.format;
            pos.sector += 1;
            if (pos.sector >= format.firstSector + format.spt) {
                pos.track += 1;
                pos.sector = format.firstSector;
            }
        };
        DiskImage.prototype.readBlock = function (block) {
            var diskInfo = this.diskInfo, blockSectors = 2, pos = this.convertBlock2Sector(block);
            var out = "";
            if (pos.track >= diskInfo.tracks) {
                Utils_1.Utils.console.error(this.composeError({}, "Block " + block + ": Track out of range", String(pos.track)));
            }
            if (pos.head >= diskInfo.heads) {
                Utils_1.Utils.console.error(this.composeError({}, "Block " + block + ": Head out of range", String(pos.track)));
            }
            for (var i = 0; i < blockSectors; i += 1) {
                this.seekTrack(pos.track, pos.head);
                out += this.readSector(pos.sector);
                this.nextSector(pos);
            }
            return out;
        };
        DiskImage.prototype.readExtents = function (fileExtents) {
            var recPerBlock = 8;
            var out = "";
            for (var i = 0; i < fileExtents.length; i += 1) {
                var extent = fileExtents[i], blocks = extent.blocks;
                var records = extent.records;
                for (var blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
                    var block = this.readBlock(blocks[blockIndex]);
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
        };
        DiskImage.prototype.readFile = function (fileExtents) {
            var out = this.readExtents(fileExtents);
            var header = DiskImage.parseAmsdosHeader(out);
            var realLen;
            if (header) {
                var amsdosHeaderLength = 0x80;
                realLen = header.length + amsdosHeaderLength;
            }
            if (realLen === undefined) { // no real length: ASCII: find EOF (0x1a) in last record
                var fileLen = out.length, lastRecPos = fileLen > 0x80 ? (fileLen - 0x80) : 0, index = out.indexOf(String.fromCharCode(0x1a), lastRecPos);
                if (index >= 0) {
                    realLen = index;
                    if (Utils_1.Utils.debug > 0) {
                        Utils_1.Utils.console.debug("readFile: ASCII file length " + fileLen + " truncated to " + realLen);
                    }
                }
            }
            if (realLen !== undefined) { // now real length (from header or ASCII)?
                out = out.substring(0, realLen);
            }
            return out;
        };
        /* eslint-enable array-element-newline */
        DiskImage.unOrProtectData = function (data) {
            var table1 = DiskImage.protectTable[0], table2 = DiskImage.protectTable[1];
            var out = "";
            for (var i = 0; i < data.length; i += 1) {
                var byte = data.charCodeAt(i);
                byte ^= table1[(i & 0x7f) % table1.length] ^ table2[(i & 0x7f) % table2.length]; // eslint-disable-line no-bitwise
                out += String.fromCharCode(byte);
            }
            return out;
        };
        // ...
        DiskImage.computeChecksum = function (data) {
            var sum = 0;
            for (var i = 0; i < data.length; i += 1) {
                sum += data.charCodeAt(i);
            }
            return sum;
        };
        DiskImage.parseAmsdosHeader = function (data) {
            var typeMap = {
                0: "T",
                1: "P",
                2: "B",
                8: "G",
                0x16: "A" // ASCII
            };
            var header;
            // http://www.benchmarko.de/cpcemu/cpcdoc/chapter/cpcdoc7_e.html#I_AMSDOS_HD
            // http://www.cpcwiki.eu/index.php/AMSDOS_Header
            if (data.length >= 0x80) {
                var computed = DiskImage.computeChecksum(data.substring(0, 66)), sum = data.charCodeAt(67) + data.charCodeAt(68) * 256;
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
        };
        // for testing only
        /*
        private static writeUInt8(data: Uint8Array, pos: number, value: number) {
            data[pos] = value;
        }
    
        private static writeUInt16(data: Uint8Array, pos: number, value: number) {
            data[pos] = value & 0xff;
            data[pos + 1] = (value >> 8) & 0xff;
        }
        */
        DiskImage.uInt8ToString = function (value) {
            return String.fromCharCode(value);
        };
        DiskImage.uInt16ToString = function (value) {
            return DiskImage.uInt8ToString(value & 0xff) + DiskImage.uInt8ToString((value >> 8) & 0xff); // eslint-disable-line no-bitwise
        };
        DiskImage.uInt24ToString = function (value) {
            return DiskImage.uInt16ToString(value & 0xffff) + DiskImage.uInt8ToString(value >> 16); // eslint-disable-line no-bitwise
        };
        DiskImage.combineAmsdosHeader = function (header) {
            var typeMap = {
                T: 0,
                P: 1,
                B: 2,
                G: 8,
                A: 0x16 // ASCII
            };
            var type = header.typeNumber;
            if (header.typeString) { // overwrite type form type
                type = typeMap[header.typeString];
                if (type === undefined) {
                    type = typeMap.A;
                }
            }
            var data1 = DiskImage.uInt8ToString(header.user || 0)
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
                + DiskImage.uInt24ToString(header.length), checksum = DiskImage.computeChecksum(data1), data = data1
                + DiskImage.uInt16ToString(checksum)
                + "\x00".repeat(59);
            return data;
        };
        DiskImage.formatDescriptors = {
            data: {
                tracks: 40,
                heads: 1,
                // head: 0, // head number?
                bps: 2,
                spt: 9,
                gap3: 0x4e,
                fill: 0xe5,
                firstSector: 0xc1,
                bls: 1024,
                // bsh: 3, // log2 BLS - 7
                // blm: 7, // BLS / 128 - 1
                al0: 0xc0,
                al1: 0x00,
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
                al0: 0x80,
                tracks: 80,
                off: 1,
                firstSector: 0x01
            },
            big780k2: {
                parentRef: "big780k",
                heads: 2
            }
        };
        // ...
        // see AMSDOS ROM, &D252
        /* eslint-disable array-element-newline */
        DiskImage.protectTable = [
            [0xe2, 0x9d, 0xdb, 0x1a, 0x42, 0x29, 0x39, 0xc6, 0xb3, 0xc6, 0x90, 0x45, 0x8a],
            [0x49, 0xb1, 0x36, 0xf0, 0x2e, 0x1e, 0x06, 0x2a, 0x28, 0x19, 0xea] // 11 bytes
        ];
        return DiskImage;
    }());
    exports.DiskImage = DiskImage;
});
//# sourceMappingURL=DiskImage.js.map