# Architecture

This project uses a lightweight feature-based ES Modules architecture. The application is still a static browser project, but the interactive UI features are separated into small modules instead of being placed inside a single large JavaScript file.

## Architecture Style

- Static web application
- Feature-based folder structure
- ES Modules for modern browser code
- Canvas-based image processing core
- Small public API bridge between legacy canvas functions and modular UI features

## Folder Structure

```text
.
├── index.html
├── about.html
├── script.js
├── styles
│   ├── index.css
│   └── navbar.css
├── src
│   ├── app.js
│   ├── features
│   │   ├── chatbot
│   │   │   └── chatbot.js
│   │   └── onboarding
│   │       └── onboarding.js
│   └── shared
│       └── dom.js
└── docs
    └── ARCHITECTURE.md
```

## Responsibilities

### `script.js`

Contains the image processing and canvas editing logic:

- Classic image filters
- AI-supported image tools
- Canvas drawing
- Crop and resize
- Rotate and flip
- Sticker editing
- Download logic

At the end of the file, `window.imageEditorApi` exposes the functions required by modular UI features.

### `src/app.js`

The modern entry point of the application. It initializes feature modules after the page is loaded.

### `src/features/chatbot/chatbot.js`

Contains the Image Assistant behavior:

- Small talk responses
- Filter recommendations
- Quick action buttons
- Calls into `window.imageEditorApi`
- Highlights related menu items

### `src/features/onboarding/onboarding.js`

Contains the page introduction flow:

- First-visit onboarding
- UI area highlighting
- Chatbot button introduction
- Versioned localStorage key

### `src/shared/dom.js`

Contains small reusable DOM helpers used by feature modules.

## Why This Architecture?

This structure keeps the project simple enough to run by opening `index.html`, while making the codebase look and feel closer to a modern frontend project. It improves readability, separates responsibilities, and makes future features easier to add without rewriting the full application.

## Future Improvements

- Move canvas image processing functions into dedicated modules.
- Replace inline HTML event handlers with JavaScript event bindings.
- Add automated browser tests for key user flows.
- Add a build tool such as Vite if the project grows beyond static hosting needs.
