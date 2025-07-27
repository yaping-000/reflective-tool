import express from "express"
import multer from "multer"
import { createReadStream, unlinkSync, statSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import OpenAI from "openai"
import ffmpeg from "fluent-ffmpeg"

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

// Helper function to extract audio from video
function extractAudioFromVideo(videoPath) {
  return new Promise((resolve, reject) => {
    const audioPath = join(tmpdir(), `audio_${Date.now()}.wav`)

    console.log(`Extracting audio from video: ${videoPath}`)
    console.log(`Output audio path: ${audioPath}`)

    ffmpeg(videoPath)
      .toFormat("wav")
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .audioFrequency(16000)
      .on("end", () => {
        console.log("Audio extraction completed")
        resolve(audioPath)
      })
      .on("error", (err) => {
        console.error("Error extracting audio:", err)
        reject(err)
      })
      .save(audioPath)
  })
}

// Helper function to transcribe audio
async function transcribeAudio(audioPath) {
  try {
    const stats = statSync(audioPath)
    const fileSizeInMB = stats.size / (1024 * 1024)

    console.log(`Audio file size: ${fileSizeInMB.toFixed(2)} MB`)

    // Since files are pre-processed on frontend, just transcribe directly
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: "whisper-1",
    })

    console.log(
      "Transcription result:",
      transcription.text.substring(0, 100) + "..."
    )
    return transcription.text
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
    console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

    let audioPath = file.path
    let isVideoFile = false

    // Check if it's a video file
    const videoExtensions = ["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv"]
    const fileExtension = file.originalname.split(".").pop()?.toLowerCase()

    if (videoExtensions.includes(fileExtension)) {
      console.log("Detected video file, extracting audio...")
      isVideoFile = true
      try {
        audioPath = await extractAudioFromVideo(file.path)
        console.log(`Audio extracted to: ${audioPath}`)
      } catch (error) {
        console.error("Failed to extract audio from video:", error)
        return res
          .status(500)
          .json({ error: "Failed to extract audio from video" })
      }
    }

    // Transcribe the audio
    console.log("Transcribing audio...")
    console.log(`File type: ${file.mimetype}`)
    console.log(`File extension: ${fileExtension}`)

    const transcript = await transcribeAudio(audioPath)

    console.log(`Final transcript length: ${transcript.length} characters`)
    console.log(`Transcript preview: "${transcript.substring(0, 200)}..."`)

    // Clean up files
    unlinkSync(file.path)
    if (isVideoFile && audioPath !== file.path) {
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
