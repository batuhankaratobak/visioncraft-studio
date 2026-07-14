export function $(selector, root = document) {
    return root.querySelector(selector);
}

export function createElement(tagName, options = {}) {
    const element = document.createElement(tagName);

    if (options.className) {
        element.className = options.className;
    }

    if (options.text) {
        element.textContent = options.text;
    }

    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }

    return element;
}

export function highlightElement(element) {
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('chatbot-highlight');

    window.setTimeout(() => {
        element.classList.remove('chatbot-highlight');
    }, 2500);
}
