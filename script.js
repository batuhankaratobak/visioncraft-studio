let imgElement = new Image();
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let lastAppliedState = null;

// Global variables for history state
let undoStack = [];
let redoStack = [];
const maxStackSize = 10;  // Maximum history size

// Global variables for brightness and contrast
let brightness = 0;
let contrast = 0;

// Tone toggle state
let isPinkTone = true;  // Controls pink/blue tone switching

// Global variable for image rotation
let currentRotation = 0;

// --- Canvas Crop & Resize with Mouse Selection ---
let selectionMode = null; // 'crop' or 'resize'
let isSelecting = false;
let selectStart = {x:0, y:0};
let selectEnd = {x:0, y:0};

function enableSelection(mode) {
    selectionMode = mode;
    canvas.style.cursor = 'crosshair';
}

canvas.addEventListener('mousedown', function(e) {
    if (!selectionMode) return;
    isSelecting = true;
    const rect = canvas.getBoundingClientRect();
    selectStart.x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    selectStart.y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    selectEnd = {...selectStart};
});

canvas.addEventListener('mousemove', function(e) {
    if (!isSelecting) return;
    const rect = canvas.getBoundingClientRect();
    selectEnd.x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    selectEnd.y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    // Redraw
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    drawSelectionRect();
});

canvas.addEventListener('mouseup', function(e) {
    if (!isSelecting) return;
    isSelecting = false;
    const x = Math.min(selectStart.x, selectEnd.x);
    const y = Math.min(selectStart.y, selectEnd.y);
    const w = Math.abs(selectEnd.x - selectStart.x);
    const h = Math.abs(selectEnd.y - selectStart.y);
    if (w < 5 || h < 5) {
        selectionMode = null;
        canvas.style.cursor = 'default';
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        return;
    }
    saveState();
    if (selectionMode === 'crop') {
        let cropped = ctx.getImageData(x, y, w, h);
        canvas.width = w;
        canvas.height = h;
        ctx.putImageData(cropped, 0, 0);
    } else if (selectionMode === 'resize') {
        let cropped = ctx.getImageData(x, y, w, h);
        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        let tempCtx = tempCanvas.getContext('2d');
        // Scale the selected area to the full canvas
        let temp = document.createElement('canvas');
        temp.width = w;
        temp.height = h;
        temp.getContext('2d').putImageData(cropped, 0, 0);
        tempCtx.drawImage(temp, 0, 0, canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
    }
    selectionMode = null;
    canvas.style.cursor = 'default';
});

function drawSelectionRect() {
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.setLineDash([6]);
    const x = Math.min(selectStart.x, selectEnd.x);
    const y = Math.min(selectStart.y, selectEnd.y);
    const w = Math.abs(selectEnd.x - selectStart.x);
    const h = Math.abs(selectEnd.y - selectStart.y);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}

function cropImage() {
    enableSelection('crop');
}
function resizeImage() {
    enableSelection('resize');
}
// --- END Canvas Crop & Resize ---

// Image upload handler
document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imgElement.onload = function() {
                // Canvas boyutunu ayarla
                canvas.width = imgElement.width;
                canvas.height = imgElement.height;
                ctx.drawImage(imgElement, 0, 0);
                saveState();
                redrawCanvasWithStickers();
            };
            imgElement.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Download handlers
document.getElementById('downloadPNG').addEventListener('click', () => downloadImage('png'));
document.getElementById('downloadJPG').addEventListener('click', () => downloadImage('jpeg'));

function downloadImage(format = 'png') {
    if (!canvas || !ctx || !imgElement.src) {
        alert('Please upload an image first!');
        return;
    }

    redrawCanvasWithStickers();
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    const dataURL = canvas.toDataURL(mimeType, 0.9);
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `filtered-image.${extension}`;
    link.click();
}

function saveSettings() {
    downloadImage('png');
}

function reloadPage() {
    window.location.href = 'index.html';
}


// Brightness and contrast adjustments
function applyAdjustments() {
    if (!canvas || !ctx || !imgElement.src) {
        alert('Please upload an image first!');
        return;
    }

    // Mevcut durumu kaydet
    saveState();

    // Get values
    brightness = parseInt(document.getElementById('brightnessRange').value, 10);
    contrast = parseInt(document.getElementById('contrastRange').value, 10);

    // Redraw the original image
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    
    // Apply adjustments
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Brightness adjustment
        data[i] = adjustPixel(data[i] + brightness);     // Red
        data[i + 1] = adjustPixel(data[i + 1] + brightness); // Green
        data[i + 2] = adjustPixel(data[i + 2] + brightness); // Mavi

        // Contrast adjustment
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        data[i] = adjustPixel(factor * (data[i] - 128) + 128);
        data[i + 1] = adjustPixel(factor * (data[i + 1] - 128) + 128);
        data[i + 2] = adjustPixel(factor * (data[i + 2] - 128) + 128);
    }

    ctx.putImageData(imageData, 0, 0);
    lastAppliedState = imageData;
}

// Keep the pixel value between 0 and 255
function adjustPixel(value) {
    return Math.min(255, Math.max(0, value));
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    const brightnessRange = document.getElementById('brightnessRange');
    const contrastRange = document.getElementById('contrastRange');

    brightnessRange.addEventListener('input', applyAdjustments);
    contrastRange.addEventListener('input', applyAdjustments);
});

