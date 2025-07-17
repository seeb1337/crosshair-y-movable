class Modal {
    constructor(content) {
        this.content = content;

        this.modalBackground = document.createElement('div');
        this.modalBackground.classList.add('modal-background');
        this.modalBackground.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 999;
            background: rgba(0, 0, 0, 0.45);
            opacity: 0;
            -webkit-backdrop-filter: blur(0px);
            backdrop-filter: blur(0px);
            will-change: opacity, backdrop-filter;
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
        `;

        this.modal = document.createElement('div');
        this.modal.classList.add('modal-foreground');
        this.modal.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            min-width: 280px;
            max-width: 90vw;
            background: #181818;
            border-radius: 12px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
            opacity: 0;
            -webkit-transform: translate(-50%, -50%) scale(0.85);
            transform: translate(-50%, -50%) scale(0.85);
            will-change: transform, opacity;
            -webkit-transform-origin: center;
            transform-origin: center;
            -webkit-transform-style: preserve-3d;
            transform-style: preserve-3d;
        `;

        this.modalBackground.appendChild(this.modal);
        document.body.appendChild(this.modalBackground);

        const prefersReducedMotion =
            localStorage.getItem('reduced-motion') === 'true' ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
            this.modalBackground.animate(
                [
                    { opacity: 0, backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' },
                    { opacity: 1, backdropFilter: 'blur(12px)', webkitBackdropFilter: 'blur(12px)' }
                ],
                { duration: 400, easing: 'cubic-bezier(.36,.66,.4,1)', fill: 'forwards' }
            );

            this.modal.animate(
                [
                    { transform: 'translate(-50%,-50%) scale(.85)', opacity: 0 },
                    { transform: 'translate(-50%,-50%) scale(1.02)', opacity: 1, offset: .7 },
                    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }
                ],
                { duration: 420, easing: 'cubic-bezier(.36,.66,.4,1)', fill: 'forwards' }
            );
        } else {
            this.modalBackground.style.opacity = '1';
            this.modal.style.opacity = '1';
            this.modal.style.transform = 'translate(-50%,-50%) scale(1)';
        }

        this._createElements(this.modal, this.content);
    }

    remove() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
            Promise.all([
                this.modalBackground.animate(
                    [
                        { opacity: 1, backdropFilter: 'blur(12px)', webkitBackdropFilter: 'blur(12px)' },
                        { opacity: 0, backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' }
                    ],
                    { duration: 260, easing: 'cubic-bezier(.4,0,.6,.4)', fill: 'forwards' }
                ).finished,

                this.modal.animate(
                    [
                        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                        { transform: 'translate(-50%,-50%) scale(.97)', opacity: 0 }
                    ],
                    { duration: 260, easing: 'cubic-bezier(.4,0,.6,.4)', fill: 'forwards' }
                ).finished
            ]).finally(() => this.modalBackground.remove());
        } else {
            this.modalBackground.remove();
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