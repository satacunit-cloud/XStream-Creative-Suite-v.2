
import { GoogleGenAI, Modality } from "@google/genai";

// A lazy-loaded instance of the GoogleGenAI client.
let ai: GoogleGenAI | null = null;

/**
 * Gets a singleton instance of the GoogleGenAI client.
 * This function will lazy-initialize the client on first use and provides a
 * safe way to access the API key from the environment.
 * @returns An initialized GoogleGenAI client.
 * @throws {Error} if the API_KEY environment variable is not available.
 */
const getAi = (): GoogleGenAI => {
    if (!ai) {
        // Fix: Adhered to coding guidelines by using process.env.API_KEY to get the API key. This resolves the TypeScript error on import.meta.env.
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            // This error will be caught by UI components and displayed gracefully.
            throw new Error(
                'Configuration Error: API_KEY is not available. Please set the API_KEY environment variable.'
            );
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};


// --- TYPE DEFINITIONS ---
export interface ImageFile {
  data: string; // base64 encoded string
  type: string; // mime type
}

export type AudioInput = File | null;

export interface CreativeControls {
    artisticStyle: string;
    aspectRatio: string;
    genre: string;
    lighting: string;
    mood: string;
    cameraAngle: string;
}

// --- HELPER FUNCTIONS ---
const imageToPart = (image: ImageFile) => ({
    inlineData: {
        data: image.data,
        mimeType: image.type,
    },
});

// --- API FUNCTIONS ---

const buildPromptBoilerplate = (controls: CreativeControls, includeGenre: boolean = true) => {
    let prompt = `
Style: ${controls.artisticStyle}.
Lighting: ${controls.lighting}.
Mood: ${controls.mood}.
Camera Angle: ${controls.cameraAngle}.
`;
    if (includeGenre && controls.genre !== 'None') {
        prompt += `The image should be suitable as cover art for the ${controls.genre} music genre.\n`;
    }
    return prompt;
};

export const generateDetailedPromptFromText = async (
    topic: string,
    assets: ImageFile[],
    audio: AudioInput, // Note: Audio file content is not directly used in the prompt text for now.
    controls: CreativeControls,
): Promise<string> => {
    const parts: any[] = [];
    let promptText = `Based on the following inputs, create a single, highly detailed, and vivid prompt for an AI image generator. The prompt should be a single paragraph. Do not use markdown.

Topic: "${topic}"
${buildPromptBoilerplate(controls)}
`;
    
    if (assets.length > 0) {
        promptText += "Incorporate inspiration from the following asset images:\n";
        assets.forEach(asset => parts.push(imageToPart(asset)));
    }
    
    parts.unshift({ text: promptText });

    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts },
    });
    return response.text.trim();
};

export const generateDetailedPromptFromImage = async (
    topic: string,
    sourceImage: ImageFile,
    assets: ImageFile[],
    audio: AudioInput,
    controls: CreativeControls,
): Promise<string> => {
    const parts: any[] = [];
    let promptText = `Based on the following source image and additional inputs, create a new, highly detailed, and vivid prompt for an AI image generator. The new prompt should describe a scene inspired by the source but incorporating the new topic and creative direction. The prompt should be a single paragraph. Do not use markdown.

New Topic or Modification: "${topic}"
${buildPromptBoilerplate(controls)}
`;

    parts.push({ text: "Source Image:" });
    parts.push(imageToPart(sourceImage));
    
    if (assets.length > 0) {
        promptText += "\nAlso take inspiration from these asset images:";
        assets.forEach(asset => parts.push(imageToPart(asset)));
    }
    
    parts.unshift({ text: promptText });

    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
    });
    return response.text.trim();
};

export const generateImage = async (
    prompt: string,
    sourceImage: ImageFile | null,
    assets: ImageFile[],
    aspectRatio: string,
): Promise<{ imageUrl: string }> => {
    const parts: any[] = [{ text: prompt }];

    // If sourceImage exists, it's the primary image for editing. Otherwise, it's just another asset.
    const allImages = sourceImage ? [sourceImage, ...assets] : assets;
    allImages.forEach(img => parts.push(imageToPart(img)));
    
    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return { imageUrl: `data:${part.inlineData.mimeType};base64,${base64ImageBytes}` };
        }
    }
    throw new Error("No image was generated.");
};


export async function* generateTextStream(
    topic: string,
    sourceImage: ImageFile | null,
    assets: ImageFile[],
    audio: AudioInput,
): AsyncGenerator<string> {
    const parts: any[] = [{ text: `In a conversational and helpful tone, tell me more about this topic: "${topic}". If any images are provided, relate your answer to them.` }];
    if (sourceImage) parts.push(imageToPart(sourceImage));
    assets.forEach(img => parts.push(imageToPart(img)));

    const response = await getAi().models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: { parts },
    });
    for await (const chunk of response) {
        yield chunk.text;
    }
};

export async function* generateLyricsStream(
    topic: string,
    genre: string,
): AsyncGenerator<string> {
    const response = await getAi().models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: `Write song lyrics about "${topic}".`,
        config: {
          systemInstruction: `You are a talented songwriter specializing in the ${genre} music genre. Write a full song with verses and a chorus. Do not include guitar chords or music notation.`,
        },
    });
    for await (const chunk of response) {
        yield chunk.text;
    }
};

export const performFaceSwap = async (
    sourceImage: ImageFile,
    faceImage: ImageFile,
): Promise<string> => {
    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imageToPart(sourceImage),
                imageToPart(faceImage),
                { text: 'Swap the face from the second image onto the person in the first image. Keep the original background and clothing.' },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('Face swap failed to generate an image.');
};

export const performClothingSwap = async (
    personImage: ImageFile,
    clothingImage: ImageFile,
): Promise<string> => {
    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imageToPart(personImage),
                imageToPart(clothingImage),
                { text: 'Take the clothing from the second image and place it realistically on the person in the first image. Keep the person\'s face and the background from the first image.' },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('Clothing swap failed to generate an image.');
};

export const performBackgroundRemoval = async (
    image: ImageFile,
): Promise<string> => {
    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imageToPart(image),
                { text: 'Isolate the main subject of this image and remove the background, making it transparent. The output should be a PNG with a transparent background.' },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('Background removal failed to generate an image.');
};

export const compositeWithGeneratedBackground = async (
    foreground: ImageFile,
    prompt: string,
): Promise<string> => {
    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imageToPart(foreground),
                { text: `First, generate a new background image based on this prompt: "${prompt}". Then, composite the main subject from the provided image onto this new background. The provided image has a transparent background.` },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('Background composition failed to generate an image.');
};

export const compositeWithUploadedBackground = async (
    foreground: ImageFile,
    background: ImageFile,
): Promise<string> => {
    const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imageToPart(foreground),
                imageToPart(background),
                { text: 'Composite the main subject from the first image onto the background from the second image. The first image has a transparent background. The result should be realistic.' },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('Background composition failed to generate an image.');
};
