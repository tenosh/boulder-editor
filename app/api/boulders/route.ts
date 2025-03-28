import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs/promises";
import os from "os";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function POST(req: Request) {
  try {
    const { imageData, routeId } = await req.json();

    // Determine folder name based on table type
    const folderName = "boulders";

    // Use routeId directly instead of generating a new UUID
    const imageId = routeId;

    // Process based on image format
    let buffer: Buffer;

    if (imageData.startsWith("http")) {
      // Handle URL
      const response = await fetch(imageData);
      if (!response.ok)
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      buffer = Buffer.from(await response.arrayBuffer());
    } else {
      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    }

    // Create temp directory
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "boulder"));
    const tmpFilePath = path.join(tmpDir, `${imageId}.webp`);

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const { width: originalWidth = 0, height: originalHeight = 0 } = metadata;

    // Calculate dimensions for 4:3 aspect ratio crop
    const targetRatio = 3 / 4;
    let cropWidth = originalWidth;
    let cropHeight = originalHeight;
    let left = 0;
    let top = 0;

    if (originalWidth / originalHeight > targetRatio) {
      // Image is wider than 4:3, crop width
      cropWidth = Math.round(originalHeight * targetRatio);
      left = Math.floor((originalWidth - cropWidth) / 2);
    } else {
      // Image is taller than 4:3, crop height
      cropHeight = Math.round(originalWidth / targetRatio);
      top = Math.floor((originalHeight - cropHeight) / 2);
    }

    // Maximum dimensions for resizing
    const MAX_WIDTH = 900;
    const MAX_HEIGHT = 1200;

    // Define initial processing parameters
    let quality = 85;
    const MAX_SIZE_KB = 300;
    let resizeWidth = cropWidth;
    let resizeHeight = cropHeight;

    // Calculate scaling factor to fit within max dimensions
    const widthRatio = MAX_WIDTH / cropWidth;
    const heightRatio = MAX_HEIGHT / cropHeight;
    const scaleFactor = Math.min(widthRatio, heightRatio);

    // Only resize if image is larger than the max dimensions
    if (scaleFactor < 1) {
      resizeWidth = Math.round(cropWidth * scaleFactor);
      resizeHeight = Math.round(cropHeight * scaleFactor);
    }

    // Process with progressive quality reduction and resizing if needed
    let processedImage;
    let finalBuffer;
    let currentQuality = quality;
    let currentWidth = resizeWidth;
    let currentHeight = resizeHeight;

    while (true) {
      processedImage = sharp(buffer)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .resize(currentWidth, currentHeight)
        .webp({ quality: currentQuality, effort: 6 });

      finalBuffer = await processedImage.toBuffer();
      const fileSize = finalBuffer.length / 1024; // Size in KB

      if (fileSize <= MAX_SIZE_KB) {
        // Save the file
        await fs.writeFile(tmpFilePath, finalBuffer);
        break;
      }

      if (currentQuality > 10) {
        // First try reducing quality
        currentQuality -= 10;
      } else {
        // If quality is already at minimum, reduce dimensions
        currentWidth = Math.round(currentWidth * 0.8);
        currentHeight = Math.round(currentHeight * 0.8);
        currentQuality = 60; // Reset quality after resizing

        // If image becomes too small, stop resizing
        if (currentWidth < 500 || currentHeight < 500) {
          await fs.writeFile(tmpFilePath, finalBuffer);
          break;
        }
      }
    }

    // Use the routeId for the file name to ensure consistent updating
    const fileName = `${imageId}.webp`;
    const filePath = `${folderName}/${fileName}`;

    // Read the optimized file
    const optimizedBuffer = await fs.readFile(tmpFilePath);

    // Upload to Supabase Storage with upsert to update existing files
    const { error: uploadError } = await supabase.storage
      .from("cactux")
      .upload(filePath, optimizedBuffer, {
        contentType: "image/webp",
        upsert: true, // This ensures the file is updated if it already exists
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("cactux").getPublicUrl(filePath);

    // Update record in the boulder table
    const { error: updateError } = await supabase
      .from("boulder")
      .update({
        image: publicUrl,
      })
      .eq("id", routeId);

    if (updateError) throw updateError;

    // Clean up temp files
    await fs.rm(tmpDir, { recursive: true });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "Image processed and saved successfully",
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to process image", details: String(error) },
      { status: 500 }
    );
  }
}
