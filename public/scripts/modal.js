class Modal {
    constructor(content) {
        this.content = content;

        this.modalBackground = document.createElement('div');
        this.modalBackground.classList.add('modal-background');
        this.modalBackground.style.opacity = '0';

        this.modal = document.createElement('div');
        this.modal.classList.add('modal-foreground');
        this.modal.style.opacity = '0';
        this.modal.style.transform = 'scale(0.7)';

        this.modalBackground.appendChild(this.modal);
        document.body.appendChild(this.modalBackground);

        const prefersReducedMotion = document.documentElement.classList.contains('reduced-motion');

        if (!prefersReducedMotion) {
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
        } else {
            this.modalBackground.style.opacity = '1';
            this.modal.style.opacity = '1';
            this.modal.style.transform = 'scale(1)';
        }

        this._createElements(this.modal, this.content);
    }

    remove() {
        const prefersReducedMotion = document.documentElement.classList.contains('reduced-motion');

        if (!prefersReducedMotion) {
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
                if (this.modalBackground.parentNode) {
                    this.modalBackground.remove();
                }
            }).catch(error => {
                console.warn("Modal removal animation interrupted or failed:", error);
                if (this.modalBackground.parentNode) {
                    this.modalBackground.remove();
                }
            });

        } else {
             if (this.modalBackground.parentNode) {
                 this.modalBackground.remove();
             }
        }
    }

    _createElements(parent, elements) {
        if (!elements || !Array.isArray(elements)) {
            console.error("Invalid elements array passed to _createElements:", elements);
            return;
        }
        elements.forEach(elementConfig => {
            if (!elementConfig || typeof elementConfig.element !== 'string') {
                 console.error("Invalid element configuration:", elementConfig);
                 return;
            }
            try {
                const item = document.createElement(elementConfig.element);
                item.classList.add('modal-item', `modal-${elementConfig.element}`);
                if (elementConfig.extraClass) {
                    const classes = Array.isArray(elementConfig.extraClass) ? elementConfig.extraClass : [elementConfig.extraClass];
                    item.classList.add(...classes);
                }

                if (elementConfig.text !== undefined) {
                    item.textContent = elementConfig.text;
                }

                if (elementConfig.value !== undefined) {
                    item.value = elementConfig.value;
                }

                if (elementConfig.event && elementConfig.eventAction) {
                    item.addEventListener(elementConfig.event, elementConfig.eventAction);
                }

                if (elementConfig.children && Array.isArray(elementConfig.children)) {
                    this._createElements(item, elementConfig.children);
                }

                parent.appendChild(item);
            } catch (e) {
                 console.error("Error creating modal element:", elementConfig, e);
            }
        });
    }

    get element() {
        return this.modalBackground;
    }
}