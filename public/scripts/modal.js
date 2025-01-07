class Modal {
    /**
     * Create a modal
     * @param {Record<string, any>[]} content - Add contents to the modal
     */
    constructor(content) {
        this.content = content;

        this.modalBackground = document.createElement('div');
        this.modalBackground.classList.add('modal-background');
        document.body.appendChild(this.modalBackground);

        this.modal = document.createElement('div');
        this.modal.classList.add('modal-foreground');
        this.modalBackground.appendChild(this.modal);

        const bounceKeyframes = [
            { transform: 'scale(0.9)', opacity: 0 },
            { transform: 'scale(1.1)', opacity: 1, offset: 0.5 },
            { transform: 'scale(1)', opacity: 1 }
        ];

        const bounceAnimationOptions = {
            duration: 600,
            easing: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
            fill: 'forwards'
        };

        this.modal.animate(bounceKeyframes, bounceAnimationOptions);

        const fadeInKeyframes = [
            { opacity: 0 },
            { opacity: 1 }
        ];

        const fadeInOptions = {
            duration: 300,
            easing: 'ease-in',
            fill: 'forwards'
        };

        this.modalBackground.animate(fadeInKeyframes, fadeInOptions);

        this._createElements(this.modal, this.content);
    }

    /**
     * Recursively create elements and their children
     * @param {HTMLElement} parent - The parent element to append children to
     * @param {Record<string, any>[]} elements - The elements to create
     */
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

    remove() {
        const fadeOutKeyframes = [
            { opacity: 1 },
            { opacity: 0 }
        ];

        const fadeOutOptions = {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        };

        this.modalBackground.animate(fadeOutKeyframes, fadeOutOptions).onfinish = () => {

            this.modalBackground.remove();
        };
    }
}