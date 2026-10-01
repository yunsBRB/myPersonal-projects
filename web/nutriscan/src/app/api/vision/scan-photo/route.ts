import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { image } = await request.json(); // base64 image

        if (!image) {
            return NextResponse.json({ error: 'Image required' }, { status: 400 });
        }

        // Step 1: Google Vision API call for TEXT and BARCODE Detection
        const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    {
                        image: { content: image.replace(/^data:image\/[a-z]+;base64,/, '') },
                        features: [
                            { type: 'TEXT_DETECTION' },
                        ]
                    }
                ]
            })
        });

        if (!visionResponse.ok) {
            throw new Error('Vision API Error');
        }

        const visionData = await visionResponse.json();
        const textAnnotations = visionData.responses[0]?.textAnnotations;

        if (!textAnnotations || textAnnotations.length === 0) {
            return NextResponse.json({ success: false, error: 'No text or barcode found in image' });
        }

        const extractedText = textAnnotations[0].description;

        // Simulate finding a barcode using Regex
        const barcodeRegex = /\b\d{8,14}\b/g;
        const barcodes = extractedText.match(barcodeRegex);

        if (barcodes && barcodes.length > 0) {
            // Step 2: Barcode found
            return NextResponse.json({ success: true, type: 'barcode', barcode: barcodes[0] });
        }

        // Step 3: No Barcode, send the extracted text (OCR) to GPT-4o Vision or standard GPT
        return NextResponse.json({
            success: true,
            type: 'ocr',
            text: extractedText,
            message: 'Nutrition table extracted, ready for AI parsing'
        });

    } catch (error) {
        console.error('API /vision/scan-photo error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
