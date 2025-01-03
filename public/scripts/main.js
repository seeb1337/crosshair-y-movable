const { ipcRenderer } = require('electron');

ipcRenderer.send('built-in-crosshairs');

const DEFAULT_CONFIG = {
    size: 40,
    hue: 0,
    crosshair: 'Simple.png'
};
let config = JSON.parse(localStorage.getItem('config')) || { ...DEFAULT_CONFIG };

ipcRenderer.send('built-in-crosshairs');
ipcRenderer.send('onload-crosshair-directory', localStorage.getItem('crosshairs-directory') || null);
ipcRenderer.send('change-custom-crosshair', localStorage.getItem('custom-crosshair') || null);
ipcRenderer.send('config', config);

const container = document.querySelector('.container');
const builtInSection = document.getElementById('built-in');
const customSection = document.getElementById('custom');
const toggleCrosshair = document.getElementById('toggle-crosshair');
const refreshDir = document.querySelector('.refresh-dir');
const openDir = document.querySelector('.open-dir');

ipcRenderer.once('built-in-crosshairs-response', (event, crosshairs) => {
    const crosshairsToElements = crosshairs.reverse().map(crosshair => `
    <div class="crosshair">
        <img src="./crosshairs/${crosshair}" draggable="false" alt="">
        <div>${crosshair.split('.')[0]}</div>
    </div>`);
    const joinedElements = crosshairsToElements.join('');
    builtInSection.innerHTML = joinedElements;

    builtInSection.querySelectorAll('.crosshair').forEach(crosshair => {
        crosshair.addEventListener('click', () => {
            const name = crosshair.querySelector('div').textContent + '.png';

            localStorage.removeItem('custom-crosshair');

            ipcRenderer.send('change-crosshair', name);
            refreshOverlay();

            config.crosshair = name;
            localStorage.setItem('config', JSON.stringify(config));
        });
    });
});

ipcRenderer.send('show-crosshair');

toggleCrosshair.addEventListener('change', () => {
    if (toggleCrosshair.checked) {
        ipcRenderer.send('show-crosshair');
    } else {
        ipcRenderer.send('hide-crosshair');
    }
});

ipcRenderer.send('change-hue', config.hue);

refreshDir.addEventListener('click', () => {
    ipcRenderer.send('refresh-crosshairs');
});

refreshDir.click();

openDir.title = localStorage.getItem('crosshairs-directory') || 'No directory';
if (localStorage.getItem('crosshairs-directory')) {
    openDir.classList.remove('disabled');
}

ipcRenderer.send('onload-crosshair-directory', localStorage.getItem('crosshairs-directory') || null);
ipcRenderer.on('custom-crosshairs-response', (event, crosshairs) => {
    let fileFormats = [];

    customSection.innerHTML = crosshairs.map(crosshair => {
        const nameSplit = crosshair.split('.');
        const nameFormat = nameSplit.pop();
        const name = nameSplit.join('.');

        fileFormats.push({ name: name, format: nameFormat });

        return `
        <div class="crosshair">
            <img src="${localStorage.getItem('crosshairs-directory')}/${crosshair}" height="40" width="40" draggable="false" alt="">
            <div>${name}</div>
        </div>
        `;
    }).join('');

    customSection.querySelectorAll('.crosshair').forEach(crosshair => {
        crosshair.addEventListener('click', () => {
            const name = crosshair.querySelector('div').textContent;
            let path = '';

            for (let i = 0; i < fileFormats.length; i++) {
                if (name.toLowerCase().trim() === fileFormats[i].name.toLowerCase().trim()) {
                    path = `${name}.${fileFormats[i].format}`;
                }
            }

            ipcRenderer.send('change-custom-crosshair', path);
            refreshOverlay();

            config.crosshair = path;
            localStorage.setItem('custom-crosshair', path);
        });
    });
});

ipcRenderer.on('custom-crosshairs-response-fail', () => {
    customSection.innerHTML = '';
});

openDir.addEventListener('click', () => {
    const directory = localStorage.getItem('crosshairs-directory');

    if (directory.trim() !== '' && directory) {
        ipcRenderer.send('open-crosshair-directory', directory);
    }
});

const settings = document.querySelector('.settings');

settings.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = './settings.html';
    frame.classList.add('full-frame', 'full-animation');
    document.body.appendChild(frame);

    frame.addEventListener('load', () => {
        const frameDoc = frame.contentDocument || frame.contentWindow.document;
        const frameBody = frameDoc.body;

        const resetButton = frameBody.querySelector('.reset');
        const closeButton = frameBody.querySelector('.close');
        const sizeRange = frameBody.querySelector('#size-range');
        const hueRange = frameBody.querySelector('#hue-range');
        const setDirectory = frameBody.querySelector('#set-directory');
        const setDirectorySubText = setDirectory.querySelector('.sub-label');
        const removeDir = frameBody.querySelector('#remove-directory');

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                localStorage.removeItem('config');
                config = { ...DEFAULT_CONFIG };

                sizeRange.value = 40;
                hueRange.value = 0;

                ipcRenderer.send('config', config);
                ipcRenderer.send('change-hue', hueRange.value);

                localStorage.removeItem('crosshairs-directory');

                setDirectorySubText.textContent = 'No directory';
                openDir.title = 'No directory';
                openDir.classList.add('disabled');

                ipcRenderer.send('onload-crosshair-directory', null);

                refreshOverlay();
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                frame.classList.add('full-animation');
                container.classList.remove('full-animation');
                setTimeout(() => {
                    frame.remove();
                }, 200);
            });
        }

        sizeRange.value = config.size || 40;

        sizeRange.addEventListener('change', () => {
            config.size = sizeRange.value;
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('config', config);
            refreshOverlay();
            ipcRenderer.send('change-hue', hueRange.value);
        });

        hueRange.value = config.hue || 0;

        hueRange.addEventListener('change', () => {
            config.hue = hueRange.value;
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('change-hue', hueRange.value);
        });

        const crosshairsDirectory = localStorage.getItem('crosshairs-directory') || '';

        if (crosshairsDirectory.trim() === '' || !crosshairsDirectory) {
            setDirectorySubText.textContent = 'No directory';
        } else {
            setDirectorySubText.textContent = crosshairsDirectory;
        }

        setDirectory.addEventListener('click', () => {
            ipcRenderer.send('open-folder-dialog');
            ipcRenderer.on('custom-crosshairs-directory', (event, directory) => {
                localStorage.setItem('crosshairs-directory', directory);

                const dir = localStorage.getItem('crosshairs-directory');
                setDirectorySubText.textContent = dir;
                openDir.title = dir;
                openDir.classList.remove('disabled');

                ipcRenderer.send('onload-crosshair-directory', localStorage.getItem('crosshairs-directory') || null);
            });
        });

        removeDir.addEventListener('click', () => {
            localStorage.removeItem('crosshairs-directory');
            setDirectorySubText.textContent = 'No directory';
            openDir.title = 'No directory';
            openDir.classList.add('disabled');

            ipcRenderer.send('onload-crosshair-directory', null);
        });
    });

    setTimeout(() => {
        frame.classList.remove('full-animation');
        container.classList.add('full-animation');
    });
});

function refreshOverlay() {
    ipcRenderer.send('destroy-crosshair');
    ipcRenderer.send('change-hue', config.hue);
    ipcRenderer.send('change-size', config.size);
    ipcRenderer.send(toggleCrosshair.checked ? 'show-crosshair' : 'hide-crosshair');
}