import { app, BrowserWindow, screen, ipcMain } from 'electron';

class CrosshairOverlay {
    public window: BrowserWindow | null = null;
    public size: number = 40;
    public hue: number = 0;
    public rotation: number = 0;
    public opacity: number = 1;

    constructor() { }

    async open(imagePath: string) {
        await app.whenReady();

        if (!this.window) {
            this.window = new BrowserWindow({
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

            const { width, height } = screen.getPrimaryDisplay().size;
            this.window.setBounds({
                x: Math.round(width / 2 - (this.size / 2)),
                y: Math.round(height / 2 - (this.size / 2)),
                width: this.size,
                height: this.size,
            });

            this.window.setIgnoreMouseEvents(true);

            this.window.once('ready-to-show', () => {
                console.log('CrosshairOverlay window is ready to show');
                this.window?.show();
                this.applyOpacity();
            });

            this.window.webContents.on('did-finish-load', () => {
                this.window?.webContents.send('load-crosshair', imagePath);

                setTimeout(() => {
                    this.window?.webContents.send('load-hue', this.hue);
                    this.window?.webContents.send('load-rotation', this.rotation);
                    this.window?.webContents.send('load-opacity', this.opacity);
                }, 50);
            });

            this.window.on('closed', () => {
                this.window = null;
            });

            ipcMain.on('load-crosshair', event => {
                event.reply('crosshair-loaded', imagePath);
            });
        }
    }

    applyHue() {
        this.window?.webContents.send('load-hue', this.hue);
    }

    applyRotation() {
        this.window?.webContents.send('load-rotation', this.rotation);
    }

    applySize() {
        if (this.window) {
            const primaryDisplay = screen.getPrimaryDisplay();
            const { x: boundsX, y: boundsY, width: boundsWidth, height: boundsHeight } = primaryDisplay.bounds;
            const centerX = boundsX + boundsWidth / 2;
            const centerY = boundsY + boundsHeight / 2;
            const x = Math.round(centerX - this.size / 2);
            const y = Math.round(centerY - this.size / 2);
            this.window.setBounds({
                x: x,
                y: y,
                width: this.size,
                height: this.size
            });
        }
    }

    applyOpacity() {
        this.window?.webContents.send('load-opacity', this.opacity);
    }

    setImage(imagePath: string) {
        if (!this.window) return;
        this.window.webContents.send('load-crosshair', imagePath);

        setTimeout(() => {
            this.window?.webContents.send('load-hue', this.hue);
            this.window?.webContents.send('load-rotation', this.rotation);
            this.window?.webContents.send('load-opacity', this.opacity);
        }, 50);
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

export = CrosshairOverlay;