// Filtre Uygulama
function applyFilter(filterType) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height); // Redraw the image

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    switch (filterType) {
        case 'sketch':
            sketchEffect(data);
            break;
        case 'cartoon':
            cartoonEffect(data);
            break;
        case 'oilpaint':
            oilPaintEffect(data);
            break;
        case 'colorseparate':
            colorSeparateEffect(data);
            break;
        case 'sepia':
            sepiaEffect(data);
            break;
        case 'negative':
            negativeEffect(data);
            break;
        case 'grayscale':
            grayscaleEffect(data);
            break;
        case 'mosaic':
            mosaicEffect(data, canvas.width);
            break;
        case 'watercolor':
            watercolorEffect(data, canvas.width, canvas.height);
            break;
        case 'sticker':
            stickerMakerEffect(data);
            break;
        default:
            break;
    }

    ctx.putImageData(imageData, 0, 0); // Apply changes to the canvas
}

// Sketch effect
function sketchEffect(data) {
    for (let i = 0; i < data.length; i += 4) {
        let grayscale = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = grayscale > 128 ? 255 : 0;
        data[i + 1] = grayscale > 128 ? 255 : 0;
        data[i + 2] = grayscale > 128 ? 255 : 0;
    }
}

// Cartoon Efekti
function cartoonEffect(data) {
    for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = Math.round(avg / 50) * 50;
        data[i + 1] = Math.round(avg / 50) * 50;
        data[i + 2] = Math.round(avg / 50) * 50;
    }
}

// Oil paint effect
function oilPaintEffect(data) {
    let pixelSize = 5;
    let width = canvas.width;
    for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
            let r = 0, g = 0, b = 0, count = 0;
            for (let dy = 0; dy < pixelSize; dy++) {
                for (let dx = 0; dx < pixelSize; dx++) {
                    let px = ((y + dy) * width + (x + dx)) * 4;
                    if (px < data.length) {
                        r += data[px];
                        g += data[px + 1];
                        b += data[px + 2];
                        count++;
                    }
                }
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            for (let dy = 0; dy < pixelSize; dy++) {
                for (let dx = 0; dx < pixelSize; dx++) {
                    let px = ((y + dy) * width + (x + dx)) * 4;
                    if (px < data.length) {
                        data[px] = r;
                        data[px + 1] = g;
                        data[px + 2] = b;
                    }
                }
            }
        }
    }
}

// Color separation effect
function colorSeparateEffect(data) {
    for (let i = 0; i < data.length; i += 4) {
        data[i + 1] = 0; // Reset green channel
        data[i + 2] = 0; // Reset blue channel
    }
}

// Sepya Efekti
function sepiaEffect(data) {
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        data[i] = r * 0.393 + g * 0.769 + b * 0.189; // R
        data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168; // G
        data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131; // B
    }
}

// Negatif Efekt
function negativeEffect(data) {
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
    }
}

function grayscaleEffect(data) {
    for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
    }
}

function mosaicEffect(data, width) {
    const blockSize = 10; // Mozaik blok boyutu
    for (let y = 0; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
            let r = 0, g = 0, b = 0, count = 0;
            for (let dy = 0; dy < blockSize; dy++) {
                for (let dx = 0; dx < blockSize; dx++) {
                    const px = ((y + dy) * width + (x + dx)) * 4;
                    if (px < data.length) {
                        r += data[px];
                        g += data[px + 1];
                        b += data[px + 2];
                        count++;
                    }
                }
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            for (let dy = 0; dy < blockSize; dy++) {
                for (let dx = 0; dx < blockSize; dx++) {
                    const px = ((y + dy) * width + (x + dx)) * 4;
                    if (px < data.length) {
                        data[px] = r;
                        data[px + 1] = g;
                        data[px + 2] = b;
                    }
                }
            }
        }
    }
}

