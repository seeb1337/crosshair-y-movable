class CustomToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._button = document.createElement('button');
        this._button.setAttribute('role', 'checkbox');
        this._button.setAttribute('aria-checked', 'false');

        const style = document.createElement('style');
        style.textContent = `
            button {
                position: relative;
                width: 100px;
                height: 40px;
                border: none;
                border-radius: 20px;
                background: var(--primary-opposite);
                color: #5a5a5a;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            button[aria-checked="true"] {
                background: var(--accent-primary);
                color: white;
                box-shadow: 0 3px 6px rgba(0,87,183,0.2);
            }

            button span {
                position: relative;
                z-index: 1;
                transition: opacity 0.2s ease;
            }
        `;

        this._span = document.createElement('span');
        this._span.textContent = 'Off';
        this._button.appendChild(this._span);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this._button);

        this._button.addEventListener('click', (e) => this.toggle());
    }

    get checked() {
        return this.hasAttribute('checked');
    }

    set checked(value) {
        const isChecked = Boolean(value);
        if (isChecked) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
        this._updateButton();
    }

    toggle() {
        this.checked = !this.checked;
        this._dispatchChangeEvent();
    }

    check() {
        this.checked = true;
        this._dispatchChangeEvent();
    }

    uncheck() {
        this.checked = false;
        this._dispatchChangeEvent();
    }

    _updateButton() {
        const isChecked = this.checked;
        this._button.setAttribute('aria-checked', isChecked.toString());
        this._span.textContent = isChecked ? 'On' : 'Off';
    }

    _dispatchChangeEvent() {
        const event = new Event('change', { bubbles: true });
        this.dispatchEvent(event);
    }

    static get observedAttributes() {
        return ['checked'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'checked') {
            this._updateButton();
        }
    }
}

customElements.define('custom-toggle', CustomToggle);

class CustomRange extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._container = document.createElement('div');
        this._container.className = 'slider';

        this._track = document.createElement('div');
        this._track.className = 'track';

        this._thumb = document.createElement('div');
        this._thumb.className = 'thumb';
        this._thumb.setAttribute('tabindex', '0');
        this._thumb.setAttribute('role', 'slider');

        this._input = document.createElement('input');
        this._input.type = 'range';
        this._input.hidden = true;

        const style = document.createElement('style');
        style.textContent = `
            .slider {
                position: relative;
                width: 200px;
                height: 24px;
                touch-action: none;
            }
            
            .track {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 100%;
                height: 4px;
                background: var(--primary-opposite);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .track::before {
                content: '';
                position: absolute;
                width: var(--width, 0%);
                height: 100%;
                background: var(--accent-primary);
                transition: width 0.1s linear;
            }
            
            .thumb {
                position: absolute;
                top: 50%;
                left: 0;
                width: 16px;
                height: 16px;
                background: #ffffff;
                border: 2px solid var(--accent-primary);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                cursor: pointer;
                transition: left 0.1s linear;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .thumb:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(0,87,183,0.2);
            }
        `;

        this._container.appendChild(this._track);
        this._container.appendChild(this._thumb);
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this._container);
        this.shadowRoot.appendChild(this._input);

        this._min = parseFloat(this.getAttribute('min')) || 0;
        this._max = parseFloat(this.getAttribute('max')) || 100;
        this._step = parseFloat(this.getAttribute('step')) || 1;
        this._value = parseFloat(this.getAttribute('value')) || this._min;

        this._isDragging = false;
        this._rafId = null;

        this._setupEventListeners();
        this._updateUI();
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._value = Math.min(Math.max(newValue, this._min), this._max);
        this._input.value = this._value;
        this._updateUI();
        this._dispatchChangeEvent();
    }

    get min() { return this._min; }
    get max() { return this._max; }
    get step() { return this._step; }

    set min(value) {
        this._min = parseFloat(value);
        this._updateUI();
    }

    set max(value) {
        this._max = parseFloat(value);
        this._updateUI();
    }

    set step(value) {
        this._step = parseFloat(value);
    }

    _updateUI() {
        const percent = (this._value - this._min) / (this._max - this._min) * 100;
        this._track.style.setProperty('--width', `${percent}%`);
        this._thumb.style.left = `${percent}%`;
        this._input.value = this._value;
        this._thumb.setAttribute('aria-valuenow', this._value);
    }

    _handleStart = (e) => {
        this._isDragging = true;
        this._container.classList.add('dragging');
        this._thumb.focus();

        if (this._rafId) cancelAnimationFrame(this._rafId);

        this._updateValueFromEvent(e);

        this._thumb.setPointerCapture(e.pointerId);
        document.addEventListener('pointermove', this._handleMove);
        document.addEventListener('pointerup', this._handleEnd);
    }

    _handleMove = (e) => {
        if (!this._isDragging) return;
        this._rafId = requestAnimationFrame(() => {
            this._updateValueFromEvent(e);
        });
    }

    _handleEnd = () => {
        this._isDragging = false;
        this._container.classList.remove('dragging');
        document.removeEventListener('pointermove', this._handleMove);
        document.removeEventListener('pointerup', this._handleEnd);
        if (this._rafId) cancelAnimationFrame(this._rafId);
    }

    _updateValueFromEvent(e) {
        const rect = this._container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const rawValue = this._min + x * (this._max - this._min);
        this.value = Math.round(rawValue / this._step) * this._step;
    }

    _dispatchChangeEvent() {
        const event = new Event('change', { bubbles: true });
        this.dispatchEvent(event);
    }

    _setupEventListeners() {
        this._thumb.addEventListener('pointerdown', this._handleStart);
        this._container.addEventListener('pointerdown', this._handleStart);

        this._thumb.addEventListener('keydown', (e) => {
            const step = e.shiftKey ? this._step * 10 : this._step;
            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowDown':
                    this.value -= step;
                    break;
                case 'ArrowRight':
                case 'ArrowUp':
                    this.value += step;
                    break;
                case 'Home':
                    this.value = this._min;
                    break;
                case 'End':
                    this.value = this._max;
                    break;
            }
        });
    }

    static get observedAttributes() {
        return ['min', 'max', 'step', 'value'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'min':
                this.min = newValue;
                break;
            case 'max':
                this.max = newValue;
                break;
            case 'step':
                this.step = newValue;
                break;
            case 'value':
                this.value = parseFloat(newValue);
                break;
        }
    }
}

