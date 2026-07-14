import { $ } from '../../shared/dom.js';

const ONBOARDING_STORAGE_KEY = 'onboardingShown_v2';

const onboardingSteps = [
    {
        text: 'Welcome! With this app you can easily add filters and effects to your photos.',
        target: null
    },
    {
        text: 'You can apply classic and AI-supported filters from the menu on the left.',
        target: '.sidebar'
    },
    {
        text: 'After uploading the photo, you can use editing tools such as cropping, rotating, undo/redo.',
        target: '.edit-controls'
    },
    {
        text: 'You can preview the effects before applying them, and try random filters with the surprise button!',
        target: '.sidebar .filter-heading'
    },
    {
        text: 'Need help choosing a style? Use the Image Assistant button in the bottom-right corner to get filter suggestions and quick guidance.',
        target: '#chatbotToggle'
    },
    {
        text: 'You are ready to start. Upload an image, choose a style, and have fun editing!',
        target: null
    }
];

export function initOnboarding() {
    if (localStorage.getItem(ONBOARDING_STORAGE_KEY)) return;
    showOnboarding();
}

function showOnboarding() {
    let onboardingStep = 0;
    const modal = $('#onboardingModal');
    const stepText = $('#onboardingStepText');
    const nextBtn = $('#onboardingNext');
    const closeBtn = $('#onboardingClose');
    const highlight = $('#onboardingHighlight');
    const arrow = $('#onboardingArrow');

    if (!modal || !stepText || !nextBtn || !closeBtn || !highlight || !arrow) return;

    function closeOnboarding() {
        modal.style.display = 'none';
        highlight.style.display = 'none';
        arrow.style.display = 'none';
        localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
    }

    function updateStep() {
        const step = onboardingSteps[onboardingStep];
        stepText.innerText = step.text;
        highlight.style.display = 'none';
        arrow.style.display = 'none';

        if (step.target) {
            const targetElement = $(step.target);

            if (targetElement) {
                positionOnboardingNearTarget({
                    modal,
                    highlight,
                    arrow,
                    targetElement
                });
            }
        } else {
            centerOnboarding(modal, highlight, arrow);
        }
    }

    modal.style.display = 'flex';
    updateStep();

    nextBtn.onclick = function() {
        onboardingStep++;

        if (onboardingStep < onboardingSteps.length) {
            updateStep();
        } else {
            closeOnboarding();
        }
    };

    closeBtn.onclick = closeOnboarding;
}

function positionOnboardingNearTarget({ modal, highlight, arrow, targetElement }) {
    const rect = targetElement.getBoundingClientRect();

    highlight.style.display = 'block';
    highlight.style.left = rect.left - 8 + 'px';
    highlight.style.top = rect.top - 8 + 'px';
    highlight.style.width = rect.width + 16 + 'px';
    highlight.style.height = rect.height + 16 + 'px';
    highlight.style.border = '4px solid #40E0D0';
    highlight.style.borderRadius = '16px';
    highlight.style.boxShadow = '0 0 32px 8px #40E0D088, 0 0 0 9999px rgba(0,0,0,0.5)';
    highlight.style.transition = 'all 0.3s cubic-bezier(.4,2,.6,1)';
    highlight.style.pointerEvents = 'none';
    highlight.style.zIndex = '10000';

    arrow.style.display = 'block';
    arrow.style.width = '60px';
    arrow.style.height = '60px';
    arrow.innerHTML = '<svg width="60" height="60"><polygon points="30,0 60,60 0,60" fill="#40E0D0"/></svg>';

    if (rect.top > 100) {
        arrow.style.left = rect.left + rect.width / 2 - 30 + 'px';
        arrow.style.top = rect.top - 70 + 'px';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        arrow.style.left = rect.left - 70 + 'px';
        arrow.style.top = rect.top + rect.height / 2 - 30 + 'px';
        arrow.style.transform = 'rotate(-90deg)';
    }

    arrow.style.zIndex = '10001';

    const modalBox = modal.children[0];
    const modalWidth = 400;
    const modalHeight = 220;
    let left = rect.left + rect.width + 24;
    let top = rect.top;

    if (left + modalWidth > window.innerWidth) {
        left = rect.left - modalWidth - 24;
    }

    if (left < 0) {
        left = rect.left;
        top = rect.top + rect.height + 24;
    }

    if (top + modalHeight > window.innerHeight) {
        left = (window.innerWidth - modalWidth) / 2;
        top = (window.innerHeight - modalHeight) / 2;
    }

    left = Math.max(16, Math.min(left, window.innerWidth - modalWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - modalHeight - 16));

    modal.style.justifyContent = 'flex-start';
    modal.style.alignItems = 'flex-start';
    modal.style.display = 'flex';
    modal.style.zIndex = '10002';
    modal.style.pointerEvents = 'auto';

    modalBox.style.position = 'absolute';
    modalBox.style.left = left + 'px';
    modalBox.style.top = top + 'px';
    modalBox.style.zIndex = '10003';
    modalBox.style.pointerEvents = 'auto';
    modalBox.style.margin = '0';
}

function centerOnboarding(modal, highlight, arrow) {
    highlight.style.display = 'none';
    arrow.style.display = 'none';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10002';
    modal.style.pointerEvents = 'auto';
    modal.children[0].style.position = 'static';
    modal.children[0].style.margin = 'auto';
    modal.children[0].style.left = '';
    modal.children[0].style.top = '';
    modal.children[0].style.zIndex = '10003';
    modal.children[0].style.pointerEvents = 'auto';
}
