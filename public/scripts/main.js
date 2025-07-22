const { ipcRenderer } = require('electron');

ipcRenderer.send('built-in-crosshairs');

const DEFAULT_CONFIG = {
    size: 40,
    hue: 0,
    rotation: 0,
    opacity: 1,
    crosshair: 'Simple.png'
};
let config = JSON.parse(localStorage.getItem('config')) || { ...DEFAULT_CONFIG };

window.toggleCrosshairCheckbox = () => toggleCrosshair.toggle();

ipcRenderer.send('built-in-crosshairs');
ipcRenderer.send('onload-crosshair-directory', localStorage.getItem('crosshairs-directory') || null);
ipcRenderer.send('change-custom-crosshair', localStorage.getItem('custom-crosshair') || null);
ipcRenderer.send('config', config);
ipcRenderer.send('change-opacity', config.opacity || 1);

const container = document.querySelector('.container');
const builtInSection = document.getElementById('built-in');
const customSection = document.getElementById('custom');
const toggleCrosshair = document.getElementById('toggle-crosshair');
const refreshDir = document.querySelector('.refresh-dir');
const openDir = document.querySelector('.open-dir');

if (localStorage.getItem('light-theme')) {
    document.documentElement.classList.add('light-theme');
}

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

            ipcRenderer.send('change-hue', config.hue);
            ipcRenderer.send('change-rotation', config.rotation);
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
ipcRenderer.send('change-rotation', config.rotation);

refreshDir.addEventListener('click', () => {
    ipcRenderer.send('refresh-crosshairs');
});

refreshDir.click();

ipcRenderer.on('tray-toggle', () => {
    window.toggleCrosshairCheckbox?.();
});

openDir.title = localStorage.getItem('crosshairs-directory') || 'No directory';
if (localStorage.getItem('crosshairs-directory')) {
    openDir.classList.remove('disabled');
}

if (localStorage.getItem('auto-updates')) {
    updatesCheck(true);
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

function applyReducedMotion(val) {
    if (val === 'on' || (val === 'system' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        document.documentElement.classList.add('reduced-motion');
    } else {
        document.documentElement.classList.remove('reduced-motion');
    }
}

applyReducedMotion(localStorage.getItem('reduced-motion') || 'system');

function refreshOverlay() {
    ipcRenderer.send('destroy-crosshair');
    ipcRenderer.send('change-hue', config.hue);
    ipcRenderer.send('change-rotation', config.rotation);
    ipcRenderer.send('change-size', config.size);
    ipcRenderer.send(toggleCrosshair.checked ? 'show-crosshair' : 'hide-crosshair');
}