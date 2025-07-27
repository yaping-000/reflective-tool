import express from "express"
import multer from "multer"
import { createReadStream, unlinkSync, statSync } from "fs"
import { tmpdir } from "os"
import OpenAI from "openai"

const app = express()

// Configure multer for file uploads
const upload = multer({
  dest: tmpdir(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit since files are now pre-processed
  },
})

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    if (fileSizeInMB > 10) {
      return res.status(413).json({
        error: "File too large",
        message:
          "Please upload a file smaller than 10MB. The app will automatically compress larger files.",
        maxSize: "10MB",
      })
    }

    const file = req.file
    console.log(`Processing ${file.mimetype} file: ${file.originalname}`)

    // Transcribe the audio (already processed on frontend)
    console.log("Transcribing audio...")
    const transcript = await transcribeAudio(file.path)

    // Clean up files
    unlinkSync(file.path)

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
