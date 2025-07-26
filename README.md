# Educational Reflection Tool

A web application that processes audio/video files and generates transcripts, summaries, and reflective questions for educational purposes.

## Features

- **Audio/Video Upload**: Support for multiple audio and video formats
- **Speech-to-Text**: Real-time transcription using OpenAI Whisper
- **Audio Extraction**: Automatic audio extraction from video files using FFmpeg
- **Structured Summary**: Key points extraction from transcripts
- **Reflective Questions**: AI-generated questions based on content

## Supported File Formats

### Audio Formats

- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- AAC (.aac)
- OGG (.ogg)
- FLAC (.flac)
- AMR (.amr)
- WMA (.wma)

### Video Formats

- MP4 (.mp4)
- MOV (.mov)
- AVI (.avi)
- MKV (.mkv)
- WMV (.wmv)
- FLV (.flv)
- WebM (.webm)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

4. **Start the backend server:**

   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to the main directory:**

   ```bash
   cd ..
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the frontend development server:**

   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

## Usage

1. **Upload Audio/Video File:**

   - Click "📁 Upload Audio/Video File"
   - Select a supported audio or video file
   - Or type/paste text directly

2. **Generate Transcript:**

   - Click "🎤 Convert to Transcript"
   - For files: Audio will be extracted from video if needed, then transcribed using Whisper
   - For text: Direct use as transcript

3. **View Results:**
   - **Transcript**: Shows the transcribed text
   - **Structured Summary**: Key bullet points extracted from transcript
   - **Reflective Questions**: AI-generated questions for reflection

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/transcribe` - Upload and transcribe audio/video files

## Technical Stack

### Backend

- **Node.js** with Express
- **Multer** for file uploads
- **FFmpeg** for audio/video processing
- **OpenAI Whisper** for speech-to-text
- **CORS** for cross-origin requests

### Frontend

- **React** with TypeScript
- **Fetch API** for backend communication
- **CSS** for styling

## Environment Variables

| Variable         | Description                              | Required |
| ---------------- | ---------------------------------------- | -------- |
| `OPENAI_API_KEY` | OpenAI API key for Whisper transcription | Yes      |
| `PORT`           | Backend server port (default: 3001)      | No       |

## File Size Limits

- Maximum file size: 100MB
- Supported formats are validated on both frontend and backend

## Error Handling

- File format validation
- File size limits
- Network error handling
- Transcription error handling
- User-friendly error messages

## Development

### Backend Development

```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development

```bash
npm start    # React development server
```

## Production Build

### Frontend

```bash
npm run build
```

### Backend

```bash
cd backend
npm start
```

## Troubleshooting

1. **"Failed to transcribe file" error:**

   - Check your OpenAI API key is valid
   - Ensure the file format is supported
   - Check file size is under 100MB

2. **CORS errors:**

   - Ensure backend is running on port 3001
   - Check frontend is making requests to correct URL

3. **FFmpeg errors:**
   - FFmpeg is included via npm package
   - No system installation required

## License

ISC
