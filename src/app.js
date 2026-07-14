import { initChatbot } from './features/chatbot/chatbot.js';
import { initOnboarding } from './features/onboarding/onboarding.js';

document.addEventListener('DOMContentLoaded', () => {
    initChatbot(window.imageEditorApi);
    initOnboarding();
});
