"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const electron_1 = require("electron");
class CrosshairOverlay {
    constructor() {
        this.window = null;
        this.size = 40;
        this.hue = 0;
    }
    open(imagePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield electron_1.app.whenReady();
            if (!this.window) {
                this.window = new electron_1.BrowserWindow({
                    width: this.size,
                    height: this.size,
                    frame: false,
                    transparent: true,
                    resizable: false,
                    movable: false,
                    alwaysOnTop: true,
                    focusable: false,
                    skipTaskbar: true,
                    hasShadow: false,
                    show: false,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false
                    },
                });
                this.window.loadFile('./public/crosshair.html');
                const { width, height } = electron_1.screen.getPrimaryDisplay().size;
                this.window.setBounds({
                    x: Math.round(width / 2 - (this.size / 2)),
                    y: Math.round(height / 2 - (this.size / 2)),
                    width: this.size,
                    height: this.size,
                });
                this.window.setIgnoreMouseEvents(true);
                this.window.once('ready-to-show', () => {
                    var _a;
                    console.log('CrosshairOverlay window is ready to show');
                    (_a = this.window) === null || _a === void 0 ? void 0 : _a.show();
                });
                this.window.webContents.on('did-finish-load', () => {
                    var _a;
                    (_a = this.window) === null || _a === void 0 ? void 0 : _a.webContents.send('load-crosshair', imagePath);
                });
                this.window.on('closed', () => {
                    this.window = null;
                });
                electron_1.ipcMain.on('load-crosshair', event => {
                    event.reply('crosshair-loaded', imagePath);
                });
            }
        });
    }
    applyHue() {
        var _a;
        (_a = this.window) === null || _a === void 0 ? void 0 : _a.webContents.send('load-hue', this.hue);
    }
    setImage(imagePath) {
        if (this.window) {
            this.window.webContents.send('load-crosshair', imagePath);
        }
    }
    close() {
        if (this.window) {
            this.window.destroy();
        }
    }
    show() {
        if (this.window) {
            console.log('CrosshairOverlay show called');
            this.window.show();
        }
    }
    hide() {
        if (this.window) {
            console.log('CrosshairOverlay hide called');
            this.window.hide();
        }
    }
}
module.exports = CrosshairOverlay;
