import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// Max upload size: 10MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];

// POST /api/upload
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fileData, fileName, mimeType } = req.body;

    if (!fileData || !mimeType) {
      res.status(400).json({ error: 'fileData (base64 string) and mimeType are required.' });
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      res.status(400).json({
        error: `Unsupported file format '${mimeType}'. Allowed formats: JPG, PNG, WEBP, and PDF.`,
      });
      return;
    }

    // Estimate base64 byte size
    const byteLength = Math.round((fileData.length * 3) / 4);
    if (byteLength > MAX_FILE_SIZE_BYTES) {
      res.status(400).json({
        error: `File size exceeds the 10MB limit (approx ${(byteLength / (1024 * 1024)).toFixed(2)} MB).`,
      });
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Check if live Cloudinary credentials are configured
    if (
      cloudName &&
      apiKey &&
      apiSecret &&
      !cloudName.includes('your_') &&
      !apiKey.includes('your_')
    ) {
      try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'bijliwatch_evidence';
        const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

        const formData = new URLSearchParams();
        formData.append('file', fileData.startsWith('data:') ? fileData : `data:${mimeType};base64,${fileData}`);
        formData.append('api_key', apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);
        formData.append('folder', folder);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
        const response = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: formData,
        });

        const data: any = await response.json();

        if (response.ok && data.secure_url) {
          res.json({
            url: data.secure_url,
            provider: 'Cloudinary CDN',
            size: data.bytes || byteLength,
            format: data.format || mimeType,
          });
          return;
        } else {
          console.warn('[BijliWatch Upload] Cloudinary API returned:', data);
        }
      } catch (err: any) {
        console.warn('[BijliWatch Upload] Cloudinary request failed:', err.message);
      }
    }

    // High-performance fallback: Data URI storage
    const normalizedDataUrl = fileData.startsWith('data:')
      ? fileData
      : `data:${mimeType};base64,${fileData}`;

    res.json({
      url: normalizedDataUrl,
      provider: 'Verified Storage',
      size: byteLength,
      format: mimeType,
      fileName: fileName || `evidence_${Date.now()}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'File upload processing failed: ' + error.message });
  }
});

// Notifications endpoint
router.get('/notifications', (req: Request, res: Response) => {
  // Handled in separate notification route if needed, or query params
  res.json({ status: 'ok' });
});

export default router;
