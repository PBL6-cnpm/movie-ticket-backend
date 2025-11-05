import { QR_COLOR, QR_IMAGE_TYPE, QR_SIZE } from '@common/constants';
import 'multer';
import * as QRCode from 'qrcode';

export async function generateQRCodeAsMulterFile<T>(input: T): Promise<Express.Multer.File> {
  try {
    const data = typeof input === 'string' ? input : JSON.stringify(input);

    const buffer = await QRCode.toBuffer(data, {
      type: QR_IMAGE_TYPE,
      color: QR_COLOR,
      width: QR_SIZE
    });

    const fakeMulterFile = {
      buffer: buffer
    } as Express.Multer.File;

    return fakeMulterFile;
  } catch (error) {
    console.error('.......Error generating QR code:', error);
    throw error;
  }
}
