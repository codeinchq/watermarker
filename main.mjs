/*
 * Copyright 2024 Code Inc. <https://www.codeinc.co>
 *
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import express from 'express';
import multer from 'multer';
import * as path from "path";
import * as fs from "fs";
import uniqid from 'uniqid';
import Jimp from 'jimp';

const port = +(process.env.PORT ?? 3000);
const tempDir = 'temp';

const app = express();
const upload = multer({dest: tempDir});

const cpUpload = upload.fields([
    {name: 'image', maxCount: 1},
    {name: 'watermark', maxCount: 1},
]);

app.post('/apply', cpUpload, async (req, res) => {
    const imageFile = req.files['image'][0];
    const watermarkFile = req.files['watermark'][0];

    console.log(`Applying watermark "${watermarkFile.originalname}" to the image "${imageFile.originalname}"`);
    try {
        if (!imageFile?.filename || !watermarkFile?.filename) {
            throw new Error('No file uploaded');
        }

        // converting the PDF file to images
        const watermarkedImagePath = `${tempDir}/${uniqid()}.${req.body.format ?? 'png'}`;
        const mainImage = await Jimp.read(imageFile.path);
        const watermarkImage = await Jimp.read(watermarkFile.path);

        // calculating the dimensions of the watermark
        const ratio = (req.body.size ?? 75) / 100;
        let newHeight, newWidth;
        if ((mainImage.getHeight() / mainImage.getWidth()) < (watermarkImage.getHeight() / watermarkImage.getWidth())) {
            newHeight = ratio * mainImage.getHeight();
            newWidth = newHeight / watermarkImage.getHeight() * watermarkImage.getWidth();
        } else {
            newWidth = ratio * mainImage.getWidth();
            newHeight = newWidth / watermarkImage.getWidth() * watermarkImage.getHeight();
        }

        // resizing the watermark
        watermarkImage.resize(newWidth, newHeight, Jimp.RESIZE_BICUBIC);

        // adds blur to the underlying image
        if (req.body.blur) {
            mainImage.blur(+(req.body.blur));
        }

        // calculating the position of the watermark
        const position = req.body.position ?? 'center';
        const padding = +(req.body.padding ?? 10);
        let x, y;
        switch (position) {
            case 'top-left':
                x = padding;
                y = padding;
                break;
            case 'top-right':
                x = mainImage.getWidth() - newWidth - padding;
                y = padding;
                break;
            case 'top':
                x = (mainImage.getWidth() - newWidth) / 2;
                y = padding;
                break;
            case 'bottom-left':
                x = padding;
                y = mainImage.getHeight() - newHeight - padding;
                break;
            case 'bottom-right':
                x = mainImage.getWidth() - newWidth - padding;
                y = mainImage.getHeight() - newHeight - padding;
                break;
            case 'bottom':
                x = (mainImage.getWidth() - newWidth) / 2;
                y = mainImage.getHeight() - newHeight - padding;
                break;
            case 'left':
                x = padding;
                y = (mainImage.getHeight() - newHeight) / 2;
                break;
            case 'right':
                x = mainImage.getWidth() - newWidth - padding;
                y = (mainImage.getHeight() - newHeight) / 2;
                break;
            case 'center':
            default:
                x = (mainImage.getWidth() - newWidth) / 2;
                y = (mainImage.getHeight() - newHeight) / 2;
                break;
        }

        // applying the watermark to the image
        await mainImage.composite(watermarkImage, x, y, {
            opacitySource: ((req.body.opacity ?? 75) / 100),
            opacityDest: 1,
            mode: Jimp.BLEND_SOURCE_OVER,
        });

        // writing the watermarked image to the file system
        await mainImage.quality(+(req.body.quality ?? 100)).writeAsync(watermarkedImagePath);

        // sending the images as a response
        res.sendFile(watermarkedImagePath, {root: path.resolve()}, () => {
            fs.unlinkSync(imageFile.path);
            fs.unlinkSync(watermarkFile.path);
            fs.unlinkSync(watermarkedImagePath);
        });
    }
    catch (e) {
        console.error(`Error: ${e.message}`);
        res.status(400);
        res.send({error: e.message});
        fs.unlinkSync(imageFile.path);
        fs.unlinkSync(watermarkFile.path);
        if (typeof watermarkedImagePath !== "undefined" && fs.existsSync(watermarkedImagePath)) {
            fs.unlinkSync(watermarkedImagePath);
        }
    }
}, cpUpload);

app.listen(port, () => {
    console.log(`The watermarker service is now listening on port ${port}`);
});
