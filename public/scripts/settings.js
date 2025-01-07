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
        const about = frameBody.querySelector('#about');
        const checkForUpdates = frameBody.querySelector('#check-for-updates');

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

        checkForUpdates.addEventListener('click', async () => {
            const url = 'https://raw.githubusercontent.com/YSSF8/crosshair-y/refs/heads/main/package.json';
            const res = await fetch(url);
            const data = await res.json();
            const version = parseFloat(data.version);

            ipcRenderer.send('about-request');
            ipcRenderer.once('about-response', (event, info) => {
                if (info.version < version) {
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
                                            text: 'Update is available'
                                        }
                                    ]
                                },
                                {
                                    element: 'div',
                                    extraClass: 'modal-wrapper-buttons',
                                    children: [
                                        {
                                            element: 'button',
                                            text: 'Ignore',
                                            event: 'click',
                                            eventAction: () => modal.remove()
                                        },
                                        {
                                            element: 'button',
                                            text: 'Download',
                                            event: 'click',
                                            eventAction: () => {
                                                ipcRenderer.send('download-updates');
                                                modal.remove();
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]);
                } else {
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
                                            text: 'No new updates found.'
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
                }
            });
        });
    });

    setTimeout(() => {
        frame.classList.remove('full-animation');
        container.classList.add('full-animation');
    });
});