// --- Improved Watercolor Effect (Realistic) ---
function watercolorEffect(data, width, height) {
    // 1. Strong Gaussian blur (2 pass)
    let blurred = new Uint8ClampedArray(data);
    const kernel = [1, 4, 6, 4, 1];
    const kernelSum = 16;
    // Horizontal blur (twice)
    for (let pass = 0; pass < 2; pass++) {
        let temp = new Uint8ClampedArray(blurred);
        for (let y = 0; y < height; y++) {
            for (let x = 2; x < width-2; x++) {
                let r=0,g=0,b=0;
                for (let k=-2; k<=2; k++) {
                    let idx = (y*width + (x+k))*4;
                    r += temp[idx]*kernel[k+2];
                    g += temp[idx+1]*kernel[k+2];
                    b += temp[idx+2]*kernel[k+2];
                }
                let idx = (y*width + x)*4;
                blurred[idx] = r/kernelSum;
                blurred[idx+1] = g/kernelSum;
                blurred[idx+2] = b/kernelSum;
            }
        }
        temp = new Uint8ClampedArray(blurred);
        for (let y = 2; y < height-2; y++) {
            for (let x = 0; x < width; x++) {
                let r=0,g=0,b=0;
                for (let k=-2; k<=2; k++) {
                    let idx = ((y+k)*width + x)*4;
                    r += temp[idx]*kernel[k+2];
                    g += temp[idx+1]*kernel[k+2];
                    b += temp[idx+2]*kernel[k+2];
                }
                let idx = (y*width + x)*4;
                blurred[idx] = r/kernelSum;
                blurred[idx+1] = g/kernelSum;
                blurred[idx+2] = b/kernelSum;
            }
        }
    }
    // 2. Posterize (reduce color levels)
    for (let i = 0; i < data.length; i += 4) {
        blurred[i] = Math.round(blurred[i] / 32) * 32;
        blurred[i+1] = Math.round(blurred[i+1] / 32) * 32;
        blurred[i+2] = Math.round(blurred[i+2] / 32) * 32;
    }
    // 3. Add paper texture (random noise)
    for (let i = 0; i < data.length; i += 4) {
        let noise = (Math.random()-0.5)*18;
        blurred[i] = Math.min(255, Math.max(0, blurred[i] + noise));
        blurred[i+1] = Math.min(255, Math.max(0, blurred[i+1] + noise));
        blurred[i+2] = Math.min(255, Math.max(0, blurred[i+2] + noise));
    }
    // 4. Soft edge blending (Sobel edge, alpha blend)
    let edge = new Uint8ClampedArray(data.length);
    for (let y = 1; y < height-1; y++) {
        for (let x = 1; x < width-1; x++) {
            let idx = (y*width + x)*4;
            let gx = 0, gy = 0;
            for (let c = 0; c < 3; c++) {
                gx += (
                    -1*blurred[((y-1)*width + (x-1))*4+c] + 1*blurred[((y-1)*width + (x+1))*4+c]
                    -2*blurred[(y*width + (x-1))*4+c] + 2*blurred[(y*width + (x+1))*4+c]
                    -1*blurred[((y+1)*width + (x-1))*4+c] + 1*blurred[((y+1)*width + (x+1))*4+c]
                );
                gy += (
                    -1*blurred[((y-1)*width + (x-1))*4+c] -2*blurred[((y-1)*width + x)*4+c] -1*blurred[((y-1)*width + (x+1))*4+c]
                    +1*blurred[((y+1)*width + (x-1))*4+c] +2*blurred[((y+1)*width + x)*4+c] +1*blurred[((y+1)*width + (x+1))*4+c]
                );
            }
            let mag = Math.sqrt(gx*gx + gy*gy)/3;
            edge[idx] = edge[idx+1] = edge[idx+2] = mag > 40 ? 255 : 0;
            edge[idx+3] = 255;
        }
    }
    // 5. Blend edge with color (soft darken)
    for (let i = 0; i < data.length; i += 4) {
        let alpha = edge[i]/255 * 0.5; // 0.5 opacity for edge
        data[i] = blurred[i]*(1-alpha) + 30*alpha;
        data[i+1] = blurred[i+1]*(1-alpha) + 30*alpha;
        data[i+2] = blurred[i+2]*(1-alpha) + 30*alpha;
    }
}
// --- END Improved Watercolor Effect (Realistic) ---

// Sticker Maker Effect (make white or single-color backgrounds transparent)
function stickerMakerEffect(data) {
    // 1. Basic background removal (make white/very light colors transparent)
    let mask = new Uint8Array(data.length/4);
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 220 && data[i+1] > 220 && data[i+2] > 220) {
            data[i+3] = 0;
            mask[i/4] = 0;
        } else {
            mask[i/4] = 1;
        }
    }
    // 2. Create the main object mask with flood fill (find the largest area)
    
    let w = canvas.width, h = canvas.height;
    let visited = new Uint8Array(mask.length);
    let queue = [];
    let cx = Math.floor(w/2), cy = Math.floor(h/2);
    let idx = cy*w+cx;
    if (mask[idx] === 1) {
        queue.push(idx);
        visited[idx] = 1;
    }
    let mainMask = new Uint8Array(mask.length);
    while (queue.length > 0) {
        let i = queue.pop();
        mainMask[i] = 1;
        let x = i%w, y = Math.floor(i/w);
        for (let [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            let nx = x+dx, ny = y+dy, ni = ny*w+nx;
            if (nx>=0 && nx<w && ny>=0 && ny<h && mask[ni]===1 && !visited[ni]) {
                queue.push(ni);
                visited[ni]=1;
            }
        }
    }
    // 3. Remove the background completely (make it transparent)
    for (let i = 0; i < mask.length; i++) {
        if (!mainMask[i]) {
            data[i*4+3] = 0;
        }
    }
    // 4. Draw a thick black outline
    let outline = new Uint8Array(mask.length);
    for (let y = 1; y < h-1; y++) {
        for (let x = 1; x < w-1; x++) {
            let i = y*w+x;
            if (mainMask[i]) {
                for (let [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    let ni = (y+dy)*w+(x+dx);
                    if (!mainMask[ni]) outline[i]=1;
                }
            }
        }
    }
    // Outline thickness: 4px
    for (let t = 0; t < 4; t++) {
        let newOutline = new Uint8Array(mask.length);
        for (let y = 1; y < h-1; y++) {
            for (let x = 1; x < w-1; x++) {
                let i = y*w+x;
                if (outline[i]) {
                    for (let [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                        let ni = (y+dy)*w+(x+dx);
                        newOutline[ni]=1;
                    }
                }
            }
        }
        for (let i = 0; i < mask.length; i++) if (newOutline[i]) outline[i]=1;
    }
    for (let i = 0; i < mask.length; i++) {
        if (outline[i]) {
            data[i*4]=0; data[i*4+1]=0; data[i*4+2]=0; data[i*4+3]=255;
        }
    }
}

// Object detection with the COCO-SSD model
async function detectObjects() {
    if (!canvas || !ctx || !imgElement.src) {
        alert("Please upload an image first!");
        return;
    }

    const model = await cocoSsd.load(); // COCO 
    const predictions = await model.detect(canvas); 

    predictions.forEach(prediction => {
        // Draw objects
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            prediction.bbox[0], //x
            prediction.bbox[1], //y
            prediction.bbox[2], //width
            prediction.bbox[3]  //height
        );

        // Show object name
        ctx.font = "16px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(
            prediction.class,
            prediction.bbox[0],
            prediction.bbox[1] - 10
        );
    });

    console.log("Predictions: ", predictions);
}

