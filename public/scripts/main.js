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
const sortSelect = document.getElementById('sort-select');
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

let fileFormats = [];
let originalNames = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

ipcRenderer.send('onload-crosshair-directory', localStorage.getItem('crosshairs-directory') || null);
ipcRenderer.on('custom-crosshairs-response', (_event, crosshairs) => {
    originalNames = crosshairs;

    fileFormats = crosshairs.map(c => {
        const parts = c.split('.');
        return {
            name: parts.slice(0, -1).join('.'),
            format: parts.pop()
        };
    });

    renderCustomSection(originalNames);
    attachClickHandlers();
});

function renderCustomSection(list) {
    const dir = localStorage.getItem('crosshairs-directory');
    if (!dir) return;

    const ordered = [
        ...favorites.filter(f => list.includes(f)),
        ...list.filter(f => !favorites.includes(f))
    ];

    customSection.innerHTML = '';
    ordered.forEach(fileName => {
        const nameOnly = fileName.split('.').slice(0, -1).join('.');
        const div = document.createElement('div');
        div.className = 'crosshair';
        div.dataset.file = fileName;
        div.innerHTML = `
            <img src="${dir}/${fileName}" height="40" width="40" draggable="false" alt="">
            <div>${nameOnly}</div>`;
        customSection.appendChild(div);

        const isFavorite = favorites.includes(fileName);

        const favoriteLabel = isFavorite ? 'Remove from favorites' : 'Add to favorites';

        new ContextMenu(div, {
            [favoriteLabel]: item => {
                const wasFavorite = favorites.includes(fileName);

                if (wasFavorite) {
                    const idx = favorites.indexOf(fileName);
                    if (idx !== -1) {
                        favorites.splice(idx, 1);
                        localStorage.setItem('favorites', JSON.stringify(favorites));
                        renderCustomSection(originalNames);
                        item.setText('Add to favorites');
                    }
                } else {
                    favorites.push(fileName);
                    localStorage.setItem('favorites', JSON.stringify(favorites));
                    renderCustomSection(originalNames);
                    item.setText('Remove from favorites');
                }
            },
            'Reveal in folder': () => ipcRenderer.send('reveal-crosshair', fileName),
            'Delete': () => {
                new Modal([
                    {
                        element: 'div',
                        extraClass: 'modal-wrapper',
                        children: [
                            { element: 'div', text: `Delete "${fileName.split('/').pop()}"?` },
                            { element: 'div', text: 'This action cannot be undone.' },
                            {
                                element: 'div',
                                extraClass: 'modal-wrapper-buttons',
                                children: [
                                    {
                                        element: 'button',
                                        text: 'Delete',
                                        event: 'click',
                                        eventAction: (e) => {
                                            const idx = favorites.indexOf(fileName);
                                            if (idx !== -1) {
                                                favorites.splice(idx, 1);
                                                localStorage.setItem('favorites', JSON.stringify(favorites));
                                            }

                                            ipcRenderer.send('delete-crosshair', fileName);

                                            e.target.closest('.modal-background').remove();
                                        }
                                    },
                                    { element: 'button', text: 'Cancel', event: 'click', eventAction: (e) => e.target.closest('.modal-background').remove() }
                                ]
                            }
                        ]
                    }
                ]);
                document.body.lastElementChild.__modal = document.body.lastElementChild;
            }
        });
    });

    attachClickHandlers();
}

function attachClickHandlers() {
    customSection.querySelectorAll('.crosshair').forEach(div => {
        div.addEventListener('click', () => {
            const clickedName = div.querySelector('div').textContent.trim();
            const match = fileFormats.find(f => f.name === clickedName);
            if (!match) return;

            const fullPath = `${match.name}.${match.format}`;
            ipcRenderer.send('change-custom-crosshair', fullPath);

            if (typeof refreshOverlay === 'function') refreshOverlay();

            if (typeof config === 'object') {
                config.crosshair = fullPath;
                localStorage.setItem('custom-crosshair', fullPath);
            }
        });
    });
}

sortSelect.addEventListener('change', () => {
    const order = sortSelect.value;
    const sorted = [...originalNames].sort((a, b) => {
        const nameA = a.split('.').slice(0, -1).join('.').toLowerCase();
        const nameB = b.split('.').slice(0, -1).join('.').toLowerCase();
        return order === 'az'
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
    });

    renderCustomSection(sorted);
    attachClickHandlers();
});

document.querySelector('.refresh-dir').addEventListener('click', () => {
    ipcRenderer.send(
        'onload-crosshair-directory',
        localStorage.getItem('crosshairs-directory') || null
    );
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