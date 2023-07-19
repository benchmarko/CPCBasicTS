// FileSelect.ts - FileSelect
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./ZipFile", "./View"], function (require, exports, Utils_1, ZipFile_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileSelect = void 0;
    var FileSelect = /** @class */ (function () {
        function FileSelect(options) {
            this.fnEndOfImport = {};
            this.outputError = {};
            this.fnLoad2 = {};
            this.files = {}; // = dataTransfer ? dataTransfer.files : ((event.target as any).files as FileList), // dataTransfer for drag&drop, target.files for file input
            this.fileIndex = 0;
            this.imported = []; // imported file names
            this.file = {}; // current file
            this.fnEndOfImport = options.fnEndOfImport;
            this.outputError = options.outputError;
            this.fnLoad2 = options.fnLoad2;
        }
        FileSelect.prototype.fnReadNextFile = function (reader) {
            if (this.fileIndex < this.files.length) {
                var file = this.files[this.fileIndex];
                this.fileIndex += 1;
                var lastModified = file.lastModified, lastModifiedDate = lastModified ? new Date(lastModified) : file.lastModifiedDate, // lastModifiedDate deprecated, but for old IE
                text = file.name + " " + (file.type || "n/a") + " " + file.size + " " + (lastModifiedDate ? lastModifiedDate.toLocaleDateString() : "n/a");
                Utils_1.Utils.console.log(text);
                if (file.type === "text/plain") {
                    reader.readAsText(file);
                }
                else if (file.type === "application/x-zip-compressed") {
                    reader.readAsArrayBuffer(file);
                }
                else {
                    reader.readAsDataURL(file);
                }
                this.file = file;
            }
            else {
                this.fnEndOfImport(this.imported);
            }
        };
        FileSelect.prototype.fnOnLoad = function (event) {
            var reader = event.target, data = (reader && reader.result) || null, file = this.file, name = file.name, type = file.type;
            if (type === "application/x-zip-compressed" && data instanceof ArrayBuffer) {
                var zip = void 0;
                try {
                    zip = new ZipFile_1.ZipFile(new Uint8Array(data), name); // rather data
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
                            this.fnLoad2(data2, name2, type, this.imported);
                        }
                    }
                }
            }
            else if (typeof data === "string") {
                this.fnLoad2(data, name, type, this.imported);
            }
            else {
                Utils_1.Utils.console.warn("Error loading file", name, "with type", type, " unexpected data:", data);
            }
            if (reader) {
                this.fnReadNextFile(reader);
            }
        };
        FileSelect.prototype.fnErrorHandler = function (event, file) {
            var reader = event.target;
            var msg = "fnErrorHandler: Error reading file " + file.name;
            if (reader && reader.error !== null) {
                if (reader.error.NOT_FOUND_ERR) {
                    msg += ": File not found";
                }
                else if (reader.error.ABORT_ERR) {
                    msg = ""; // nothing
                }
            }
            if (msg) {
                Utils_1.Utils.console.warn(msg);
            }
            if (reader) {
                this.fnReadNextFile(reader);
            }
        };
        // https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
        // https://www.w3.org/TR/file-upload/#dfn-filereader
        FileSelect.prototype.fnHandleFileSelect = function (event) {
            event.stopPropagation();
            event.preventDefault();
            var dataTransfer = event.dataTransfer, files = dataTransfer ? dataTransfer.files : View_1.View.getEventTarget(event).files; // dataTransfer for drag&drop, target.files for file input
            if (!files || !files.length) {
                Utils_1.Utils.console.error("fnHandleFileSelect: No files!");
                return;
            }
            this.files = files;
            this.fileIndex = 0;
            this.imported.length = 0;
            if (window.FileReader) {
                var reader = new FileReader();
                reader.onerror = this.fnErrorHandler.bind(this);
                reader.onload = this.fnOnLoad.bind(this);
                this.fnReadNextFile(reader);
            }
            else {
                Utils_1.Utils.console.warn("fnHandleFileSelect: FileReader API not supported.");
            }
        };
        //TODO: can we use View.attachEventHandler() somehow?
        FileSelect.prototype.addFileSelectHandler = function (element, type) {
            element.addEventListener(type, this.fnHandleFileSelect.bind(this), false);
        };
        return FileSelect;
    }());
    exports.FileSelect = FileSelect;
});
//# sourceMappingURL=FileSelect.js.map