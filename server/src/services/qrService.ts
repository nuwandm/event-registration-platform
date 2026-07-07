import QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { cloudinary } from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';

export interface QRPayload {
  id: string;
  token: string;
}

export interface QRResult {
  token: string;
  qrCodeUrl: string;
  qrCodePublicId: string;
}

const generateQRImageBuffer = async (payload: QRPayload): Promise<Buffer> => {
  const data = JSON.stringify(payload);
  // Returns a PNG buffer
  return QRCode.toBuffer(data, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
};

const uploadQRToCloudinary = (buffer: Buffer, registrationId: string): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'eventhub/qrcodes',
        public_id: `qr-${registrationId}`,
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) reject(new AppError('QR code upload failed', 500));
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

export const qrService = {
  async generateQR(registrationId: string): Promise<QRResult> {
    const token = randomUUID();
    const payload: QRPayload = { id: registrationId, token };

    const buffer = await generateQRImageBuffer(payload);
    const { url, publicId } = await uploadQRToCloudinary(buffer, registrationId);

    return { token, qrCodeUrl: url, qrCodePublicId: publicId };
  },
};
