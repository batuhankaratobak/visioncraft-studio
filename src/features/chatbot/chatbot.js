import { $, createElement, highlightElement } from '../../shared/dom.js';

const recommendations = {
    artistic: {
        label: 'Artistic',
        message: 'For an artistic look, I recommend Watercolor, Cartoon, or Sketch. Which one would you like to try?',
        options: [
            { label: 'Watercolor', type: 'filter', value: 'watercolor' },
            { label: 'Cartoon', type: 'filter', value: 'cartoon' },
            { label: 'Sketch', type: 'filter', value: 'sketch' }
        ]
    },
    vintage: {
        label: 'Vintage',
        message: 'For a vintage style, Sepia is the best first choice. Black & White also works well for a classic photo.',
        options: [
            { label: 'Sepia', type: 'filter', value: 'sepia' },
            { label: 'Black & White', type: 'filter', value: 'grayscale' },
            { label: 'Fade', type: 'effect', value: 'fade' }
        ]
    },
    clean: {
        label: 'Clean up',
        message: 'If you want a cleaner image, try Repair Image, Enhance Details, Sharpen, or Fix Shadows.',
        options: [
            { label: 'Repair Image', type: 'command', value: 'repairImage' },
            { label: 'Enhance Details', type: 'effect', value: 'enhance-details' },
            { label: 'Sharpen', type: 'effect', value: 'sharpen' },
            { label: 'Fix Shadows', type: 'effect', value: 'fix-shadows' }
        ]
    },
    fun: {
        label: 'Fun',
        message: 'For a playful edit, you can use Mosaic, Negative, Sticker Maker, or the Surprise button.',
        options: [
            { label: 'Mosaic', type: 'filter', value: 'mosaic' },
            { label: 'Negative', type: 'filter', value: 'negative' },
            { label: 'Sticker Maker', type: 'filter', value: 'sticker' },
            { label: 'Surprise', type: 'command', value: 'applyRandomFilter' }
        ]
    },
    ai: {
        label: 'AI',
        message: 'For AI-supported tools, you can detect objects, remove the background, or repair the image.',
        options: [
            { label: 'Detect Objects', type: 'command', value: 'detectObjects' },
            { label: 'Remove Background', type: 'command', value: 'removeBackground' },
            { label: 'Repair Image', type: 'command', value: 'repairImage' }
        ]
    }
};

export function initChatbot(editorApi = window.imageEditorApi) {
    const widget = $('#chatbotWidget');
    const toggle = $('#chatbotToggle');
    const close = $('#chatbotClose');
    const form = $('#chatbotForm');
    const input = $('#chatbotInput');
    const quickActions = $('#chatbotQuickActions');

    if (!widget || !toggle || !close || !form || !input || !quickActions || !editorApi) return;

    toggle.addEventListener('click', () => {
        widget.classList.toggle('open');

        if (widget.classList.contains('open') && !widget.dataset.started) {
            widget.dataset.started = 'true';
            addMessage('bot', 'Hello! I am your Image Assistant. I can help you choose a filter, explain tools, or guide you through editing your photo.', getStarterOptions());
        }

        if (widget.classList.contains('open')) {
            input.focus();
        }
    });

    close.addEventListener('click', () => {
        widget.classList.remove('open');
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        const message = input.value.trim();
        if (!message) return;

        addMessage('user', message);
        input.value = '';
        handleInput(message, editorApi);
    });

    quickActions.addEventListener('click', event => {
        const button = event.target.closest('[data-chat-action]');
        if (!button) return;

        handleAction(button.dataset.chatAction, editorApi);
    });
}

function getStarterOptions() {
    return [
        { label: 'Recommend a filter', action: 'recommend' },
        { label: 'Artistic style', action: 'artistic' },
        { label: 'Fix my photo', action: 'clean' },
        { label: 'AI tools', action: 'ai' }
    ];
}

