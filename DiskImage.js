// DiskImage.ts - DiskImage
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskImage = void 0;
    var DiskImage = /** @class */ (function () {
        function DiskImage(options) {
            this.diskInfo = DiskImage.getInitialDiskInfo();
            this.options = {
                data: "",
                quiet: false
            };
            this.setOptions(options);
        }
        DiskImage.prototype.getOptions = function () {
            return this.options;
        };
        DiskImage.prototype.setOptions = function (options) {
            var currentData = this.options.data;
            Object.assign(this.options, options);
            if (this.options.data !== currentData) { // changed?
                this.diskInfo.ident = ""; // invalidate diskinfo
                this.diskInfo.trackInfo.ident = ""; // invalidate trackinfo
            }
        };
        DiskImage.getInitialDiskInfo = function () {
            var diskInfo = {
                ident: "",
                creator: "",
                tracks: 0,
                heads: 0,
                trackSize: 0,
                trackInfo: {
                    ident: "",
                    sectorInfoList: []
                },
                trackSizes: [],
                trackInfoPosList: [],
                extended: false
            };
            return diskInfo;
        };
        DiskImage.prototype.getFormatDescriptor = function () {
            var formatDescriptor = this.formatDescriptor;
            if (!formatDescriptor) {
                throw this.composeError(Error(), "getFormatDescriptor: formatDescriptor:", String(formatDescriptor));
            }
            return formatDescriptor;
        };
        DiskImage.prototype.composeError = function (error, message, value, pos) {
            var len = 0;
            return Utils_1.Utils.composeError("DiskImage", error, this.options.diskName + ": " + message, value, pos || 0, len);
        };
        DiskImage.testDiskIdent = function (ident) {
            var diskType = DiskImage.diskInfoIdentMap[ident] || 0;
            return diskType;
        };
        DiskImage.prototype.readUtf = function (pos, len) {
            var out = this.options.data.substring(pos, pos + len);
            if (out.length !== len) {
                throw this.composeError(new Error(), "End of File", "", pos);
            }
            return out;
        };
        DiskImage.prototype.readUInt8 = function (pos) {
            var num = this.options.data.charCodeAt(pos);
            if (isNaN(num)) {
                throw this.composeError(new Error(), "End of File", String(num), pos);
            }
            return num;
        };
        DiskImage.prototype.readUInt16 = function (pos) {
            return this.readUInt8(pos) + this.readUInt8(pos + 1) * 256;
        };
        DiskImage.uInt8ToString = function (value) {
            return String.fromCharCode(value);
        };
        DiskImage.uInt16ToString = function (value) {
            return DiskImage.uInt8ToString(value & 0xff) + DiskImage.uInt8ToString((value >> 8) & 0xff); // eslint-disable-line no-bitwise
        };
        DiskImage.uInt24ToString = function (value) {
            return DiskImage.uInt16ToString(value & 0xffff) + DiskImage.uInt8ToString(value >> 16); // eslint-disable-line no-bitwise
        };
        DiskImage.prototype.readDiskInfo = function (diskInfo, pos) {
            var ident = this.readUtf(pos, 8), // check first 8 characters as characteristic
            diskType = DiskImage.testDiskIdent(ident);
            if (!diskType) {
                throw this.composeError(Error(), "Ident not found", ident, pos);
            }
            diskInfo.extended = (diskType === 2);
            diskInfo.ident = ident + this.readUtf(pos + 8, 34 - 8); // read remaining ident
            if (diskInfo.ident.substring(34 - 11, 34 - 11 + 9) !== "Disk-Info") { // some tools use "Disk-Info  " instead of "Disk-Info\r\n", so compare without "\r\n"
                // "Disk-Info" string is optional
                if (!this.options.quiet) {
                    Utils_1.Utils.console.warn(this.composeError({}, "Disk ident not found", diskInfo.ident.substring(34 - 11, 34 - 11 + 9), pos + 34 - 11).message);
                }
            }
            diskInfo.creator = this.readUtf(pos + 34, 14);
            diskInfo.tracks = this.readUInt8(pos + 48);
            diskInfo.heads = this.readUInt8(pos + 49);
            diskInfo.trackSize = this.readUInt16(pos + 50);
            var trackSizes = [], trackInfoPosList = [], trackSizeCount = diskInfo.tracks * diskInfo.heads; // number of track sizes
            var trackInfoPos = DiskImage.diskInfoSize;
            pos += 52; // track sizes high bytes start at offset 52 (0x35)
            for (var i = 0; i < trackSizeCount; i += 1) {
                trackInfoPosList.push(trackInfoPos);
                var trackSize = diskInfo.trackSize || (this.readUInt8(pos + i) * 256); // take common track size or read individual track size (extended)
                trackSizes.push(trackSize);
                trackInfoPos += trackSize;
            }
            diskInfo.trackSizes = trackSizes;
            diskInfo.trackInfoPosList = trackInfoPosList;
            diskInfo.trackInfo.ident = ""; // make sure it is invalid
        };
        DiskImage.createDiskInfoAsString = function (diskInfo) {
            // only standard format
            var diskInfoString = diskInfo.ident // 34
                + diskInfo.creator // 14
                + DiskImage.uInt8ToString(diskInfo.tracks)
                + DiskImage.uInt8ToString(diskInfo.heads)
                + DiskImage.uInt16ToString(diskInfo.trackSize)
                + DiskImage.uInt8ToString(0).repeat(204); // unused
            return diskInfoString;
        };
        DiskImage.prototype.readTrackInfo = function (trackInfo, pos) {
            var trackInfoSize = DiskImage.trackInfoSize, sectorInfoList = trackInfo.sectorInfoList, trackDataPos = pos + trackInfoSize;
            trackInfo.ident = this.readUtf(pos, 12);
            if (trackInfo.ident.substring(0, 10) !== "Track-Info") { // some tools use "Track-Info  " instead of "Track-Info\r\n", so compare without "\r\n"
                // "Track-Info" string is optional
                if (!this.options.quiet) {
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
            var sectorPos = trackDataPos;
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
        DiskImage.createTrackInfoAsString = function (trackInfo) {
            var sectorInfoList = trackInfo.sectorInfoList;
            var trackInfoString = trackInfo.ident // 12
                + DiskImage.uInt8ToString(0).repeat(4) // 4 unused
                + DiskImage.uInt8ToString(trackInfo.track)
                + DiskImage.uInt8ToString(trackInfo.head)
                + DiskImage.uInt8ToString(trackInfo.dataRate)
                + DiskImage.uInt8ToString(trackInfo.recMode)
                + DiskImage.uInt8ToString(trackInfo.bps)
                + DiskImage.uInt8ToString(trackInfo.spt)
                + DiskImage.uInt8ToString(trackInfo.gap3)
                + DiskImage.uInt8ToString(trackInfo.fill);
            for (var i = 0; i < trackInfo.spt; i += 1) {
                var sectorInfo = sectorInfoList[i], sectorinfoString = DiskImage.uInt8ToString(sectorInfo.track)
                    + DiskImage.uInt8ToString(sectorInfo.head)
                    + DiskImage.uInt8ToString(sectorInfo.sector)
                    + DiskImage.uInt8ToString(sectorInfo.bps)
                    + DiskImage.uInt8ToString(sectorInfo.state1)
                    + DiskImage.uInt8ToString(sectorInfo.state2)
                    + DiskImage.uInt16ToString(sectorInfo.sectorSize);
                trackInfoString += sectorinfoString;
            }
            // fill up
            trackInfoString += DiskImage.uInt8ToString(0).repeat(DiskImage.trackInfoSize - trackInfoString.length);
            return trackInfoString;
        };
        DiskImage.prototype.seekTrack = function (diskInfo, track, head) {
            if (!diskInfo.ident) {
                this.readDiskInfo(diskInfo, 0);
            }
            var trackInfo = diskInfo.trackInfo;
            if (trackInfo.ident && trackInfo.track === track && trackInfo.head === head) { // already positionend?
                return;
            }
            var trackInfoPos = diskInfo.trackInfoPosList[track * diskInfo.heads + head];
            if (trackInfoPos === undefined) {
                throw this.composeError(new Error(), "Track not found", String(track));
            }
            this.readTrackInfo(trackInfo, trackInfoPos);
        };
        DiskImage.sectorNum2Index = function (trackInfo, sector) {
            var sectorIndex = trackInfo.sectorNum2Index[sector];
            return sectorIndex;
        };
        DiskImage.seekSector = function (sectorInfoList, sectorIndex) {
            return sectorInfoList[sectorIndex];
        };
        DiskImage.prototype.readSector = function (trackInfo, sector) {
            var sectorIndex = DiskImage.sectorNum2Index(trackInfo, sector);
            if (sectorIndex === undefined) {
                throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
            }
            var sectorInfo = DiskImage.seekSector(trackInfo.sectorInfoList, sectorIndex), out = this.readUtf(sectorInfo.dataPos, sectorInfo.sectorSize);
            return out;
        };
        DiskImage.prototype.writeSector = function (trackInfo, sector, sectorData) {
            var sectorIndex = DiskImage.sectorNum2Index(trackInfo, sector);
            if (sectorIndex === undefined) {
                throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
            }
            var sectorInfo = DiskImage.seekSector(trackInfo.sectorInfoList, sectorIndex), data = this.options.data;
            if (sectorData.length !== sectorInfo.sectorSize) {
                Utils_1.Utils.console.error(this.composeError({}, "sectordata.length " + sectorData.length + " <> sectorSize " + sectorInfo.sectorSize, String(0)));
            }
            this.options.data = data.substring(0, sectorInfo.dataPos) + sectorData + data.substring(sectorInfo.dataPos + sectorInfo.sectorSize);
        };
        // ...
        DiskImage.prototype.composeFormatDescriptor = function (format) {
            var derivedFormatDescriptor = DiskImage.formatDescriptors[format];
            if (!derivedFormatDescriptor) {
                throw this.composeError(Error(), "Unknown format", format);
            }
            var formatDescriptor;
            if (derivedFormatDescriptor.parentRef) {
                var parentFormatDescriptor = this.composeFormatDescriptor(derivedFormatDescriptor.parentRef); // recursive
                formatDescriptor = Object.assign({}, parentFormatDescriptor, derivedFormatDescriptor);
            }
            else {
                formatDescriptor = Object.assign({}, derivedFormatDescriptor); // get a copy
            }
            return formatDescriptor;
        };
        DiskImage.prototype.determineFormat = function (diskInfo) {
            var trackInfo = diskInfo.trackInfo, track = 0, head = 0;
            this.seekTrack(diskInfo, track, head);
            var firstSector = 0xff;
            for (var i = 0; i < trackInfo.spt; i += 1) {
                var sector = trackInfo.sectorInfoList[i].sector;
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
            else if ((firstSector === 0x91) && (diskInfo.tracks === 80)) { // parados80
                format = "parados80";
            }
            else if ((firstSector === 0x01) && (diskInfo.tracks === 80)) { // big780k (usually diskInfo.heads: 2)
                format = "big780k";
            }
            else {
                throw this.composeError(Error(), "Unknown format with sector", String(firstSector));
            }
            if (diskInfo.heads > 1) { // maybe 2
                format += String(diskInfo.heads); // e.g. "data": "data2"
            }
            return format;
        };
        DiskImage.prototype.createImage = function (format) {
            var formatDescriptor = this.composeFormatDescriptor(format), sectorInfoList = [], sectorSize = (0x80 << formatDescriptor.bps), // eslint-disable-line no-bitwise
            sectorInfo = {
                track: 0,
                head: 0,
                sector: 0,
                bps: formatDescriptor.bps,
                state1: 0,
                state2: 0,
                sectorSize: sectorSize,
                dataPos: 0
            }, trackInfo = {
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
            }, diskInfo = {
                ident: "MV - CPCEMU Disk-File\r\nDisk-Info\r\n",
                creator: "CpcBasicTS    ",
                tracks: formatDescriptor.tracks,
                heads: formatDescriptor.heads,
                trackSize: DiskImage.trackInfoSize + formatDescriptor.spt * sectorSize,
                trackInfo: trackInfo,
                trackSizes: [],
                trackInfoPosList: [],
                extended: false
            }, emptySectorData = DiskImage.uInt8ToString(formatDescriptor.fill).repeat(sectorSize);
            for (var i = 0; i < trackInfo.spt; i += 1) {
                var sectorInfoClone = __assign({}, sectorInfo);
                sectorInfoClone.sector = formatDescriptor.firstSector + i;
                trackInfo.sectorNum2Index[sectorInfoClone.sector] = i;
                sectorInfoList.push(sectorInfoClone);
            }
            var image = DiskImage.createDiskInfoAsString(diskInfo), trackInfoPos = DiskImage.diskInfoSize;
            for (var track = 0; track < formatDescriptor.tracks; track += 1) {
                for (var head = 0; head < formatDescriptor.heads; head += 1) {
                    trackInfo.track = track;
                    trackInfo.head = head;
                    diskInfo.trackInfoPosList.push(trackInfoPos);
                    for (var sector = 0; sector < trackInfo.spt; sector += 1) {
                        var sectorInfo2 = sectorInfoList[sector];
                        sectorInfo2.track = track;
                        sectorInfo2.head = head;
                        // in case we want to use the formatted image...
                        sectorInfo2.dataPos = trackInfoPos + DiskImage.trackInfoSize + sector * sectorInfo2.sectorSize;
                    }
                    var trackAsString = DiskImage.createTrackInfoAsString(trackInfo);
                    image += trackAsString;
                    for (var sector = 0; sector < formatDescriptor.spt; sector += 1) {
                        image += emptySectorData;
                    }
                    trackInfoPos += diskInfo.trackSize;
                }
            }
            this.diskInfo = diskInfo;
            this.formatDescriptor = formatDescriptor;
            return image;
        };
        DiskImage.prototype.formatImage = function (format) {
            var image = this.createImage(format);
            this.options.data = image;
            return image;
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
                var extent = {
                    user: this.readUInt8(pos),
                    name: this.readUtf(pos + 1, 8),
                    ext: this.readUtf(pos + 9, 3),
                    extent: this.readUInt8(pos + 12),
                    lastRecBytes: this.readUInt8(pos + 13),
                    extentHi: this.readUInt8(pos + 14),
                    records: this.readUInt8(pos + 15),
                    blocks: []
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
        DiskImage.createDirectoryExtentAsString = function (extent) {
            var extentString = DiskImage.uInt8ToString(extent.user)
                + extent.name
                + extent.ext
                + DiskImage.uInt8ToString(extent.extent)
                + DiskImage.uInt8ToString(extent.lastRecBytes)
                + DiskImage.uInt8ToString(extent.extentHi)
                + DiskImage.uInt8ToString(extent.records), blockString = "";
            for (var i = 0; i < extent.blocks.length; i += 1) {
                blockString += DiskImage.uInt8ToString(extent.blocks[i]);
            }
            extentString += blockString;
            return extentString;
        };
        DiskImage.createSeveralDirectoryExtentsAsString = function (extents, first, last) {
            var extentString = "";
            for (var i = first; i < last; i += 1) {
                extentString += DiskImage.createDirectoryExtentAsString(extents[i]);
            }
            return extentString;
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
                    var name_2 = DiskImage.fnRemoveHighBit7(extent.name) + "." + DiskImage.fnRemoveHighBit7(extent.ext); // and extent.user?
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
        DiskImage.convertBlock2Sector = function (formatDescriptor, block) {
            var spt = formatDescriptor.spt, blockSectors = formatDescriptor.bls / 512, // usually 2
            logSec = block * blockSectors, // directory is in block 0-1
            pos = {
                track: Math.floor(logSec / spt) + formatDescriptor.off,
                head: 0,
                sector: (logSec % spt) + formatDescriptor.firstSector
            };
            return pos;
        };
        DiskImage.prototype.readAllDirectoryExtents = function (diskInfo, formatDescriptor, extents) {
            var directorySectors = 4, // could be determined from al0,al1
            off = formatDescriptor.off, firstSector = formatDescriptor.firstSector, trackInfo = diskInfo.trackInfo, sectorInfoList = trackInfo.sectorInfoList;
            this.seekTrack(diskInfo, off, 0);
            for (var i = 0; i < directorySectors; i += 1) {
                var sectorIndex = DiskImage.sectorNum2Index(trackInfo, firstSector + i);
                if (sectorIndex === undefined) {
                    throw this.composeError(Error(), "Cannot read directory at track " + off + " sector", String(firstSector));
                }
                var sectorInfo = DiskImage.seekSector(sectorInfoList, sectorIndex);
                this.readDirectoryExtents(extents, sectorInfo.dataPos, sectorInfo.dataPos + sectorInfo.sectorSize);
            }
            return extents;
        };
        DiskImage.prototype.writeAllDirectoryExtents = function (diskInfo, formatDescriptor, extents) {
            var directoryBlocks = 2, // could be determined from al0,al1
            extentsPerBlock = extents.length / directoryBlocks;
            for (var i = 0; i < directoryBlocks; i += 1) {
                var blockData = DiskImage.createSeveralDirectoryExtentsAsString(extents, i * extentsPerBlock, (i + 1) * extentsPerBlock);
                this.writeBlock(diskInfo, formatDescriptor, i, blockData);
            }
        };
        DiskImage.prototype.readDirectory = function () {
            var diskInfo = this.diskInfo, format = this.determineFormat(diskInfo), formatDescriptor = this.composeFormatDescriptor(format), extents = [];
            this.formatDescriptor = formatDescriptor;
            this.readAllDirectoryExtents(diskInfo, formatDescriptor, extents);
            return DiskImage.prepareDirectoryList(extents, this.formatDescriptor.fill);
        };
        DiskImage.nextSector = function (formatDescriptor, pos) {
            pos.sector += 1;
            if (pos.sector >= formatDescriptor.firstSector + formatDescriptor.spt) {
                pos.track += 1;
                pos.sector = formatDescriptor.firstSector;
            }
        };
        DiskImage.prototype.readBlock = function (diskInfo, formatDescriptor, block) {
            var blockSectors = formatDescriptor.bls / 512, // usually 2
            pos = DiskImage.convertBlock2Sector(formatDescriptor, block);
            var out = "";
            if (pos.track >= diskInfo.tracks) {
                Utils_1.Utils.console.error(this.composeError({}, "Block " + block + ": Track out of range", String(pos.track)));
            }
            if (pos.head >= diskInfo.heads) {
                Utils_1.Utils.console.error(this.composeError({}, "Block " + block + ": Head out of range", String(pos.track)));
            }
            for (var i = 0; i < blockSectors; i += 1) {
                this.seekTrack(diskInfo, pos.track, pos.head);
                out += this.readSector(diskInfo.trackInfo, pos.sector);
                DiskImage.nextSector(formatDescriptor, pos);
            }
            return out;
        };
        DiskImage.prototype.writeBlock = function (diskInfo, formatDescriptor, block, blockData) {
            var blockSectors = formatDescriptor.bls / 512, // usually 2
            sectorSize = (0x80 << formatDescriptor.bps), // eslint-disable-line no-bitwise
            pos = DiskImage.convertBlock2Sector(formatDescriptor, block);
            if (pos.track >= diskInfo.tracks) {
                Utils_1.Utils.console.error(this.composeError({}, "Block " + block + ": Track out of range", String(pos.track)));
            }
            if (pos.head >= diskInfo.heads) {
                Utils_1.Utils.console.error(this.composeError({}, "Block " + block + ": Head out of range", String(pos.track)));
            }
            if (blockData.length !== (blockSectors * sectorSize)) {
                Utils_1.Utils.console.error(this.composeError({}, "blockData.length " + blockData.length + " <> blockSize " + (blockSectors * sectorSize), String(0)));
            }
            for (var i = 0; i < blockSectors; i += 1) {
                this.seekTrack(diskInfo, pos.track, pos.head);
                var sectorData = blockData.substring(i * sectorSize, (i + 1) * sectorSize);
                this.writeSector(diskInfo.trackInfo, pos.sector, sectorData);
                DiskImage.nextSector(formatDescriptor, pos);
            }
        };
        DiskImage.prototype.readExtents = function (diskInfo, formatDescriptor, fileExtents) {
            var recPerBlock = formatDescriptor.bls / 128; // usually 8
            var out = "";
            for (var i = 0; i < fileExtents.length; i += 1) {
                var extent = fileExtents[i], blocks = extent.blocks;
                var records = extent.records;
                if (extent.extent > 0) {
                    if (recPerBlock > 8) { // fast hack for parados: adapt records
                        records += extent.extent * 128;
                    }
                }
                for (var blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
                    var block = this.readBlock(diskInfo, formatDescriptor, blocks[blockIndex]);
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
            var diskInfo = this.diskInfo, formatDescriptor = this.getFormatDescriptor();
            var out = this.readExtents(diskInfo, formatDescriptor, fileExtents);
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
        DiskImage.getFreeExtents = function (extents, fill) {
            var freeExtents = [];
            for (var i = 0; i < extents.length; i += 1) {
                if (extents[i].user === fill) {
                    freeExtents.push(i);
                }
            }
            return freeExtents;
        };
        DiskImage.getBlockMask = function (extents, fill, dsm, al0, al1) {
            var blockMask = [];
            for (var i = 0; i < dsm - 1; i += 1) {
                blockMask[i] = false;
            }
            // mark reserved blocks
            var mask = 0x80;
            for (var i = 0; i < 8; i += 1) {
                if (al0 & mask) { // eslint-disable-line no-bitwise
                    blockMask[i] = true; // mark reserved block
                }
                mask >>= 1; // eslint-disable-line no-bitwise
            }
            mask = 0x80;
            for (var i = 8; i < 16; i += 1) {
                if (al1 & mask) { // eslint-disable-line no-bitwise
                    blockMask[i] = true; // mark reserved block
                }
                mask >>= 1; // eslint-disable-line no-bitwise
            }
            for (var i = 0; i < extents.length; i += 1) {
                var extent = extents[i];
                if (extent.user !== fill) {
                    for (var block = 0; block < extent.blocks.length; block += 1) {
                        if (extent.blocks[block]) {
                            if (blockMask[block]) { // eslint-disable-line max-depth
                                Utils_1.Utils.console.warn("getBlockMask: Block number $block already in use:", block);
                            }
                            blockMask[i] = true;
                        }
                        else {
                            break; // block=0 -> no more for this extent
                        }
                    }
                }
            }
            return blockMask;
        };
        DiskImage.getFreeBlocks = function (blockMask, dsm) {
            var freeBlocks = [];
            for (var i = 0; i < dsm; i += 1) {
                if (!blockMask[i]) {
                    freeBlocks.push(i);
                }
            }
            return freeBlocks;
        };
        DiskImage.getFilenameAndExtension = function (filename) {
            var _a = filename.split("."), name1 = _a[0], ext1 = _a[1]; // eslint-disable-line array-element-newline
            name1 = name1.substring(0, 8).toUpperCase().padEnd(8, " ");
            ext1 = ext1.substring(0, 3).toUpperCase().padEnd(3, " ");
            return [name1, ext1]; // eslint-disable-line array-element-newline
        };
        DiskImage.prototype.writeFile = function (filename, data) {
            var diskInfo = this.diskInfo, formatDescriptor = this.getFormatDescriptor(), extents = [];
            this.readAllDirectoryExtents(diskInfo, formatDescriptor, extents);
            var fill = formatDescriptor.fill, freeExtents = DiskImage.getFreeExtents(extents, formatDescriptor.fill), sectors = (formatDescriptor.tracks - formatDescriptor.off) * formatDescriptor.spt, ssize = 0x80 << formatDescriptor.bps, // eslint-disable-line no-bitwise
            dsm = ((sectors * ssize) / formatDescriptor.bls) | 0, // eslint-disable-line no-bitwise
            // DSM: total size of disc in blocks excluding any reserved tracks
            al0 = formatDescriptor.al0, al1 = formatDescriptor.al1, blockMask = DiskImage.getBlockMask(extents, fill, dsm, al0, al1), freeBlocks = DiskImage.getFreeBlocks(blockMask, dsm);
            if (Utils_1.Utils.debug > 0) {
                Utils_1.Utils.console.debug("writeFile: freeExtents=", freeExtents.length, ", freeBlocks=", freeBlocks);
            }
            if (!freeBlocks.length) {
                Utils_1.Utils.console.warn("writeFile: No space left!");
                return false;
            }
            if (!freeExtents.length) {
                Utils_1.Utils.console.warn("writeFile: Directory full!");
                return false;
            }
            var _a = DiskImage.getFilenameAndExtension(filename), name1 = _a[0], ext1 = _a[1], // eslint-disable-line array-element-newline
            fileSize = data.length, bls = formatDescriptor.bls, requiredBlocks = ((fileSize + bls - 1) / bls) | 0; // eslint-disable-line no-bitwise
            if (requiredBlocks > freeBlocks.length) {
                var requiredKB = ((requiredBlocks * bls) / 1024) | 0, // eslint-disable-line no-bitwise
                freeKB = ((freeBlocks.length * bls) / 1024) | 0; // eslint-disable-line no-bitwise
                Utils_1.Utils.console.warn("writeFile: Not enough space left (" + requiredKB + "K > " + freeKB + "K). Ignoring.");
                return false;
            }
            var blocksPerExtent = 16, requiredExtents = ((requiredBlocks + blocksPerExtent - 1) / blocksPerExtent) | 0; // eslint-disable-line no-bitwise
            if (requiredExtents > freeExtents.length) {
                Utils_1.Utils.console.warn("writeFile: Directory full!");
                return false;
            }
            var size = fileSize, extent, extentCnt = 0, blockCnt = 0;
            while (size > 0) {
                if (!extent || (blockCnt >= 16)) {
                    var records = ((size + 0x80 - 1) / 0x80) | 0; // eslint-disable-line no-bitwise
                    extent = extents[freeExtents[extentCnt]];
                    extent.user = 0;
                    extent.name = name1;
                    extent.ext = ext1;
                    extent.extent = extentCnt;
                    extent.lastRecBytes = 0; // ($size >= 0x80) ? 0 : $size;
                    extent.extentHi = 0;
                    extent.records = (records > 0x80) ? 0x80 : records;
                    extent.blocks.length = 0;
                    for (var i = 0; i < 16; i += 1) {
                        extent.blocks[i] = 0;
                    }
                    extentCnt += 1;
                    blockCnt = 0;
                }
                var thisSize = (size > bls) ? bls : size;
                var dataChunk = data.substring(fileSize - size, fileSize - size + thisSize);
                if (thisSize < bls) {
                    dataChunk += DiskImage.uInt8ToString(0x1a); // EOF (maybe ASCII)
                    dataChunk += DiskImage.uInt8ToString(0).repeat(bls - thisSize - 1); // fill up last block with 0
                }
                var block = freeBlocks[(extentCnt - 1) * 16 + blockCnt];
                this.writeBlock(diskInfo, formatDescriptor, block, dataChunk);
                extent.blocks[blockCnt] = block;
                blockCnt += 1;
                size -= thisSize;
            }
            this.writeAllDirectoryExtents(diskInfo, formatDescriptor, extents);
            return true;
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
            var length = header.pseudoLen || header.length; // logical length;
            if (length > 0xffff) { // 16 bit
                length = 0xffff;
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
                + DiskImage.uInt16ToString(length) // logical length
                + DiskImage.uInt16ToString(header.entry || 0)
                + " ".repeat(36)
                + DiskImage.uInt24ToString(header.length), checksum = DiskImage.computeChecksum(data1), data = data1
                + DiskImage.uInt16ToString(checksum)
                + "\x00".repeat(59);
            return data;
        };
        DiskImage.createAmsdosHeader = function (parameter) {
            var header = __assign({ user: 0, name: "", ext: "", typeNumber: 0, start: 0, pseudoLen: 0, entry: 0, length: 0, typeString: "" }, parameter);
            return header;
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
            parados80: {
                parentRef: "data",
                tracks: 80,
                firstSector: 0x91,
                spt: 10,
                bls: 2048
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
        DiskImage.diskInfoIdentMap = {
            "MV - CPC": 1,
            EXTENDED: 2
        };
        DiskImage.diskInfoSize = 0x100;
        DiskImage.trackInfoSize = 0x100;
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