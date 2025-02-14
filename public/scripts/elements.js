class CustomToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._button = document.createElement('button');
        this._button.setAttribute('role', 'checkbox');
        this._button.setAttribute('aria-checked', 'false');
        this._button.textContent = 'Off';

        const style = document.createElement('style');
        style.textContent = `
        button {
          padding: 10px 20px;
          border: 2px solid #ccc;
          border-radius: 20px;
          background-color: #f0f0f0;
          color: #333;
          font-size: 16px;
          cursor: pointer;
          outline: none;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        button[aria-checked="true"] {
          background-color: #90c9fc;
          border-color: #90c9fc;
          color: #fff;
        }
      `;

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this._button);

        this._button.addEventListener('click', () => this.toggle());
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
        this._button.textContent = isChecked ? 'On' : 'Off';
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