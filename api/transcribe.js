import express from "express"
import multer from "multer"
import { createReadStream, unlinkSync, statSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import ffmpeg from "fluent-ffmpeg"
import OpenAI from "openai"

const app = express()

// Configure multer for file uploads
const upload = multer({
  dest: tmpdir(),
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB limit for Vercel serverless functions
  },
})

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to extract audio from video
function extractAudioFromVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions("-vn") // No video
      .audioCodec("aac")
      .audioBitrate("128k")
      .on("end", () => {
        console.log("Audio extraction completed")
        resolve(outputPath)
      })
      .on("error", (err) => {
        console.error("Error extracting audio:", err)
        reject(err)
      })
      .save(outputPath)
  })
}

// Helper function to compress audio
function compressAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("aac")
      .audioBitrate("64k")
      .audioChannels(1)
      .audioFrequency(16000)
      .on("end", () => {
        console.log("Audio compression completed")
        resolve(outputPath)
      })
      .on("error", (err) => {
        console.error("Error compressing audio:", err)
        reject(err)
      })
      .save(outputPath)
  })
}

// Helper function to transcribe audio
async function transcribeAudio(audioPath) {
  try {
    const stats = statSync(audioPath)
    const fileSizeInMB = stats.size / (1024 * 1024)

    console.log(`Audio file size: ${fileSizeInMB.toFixed(2)} MB`)

    if (fileSizeInMB > 24) {
      console.log("File too large, compressing audio...")
      const compressedPath = audioPath.replace(/\.[^/.]+$/, "_compressed.m4a")
      await compressAudio(audioPath, compressedPath)

      const transcription = await openai.audio.transcriptions.create({
        file: createReadStream(compressedPath),
        model: "whisper-1",
      })

      unlinkSync(compressedPath) // Clean up compressed file
      return transcription.text
    } else {
      const transcription = await openai.audio.transcriptions.create({
        file: createReadStream(audioPath),
        model: "whisper-1",
      })
      return transcription.text
    }
  } catch (error) {
    console.error("Error transcribing audio:", error)
    throw error
  }
}

// Transcribe endpoint
app.post("/api/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    // Check file size
    const fileSizeInMB = req.file.size / (1024 * 1024)
    if (fileSizeInMB > 4) {
      return res.status(413).json({
        error: "File too large",
        message:
          "Please upload a file smaller than 4MB. For larger files, consider compressing the video/audio first.",
        maxSize: "4MB",
      })
    }

    const file = req.file
    console.log(`Processing ${file.mimetype} file: ${file.originalname}`)

    let audioPath = file.path

    // Extract audio if it's a video file
    if (file.mimetype.startsWith("video/")) {
      console.log("Extracting audio from video...")
      const audioOutputPath = join(tmpdir(), `${file.filename}_audio.wav`)
      await extractAudioFromVideo(file.path, audioOutputPath)
      audioPath = audioOutputPath
    }

    // Transcribe the audio
    console.log("Transcribing audio...")
    const transcript = await transcribeAudio(audioPath)

    // Clean up files
    unlinkSync(file.path)
    if (audioPath !== file.path) {
      unlinkSync(audioPath)
    }

    res.json({ transcript })
  } catch (error) {
    console.error("Error processing file:", error)
    res.status(500).json({ error: "Error processing file" })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

// Export the Express app as a Vercel serverless function
export default app
