import type {NextApiRequest, NextApiResponse} from 'next'
import multer from "multer";
import fs, { createReadStream } from 'fs';
import AdmZip from 'adm-zip';
import {NEXT_PUBLIC_CHAT_FILES_UPLOAD_PATH} from "@/utils/app/const";
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    }
};

const folderPath = NEXT_PUBLIC_CHAT_FILES_UPLOAD_PATH!;

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, folderPath);
        },
        filename: (req, file, cb) => {
            cb(null, req.query.fileName as string);
        },
    }),
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    console.log("beginning files handler");

    if (req.method === 'POST') {
        upload.single('file')(req as any, res as any, (err: any) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }
            const fileName = req.query.fileName as string;
            if (fileName.split('.').pop()! === 'zip') {
                try {
                    const zip = new AdmZip(`${folderPath}/${fileName}`);
                    const finalPath = `${folderPath}/${fileName.split('.')[0]}`;
                    zip.extractAllTo(finalPath, true);
                } catch (e) {
                    console.error(e);
                    return res.status(500).json({ message: (e as Error).message });
                }
            }
            // File uploaded successfully
            res.status(200).json({ message: 'File uploaded successfully' });
        });
    } else if (req.method === 'DELETE') {
        const filePath = `${folderPath}/${req.query.fileName as string}`;
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(400).json({ message: err.message });
                }
                res.status(200).json({ message: 'File deleted successfully' });
                console.log('File deleted successfully');
            });
        } else {
            res.status(404).json({ message: 'File Not Found' });
            console.log('File does not exist');
        }
    }

    //download file from server to client
    else if (req.method === 'GET') {   
        console.log("file name: ", req.query);
        const { filename } = req.query;

       // Replace 'uploads' with the path to your folder containing the files
        const folderPathDownload = path.join(process.cwd(), folderPath);
        const files = fs.readdirSync(folderPathDownload);

        try {

            // Find the file with a name that matches the provided index (without extension)
            const matchingFile = files.find((file) => file.split('.')[0] === filename);
            console.log("matching file: ", matchingFile);
            if (matchingFile) {
            const filePath = path.join(folderPathDownload, matchingFile);
            console.log("file path: ", filePath);

            // Set the appropriate headers for the download
            res.setHeader('Content-Disposition', `attachment; filename="${matchingFile}"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            // Send the file to the client
            fs.createReadStream(filePath).pipe(res);
            } else {
            res.status(404).end('File not found');
            }

          } catch (error) {
            console.error('Error downloading file:', error);
            res.status(500).end('Internal Server Error');
          }

    }



}

export default handler;