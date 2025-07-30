import { app, BrowserWindow } from 'electron';

function createEditorWindow(filePath: string) {
    const editorWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    editorWindow.loadFile('public/editor.html');
    editorWindow.webContents.on('did-finish-load', () => {
        editorWindow.webContents.send('load-file', filePath);
    });

    return editorWindow;
}

export = createEditorWindow;