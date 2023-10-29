// FileSelect.ts - FileSelect
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
define(["require", "exports", "./Utils", "./View"], function (require, exports, Utils_1, View_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileSelect = void 0;
    var FileSelect = /** @class */ (function () {
        function FileSelect(options) {
            this.fileIndex = 0;
            this.imported = []; // imported file names
            this.fnOnLoadHandler = this.fnOnLoad.bind(this);
            this.fnOnErrorHandler = this.fnOnError.bind(this);
            this.fnOnFileSelectHandler = this.fnOnFileSelect.bind(this);
            this.fnEndOfImport = options.fnEndOfImport;
            this.fnLoad2 = options.fnLoad2;
        }
        FileSelect.prototype.fnReadNextFile = function (reader) {
            if (this.files && this.fileIndex < this.files.length) {
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
            if (!this.file) {
                Utils_1.Utils.console.error("fnOnLoad: Programming error: No file");
                return;
            }
            var file = this.file, name = file.name, reader = event.target;
            var data = (reader && reader.result) || null, type = file.type;
            if (type === "application/x-zip-compressed" && data instanceof ArrayBuffer) {
                type = "Z";
                this.fnLoad2(new Uint8Array(data), name, type, this.imported);
            }
            else if (typeof data === "string") {
                if (type === "text/plain") { // "text/plain"
                    type = "A";
                }
                else if (data.indexOf("data:") === 0) {
                    // check for meta info in data: data:application/octet-stream;base64, or: data:text/javascript;base64,
                    var index = data.indexOf(",");
                    if (index >= 0) {
                        var info1 = data.substring(0, index);
                        // remove meta prefix
                        data = data.substring(index + 1);
                        if (info1.indexOf("base64") >= 0) {
                            data = Utils_1.Utils.atob(data); // decode base64
                        }
                        if (info1.indexOf("text/") >= 0) {
                            type = "A";
                        }
                    }
                }
                this.fnLoad2(data, name, type, this.imported);
            }
            else {
                Utils_1.Utils.console.warn("Error loading file", name, "with type", type, " unexpected data:", data);
            }
            if (reader) {
                this.fnReadNextFile(reader);
            }
        };
        FileSelect.prototype.fnOnError = function (event) {
            var reader = event.target, filename = (this.file && this.file.name) || "unknown";
            var msg = "fnOnError: " + filename;
            if (reader && reader.error) {
                msg += ": " + String(reader.error);
            }
            Utils_1.Utils.console.error(msg);
            if (reader) {
                this.fnReadNextFile(reader);
            }
        };
        // https://stackoverflow.com/questions/10261989/html5-javascript-drag-and-drop-file-from-external-window-windows-explorer
        // https://www.w3.org/TR/file-upload/#dfn-filereader
        FileSelect.prototype.fnOnFileSelect = function (event) {
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
                var reader = new window.FileReader();
                reader.onerror = this.fnOnErrorHandler;
                reader.onload = this.fnOnLoadHandler;
                this.fnReadNextFile(reader);
            }
            else {
                Utils_1.Utils.console.warn("fnHandleFileSelect: FileReader API not supported.");
            }
        };
        //TODO: can we use View.attachEventHandler() somehow?
        FileSelect.prototype.addFileSelectHandler = function (element, type) {
            element.addEventListener(type, this.fnOnFileSelectHandler, false);
        };
        return FileSelect;
    }());
    exports.FileSelect = FileSelect;
});
//# sourceMappingURL=FileSelect.js.map