function addMessage(sender, text, options = []) {
    const messages = $('#chatbotMessages');
    if (!messages) return;

    const message = createElement('div', {
        className: `chatbot-message ${sender}`,
        text
    });

    if (options.length > 0) {
        const suggestions = createElement('div', { className: 'chatbot-suggestions' });

        options.forEach(option => {
            const button = createElement('button', { text: option.label });
            button.type = 'button';
            button.addEventListener('click', () => {
                if (option.action) {
                    handleAction(option.action, window.imageEditorApi);
                } else {
                    applyOption(option, window.imageEditorApi);
                }
            });
            suggestions.appendChild(button);
        });

        message.appendChild(suggestions);
    }

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

function handleInput(message, editorApi) {
    const normalized = message.toLowerCase();

    if (matchesAny(normalized, ['hello', 'hi', 'hey', 'good morning', 'good evening'])) {
        addMessage('bot', 'Hello! Tell me what kind of look you want, or choose one of the options below.', getStarterOptions());
        return;
    }

    if (matchesAny(normalized, ['thanks', 'thank you', 'thx'])) {
        addMessage('bot', 'You are welcome! I can suggest another filter whenever you want.');
        return;
    }

    if (matchesAny(normalized, ['help', 'what can you do', 'how'])) {
        addMessage('bot', 'I can recommend filters, explain editing tools, and point you to the right menu button. Upload an image first, then choose a style.', getStarterOptions());
        return;
    }

    if (matchesAny(normalized, ['art', 'artistic', 'paint', 'watercolor', 'cartoon', 'sketch'])) {
        handleAction('artistic', editorApi);
        return;
    }

    if (matchesAny(normalized, ['old', 'vintage', 'retro', 'sepia', 'classic', 'black and white', 'black white'])) {
        handleAction('vintage', editorApi);
        return;
    }

    if (matchesAny(normalized, ['fix', 'repair', 'clean', 'sharp', 'sharpen', 'shadow', 'enhance', 'better'])) {
        handleAction('clean', editorApi);
        return;
    }

    if (matchesAny(normalized, ['fun', 'mosaic', 'negative', 'sticker', 'surprise'])) {
        handleAction('fun', editorApi);
        return;
    }

    if (matchesAny(normalized, ['ai', 'object', 'detect', 'background', 'remove background'])) {
        handleAction('ai', editorApi);
        return;
    }

    addMessage('bot', 'I can help with that. Do you want an artistic, vintage, clean, fun, or AI-supported edit?', getStarterOptions());
}

function handleAction(action, editorApi) {
    if (action === 'recommend') {
        addMessage('bot', 'What kind of result do you want for your image?', [
            { label: 'Artistic', action: 'artistic' },
            { label: 'Vintage', action: 'vintage' },
            { label: 'Cleaner photo', action: 'clean' },
            { label: 'Fun edit', action: 'fun' },
            { label: 'AI tools', action: 'ai' }
        ]);
        return;
    }

    const recommendation = recommendations[action];
    if (!recommendation) return;

    addMessage('user', recommendation.label);
    addMessage('bot', recommendation.message, recommendation.options);
    highlightRelevantMenu(action);
}

function applyOption(option, editorApi) {
    if (!editorApi?.hasImage()) {
        addMessage('bot', 'Please upload an image first. After that, choose this option again and I will apply or guide you to the selected tool.');
        highlightElement($('#imageInput'));
        return;
    }

    if (option.type === 'filter') {
        editorApi.applyFilter(option.value);
        addMessage('bot', `${option.label} has been applied. You can download the result or try another effect.`);
        highlightFilterButton(option.value);
        return;
    }

    if (option.type === 'effect') {
        editorApi.applyImageEffect(option.value);
        addMessage('bot', `${option.label} has been applied. You can click it again for a stronger effect.`);
        highlightEffectButton(option.value);
        return;
    }

    if (option.type === 'command' && typeof editorApi[option.value] === 'function') {
        editorApi[option.value]();
        addMessage('bot', `${option.label} is selected from the menu.`);
        highlightCommandButton(option.value);
    }
}

function matchesAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

function highlightRelevantMenu(action) {
    if (action === 'clean') {
        highlightElement($('.sidebar-item'));
    } else {
        highlightElement($('.sidebar'));
    }
}

function highlightFilterButton(filterType) {
    highlightElement($(`button[onclick="applyFilter('${filterType}')"]`));
}

function highlightEffectButton(effectType) {
    highlightElement($(`[data-filter="${effectType}"]`));
}

function highlightCommandButton(functionName) {
    highlightElement($(`button[onclick="${functionName}()"]`));
}
