class Modal {
    constructor(content) {
        this.content = content;

        this.modalBackground = document.createElement('div');
        this.modalBackground.classList.add('modal-background');
        document.body.appendChild(this.modalBackground);

        this.modal = document.createElement('div');
        this.modal.classList.add('modal-foreground');
        this.modalBackground.appendChild(this.modal);

        this.modal.animate([
            { transform: 'scale(0.7)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            fill: 'forwards'
        });

        this.modalBackground.animate([
            { opacity: 0, backdropFilter: 'blur(0px)' },
            { opacity: 1, backdropFilter: 'blur(4px)' }
        ], {
            duration: 250,
            easing: 'ease-out',
            fill: 'forwards'
        });

        this._createElements(this.modal, this.content);
    }

    remove() {
        const bgAnimation = this.modalBackground.animate([
            { opacity: 1, backdropFilter: 'blur(4px)' },
            { opacity: 0, backdropFilter: 'blur(0px)' }
        ], {
            duration: 200,
            easing: 'ease-in',
            fill: 'forwards'
        });

        const modalAnimation = this.modal.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(0.97)', opacity: 0 }
        ], {
            duration: 200,
            easing: 'ease-in',
            fill: 'forwards'
        });

        Promise.all([bgAnimation.finished, modalAnimation.finished]).then(() => {
            this.modalBackground.remove();
        });
    }

    _createElements(parent, elements) {
        for (let i = 0; i < elements.length; i++) {
            const elementConfig = elements[i];
            const item = document.createElement(elementConfig.element);
            item.classList.add('modal-item', `modal-${elementConfig.element}`, ...(elementConfig.extraClass ? [elementConfig.extraClass] : []));

            if (elementConfig.text) {
                item.textContent = elementConfig.text;
            }

            if (elementConfig.value) {
                item.value = elementConfig.value;
            }

            if (elementConfig.event && elementConfig.eventAction) {
                item.addEventListener(elementConfig.event, elementConfig.eventAction);
            }

            if (elementConfig.children && Array.isArray(elementConfig.children)) {
                this._createElements(item, elementConfig.children);
            }

            parent.appendChild(item);
        }
    }
}