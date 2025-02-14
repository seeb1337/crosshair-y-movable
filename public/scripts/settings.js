const settings = document.querySelector('.settings');

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
        const opacityRange = frameBody.querySelector('#opacity-range');
        const setDirectory = frameBody.querySelector('#set-directory');
        const setDirectorySubText = setDirectory.querySelector('.sub-label');
        const removeDir = frameBody.querySelector('#remove-directory');
        const themeToggle = frameBody.querySelector('#theme-toggle');
        const about = frameBody.querySelector('#about');
        const checkForUpdates = frameBody.querySelector('#check-for-updates');
        const autoUpdater = frameBody.querySelector('#auto-updates-toggle');

        autoUpdater.checked = localStorage.getItem('auto-updates') !== null;

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

        opacityRange.value = config.opacity || 1;

        opacityRange.addEventListener('change', () => {
            config.opacity = opacityRange.value;
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('change-opacity', opacityRange.value);
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

        if (localStorage.getItem('light-theme')) {
            themeToggle.removeAttribute('checked');
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.documentElement.classList.remove('light-theme');
                htmlElement.classList.remove('light-theme');
                localStorage.removeItem('light-theme');
            } else {
                document.documentElement.classList.add('light-theme');
                htmlElement.classList.add('light-theme');
                localStorage.setItem('light-theme', true);
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