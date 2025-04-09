const settings = document.querySelector('.settings');

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

settings.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = './settings.html';
    frame.classList.add('full-frame', 'full-animation');
    document.body.appendChild(frame);

    frame.addEventListener('load', () => {
        const frameDoc = frame.contentDocument || frame.contentWindow.document;
        const frameBody = frameDoc.body;
        const htmlElement = frameBody.parentElement;

        if (localStorage.getItem('light-theme')) {
            htmlElement.classList.add('light-theme');
        }

        const resetButton = frameBody.querySelector('.reset');
        const closeButton = frameBody.querySelector('.close');
        const sizeRange = frameBody.querySelector('#size-range');
        const hueRange = frameBody.querySelector('#hue-range');
        const rotateRange = frameBody.querySelector('#rotate-range');
        const opacityRange = frameBody.querySelector('#opacity-range');
        const setDirectory = frameBody.querySelector('#set-directory');
        const setDirectorySubText = setDirectory.querySelector('.sub-label');
        const removeDir = frameBody.querySelector('#remove-directory');
        const themeToggle = frameBody.querySelector('#theme-toggle');
        const reducedMotionToggle = frameBody.querySelector('#reduced-motion-toggle');
        const about = frameBody.querySelector('#about');
        const checkForUpdates = frameBody.querySelector('#check-for-updates');
        const autoUpdater = frameBody.querySelector('#auto-updates-toggle');

        if (localStorage.getItem('light-theme') === 'true') {
            htmlElement.classList.add('light-theme');
            document.documentElement.classList.add('light-theme');
            themeToggle.checked = false;
        } else {
            themeToggle.checked = true;
        }

        const prefersReducedMotion = localStorage.getItem('reduced-motion') === 'true';
        reducedMotionToggle.checked = prefersReducedMotion;
        if (prefersReducedMotion) {
            htmlElement.classList.add('reduced-motion');
            document.documentElement.classList.add('reduced-motion');
        }

        autoUpdater.checked = localStorage.getItem('auto-updates') === 'true';

        const INPUT_DEBOUNCE_DELAY = 50;

        const debouncedSendSize = debounce(value => {
            ipcRenderer.send('change-size', value);
            console.log('Debounced size change sent:', value);
        }, INPUT_DEBOUNCE_DELAY);

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                localStorage.removeItem('config');
                config = { ...(typeof DEFAULT_CONFIG !== 'undefined' ? DEFAULT_CONFIG : { size: 40, hue: 0, rotation: 0, opacity: 1, crosshair: '' /* Add default crosshair */}) };

                sizeRange.value = config.size;
                hueRange.value = config.hue;
                rotateRange.value = config.rotation;
                opacityRange.value = config.opacity;

                sizeRange.title = sizeRange.value;
                hueRange.title = hueRange.value;
                rotateRange.title = rotateRange.value;
                opacityRange.title = parseFloat(opacityRange.value).toFixed(1);

                ipcRenderer.send('config', config);
                ipcRenderer.send('change-size', config.size);
                ipcRenderer.send('change-hue', config.hue);
                ipcRenderer.send('change-rotation', config.rotation);
                ipcRenderer.send('change-opacity', config.opacity);

                localStorage.removeItem('crosshairs-directory');
                setDirectorySubText.textContent = 'No directory';
                if (typeof openDir !== 'undefined') { openDir.title = 'No directory'; openDir.classList.add('disabled'); }
                ipcRenderer.send('onload-crosshair-directory', null);

                if (localStorage.getItem('light-theme') === 'true') {
                    document.documentElement.classList.remove('light-theme');
                    htmlElement.classList.remove('light-theme');
                    localStorage.removeItem('light-theme');
                }
                themeToggle.checked = true;

                if (localStorage.getItem('reduced-motion') === 'true') {
                    document.documentElement.classList.remove('reduced-motion');
                    htmlElement.classList.remove('reduced-motion');
                    localStorage.removeItem('reduced-motion');
                }
                reducedMotionToggle.checked = false;

                if (localStorage.getItem('auto-updates') === 'true') {
                    localStorage.removeItem('auto-updates');
                }
                 autoUpdater.checked = false;

                refreshOverlay();
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                frame.classList.add('full-animation');
                if (typeof container !== 'undefined') {
                    container.classList.remove('full-animation');
                } else {
                    console.warn("'container' element not found for animation.");
                }
                setTimeout(() => {
                    frame.remove();
                }, 200);
            });
        }

        sizeRange.value = config.size || 40;
        sizeRange.title = sizeRange.value;
        sizeRange.addEventListener('change', () => {
            const currentValue = sizeRange.value;
            config.size = currentValue;
            sizeRange.title = currentValue;
            localStorage.setItem('config', JSON.stringify(config));
            debouncedSendSize(currentValue);
        });

        hueRange.value = config.hue || 0;
        hueRange.title = hueRange.value;
        hueRange.addEventListener('change', () => {
            config.hue = hueRange.value;
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('change-hue', hueRange.value);
            hueRange.title = hueRange.value;
        });

        rotateRange.value = config.rotation || 0;
        rotateRange.title = rotateRange.value;
        rotateRange.addEventListener('change', () => {
            config.rotation = rotateRange.value;
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('change-rotation', rotateRange.value);
            rotateRange.title = rotateRange.value;
        });

        opacityRange.value = config.opacity || 1;
        opacityRange.title = parseFloat(opacityRange.value.toFixed(1));
        opacityRange.addEventListener('change', () => {
            config.opacity = opacityRange.value;
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('change-opacity', opacityRange.value);
            opacityRange.title = parseFloat(opacityRange.value.toFixed(1));
        });

        const crosshairsDirectory = localStorage.getItem('crosshairs-directory') || '';

        if (crosshairsDirectory.trim() === '' || !crosshairsDirectory) {
            setDirectorySubText.textContent = 'No directory';
        } else {
            setDirectorySubText.textContent = crosshairsDirectory;
        }

        setDirectory.addEventListener('click', () => {
            ipcRenderer.send('open-folder-dialog');
            ipcRenderer.once('custom-crosshairs-directory', (event, directory) => {
                localStorage.setItem('crosshairs-directory', directory);

                const dir = localStorage.getItem('crosshairs-directory');
                setDirectorySubText.textContent = dir;
                if (typeof openDir !== 'undefined') {
                    openDir.title = dir;
                    openDir.classList.remove('disabled');
                } else {
                    console.warn("'openDir' element not found.");
                }

                ipcRenderer.send('onload-crosshair-directory', localStorage.getItem('crosshairs-directory') || null);
            });
        });

        removeDir.addEventListener('click', () => {
            localStorage.removeItem('crosshairs-directory');
            setDirectorySubText.textContent = 'No directory';
            if (typeof openDir !== 'undefined') {
                openDir.title = 'No directory';
                openDir.classList.add('disabled');
            } else {
                console.warn("'openDir' element not found.");
            }
            ipcRenderer.send('onload-crosshair-directory', null);
        });

        if (localStorage.getItem('light-theme')) {
            themeToggle.removeAttribute('checked');
        } else {
            themeToggle.setAttribute('checked', '');
        }

        themeToggle.addEventListener('change', () => {
            if (!themeToggle.checked) {
                document.documentElement.classList.add('light-theme');
                htmlElement.classList.add('light-theme');
                localStorage.setItem('light-theme', 'true');
            } else {
                document.documentElement.classList.remove('light-theme');
                htmlElement.classList.remove('light-theme');
                localStorage.removeItem('light-theme');
            }
        });

        reducedMotionToggle.addEventListener('change', () => {
            if (reducedMotionToggle.checked) {
                localStorage.setItem('reduced-motion', 'true');
                htmlElement.classList.add('reduced-motion');
                document.documentElement.classList.add('reduced-motion');
            } else {
                localStorage.removeItem('reduced-motion');
                htmlElement.classList.remove('reduced-motion');
                document.documentElement.classList.remove('reduced-motion');
            }
        });

        about.addEventListener('click', () => {
            ipcRenderer.send('about-request');
            ipcRenderer.once('about-response', (event, info) => {
                if (!info.error) {
                    const modal = new Modal([
                        {
                            element: 'div',
                            extraClass: 'modal-wrapper',
                            children: [
                                {
                                    element: 'div',
                                    children: [
                                        {
                                            element: 'div',
                                            text: `Version: ${info.version}`
                                        },
                                        {
                                            element: 'div',
                                            text: `Author: ${info.author}`
                                        },
                                        {
                                            element: 'div',
                                            text: `License: ${info.license}`
                                        }
                                    ]
                                },
                                {
                                    element: 'div',
                                    extraClass: 'modal-wrapper-buttons',
                                    children: [
                                        {
                                            element: 'button',
                                            text: 'OK',
                                            event: 'click',
                                            eventAction: () => modal.remove()
                                        }
                                    ]
                                }
                            ]
                        }
                    ]);
                } else {
                    alert('An error occured while trying to load data.');
                }
            });
        });

        checkForUpdates.addEventListener('click', () => updatesCheck(false));

        autoUpdater.addEventListener('change', () => {
            if (autoUpdater.checked) {
                localStorage.setItem('auto-updates', true);
            } else {
                localStorage.removeItem('auto-updates');
            }
        });
    });

    setTimeout(() => {
        frame.classList.remove('full-animation');
        container.classList.add('full-animation');
    });
});