const { ipcRenderer } = require('electron');

ipcRenderer.send('load-crosshair');

const img = document.querySelector('img');

let config = JSON.parse(localStorage.getItem('config')) || {
    size: 40,
    hue: 0,
    crosshair: 'Simple.png'
};

document.addEventListener('DOMContentLoaded', () => {
    img.style.filter = `hue-rotate(${config.hue})` || '';
});

const SIMPLE_CURSOR = './crosshairs/Simple.png';

ipcRenderer.on('crosshair-loaded', (event, path) => {
    img.src = path.replace('public/crosshairs', './crosshairs');

    if (img.src.indexOf('./crosshairs')) {
        fetch(img.src)
            .then(res => {
                if (!res.ok) {
                    img.src = SIMPLE_CURSOR;
                }
                return res.blob();
            })
            .then(data => console.log('Data retreived successfully', data))
            .catch(err => {
                img.src = SIMPLE_CURSOR;
                ipcRenderer.send('error', err);
            });
    }
});

ipcRenderer.on('load-hue', (event, hue) => {
    img.style.filter = `hue-rotate(${hue}deg)`;
});
