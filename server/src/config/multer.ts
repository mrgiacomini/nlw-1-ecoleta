import multer from 'multer';
import path from 'path';

export default {
    storage: multer.diskStorage({
        destination: path.resolve(__dirname, '..', '..', 'uploads', 'points'),
        filename(request, file, callback) { 
            const filename = `${new Date().toISOString().replace(/:/g, '-')}-${file.originalname}`;

            callback(null, filename);
        }
    }),
};