customElements.define('custom-range', CustomRange);

class CustomCheck extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._id = this.getAttribute('id') || `check-${Math.random().toString(36).substr(2, 9)}`;

        this._button = document.createElement('button');
        this._button.setAttribute('role', 'checkbox');
        this._button.setAttribute('aria-checked', 'false');
        this._button.setAttribute('id', this._id);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.innerHTML = `
            <path d="M8.5 12.5L11 15L16 9" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="checkmark"/>
        `;

        const style = document.createElement('style');
        style.textContent = `
            button {
                position: relative;
                width: 20px;
                height: 20px;
                border: none;
                border-radius: 5px;
                background: var(--primary-opposite);
                color: #5a5a5a;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            button[aria-checked="true"] {
                background: var(--accent-primary);
                color: white;
                box-shadow: 0 3px 6px rgba(0,87,183,0.2);
            }

            svg {
                width: 20px;
                height: 20px;
                opacity: 0;
                transform: scale(4) translateZ(0);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            button[aria-checked="true"] svg {
                opacity: 1;
                transform: scale(2) translateZ(0);
            }

            .checkmark {
                stroke-dasharray: 24;
                stroke-dashoffset: 24;
                transition: stroke-dashoffset 0.35s ease-out;
            }

            button[aria-checked="true"] .checkmark {
                stroke-dashoffset: 0;
                transition-delay: 0.1s;
            }
        `;

        this._button.appendChild(svg);
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this._button);

        this._handleLabelClicks = this._handleLabelClicks.bind(this);
        setTimeout(() => this._connectLabel(), 0);
    }

    _connectLabel() {
        const parent = this.parentElement;
        if (parent) {
            parent.removeEventListener('click', this._handleLabelClicks);
            parent.addEventListener('click', this._handleLabelClicks);
        }
    }

    _handleLabelClicks(e) {
        if (e.target.tagName === 'LABEL' || e.target.tagName === 'SPAN') {
            if (e.target.htmlFor === this._id ||
                e.target.closest(`label[for="${this._id}"]`)) {
                this.toggle();
            }
        }
    }

    get checked() {
        return this.hasAttribute('checked');
    }

    set checked(value) {
        const isChecked = Boolean(value);
        if (isChecked) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
        this._updateButton();
    }

    toggle() {
        this.checked = !this.checked;
        this._dispatchChangeEvent();
    }

    check() {
        this.checked = true;
        this._dispatchChangeEvent();
    }

    uncheck() {
        this.checked = false;
        this._dispatchChangeEvent();
    }

    _updateButton() {
        const isChecked = this.checked;
        this._button.setAttribute('aria-checked', isChecked.toString());
    }

    _dispatchChangeEvent() {
        const event = new Event('change', { bubbles: true });
        this.dispatchEvent(event);
    }

    disconnectedCallback() {
        const parent = this.parentElement;
        if (parent) {
            parent.removeEventListener('click', this._handleLabelClicks);
        }
    }

    static get observedAttributes() {
        return ['checked', 'id'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'checked') {
            this._updateButton();
        }
        if (name === 'id') {
            this._id = newValue;
            this._button.setAttribute('id', newValue);
        }
    }
}

customElements.define('custom-check', CustomCheck);