// FileHandler.ts - FileHandler
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./DiskImage"], function (require, exports, Utils_1, DiskImage_1) {
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
        FileHandler.prototype.fnLoad2 = function (data, name, type, imported) {
            var header, storageName = this.adaptFilename(name, "FILE");
            storageName = FileHandler.fnLocalStorageName(storageName);
            if (type === "text/plain") {
                header = FileHandler.createMinimalAmsdosHeader("A", 0, data.length);
            }
            else {
                if (type === "application/x-zip-compressed" || type === "cpcBasic/binary") { // are we a file inside zip?
                    // empty
                }
                else { // e.g. "data:application/octet-stream;base64,..."
                    var index = data.indexOf(",");
                    if (index >= 0) {
                        var info1 = data.substring(0, index);
                        data = data.substring(index + 1); // remove meta prefix
                        if (info1.indexOf("base64") >= 0) {
                            data = Utils_1.Utils.atob(data); // decode base64
                        }
                    }
                }
                header = DiskImage_1.DiskImage.parseAmsdosHeader(data);
                if (header) {
                    data = data.substring(0x80); // remove header
                }
                else if (FileHandler.reRegExpIsText.test(data)) {
                    header = FileHandler.createMinimalAmsdosHeader("A", 0, data.length);
                }
                else if (DiskImage_1.DiskImage.testDiskIdent(data.substring(0, 8))) { // disk image file?
                    try {
                        var dsk = new DiskImage_1.DiskImage({
                            data: data,
                            diskName: name
                        }), dir = dsk.readDirectory(), diskFiles = Object.keys(dir);
                        for (var i = 0; i < diskFiles.length; i += 1) {
                            var fileName = diskFiles[i];
                            try { // eslint-disable-line max-depth
                                data = dsk.readFile(dir[fileName]);
                                this.fnLoad2(data, fileName, "cpcBasic/binary", imported); // recursive
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
                    header = undefined; // ignore dsk file
                }
                else { // binary
                    header = FileHandler.createMinimalAmsdosHeader("B", 0, data.length);
                }
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