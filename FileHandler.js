// FileHandler.ts - FileHandler
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
import { Utils } from "./Utils";
import { DiskImage } from "./DiskImage";
import { Snapshot } from "./Snapshot";
import { ZipFile } from "./ZipFile";
var FileHandler = /** @class */ (function () {
    function FileHandler(options) {
        this.processFileImports = true;
        this.options = {};
        this.setOptions(options);
    }
    FileHandler.prototype.setOptions = function (options) {
        Object.assign(this.options, options);
    };
    FileHandler.prototype.getDiskImage = function () {
        if (!this.diskImage) {
            this.diskImage = new DiskImage({
                data: "" // will be set later
            });
        }
        return this.diskImage;
    };
    FileHandler.fnLocalStorageName = function (name, defaultExtension) {
        // modify name so we do not clash with localstorage methods/properites
        if (name.indexOf(".") < 0) { // no dot inside name?
            name += "." + (defaultExtension || ""); // append dot or default extension
        }
        return name;
    };
    FileHandler.getMetaIdent = function () {
        return FileHandler.metaIdent;
    };
    FileHandler.joinMeta = function (meta) {
        return [
            FileHandler.metaIdent,
            meta.typeString,
            meta.start,
            meta.length,
            meta.entry,
            meta.encoding
        ].join(";");
    };
    // starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF
    FileHandler.prototype.processDskFile = function (data, name, imported) {
        try {
            var dsk = this.getDiskImage();
            dsk.setOptions({
                data: data,
                diskName: name
            });
            var dir = dsk.readDirectory(), diskFiles = Object.keys(dir);
            for (var i = 0; i < diskFiles.length; i += 1) {
                var fileName = diskFiles[i];
                try { // eslint-disable-line max-depth
                    data = dsk.readFile(dir[fileName]);
                    this.fnLoad2(data, fileName, "", imported); // recursive
                }
                catch (e) {
                    Utils.console.error(e);
                    if (e instanceof Error) { // eslint-disable-line max-depth
                        this.options.outputError(e, true);
                    }
                }
            }
        }
        catch (e) {
            Utils.console.error(e);
            if (e instanceof Error) {
                this.options.outputError(e, true);
            }
        }
    };
    FileHandler.prototype.processZipFile = function (uint8Array, name, imported) {
        var zip;
        try {
            zip = new ZipFile({
                data: uint8Array, // rather data
                zipName: name
            });
        }
        catch (e) {
            Utils.console.error(e);
            if (e instanceof Error) {
                this.options.outputError(e, true);
            }
        }
        if (zip) {
            var zipDirectory = zip.getZipDirectory(), entries = Object.keys(zipDirectory);
            for (var i = 0; i < entries.length; i += 1) {
                var name2 = entries[i];
                if (name2.startsWith("__MACOSX/")) { // MacOS X creates some extra folder in ZIP files
                    Utils.console.log("processZipFile: Ignoring file:", name2);
                }
                else {
                    var data2 = void 0;
                    try {
                        data2 = zip.readData(name2);
                    }
                    catch (e) {
                        Utils.console.error(e);
                        if (e instanceof Error) { // eslint-disable-line max-depth
                            this.options.outputError(e, true);
                        }
                    }
                    if (data2) {
                        this.fnLoad2(data2, name2, "", imported); // type not known but without meta
                    }
                }
            }
        }
    };
    FileHandler.prototype.fnLoad2 = function (data, name, type, imported) {
        var header;
        if (type === "" && !(data instanceof Uint8Array)) { // detetermine type
            header = DiskImage.parseAmsdosHeader(data);
            if (header) {
                type = "H"; // with header
                data = data.substring(0x80); // remove header
            }
            else if (FileHandler.reRegExpIsText.test(data)) {
                type = "A";
            }
            else if (Snapshot.testSnapIdent(data.substring(0, 8))) { // snapshot file?
                type = "S";
            }
            else if (DiskImage.testDiskIdent(data.substring(0, 8))) { // disk image file?
                type = "X";
            }
        }
        switch (type) {
            case "A": // "text/plain"
            case "B": // binary?
                header = DiskImage.createAmsdosHeader({
                    typeString: type,
                    length: data.length
                });
                break;
            case "H": // with header?
                break;
            case "S": // sna file?
                header = DiskImage.createAmsdosHeader({
                    typeString: type,
                    length: data.length
                }); // currently we store it
                break;
            case "X": // dsk file?
                if (this.processFileImports) {
                    this.processDskFile(data, name, imported); // we know data is string
                }
                else {
                    header = DiskImage.createAmsdosHeader({
                        typeString: type,
                        length: data.length
                    });
                }
                break;
            case "Z": // zip file?
                if (this.processFileImports) {
                    this.processZipFile(data instanceof Uint8Array ? data : Utils.string2Uint8Array(data), name, imported);
                }
                else {
                    header = DiskImage.createAmsdosHeader({
                        typeString: type,
                        length: data.length
                    });
                }
                break;
            default:
                Utils.console.warn("fnLoad2: " + name + ": Unknown file type: " + type + ", assuming B");
                header = DiskImage.createAmsdosHeader({
                    typeString: "B",
                    length: data.length
                });
                break;
        }
        if (header) { // do we have a header? (means we should store it as a file in storage...)
            var storageName = FileHandler.fnLocalStorageName(this.options.adaptFilename(name, "FILE")), meta = FileHandler.joinMeta(header), dataAsString = data instanceof Uint8Array ? Utils.uint8Array2string(data) : data;
            try {
                Utils.localStorage.setItem(storageName, meta + "," + dataAsString);
                this.options.updateStorageDatabase("set", storageName);
                Utils.console.log("fnOnLoad: file: " + storageName + " meta: " + meta + " imported");
                imported.push(name);
            }
            catch (e) { // maybe quota exceeded
                Utils.console.error(e);
                if (e instanceof Error) {
                    if (e.name === "QuotaExceededError") {
                        e.shortMessage = storageName + ": Quota exceeded";
                    }
                    this.options.outputError(e, true);
                }
            }
        }
    };
    FileHandler.metaIdent = "CPCBasic";
    FileHandler.reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/); // eslint-disable-line no-control-regex
    return FileHandler;
}());
export { FileHandler };
//# sourceMappingURL=FileHandler.js.map