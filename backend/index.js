require("dotenv").config()
const express = require("express")
const multer = require("multer")
const cors = require("cors")
const path = require("path")
const fs = require("fs")
const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path
const OpenAI = require("openai/index.js")

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    )
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedAudioTypes = [
      ".mp3",
      ".wav",
      ".m4a",
      ".aac",
      ".ogg",
      ".flac",
      ".amr",
      ".wma",
    ]
    const allowedVideoTypes = [
      ".mp4",
      ".mov",
      ".avi",
      ".mkv",
      ".wmv",
      ".flv",
      ".webm",
    ]
    const ext = path.extname(file.originalname).toLowerCase()

    if ([...allowedAudioTypes, ...allowedVideoTypes].includes(ext)) {
      cb(null, true)
    } else {
      cb(
        new Error("Unsupported file type. Please upload audio or video files."),
        false
      )
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
})

// Initialize OpenAI (you'll need to set OPENAI_API_KEY environment variable)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to extract audio from video
function extractAudioFromVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat("wav")
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

// Helper function to compress audio to reduce file size
function compressAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("aac") // Use AAC instead of MP3
      .audioBitrate("64k") // Low bitrate to reduce file size
      .audioChannels(1) // Mono audio
      .audioFrequency(16000) // Lower frequency
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

// Helper function to transcribe audio using OpenAI Whisper
async function transcribeAudio(audioPath) {
  try {
    // Check file size first
    const stats = fs.statSync(audioPath)
    const fileSizeInBytes = stats.size
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024)

    console.log(`Audio file size: ${fileSizeInMB.toFixed(2)} MB`)

    // If file is larger than 24MB, compress it
    if (fileSizeInMB > 24) {
      console.log("File too large, compressing audio...")
      const compressedPath = audioPath.replace(
        path.extname(audioPath),
        "_compressed.m4a"
      )
      await compressAudio(audioPath, compressedPath)

      // Use compressed file for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(compressedPath),
        model: "whisper-1",
      })

      // Clean up compressed file
      fs.unlinkSync(compressedPath)
      return transcription.text
    } else {
      // Use original file if it's small enough
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
      })
      return transcription.text
    }
  } catch (error) {
    console.error("Error transcribing audio:", error)
    throw error
  }
}

// Helper function to detect file type
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase()
  const audioTypes = [
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".ogg",
    ".flac",
    ".amr",
    ".wma",
  ]
  const videoTypes = [".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm"]

  if (audioTypes.includes(ext)) return "audio"
  if (videoTypes.includes(ext)) return "video"
  return "unknown"
}

// Upload and transcribe endpoint
app.post("/api/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const filePath = req.file.path
    const fileType = getFileType(req.file.originalname)
    let audioPath = filePath

    console.log(`Processing ${fileType} file: ${req.file.originalname}`)

    // Step 1: Detect file type and extract audio if needed
    if (fileType === "video") {
      console.log("Extracting audio from video...")
      const audioOutputPath = filePath.replace(
        path.extname(filePath),
        "_audio.wav"
      )
      audioPath = await extractAudioFromVideo(filePath, audioOutputPath)
    }

    // Step 2: Transcribe audio using OpenAI Whisper
    console.log("Transcribing audio...")
    const transcript = await transcribeAudio(audioPath)

    // Clean up temporary files
    if (fileType === "video" && audioPath !== filePath) {
      fs.unlinkSync(audioPath)
    }
    fs.unlinkSync(filePath)

    // Step 3: Return transcript
    res.json({
      success: true,
      transcript,
      originalFile: req.file.originalname,
      fileType: fileType,
    })
  } catch (error) {
    console.error("Error processing file:", error)

    // Clean up files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      error: "Error processing file",
      details: error.message,
    })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running" })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
  console.log(`Transcribe endpoint: http://localhost:${PORT}/api/transcribe`)
})
