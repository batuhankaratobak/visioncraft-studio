# VisionCraft Studio

VisionCraft Studio is a browser-based image filtering and photo editing application that I developed as a graduation project. The main idea is simple: upload an image, try different filters or editing tools, and export the edited result as PNG or JPG.

The project is built with HTML, CSS, JavaScript, the Canvas API, and a lightweight feature-based ES Modules structure. I also added a small rule-based Image Assistant that helps users choose filters based on the style they want.

## Live Demo

You can try the project here:

[VisionCraft Studio Live Demo](https://visioncraft-studio-app.vercel.app/index.html)

## Screenshots

### Main Editor

![VisionCraft Studio main editor](docs/screenshots/main-editor.png)

### Image Assistant

![VisionCraft Studio image assistant](docs/screenshots/chatbot-assistant.png)

## What It Can Do

- Upload an image and preview it on a canvas
- Apply classic image filters
- Adjust brightness and contrast
- Rotate and flip images
- Crop and resize selected areas
- Use undo and redo
- Draw on the image
- Use an eraser
- Add and resize stickers
- Export the result as PNG or JPG
- Get filter suggestions from the built-in Image Assistant
- See a short onboarding guide when the app is opened for the first time

## Filters and Effects

The project includes several image filters and effects:

- Sketch
- Cartoon
- Color Separate
- Sepia
- Negative
- Black & White
- Mosaic
- Watercolor
- Sticker Maker
- Enhance Details
- Sharpen
- Blur
- Fix Shadows
- Increase Vibrance
- Color Tone
- Fade
- Repair Image

## AI-Supported Experiments

I experimented with TensorFlow.js and COCO-SSD for AI-supported image features. The object detection feature can detect objects on the uploaded image and draw bounding boxes around them.

Some AI-related parts, such as style transfer, face beautification, portrait effects, and smart enhancement, are still prototype-level ideas in the codebase. I kept them in the project because they show the direction I wanted to explore, but they may need more stable model integration before being treated as production-ready features.

## Tech Stack

- HTML5
- CSS3
- JavaScript
- ES Modules
- Canvas API
- TensorFlow.js
- COCO-SSD
- MediaPipe
- Font Awesome

## Architecture

The image processing and canvas editing logic is mostly kept in `script.js`. Newer UI features are organized under `src/` using a feature-based ES Modules structure:

- `src/app.js` initializes the modular features.
- `src/features/chatbot/chatbot.js` contains the Image Assistant logic.
- `src/features/onboarding/onboarding.js` contains the first-visit onboarding flow.
- `src/shared/dom.js` contains small reusable DOM helpers.

More details are available in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Project Structure

```text
.
├── index.html
├── about.html
├── script.js
├── style.css
├── background.jpg
├── batuhan-profile.jpeg
├── docs
│   ├── ARCHITECTURE.md
│   └── screenshots
│       ├── chatbot-assistant.png
│       └── main-editor.png
├── src
│   ├── app.js
│   ├── features
│   │   ├── chatbot
│   │   │   └── chatbot.js
│   │   └── onboarding
│   │       └── onboarding.js
│   └── shared
│       └── dom.js
└── styles
    ├── index.css
    └── navbar.css
```

## How to Run Locally

Because the project uses ES Modules, it should be opened through a small local server instead of opening `index.html` directly.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Notes

- The Image Assistant does not use any paid API or API key. It is a rule-based chatbot that runs in the browser.
- Some AI-supported features load external libraries or models from CDNs, so they may require an internet connection.
- This is an academic and portfolio project. Some experimental features are included to show possible future development directions.

## Future Improvements

- Move more image processing logic into smaller modules.
- Replace inline HTML event handlers with modular JavaScript event listeners.
- Improve mobile responsiveness.
- Add before/after image comparison.
- Make the AI-supported features more stable.
- Add automated browser tests for important user flows.