// Background removal
async function removeBackground() {
    if (!canvas || !ctx || !imgElement.src) {
        alert("Please upload an image first!");
        return;
    }

    try {
        // Mevcut durumu kaydet
        saveState();

        // Load the COCO-SSD model
        const model = await cocoSsd.load();
        
        // Detect objects
        const predictions = await model.detect(canvas);
        
        if (predictions.length === 0) {
            alert('No detectable object was found in the image!');
            return;
        }

        // Process the image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Make all pixels transparent initially
        for (let i = 0; i < data.length; i += 4) {
            data[i + 3] = 0; // Make the alpha channel transparent
        }

        // For each detected object
        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            
            // Make pixels inside the object bounds visible
            for (let py = Math.floor(y); py < Math.floor(y + height); py++) {
                for (let px = Math.floor(x); px < Math.floor(x + width); px++) {
                    if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
                        const idx = (py * canvas.width + px) * 4;
                        data[idx + 3] = 255; // Make the alpha channel opaque
                    }
                }
            }
        });

        // Apply changes to the canvas
        ctx.putImageData(imageData, 0, 0);

        // Show success message
        alert('Background removal completed!');

    } catch (error) {
        console.error('Background removal error:', error);
        alert('An error occurred during background removal. Please try again.');
    }
}

// Change the navbar appearance on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// New AI filter functions
async function applyAIFilter(filterType) {
    if (!canvas || !ctx || !imgElement.src) {
        alert("Please upload an image first!");
        return;
    }

    try {
        switch (filterType) {
            case 'style-transfer':
                await applyStyleTransfer();
                break;
            case 'face-beauty':
                await applyFaceBeauty();
                break;
            case 'portrait-effects':
                await applyPortraitEffects();
                break;
            case 'smart-enhance':
                await applySmartEnhance();
                break;
        }
    } catch (error) {
        console.error('AI filter error:', error);
        alert('An error occurred while applying the filter. Please try again.');
    }
}

// Style transfer filter - simplified version
async function applyStyleTransfer() {
    try {
        const loadingDiv = showLoading("Applying style transfer...");
        
        // Load the model directly from the CDN
        const model = await tf.loadGraphModel(
            'https://tfhub.dev/google/tfjs-model/magenta/arbitrary-image-stylization-v1-256/2/predict/1',
            { fromTFHub: true }
        );

        // Fixed style options (URLs)
        const styles = {
            'Starry Night': 'https://i.imgur.com/69IBQD1.jpg',
            'The Scream': 'https://i.imgur.com/93YOPZM.jpg',
            'Wave': 'https://i.imgur.com/qzpCwLb.jpg'
        };

        // Show the style selection modal
        const selectedStyle = await showStyleSelectionModal(styles);
        if (!selectedStyle) {
            hideLoading(loadingDiv);
            return;
        }

        // Load the style image
        const styleImg = await loadImage(selectedStyle);
        
        // Convert images to tensors
        const contentTensor = tf.browser.fromPixels(canvas)
            .toFloat()
            .div(255.0)
            .expandDims();
        
        const styleTensor = tf.browser.fromPixels(styleImg)
            .toFloat()
            .div(255.0)
            .expandDims();

        // Apply style transfer
        const result = await model.predict([contentTensor, styleTensor]);
        
        // Draw the result to the canvas
        await tf.browser.toPixels(result.squeeze(), canvas);
        
        // Clean up memory
        tf.dispose([contentTensor, styleTensor, result]);
        hideLoading(loadingDiv);
        
    } catch (error) {
        console.error('Style transfer error:', error);
        alert('An error occurred during style transfer.');
    }
}

// Face beautification filter - simplified version
async function applyFaceBeauty() {
    try {
        const loadingDiv = showLoading("Applying face beautification...");
        
        // Load face-api.js models from the CDN
        await faceapi.nets.tinyFaceDetector.load('/models/face-api');
        await faceapi.nets.faceLandmark68Net.load('/models/face-api');
        
        // Detect faces
        const detections = await faceapi.detectAllFaces(
            canvas, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks();

        if (detections.length === 0) {
            alert('No face was found in the image!');
            hideLoading(loadingDiv);
            return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply a simple smoothing effect
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Soften colors
            data[i] = (r * 0.9 + 255 * 0.1);     // Red
            data[i + 1] = (g * 0.9 + 255 * 0.1); // Green
            data[i + 2] = (b * 0.9 + 255 * 0.1); // Blue
        }

        ctx.putImageData(imageData, 0, 0);
        hideLoading(loadingDiv);
        
    } catch (error) {
        console.error('Face beautification error:', error);
        alert('An error occurred during face beautification.');
    }

}

// Helper functions
function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    return loadingDiv;
}

function hideLoading(loadingDiv) {
    if (loadingDiv && loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
    }
}

