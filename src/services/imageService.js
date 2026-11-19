import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads', 'profileImages');
const PUBLIC_PATH = '/uploads/profileImages';

// Thumbnail sizes for each screen type
const SIZES = {
    mobile: { width: 100, height: 100 },
    tablet: { width: 150, height: 150 },
    laptop: { width: 200, height: 200 },
    desktop: { width: 300, height: 300 }
}

const ORIGINAL_MAX_SIZE = 1024;
const ALLOWED_FORMATS = ['jpeg', 'png']; // detected from real

const createError = (message, code, statusCode) => Object.assign(new Error(message), { code, statusCode });

/**
 * Checks the real file content(not just the name or MIME type) 
 * Rejects renamed files such as .exe renamed to .jpg
 */
async function validateImage(buffer) {
    let metadata;
    try {
        metadata = await sharp(buffer).metadata();
    } catch {
        throw createError("Invalid or corrupted image file.", "INVALID_IMAGE", 400);
    }

    if (!ALLOWED_FORMATS.includes(metadata.format)) {
        throw createError("Invalid image format.", "INVALID_IMAGE_FORMAT", 400);
    }
    return metadata;
}

/**
 * Creates the original + 4 thumbnails and returns public URLs
 * File name are unique on every upload, so updated never overwrite
 * existing files and browsers never show a stale cache image.
 */

async function processProfileImage(buffer, userId) {
    const metadata = await validateImage(buffer);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const uniqueId = `${userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const ext = metadata.format === 'png' ? 'png' : 'jpg';
    const formatOptions = metadata.format === 'png' ? { compressionLevel: 9 } : { quality: 85, mozjpeg: true };

    // rotate() fixes orientation from EXIF; sharp strips EXIF(including GPS) by default
    const base = sharp(buffer).rotate();

    const tasks = []
    const createdFiles = [];
    const images = {}

    //Original image, capped at 1024px
    const originalName = `${uniqueId}-original.${ext}`;
    images.original = `${PUBLIC_PATH}/${originalName}`;
    createdFiles.push(originalName);
    tasks.push(
        base.clone().resize({
            width: ORIGINAL_MAX_SIZE,
            height: ORIGINAL_MAX_SIZE,
            fit: 'inside',
            withoutEnlargement: true
        })
            .toFormat(metadata.format, formatOptions)
            .toFile(path.join(UPLOAD_DIR, originalName))
    );

    // Thumbnails one per screen type
    for (const [device, { width, height }] of Object.entries(SIZES)) {
        const fileName = `${uniqueId}-${device}.${ext}`;
        createdFiles.push(fileName);
        images[device] = `${PUBLIC_PATH}/${fileName}`;
        tasks.push(
            base.clone()
                .resize(width, height, { fit: 'cover', position: 'center' })
                .toFormat(metadata.format, formatOptions)
                .toFile(path.join(UPLOAD_DIR, fileName))
        );
    }

    try {
        await Promise.all(tasks);
    } catch (err) {
        // if any file failed, remove the ones that were created
        await Promise.all(
            createdFiles.map((file) => fs.unlink(path.join(UPLOAD_DIR, file)).catch(() => { })) // ignore errors during cleanup
        );
        throw createError("Failed to process the image.", "IMAGE_PROCESSING_ERROR", 500);
    }
    images.updatedAt = new Date().toISOString();
    return images
}

/**
 * Deletes the files of a profileImage object.
 * Safe for first-time users (null values) and for files that are already missing.
 * Only deletes files inside UPLOAD_DIR (protects against path traversal attacks)
 */

async function deleteProfileImages(images) {
    if (!images) return;
    const urls = ['original', ...Object.keys(SIZES)].map(key => images[key]).filter(Boolean);

    await Promise.all(
        urls.map(async (url) => {
            const filePath = path.join(ROOT_DIR, '.' + url);
            if (!filePath.startsWith(UPLOAD_DIR + path.sep)) return; // outside the upload folder

            try {
                await fs.unlink(filePath);
            } catch (err) {
                // ignore errors during cleanup
                if (err.code !== 'ENOENT') console.error('Failed to delete file:', filePath, err.message);
            }
        })
    );
}

function hasImage(images) {
    return Boolean(images && images.original)
}

export {
    processProfileImage,
    deleteProfileImages,
    hasImage,
    SIZES
}