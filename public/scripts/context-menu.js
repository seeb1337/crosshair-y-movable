class ContextMenu {
    #target;
    #items;
    #menu;
    #isOpen = false;

    constructor(targetElement, itemsObject = {}) {
        if (!(targetElement instanceof HTMLElement))
            throw new TypeError('ContextMenu expects a valid HTMLElement as first argument');

        this.#target = targetElement;
        this.#items = new Map(Object.entries(itemsObject));

        this.#buildMenu();
        this.#attachEvents();
    }
    #buildMenu() {
        this.#menu = document.createElement('div');
        this.#menu.className = 'ctx-menu';
        this.#menu.setAttribute('tabindex', '-1');
        this.#menu.style.cssText = `
            position: fixed;
            z-index: 100000;
            background: var(--secondary-color);
            border: 1px solid var(--line-color);
            border-radius: var(--default-px);
            box-shadow: 0 2px 8px rgba(0,0,0,.35);
            padding: calc(var(--default-px) / 2) 0;
            min-width: 160px;
            font-size: 14px;
            color: var(--text);
            opacity: 0;
            transform: scale(.96);
            transform-origin: top left;
            transition: transform 120ms ease, opacity 120ms ease;
            pointer-events: none;
        `;

        this.#items.forEach((callback, label) => {
            this.#buildItem(label, callback);
        });

        document.body.appendChild(this.#menu);
    }

    #attachEvents() {
        this.#target.addEventListener('contextmenu', this.#onContextMenu.bind(this));
        document.addEventListener('click', this.#close.bind(this), true);
        document.addEventListener('keydown', this.#onKeyDown.bind(this), true);
    }

    #onContextMenu(ev) {
        ev.preventDefault();
        this.#open(ev.clientX, ev.clientY);
    }

    #onKeyDown(ev) {
        if (ev.key === 'Escape' && this.#isOpen) {
            this.#close();
        }
    }

    #open(x, y) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const { width, height } = this.#menu.getBoundingClientRect();

        if (x + width > vw) x = vw - width - 4;
        if (y + height > vh) y = vh - height - 4;

        this.#menu.style.left = `${x}px`;
        this.#menu.style.top = `${y}px`;

        this.#menu.style.pointerEvents = 'auto';
        this.#menu.style.opacity = '1';
        this.#menu.style.transform = 'scale(1)';
        this.#menu.focus();
        this.#isOpen = true;
    }

    #close() {
        if (!this.#isOpen) return;
        this.#menu.style.opacity = '0';
        this.#menu.style.transform = 'scale(.96)';
        this.#menu.style.pointerEvents = 'none';
        this.#isOpen = false;
    }

    addItem(label, callback) {
        if (this.#items.has(label)) return this;
        this.#items.set(label, callback);

        this.#menu.innerHTML = '';
        this.#items.forEach((cb, lbl) => this.#buildItem(lbl, cb));
        return this;
    }

    removeItem(label) {
        if (!this.#items.delete(label)) return this;

        this.#menu.innerHTML = '';
        this.#items.forEach((cb, lbl) => this.#buildItem(lbl, cb));
        return this;
    }

    destroy() {
        this.#close();
        this.#menu.remove();
    }

    #buildItem(label, callback) {
        const entry = document.createElement('div');
        entry.textContent = label;
        entry.className = 'ctx-item';
        entry.style.cssText = `
            padding: calc(var(--default-px) / 1.5) calc(var(--default-px) * 2);
            cursor: pointer;
            transition: background 150ms ease;
            white-space: nowrap;
        `;
        entry.addEventListener('mouseenter', () => {
            entry.style.background = 'var(--hover-state)';
        });
        entry.addEventListener('mouseleave', () => {
            entry.style.background = 'transparent';
        });

        entry.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this.#close();

            const menuItem = {
                target: this.#target,

                /**
                 * Gets the current text label of the context menu item.
                 * @returns {string} The item's label.
                 */
                getText: () => entry.textContent,

                /**
                 * Sets the text label of the context menu item.
                 * @param {string} newLabel - The new label to display.
                 */
                setText: (newLabel) => {
                    if (typeof newLabel !== 'string' || !newLabel.trim()) {
                        console.error('ContextMenu item label must be a non-empty string.');
                        return;
                    }
                    const currentLabel = label;
                    if (newLabel !== currentLabel && this.#items.has(newLabel)) {
                        console.error(`ContextMenu item with label "${newLabel}" already exists.`);
                        return;
                    }

                    const newItemsMap = new Map();
                    this.#items.forEach((value, key) => {
                        if (key === currentLabel) {
                            newItemsMap.set(newLabel, value);
                        } else {
                            newItemsMap.set(key, value);
                        }
                    });
                    this.#items = newItemsMap;

                    entry.textContent = newLabel;
                    label = newLabel;
                }
            };
            callback(menuItem);
        });
        this.#menu.appendChild(entry);
    }
}