async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function showStyleSelectionModal(styles) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'style-modal';
        modal.innerHTML = `
            <div class="style-modal-content">
                <h3>Select Style</h3>
                <div class="style-grid">
                    ${Object.entries(styles).map(([key, src]) => `
                        <div class="style-option" data-style="${src}">
                            <img src="${src}" alt="${key}">
                            <p>${key}</p>
                        </div>
                    `).join('')}
                </div>
                <button class="cancel-button">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.cancel-button').onclick = () => {
            modal.remove();
            resolve(null);
        };
        
        modal.querySelectorAll('.style-option').forEach(option => {
            option.onclick = () => {
                const selectedStyle = option.dataset.style;
                modal.remove();
                resolve(selectedStyle);
            };
        });
    });
}

// Smart enhancement filter
async function applySmartEnhance() {
    const model = await tf.loadLayersModel('path/to/enhance-model.json');
    
    const tensor = tf.browser.fromPixels(canvas)
        .toFloat()
        .expandDims();
    
    const enhanced = model.predict(tensor);
    
    const resultCanvas = document.createElement('canvas');
    await tf.browser.toPixels(enhanced.squeeze(), resultCanvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(resultCanvas, 0, 0, canvas.width, canvas.height);
    
    tf.dispose([tensor, enhanced]);
}

// Portre efektleri
async function applyPortraitEffects() {
    const faceDetector = await blazeface.load();
    const faces = await faceDetector.estimateFaces(canvas, false);
    
    if (faces.length > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        faces.forEach(face => {
            const x = face.topLeft[0];
            const y = face.topLeft[1];
            const width = face.bottomRight[0] - face.topLeft[0];
            const height = face.bottomRight[1] - face.topLeft[1];
            
            // Apply effects to the face area
            applyPortraitEnhancement(data, x, y, width, height, canvas.width);
        });
        
        ctx.putImageData(imageData, 0, 0);
    }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.sidebar-button').forEach(button => {
        button.addEventListener('click', function() {
            const filterType = this.getAttribute('data-filter');
            if (!this.hasAttribute('data-intensity')) {
                effectIntensity = 0; // Reset intensity for the new effect
                this.setAttribute('data-intensity', '0');
            }
            applyImageEffect(filterType);
        });
    });
});

// Function for applying image effects
function applyImageEffect(effectType) {
    if (!canvas || !ctx || !imgElement.src) {
        alert('Please upload an image first!');
        return;
    }

    // Save the current state before applying the effect
    saveState();

    // Efekti uygula
    switch(effectType) {
        case 'enhance-details':
            enhanceDetails(ctx);
            break;
        case 'sharpen':
            applySharpness(ctx);
            break;
        case 'blur':
            applyBlur(ctx);
            break;
        case 'fix-shadows':
            fixShadows(ctx);
            break;
        case 'increase-vibrance':
            increaseVibrance(ctx);
            break;
        case 'color-tone':
            adjustColorTone(ctx);
            break;
        case 'fade':
            applyFadeEffect(ctx);
            break;
        default:
            console.error('Bilinmeyen efekt tipi:', effectType);
    }
}

// Global variables
let effectIntensity = 0;
const effectStep = 0.1;
const maxEffectIntensity = 1.0;

// Enhance details function
function enhanceDetails(ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Increase intensity
    effectIntensity = Math.min(effectIntensity + effectStep, maxEffectIntensity);
    const contrast = 1 + (0.3 * effectIntensity);
    const brightness = 5 * effectIntensity;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = Math.min(255, Math.max(0, (r - 128) * contrast + 128 + brightness));
        data[i + 1] = Math.min(255, Math.max(0, (g - 128) * contrast + 128 + brightness));
        data[i + 2] = Math.min(255, Math.max(0, (b - 128) * contrast + 128 + brightness));
    }
    
    ctx.putImageData(imageData, 0, 0);
    lastAppliedState = imageData;
}

// Sharpening function
function applySharpness(ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Increase intensity
    effectIntensity = Math.min(effectIntensity + effectStep, maxEffectIntensity);
    
    // Sharpening kernel
    const kernel = [
        0, -1 * effectIntensity, 0,
        -1 * effectIntensity, 1 + (4 * effectIntensity), -1 * effectIntensity,
        0, -1 * effectIntensity, 0
    ];
    
    const tempData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            let r = 0, g = 0, b = 0;
            
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const kernelIdx = (ky + 1) * 3 + (kx + 1);
                    const dataIdx = ((y + ky) * width + (x + kx)) * 4;
                    
                    r += tempData[dataIdx] * kernel[kernelIdx];
                    g += tempData[dataIdx + 1] * kernel[kernelIdx];
                    b += tempData[dataIdx + 2] * kernel[kernelIdx];
                }
            }
            
            data[idx] = Math.min(255, Math.max(0, r));
            data[idx + 1] = Math.min(255, Math.max(0, g));
            data[idx + 2] = Math.min(255, Math.max(0, b));
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    lastAppliedState = imageData;
}

// Blur function
function applyBlur(ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Increase intensity
    effectIntensity = Math.min(effectIntensity + effectStep, maxEffectIntensity);
    const radius = Math.floor(1 + (3 * effectIntensity)); // Radius between 1 and 4
    
    const tempData = new Uint8ClampedArray(data);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0;
            let count = 0;
            
            // Average neighboring pixels
            for (let ky = -radius; ky <= radius; ky++) {
                for (let kx = -radius; kx <= radius; kx++) {
                    const nx = x + kx;
                    const ny = y + ky;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const idx = (ny * width + nx) * 4;
                        r += tempData[idx];
                        g += tempData[idx + 1];
                        b += tempData[idx + 2];
                        count++;
                    }
                }
            }
            
            const idx = (y * width + x) * 4;
            data[idx] = r / count;
            data[idx + 1] = g / count;
            data[idx + 2] = b / count;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    lastAppliedState = imageData;
}

// Increase vibrance function
function increaseVibrance(ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    effectIntensity = Math.min(effectIntensity + effectStep, maxEffectIntensity);
    const amount = 0.3 * effectIntensity;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const avg = (r + g + b) / 3;
        const saturation = max === 0 ? 0 : (max - min) / max;
        
        const amt = (Math.abs(max - avg) * 1.5) * (amount * (1 - saturation));
        
        data[i] = Math.min(255, Math.max(0, r + ((r - avg) * amt)));
        data[i + 1] = Math.min(255, Math.max(0, g + ((g - avg) * amt)));
        data[i + 2] = Math.min(255, Math.max(0, b + ((b - avg) * amt)));
    }
    
    ctx.putImageData(imageData, 0, 0);
    lastAppliedState = imageData;
}

// Fix shadows function
function fixShadows(ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    effectIntensity = Math.min(effectIntensity + effectStep, maxEffectIntensity);
    const shadowFactor = 1 + (0.5 * effectIntensity);
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const brightness = (r + g + b) / 3;
        if (brightness < 128) {  // Only adjust dark areas
            data[i] = Math.min(255, r * shadowFactor);
            data[i + 1] = Math.min(255, g * shadowFactor);
            data[i + 2] = Math.min(255, b * shadowFactor);
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    lastAppliedState = imageData;
}

// Renk tonu ayarlama fonksiyonu
function adjustColorTone(ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    effectIntensity = Math.min(effectIntensity + effectStep, maxEffectIntensity);
    const toneIntensity = 30 * effectIntensity;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (isPinkTone) {
            // Pembe ton
            data[i] = Math.min(255, r + toneIntensity);     // Increase red
            data[i + 1] = Math.max(0, g - toneIntensity/2); // Green azalt
            data[i + 2] = Math.min(255, b + toneIntensity/2); // Slightly increase blue
        } else {
            // Mavi ton
            data[i] = Math.max(0, r - toneIntensity);     // Red azalt
            data[i + 1] = Math.max(0, g - toneIntensity/2); // Green azalt
            data[i + 2] = Math.min(255, b + toneIntensity); // Increase blue
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    lastAppliedState = imageData;
    isPinkTone = !isPinkTone;  // Switch between tones
}

function applyFadeEffect(ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            // Fade effect from edges to center
            const distanceX = Math.min(x, width - x) / (width / 2);
            const distanceY = Math.min(y, height - y) / (height / 2);
            const distance = Math.min(distanceX, distanceY);
            
            data[idx + 3] = 255 * distance; // Adjust the alpha channel
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Save history state
function saveState() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.push(imageData);
    
    // Stack boyutunu kontrol et
    if (undoStack.length > maxStackSize) {
        undoStack.shift();  // En eski durumu sil
    }
    
    // Clear the redo stack when a new state is added
    redoStack = [];
}

// Geri al fonksiyonu
function undo() {
    if (!canvas || !ctx) {
        console.error('Canvas not found');
        return;
    }

    if (undoStack.length > 0) {
        // Mevcut durumu redo stack'ine kaydet
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        redoStack.push(currentState);
        
        // Restore the previous state
        const previousState = undoStack.pop();
        ctx.putImageData(previousState, 0, 0);
        lastAppliedState = previousState;
    } else {
        alert('There are no changes left to undo!');
    }
}

// Redo function
function redo() {
    if (!canvas || !ctx) {
        console.error('Canvas not found');
        return;
    }

    if (redoStack.length > 0) {
        // Mevcut durumu undo stack'ine kaydet
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStack.push(currentState);
        
        // Restore the next state
        const nextState = redoStack.pop();
        ctx.putImageData(nextState, 0, 0);
        lastAppliedState = nextState;
    } else {
        alert('There are no changes left to redo!');
    }
}

// Rotate left function
function rotateLeft() {
    if (!canvas || !ctx || !imgElement.src) {
        alert('Please upload an image first!');
        return;
    }

    // Mevcut durumu kaydet
    saveState();

    // Update rotation
    currentRotation = (currentRotation - 90) % 360;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update canvas size and scale the image down
    if (Math.abs(currentRotation) % 180 !== 0) {
        const scale = 0.7; // Scale the image down to 70%
        [canvas.width, canvas.height] = [canvas.height * scale, canvas.width * scale];
    } else {
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
    }

    // Center and rotate the canvas
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(currentRotation * Math.PI / 180);
    ctx.drawImage(imgElement, -imgElement.width/2, -imgElement.height/2, imgElement.width, imgElement.height);
    ctx.restore();

    // Son durumu kaydet
    lastAppliedState = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Rotate right function
function rotateRight() {
    if (!canvas || !ctx || !imgElement.src) {
        alert('Please upload an image first!');
        return;
    }

    // Mevcut durumu kaydet
    saveState();

    // Update rotation
    currentRotation = (currentRotation + 90) % 360;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update canvas size and scale the image down
    if (Math.abs(currentRotation) % 180 !== 0) {
        const scale = 0.7; // Scale the image down to 70%
        [canvas.width, canvas.height] = [canvas.height * scale, canvas.width * scale];
    } else {
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
    }

    // Center and rotate the canvas
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(currentRotation * Math.PI / 180);
    ctx.drawImage(imgElement, -imgElement.width/2, -imgElement.height/2, imgElement.width, imgElement.height);
    ctx.restore();

    // Son durumu kaydet
    lastAppliedState = ctx.getImageData(0, 0, canvas.width, canvas.height);
}



// --- Tooltip Logic ---
document.addEventListener('DOMContentLoaded', function() {
  const tooltip = document.getElementById('tooltip');
  document.body.addEventListener('mouseover', function(e) {
    const target = e.target.closest('[data-tooltip]');
    if (target) {
      tooltip.innerText = target.getAttribute('data-tooltip');
      tooltip.style.display = 'block';
    }
  });
  document.body.addEventListener('mousemove', function(e) {
    if (tooltip.style.display === 'block') {
      let x = e.clientX + 18;
      let y = e.clientY + 18;
      // Clamp to viewport
      const rect = tooltip.getBoundingClientRect();
      if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 12;
      if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 12;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }
  });
  document.body.addEventListener('mouseout', function(e) {
    const target = e.target.closest('[data-tooltip]');
    if (target) {
      tooltip.style.display = 'none';
    }
  });
});
// --- END Tooltip Logic ---

function applyRandomFilter() {
  // Klasik filtreler ve AI filtreler
  const classic = [
    {type: 'sketch', name: 'Sketch'},
    {type: 'cartoon', name: 'Cartoon'},
    {type: 'oilpaint', name: 'Oil Paint'},
    {type: 'colorseparate', name: 'Color Separate'},
    {type: 'sepia', name: 'Sepia'},
    {type: 'negative', name: 'Negative'},
    {type: 'grayscale', name: 'Black & White'},
    {type: 'mosaic', name: 'Mosaic'},
    {type: 'watercolor', name: 'Watercolor'},
    {type: 'sticker', name: 'Sticker Maker'}
  ];
  // AI filters (optional examples)
  // const ai = [
  //   {type: 'style-transfer', name: 'Style Transfer'},
  //   {type: 'face-beauty', name: 'Face Beautification'},
  //   {type: 'portrait-effects', name: 'Portre Efekti'},
  //   {type: 'smart-enhance', name: 'Smart Enhancement'}
  // ];
  // const all = classic.concat(ai);
  const all = classic;
  const pick = all[Math.floor(Math.random() * all.length)];
  applyFilter(pick.type);
  alert('Surprise! Applied filter: ' + pick.name);
}

// --- Draw Mode Logic ---
let isDrawMode = false;
let isDrawing = false;
let lastDraw = {x:0, y:0};
let brushColor = '#ff0000';
let brushSize = 6;
let isEraser = false;

function toggleDrawMode() {
  isDrawMode = !isDrawMode;
  const btn = document.getElementById('drawModeBtn');
  const colorInput = document.getElementById('brushColor');
  const sizeInput = document.getElementById('brushSize');
  const eraserBtn = document.getElementById('eraserBtn');
  const canvasEl = document.getElementById('canvas');
  if (isDrawMode) {
    btn.style.background = 'linear-gradient(135deg, #40E0D0, #48D1CC)';
    btn.style.color = '#fff';
    btn.style.boxShadow = '0 0 12px #40E0D0';
    colorInput.style.display = 'inline-block';
    sizeInput.style.display = 'inline-block';
    eraserBtn.style.display = 'inline-block';
    canvasEl.classList.add('draw-mode');
    canvasEl.width = 900;
    canvasEl.height = 600;
    redrawCanvasWithStickers();
  } else {
    btn.style.background = '';
    btn.style.color = '';
    btn.style.boxShadow = '';
    colorInput.style.display = 'none';
    sizeInput.style.display = 'none';
    eraserBtn.style.display = 'none';
    canvasEl.classList.remove('draw-mode');
    // Return to the original image size
    if (imgElement.src) {
      canvasEl.width = imgElement.width;
      canvasEl.height = imgElement.height;
      redrawCanvasWithStickers();
    }
    isEraser = false;
    document.getElementById('eraserBtn').style.background = '';
  }
}

function toggleEraser() {
  isEraser = !isEraser;
  const eraserBtn = document.getElementById('eraserBtn');
  if (isEraser) {
    eraserBtn.style.background = 'linear-gradient(135deg, #f8f8f8, #bbb)';
    eraserBtn.style.color = '#222';
    eraserBtn.style.boxShadow = '0 0 12px #bbb';
  } else {
    eraserBtn.style.background = '';
    eraserBtn.style.color = '';
    eraserBtn.style.boxShadow = '';
  }
}

document.getElementById('brushColor').addEventListener('input', function(e) {
  brushColor = e.target.value;
});
document.getElementById('brushSize').addEventListener('input', function(e) {
  brushSize = parseInt(e.target.value, 10);
});

canvas.addEventListener('mousedown', function(e) {
  if (!isDrawMode) return;
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  lastDraw.x = (e.clientX - rect.left) * (canvas.width / rect.width);
  lastDraw.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});
canvas.addEventListener('mousemove', function(e) {
  if (!isDrawMode || !isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  ctx.strokeStyle = isEraser ? '#fff' : brushColor;
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
  ctx.beginPath();
  ctx.moveTo(lastDraw.x, lastDraw.y);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  lastDraw.x = x;
  lastDraw.y = y;
});
canvas.addEventListener('mouseup', function(e) {
  if (!isDrawMode) return;
  isDrawing = false;
});
canvas.addEventListener('mouseleave', function(e) {
  if (!isDrawMode) return;
  isDrawing = false;
});
// --- END Draw Mode Logic ---

// --- Sticker Gallery Logic ---
let stickers = [];
let draggingSticker = null;
let dragOffset = {x:0, y:0};
let resizingSticker = null;
let resizeStart = {x:0, y:0, w:0, h:0};
let selectedSticker = null;

function openStickerGallery() {
  document.getElementById('stickerGalleryModal').style.display = 'flex';
}
function closeStickerGallery() {
  document.getElementById('stickerGalleryModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.sticker-option').forEach(img => {
    img.addEventListener('click', function() {
      closeStickerGallery();
      addStickerToCanvas(this.src);
    });
  });
});

function addStickerToCanvas(src) {
  const img = new window.Image();
  img.src = src;
  img.onload = function() {
    const w = 80, h = 80;
    const x = canvas.width/2 - w/2;
    const y = canvas.height/2 - h/2;
    const sticker = {img, x, y, w, h};
    stickers.push(sticker);
    selectedSticker = sticker;
    redrawCanvasWithStickers();
    showStickerHandle();
  };
}

function redrawCanvasWithStickers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
  for (const s of stickers) {
    ctx.drawImage(s.img, s.x, s.y, s.w, s.h);
  }
}

function showStickerHandle() {
  removeStickerHandle();
  if (!selectedSticker) return;
  const container = document.getElementById('canvasContainer');
  const handle = document.createElement('div');
  handle.className = 'sticker-handle';
  handle.style.left = (canvas.offsetLeft + selectedSticker.x + selectedSticker.w - 9) + 'px';
  handle.style.top = (canvas.offsetTop + selectedSticker.y + selectedSticker.h - 9) + 'px';
  handle.onmousedown = function(e) {
    e.stopPropagation();
    resizingSticker = selectedSticker;
    resizeStart.x = e.clientX;
    resizeStart.y = e.clientY;
    resizeStart.w = resizingSticker.w;
    resizeStart.h = resizingSticker.h;
    document.body.style.userSelect = 'none';
  };
  container.appendChild(handle);
}
function removeStickerHandle() {
  document.querySelectorAll('.sticker-handle').forEach(h => h.remove());
}

canvas.addEventListener('mousedown', function(e) {
  // Drag or select sticker
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  let found = false;
  for (let i = stickers.length-1; i >= 0; i--) {
    const s = stickers[i];
    if (mx >= s.x && mx <= s.x+s.w && my >= s.y && my <= s.y+s.h) {
      draggingSticker = s;
      dragOffset.x = mx - s.x;
      dragOffset.y = my - s.y;
      // Bring to front
      stickers.splice(i, 1);
      stickers.push(s);
      selectedSticker = s;
      found = true;
      showStickerHandle();
      break;
    }
  }
  if (!found) {
    selectedSticker = null;
    removeStickerHandle();
  }
});
canvas.addEventListener('mousemove', function(e) {
  if (draggingSticker) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    draggingSticker.x = mx - dragOffset.x;
    draggingSticker.y = my - dragOffset.y;
    redrawCanvasWithStickers();
    showStickerHandle();
  }
  if (resizingSticker) {
    const dx = e.clientX - resizeStart.x;
    const dy = e.clientY - resizeStart.y;
    resizingSticker.w = Math.max(24, resizeStart.w + dx);
    resizingSticker.h = Math.max(24, resizeStart.h + dy);
    redrawCanvasWithStickers();
    showStickerHandle();
  }
});
canvas.addEventListener('mouseup', function(e) {
  draggingSticker = null;
  resizingSticker = null;
  document.body.style.userSelect = '';
});
canvas.addEventListener('mouseleave', function(e) {
  draggingSticker = null;
  resizingSticker = null;
  document.body.style.userSelect = '';
});
// --- END Sticker Gallery Logic ---

async function repairImage() {
    if (!canvas || !ctx || !imgElement.src) {
        alert("Please upload an image first!");
        return;
    }

    try {
        // Mevcut durumu kaydet
        saveState();

        // Process the image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Color enhancement
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Increase color saturation
            const avg = (r + g + b) / 3;
            const saturation = 1.2; // Saturation factor

            // Adjust each color based on the average value
            data[i] = Math.min(255, Math.max(0, avg + (r - avg) * saturation));
            data[i + 1] = Math.min(255, Math.max(0, avg + (g - avg) * saturation));
            data[i + 2] = Math.min(255, Math.max(0, avg + (b - avg) * saturation));

            // Slightly increase brightness
            const brightness = 1.1; // Brightness factor
            data[i] = Math.min(255, data[i] * brightness);
            data[i + 1] = Math.min(255, data[i + 1] * brightness);
            data[i + 2] = Math.min(255, data[i + 2] * brightness);
        }

        // Apply changes to the canvas
        ctx.putImageData(imageData, 0, 0);

        // Show success message
        alert('Image repair completed!');

    } catch (error) {
        console.error('Image repair error:', error);
        alert('An error occurred during image repair. Please try again.');
    }
}

// Horizontal flip function
function flipHorizontal() {
    if (!canvas || !ctx || !imgElement.src) {
        alert('Please upload an image first!');
        return;
    }

    // Mevcut durumu kaydet
    saveState();

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save the canvas for horizontal flipping
    ctx.save();
    
    // Flip the canvas horizontally
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    // Draw the image
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    
    // Restore the canvas state
    ctx.restore();

    // Son durumu kaydet
    lastAppliedState = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Vertical flip function
function flipVertical() {
    if (!canvas || !ctx || !imgElement.src) {
        alert('Please upload an image first!');
        return;
    }

    // Mevcut durumu kaydet
    saveState();

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save the canvas for vertical flipping
    ctx.save();
    
    // Flip the canvas vertically
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    
    // Draw the image
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    
    // Restore the canvas state
    ctx.restore();

    // Son durumu kaydet
    lastAppliedState = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

window.imageEditorApi = {
    hasImage() {
        return Boolean(imgElement.src);
    },
    applyFilter,
    applyImageEffect,
    applyRandomFilter,
    detectObjects,
    removeBackground,
    repairImage
};
