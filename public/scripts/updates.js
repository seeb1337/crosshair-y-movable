/**
 * Check for updates
 * @param {boolean} neglect - Neglects the modal when no updates found
 */
async function updatesCheck(neglect) {
    const url = 'https://raw.githubusercontent.com/YSSF8/crosshair-y/refs/heads/main/package.json';
    const res = await fetch(url);
    const data = await res.json();
    const version = parseFloat(data.version);

    ipcRenderer.send('about-request');
    ipcRenderer.once('about-response', (event, info) => {
        if (info.error) {
            alert(info.error);
        }

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
            if (!neglect) {
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
        }
    });
}