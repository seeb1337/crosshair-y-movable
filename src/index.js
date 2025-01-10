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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const openurl_1 = __importDefault(require("openurl"));
const child_process_1 = __importDefault(require("child_process"));
const CrosshairOverlay = require("./crosshair");
let window;
const crosshair = new CrosshairOverlay();
const CROSSHAIRS_DIR = path_1.default.join(electron_1.app.getAppPath(), 'public', 'crosshairs');
electron_1.app.on('ready', () => {
    window = new electron_1.BrowserWindow({
        width: 800,
        height: 500,
        minWidth: 567,
        minHeight: 393,
        autoHideMenuBar: true,
        icon: path_1.default.join(electron_1.app.getAppPath(), '..', '/icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    window.setMenu(null);
    window.loadFile(path_1.default.join(electron_1.app.getAppPath(), 'public', 'index.html'));
    window.on('closed', () => {
        crosshair.close();
    });
});
let builtInCrosshairs;
electron_1.ipcMain.on('built-in-crosshairs', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = yield promises_1.default.readdir(CROSSHAIRS_DIR);
        const pngFiles = files.filter(file => path_1.default.extname(file) === '.png');
        event.reply('built-in-crosshairs-response', pngFiles);
        builtInCrosshairs = pngFiles;
    }
    catch (err) {
        console.log(err);
    }
}));
let customCrosshairsDir;
let customCrosshair;
electron_1.ipcMain.on('onload-crosshair-directory', (event, directory) => {
    customCrosshairsDir = directory;
    if (customCrosshairsDir && customCrosshair) {
        const selectedCrosshair = getSelectedCrosshairPath();
        crosshair.setImage(selectedCrosshair || '');
    }
});
let config;
function getSelectedCrosshairPath() {
    if (customCrosshair && customCrosshairsDir) {
        return path_1.default.join(customCrosshairsDir, customCrosshair);
    }
    else {
        if (process.platform === 'linux') {
            return path_1.default.join(CROSSHAIRS_DIR, '..', 'public', 'crosshairs', config.crosshair);
        }
        else if (process.platform === 'win32') {
            return path_1.default.join(CROSSHAIRS_DIR, '..', 'crosshairs', config.crosshair);
        }
    }
}
function getSelectedCrosshairFilename() {
    if (customCrosshair && customCrosshairsDir) {
        return customCrosshair;
    }
    else {
        return config.crosshair;
    }
}
electron_1.ipcMain.on('change-custom-crosshair', (event, name) => {
    customCrosshair = name;
    if (customCrosshairsDir && customCrosshair) {
        const selectedCrosshair = getSelectedCrosshairPath();
        crosshair.setImage(selectedCrosshair || '');
    }
});
electron_1.ipcMain.on('config', (event, newConfig) => {
    config = newConfig;
    crosshair.size = +config.size;
    crosshair.opacity = +config.opacity;
    const selectedCrosshair = getSelectedCrosshairPath();
    crosshair.setImage(selectedCrosshair || '');
    crosshair.applyOpacity();
});
electron_1.ipcMain.on('change-hue', (event, hue) => {
    crosshair.hue = +hue;
    crosshair.applyHue();
});
electron_1.ipcMain.on('change-opacity', (event, opacity) => {
    crosshair.opacity = +opacity;
    crosshair.applyOpacity();
});
electron_1.ipcMain.on('change-crosshair', (event, name) => {
    var _a;
    config.crosshair = name;
    customCrosshair = null;
    const crosshairFilename = getSelectedCrosshairFilename();
    (_a = crosshair.window) === null || _a === void 0 ? void 0 : _a.webContents.send('crosshair-loaded', crosshairFilename);
});
electron_1.ipcMain.on('error', (event, error) => {
    console.log(error);
});
electron_1.ipcMain.on('destroy-crosshair', () => {
    crosshair.close();
});
electron_1.ipcMain.on('show-crosshair', () => {
    const selectedCrosshair = getSelectedCrosshairPath();
    crosshair.open(selectedCrosshair || '');
    crosshair.show();
});
electron_1.ipcMain.on('hide-crosshair', () => {
    crosshair.hide();
});
electron_1.ipcMain.on('open-folder-dialog', (event) => __awaiter(void 0, void 0, void 0, function* () {
    const selectedFolder = yield electron_1.dialog.showOpenDialog({
        title: 'Select Directory',
        properties: ['openDirectory']
    });
    if (!selectedFolder.canceled) {
        event.reply('custom-crosshairs-directory', selectedFolder.filePaths[0]);
    }
}));
electron_1.ipcMain.on('open-crosshair-directory', (event, directory) => {
    if (process.platform === 'linux') {
        child_process_1.default.exec(`xdg-open "${directory}"`);
    }
    else if (process.platform === 'win32') {
        child_process_1.default.exec(`explorer.exe "${directory}"`);
    }
    else if (process.platform === 'darwin') {
        child_process_1.default.exec(`open "${directory}"`);
    }
});
electron_1.ipcMain.on('refresh-crosshairs', (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (customCrosshairsDir) {
            const files = yield promises_1.default.readdir(customCrosshairsDir);
            const pngFiles = files.filter(file => path_1.default.extname(file) === '.png');
            event.reply('custom-crosshairs-response', pngFiles);
        }
        else {
            console.log('No directory selected');
            event.reply('custom-crosshairs-response-fail');
        }
    }
    catch (err) {
        console.log(err);
    }
}));
electron_1.ipcMain.on('about-request', (event) => __awaiter(void 0, void 0, void 0, function* () {
    const pkgPath = path_1.default.join(electron_1.app.getAppPath(), 'package.json');
    try {
        const pkg = yield promises_1.default.readFile(pkgPath, 'utf-8');
        const pkgJson = JSON.parse(pkg);
        event.reply('about-response', pkgJson);
    }
    catch (err) {
        console.error('Failed to read package.json:', err);
        event.reply('about-response', { error: 'Failed to read package.json' });
    }
}));
electron_1.ipcMain.on('download-updates', () => {
    const url = 'https://github.com/YSSF8/crosshair-y/releases/latest';
    openurl_1.default.open(url);
});
