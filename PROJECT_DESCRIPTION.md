# Project Description

VisionCraft Studio is a browser-based image processing and photo editing application. Users can upload their own images, apply different filters and effects, perform basic editing operations, and export the final result as PNG or JPG.

## General Structure

The application is mainly built with `index.html`, `about.html`, `script.js`, CSS files, and modular JavaScript files under the `src/` directory. The main page contains the image upload, filtering, editing, onboarding, and chatbot features. The `about.html` page introduces the project and the developer.

Most of the image processing logic is implemented with JavaScript and the HTML Canvas API. The newer interface features, such as the chatbot and onboarding flow, are organized with a feature-based ES Modules architecture.

## Implemented Features

The project combines classic image processing filters, basic editing tools, AI-supported experiments, and a user guidance system. After uploading an image, users can adjust brightness and contrast, apply black-and-white, sepia, negative, mosaic, sketch, cartoon, and watercolor effects.

The application also supports rotation, horizontal and vertical flipping, cropping, resizing, drawing, erasing, sticker insertion, undo/redo actions, and image export. These features are designed to provide a simple but practical browser-based photo editing experience.

An English chatbot is also included in the bottom-right corner of the page. The chatbot greets the user, answers small-talk messages, asks what kind of visual style the user wants, suggests suitable filters, and guides the user to the related menu options.

## Image Processing Logic

The application uses pixel-based operations on the HTML Canvas. After an image is drawn on the canvas, pixel data is accessed with `getImageData`. Filters are applied by changing red, green, blue, and alpha channel values. The updated data is then written back to the canvas with `putImageData`.

This approach allows the filters to run on the client side, directly in the user's browser, without requiring a backend server.

## AI-Supported Sections

TensorFlow.js and COCO-SSD are used for experimental AI-supported features such as object detection. After uploading an image, users can run object detection and see detected objects marked with bounding boxes.

Background removal and image repair features are also included as prototype-level tools. These areas can be improved with more stable model integration, additional AI models, and performance optimization.

## Developer

This project was developed by Batuhan Karatobak. The image processing functions, Canvas operations, filter logic, user interface behavior, export features, chatbot guidance, onboarding flow, and modular architecture were designed and implemented as part of an individual graduation project.

## Known Limitations and Future Improvements

The project is publishable in its current state, but some areas are still open for improvement:

- Improve the stability of advanced AI filters.
- Complete missing model connections for experimental AI features.
- Improve mobile responsiveness.
- Optimize performance for large images.
- Move more image processing logic into dedicated modules.
- Replace inline HTML event handlers with modular JavaScript event bindings.
- Update social media links with real profile URLs.

This version is suitable as an academic graduation project and as a portfolio project that demonstrates browser-based image processing, Canvas API usage, modular frontend architecture, and interactive user guidance.
