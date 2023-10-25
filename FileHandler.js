// FileHandler.ts - FileHandler
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./DiskImage", "./ZipFile"], function (require, exports, Utils_1, DiskImage_1, ZipFile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileHandler = void 0;
    var FileHandler = /** @class */ (function () {
        function FileHandler(options) {
            this.adaptFilename = {};
            this.updateStorageDatabase = {};
            this.outputError = {};
            this.adaptFilename = options.adaptFilename;
            this.updateStorageDatabase = options.updateStorageDatabase;
            this.outputError = options.outputError;
        }
        FileHandler.fnLocalStorageName = function (name, defaultExtension) {
            // modify name so we do not clash with localstorage methods/properites
            if (name.indexOf(".") < 0) { // no dot inside name?
                name += "." + (defaultExtension || ""); // append dot or default extension
            }
            return name;
        };
        FileHandler.createMinimalAmsdosHeader = function (type, start, length) {
            return {
                typeString: type,
                start: start,
                length: length
            };
        };
        FileHandler.joinMeta = function (meta) {
            return [
                FileHandler.metaIdent,
                meta.typeString,
                meta.start,
                meta.length,
                meta.entry
            ].join(";");
        };
        // starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF
        FileHandler.prototype.processZipFile = function (uint8Array, name, imported) {
            var zip;
            try {
                zip = new ZipFile_1.ZipFile(uint8Array, name); // rather data
            }
            catch (e) {
                Utils_1.Utils.console.error(e);
                if (e instanceof Error) {
                    this.outputError(e, true);
                }
            }
            if (zip) {
                var zipDirectory = zip.getZipDirectory(), entries = Object.keys(zipDirectory);
                for (var i = 0; i < entries.length; i += 1) {
                    var name2 = entries[i];
                    var data2 = void 0;
                    try {
                        data2 = zip.readData(name2);
                    }
                    catch (e) {
                        Utils_1.Utils.console.error(e);
                        if (e instanceof Error) { // eslint-disable-line max-depth
                            this.outputError(e, true);
                        }
                    }
                    if (data2) {
                        this.fnLoad2(data2, name2, "", imported); // type not known but without meta
                    }
                }
            }
        };
        FileHandler.prototype.processDskFile = function (data, name, imported) {
            try {
                var dsk = new DiskImage_1.DiskImage({
                    data: data,
                    diskName: name
                }), dir = dsk.readDirectory(), diskFiles = Object.keys(dir);
                for (var i = 0; i < diskFiles.length; i += 1) {
                    var fileName = diskFiles[i];
                    try { // eslint-disable-line max-depth
                        data = dsk.readFile(dir[fileName]);
                        this.fnLoad2(data, fileName, "", imported); // recursive
                    }
                    catch (e) {
                        Utils_1.Utils.console.error(e);
                        if (e instanceof Error) { // eslint-disable-line max-depth
                            this.outputError(e, true);
                        }
                    }
                }
            }
            catch (e) {
                Utils_1.Utils.console.error(e);
                if (e instanceof Error) {
                    this.outputError(e, true);
                }
            }
        };
        FileHandler.prototype.fnLoad2 = function (data, name, type, imported) {
            if (data instanceof Uint8Array) { // FileSelect filereader zip file?
                this.processZipFile(data, name, imported);
                return;
            }
            var header, storageName = this.adaptFilename(name, "FILE");
            storageName = FileHandler.fnLocalStorageName(storageName);
            if (type === "") { // detetermine type
                header = DiskImage_1.DiskImage.parseAmsdosHeader(data);
                if (header) {
                    type = "H"; // with header
                    data = data.substring(0x80); // remove header
                }
                else if (FileHandler.reRegExpIsText.test(data)) {
                    type = "A";
                }
                else if (DiskImage_1.DiskImage.testDiskIdent(data.substring(0, 8))) { // disk image file?
                    type = "X";
                }
            }
            switch (type) {
                case "A": // "text/plain"
                case "B": // binary?
                    header = FileHandler.createMinimalAmsdosHeader(type, 0, data.length);
                    break;
                case "Z": // zip file?
                    this.processZipFile(Utils_1.Utils.string2Uint8Array(data), name, imported);
                    break;
                case "X": // dsk file?
                    this.processDskFile(data, name, imported);
                    break;
                case "H": // with header?
                    break;
                default:
                    Utils_1.Utils.console.warn("fnLoad2: " + name + ": Unknown file type: " + type + ", assuming B");
                    header = FileHandler.createMinimalAmsdosHeader("B", 0, data.length);
                    break;
            }
            if (header) {
                var meta = FileHandler.joinMeta(header);
                try {
                    Utils_1.Utils.localStorage.setItem(storageName, meta + "," + data);
                    this.updateStorageDatabase("set", storageName);
                    Utils_1.Utils.console.log("fnOnLoad: file: " + storageName + " meta: " + meta + " imported");
                    imported.push(name);
                }
                catch (e) { // maybe quota exceeded
                    Utils_1.Utils.console.error(e);
                    if (e instanceof Error) {
                        if (e.name === "QuotaExceededError") {
                            e.shortMessage = storageName + ": Quota exceeded";
                        }
                        this.outputError(e, true);
                    }
                }
            }
        };
        FileHandler.metaIdent = "CPCBasic";
        FileHandler.reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/); // eslint-disable-line no-control-regex
        return FileHandler;
    }());
    exports.FileHandler = FileHandler;
});
//# sourceMappingURL=FileHandler.js.map