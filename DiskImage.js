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
            this.options = {
                diskName: options.diskName,
                data: options.data,
                quiet: false
            };
            this.setOptions(options);
            // reset
            this.diskInfo = DiskImage.getInitialDiskInfo();
            this.format = DiskImage.getInitialFormatDescriptor();
        }
        DiskImage.prototype.setOptions = function (options) {
            if (options.diskName !== undefined) {
                this.options.diskName = options.diskName;
            }
            if (options.data !== undefined) {
                this.options.data = options.data;
            }
            if (options.quiet !== undefined) {
                this.options.quiet = options.quiet;
            }
        };
        DiskImage.prototype.getOptions = function () {
            return this.options;
        };
        DiskImage.getInitialDiskInfo = function () {
            return {
                trackInfo: {
                    sectorInfo: []
                }
            };
        };
        DiskImage.getInitialFormatDescriptor = function () {
            return {};
        };
        DiskImage.prototype.reset = function () {
            this.diskInfo = DiskImage.getInitialDiskInfo();
            this.format = DiskImage.getInitialFormatDescriptor();
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
        DiskImage.prototype.readDiskInfo = function (pos) {
            var diskInfo = this.diskInfo, ident = this.readUtf(pos, 8), // check first 8 characters as characteristic
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
            var trackSizes = [], trackPosList = [], trackSizeCount = diskInfo.tracks * diskInfo.heads; // number of track sizes
            var trackPos = DiskImage.diskInfoSize;
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
        DiskImage.prototype.readTrackInfo = function (pos) {
            var trackInfoSize = DiskImage.trackInfoSize, trackInfo = this.diskInfo.trackInfo, sectorInfoList = trackInfo.sectorInfo;
            trackInfo.dataPos = pos + trackInfoSize;
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
        DiskImage.createTrackInfoAsString = function (trackInfo) {
            var sectorInfoList = trackInfo.sectorInfo;
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
        DiskImage.prototype.writeSector = function (sector, sectorData) {
            var trackInfo = this.diskInfo.trackInfo, sectorIndex = this.sectorNum2Index(sector);
            if (sectorIndex === undefined) {
                throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
            }
            var sectorInfo = this.seekSector(sectorIndex), data = this.options.data;
            if (sectorData.length !== sectorInfo.sectorSize) {
                Utils_1.Utils.console.error(this.composeError({}, "sectordata.length " + sectorData.length + " <> sectorSize " + sectorInfo.sectorSize, String(0)));
            }
            //out = this.readUtf(sectorInfo.dataPos, sectorInfo.sectorSize);
            this.options.data = data.substring(0, sectorInfo.dataPos) + sectorData + data.substring(sectorInfo.dataPos + sectorInfo.sectorSize);
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
            return this.getFormatDescriptor(format);
        };
        DiskImage.prototype.createImage = function (format) {
            var formatDescriptor = this.getFormatDescriptor(format), sectorInfoList = [], sectorSize = (0x80 << formatDescriptor.bps), // eslint-disable-line no-bitwise
            sectorInfo = {
                track: 0,
                head: 0,
                sector: 0,
                bps: formatDescriptor.bps,
                state1: 0,
                state2: 0,
                sectorSize: sectorSize,
                length: 0,
                dataPos: 0 // not needed for format
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
                sectorInfo: sectorInfoList,
                dataPos: 0,
                sectorNum2Index: {}
            }, diskInfo = {
                ident: "MV - CPCEMU Disk-File\r\nDisk-Info\r\n",
                creator: "CpcBasicTS    ",
                tracks: formatDescriptor.tracks,
                heads: formatDescriptor.heads,
                trackSize: DiskImage.trackInfoSize + formatDescriptor.spt * sectorSize,
                trackInfo: trackInfo,
                extended: false,
                trackSizes: [],
                trackPos: []
            }, emptySectorData = DiskImage.uInt8ToString(formatDescriptor.fill).repeat(sectorSize);
            for (var i = 0; i < trackInfo.spt; i += 1) {
                var sectorInfoClone = __assign({}, sectorInfo);
                sectorInfoClone.sector = formatDescriptor.firstSector + i;
                sectorInfoList.push(sectorInfoClone);
            }
            var image = DiskImage.createDiskInfoAsString(diskInfo);
            for (var track = 0; track < formatDescriptor.tracks; track += 1) {
                for (var head = 0; head < formatDescriptor.heads; head += 1) {
                    trackInfo.track = track;
                    trackInfo.head = head;
                    for (var sector = 0; sector < trackInfo.spt; sector += 1) {
                        sectorInfoList[sector].track = track;
                        sectorInfoList[sector].head = head;
                    }
                    var trackAsString = DiskImage.createTrackInfoAsString(trackInfo);
                    image += trackAsString;
                    for (var sector = 0; sector < formatDescriptor.spt; sector += 1) {
                        image += emptySectorData;
                    }
                }
            }
            this.diskInfo = diskInfo;
            this.format = formatDescriptor;
            return image;
        };
        DiskImage.prototype.formatImage = function (format) {
            var image = this.createImage(format);
            this.reset(); // reset disk info and format (TTT)
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
        DiskImage.fnAddHighBit7 = function (str, setBit7) {
            var out = "";
            for (var i = 0; i < str.length; i += 1) {
                var char = str.charCodeAt(i);
                out += String.fromCharCode(setBit7[i] ? (char | 0x80) : char); // eslint-disable-line no-bitwise
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
        DiskImage.createDirectoryExtentAsString = function (extent) {
            var extWithFlags = DiskImage.fnAddHighBit7(extent.ext, [
                extent.readOnly,
                extent.system,
                extent.backup
            ]);
            var extentString = DiskImage.uInt8ToString(extent.user)
                + extent.name
                + extWithFlags
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
        /*
        private writeDirectoryExtents(extents: ExtentEntry[], pos: number, endPos: number) {
            let extentString = "";
    
            for (let i = 0; i < extents.length; i += 1) {
                extentString += DiskImage.createDirectoryExtentAsString(extents[i]);
            }
    
            const data = this.options.data;
    
            // replace data slice with extentString (length should not change)
            this.options.data = data.substring(0, pos) + extentString + data.substring(endPos);
            // TODO: use writeSector!
        }
        */
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
            var format = this.format, spt = format.spt, blockSectors = format.bls / 512, // usually 2
            logSec = block * blockSectors, // directory is in block 0-1
            pos = {
                track: Math.floor(logSec / spt) + format.off,
                head: 0,
                sector: (logSec % spt) + format.firstSector
            };
            return pos;
        };
        DiskImage.prototype.readAllDirectoryExtents = function (extents) {
            var directorySectors = 4, // could be determined from al0,al1
            format = this.format, off = format.off, firstSector = format.firstSector;
            this.seekTrack(off, 0);
            for (var i = 0; i < directorySectors; i += 1) {
                var sectorIndex = this.sectorNum2Index(firstSector + i);
                if (sectorIndex === undefined) {
                    throw this.composeError(Error(), "Cannot read directory at track " + off + " sector", String(firstSector));
                }
                var sectorInfo = this.seekSector(sectorIndex);
                this.readDirectoryExtents(extents, sectorInfo.dataPos, sectorInfo.dataPos + sectorInfo.sectorSize);
            }
            return extents;
        };
        DiskImage.prototype.writeAllDirectoryExtents = function (extents) {
            var directoryBlocks = 2, // could be determined from al0,al1
            extentsPerBlock = extents.length / directoryBlocks; // TODO: compute
            //this.seekTrack(off, 0);
            for (var i = 0; i < directoryBlocks; i += 1) {
                //const sectorIndex = this.sectorNum2Index(firstSector + i);
                var blockData = DiskImage.createSeveralDirectoryExtentsAsString(extents, i * extentsPerBlock, (i + 1) * extentsPerBlock);
                this.writeBlock(i, blockData);
            }
        };
        /*
        private writeAllDirectoryExtents(extents: ExtentEntry[]) {
            const directorySectors = 4, // could be determined from al0,al1
                format = this.format,
                off = format.off,
                firstSector = format.firstSector;
    
            this.seekTrack(off, 0);
    
            for (let i = 0; i < directorySectors; i += 1) {
                const sectorIndex = this.sectorNum2Index(firstSector + i);
    
                if (sectorIndex === undefined) {
                    throw this.composeError(Error(), "Cannot write directory at track " + off + " sector", String(firstSector));
                }
                const sectorInfo = this.seekSector(sectorIndex);
    
                //this.writeDirectoryExtents(extents, sectorInfo.dataPos, sectorInfo.dataPos + sectorInfo.sectorSize);
            }
        }
        */
        DiskImage.prototype.readDirectory = function () {
            var format = this.determineFormat(), extents = [];
            this.format = format;
            this.readAllDirectoryExtents(extents);
            return DiskImage.prepareDirectoryList(extents, format.fill);
        };
        /*
        writeDirectory(directoryList: DirectoryListType) {
        }
        */
        DiskImage.prototype.nextSector = function (pos) {
            var format = this.format;
            pos.sector += 1;
            if (pos.sector >= format.firstSector + format.spt) {
                pos.track += 1;
                pos.sector = format.firstSector;
            }
        };
        DiskImage.prototype.readBlock = function (block) {
            var diskInfo = this.diskInfo, blockSectors = this.format.bls / 512, // usually 2
            pos = this.convertBlock2Sector(block);
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
        DiskImage.prototype.writeBlock = function (block, blockData) {
            var diskInfo = this.diskInfo, format = this.format, blockSectors = format.bls / 512, // usually 2
            sectorSize = (0x80 << format.bps), // eslint-disable-line no-bitwise
            pos = this.convertBlock2Sector(block);
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
                this.seekTrack(pos.track, pos.head);
                var sectorData = blockData.substring(i * sectorSize, (i + 1) * sectorSize);
                this.writeSector(pos.sector, sectorData); //out += this.readSector(pos.sector);
                this.nextSector(pos);
            }
        };
        DiskImage.prototype.readExtents = function (fileExtents) {
            var recPerBlock = this.format.bls / 128; // usually 8
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
        DiskImage.getFreeExtents = function (extents, fill) {
            var freeExtents = [];
            for (var i = 0; i < extents.length; i += 1) {
                if (extents[i].user === fill) {
                    freeExtents.push(i);
                }
            }
            return freeExtents;
        };
        /*
        // http://bytes.com/groups/cpp/546879-reverse-bit-order
        private static reverseBitOrder8(num: number) {
            num = (num & 0x0F) << 4 | (num & 0xF0) >> 4; // eslint-disable-line no-bitwise
            num = (num & 0x33) << 2 | (num & 0xCC) >> 2; // eslint-disable-line no-bitwise
            num = (num & 0x55) << 1 | (num & 0xAA) >> 1; // eslint-disable-line no-bitwise
            return num;
        }
        */
        DiskImage.getBlockMask = function (extents, fill, dsm, al0, al1) {
            var blockMask = [];
            //al01 = al0 | (al1 << 8); // eslint-disable-line no-bitwise
            for (var i = 0; i < dsm - 1; i += 1) {
                blockMask[i] = false;
            }
            // mark reserved blocks
            /*
            let mask1 = 0x8000;
    
            for (let i = 0; i < 16; i += 1) {
                if (al01 & mask1) { // eslint-disable-line no-bitwise
                    blockMask[i] = true; // mark reserved block
                }
                mask1 >>= 1; // eslint-disable-line no-bitwise
            }
            */
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
            name1 = name1.toUpperCase().padEnd(8, " ");
            ext1 = ext1.toUpperCase().padEnd(3, " ");
            return [name1, ext1]; // eslint-disable-line array-element-newline
        };
        DiskImage.prototype.writeFile = function (filename, data) {
            var format = this.format, extents = [];
            this.readAllDirectoryExtents(extents);
            var fill = format.fill, freeExtents = DiskImage.getFreeExtents(extents, format.fill), sectors = (format.tracks - format.off) * format.spt, ssize = 0x80 << format.bps, // eslint-disable-line no-bitwise
            dsm = ((sectors * ssize) / format.bls) | 0, // eslint-disable-line no-bitwise
            // DSM: total size of disc in blocks excluding any reserved tracks
            al0 = format.al0, al1 = format.al1, blockMask = DiskImage.getBlockMask(extents, fill, dsm, al0, al1), freeBlocks = DiskImage.getFreeBlocks(blockMask, dsm);
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
            fileSize = data.length, bls = format.bls, requiredBlocks = ((fileSize + bls - 1) / bls) | 0; // eslint-disable-line no-bitwise
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
            //const newBlocks = [];
            //my $fh = _file_open('<'. $fname) || (warn("WARNING: $!: '$fname'\n"), return);
            var size = fileSize, extent, //my $ext_r = undef();
            extentCnt = 0, blockCnt = 0;
            while (size > 0) {
                if (!extent || (blockCnt >= 16)) {
                    var records = ((size + 0x80 - 1) / 0x80) | 0; // eslint-disable-line no-bitwise
                    extent = extents[freeExtents[extentCnt]];
                    extent.user = 0;
                    extent.name = name1;
                    extent.ext = ext1;
                    extent.readOnly = false;
                    extent.system = false;
                    extent.backup = false;
                    extent.extent = extentCnt;
                    extent.lastRecBytes = 0; // ($size >= 0x80) ? 0 : $size;
                    extent.extentHi = 0;
                    extent.records = (records > 0x80) ? 0x80 : records;
                    //$ext_r->{'ftype_flags'} = ''; # R S B (RO SYS bak?)
                    extent.blocks.length = 0;
                    for (var i = 0; i < 16; i += 1) {
                        extent.blocks[i] = 0;
                    }
                    extentCnt += 1;
                    blockCnt = 0;
                }
                var thisSize = (size > bls) ? bls : size;
                var dataChunk = data.substring(fileSize - size, fileSize - size + thisSize); //my $data_r = _fread_blk($fh, $this_size) || return;
                if (thisSize < bls) {
                    dataChunk += DiskImage.uInt8ToString(0x1a); // EOF (maybe ASCII)
                    dataChunk += DiskImage.uInt8ToString(0).repeat(bls - thisSize - 1); // fill up last block with 0 (or fill?)
                }
                var block = freeBlocks[(extentCnt - 1) * 16 + blockCnt];
                this.writeBlock(block, dataChunk); //$self->write_block($block, $data_r) || return;
                extent.blocks[blockCnt] = block;
                blockCnt += 1;
                size -= thisSize;
            }
            this.writeAllDirectoryExtents(extents);
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