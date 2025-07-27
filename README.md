# Educational Reflection Tool

A comprehensive AI-powered web application that processes audio/video files and text to generate transcripts, structured summaries, quiz questions, and interactive mind maps for educational purposes.

## 🚀 Features

- **Multi-Modal Input**: Support for audio, video, and text input
- **AI-Powered Processing**:
  - Speech-to-text transcription using OpenAI Whisper
  - Structured summaries with key themes and insights
  - Quiz questions to test understanding
  - Interactive mind maps for visual learning
- **Client-Side Audio Processing**: Efficient audio extraction and compression
- **Interactive Responses**: Text, audio, and image responses to questions
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 📁 Supported File Formats

### Audio Formats

- MP3 (.mp3), WAV (.wav), M4A (.m4a), AAC (.aac)
- OGG (.ogg), FLAC (.flac), AMR (.amr), WMA (.wma)

### Video Formats

- MP4 (.mp4), MOV (.mov), AVI (.avi), MKV (.mkv)
- WMV (.wmv), FLV (.flv), WebM (.webm)

## 🛠️ Local Development Setup

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **OpenAI API key** (for transcription and AI features)
- **Git** (to clone the repository)

### Step 1: Clone and Navigate

```bash
git clone <repository-url>
cd reflective-tool
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
touch .env
```

Add the following environment variables to `.env`:

```env
# OpenAI API Key (Required)
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Backend URL (Required for local development)
REACT_APP_BACKEND_URL=http://localhost:3001/api
```

**Important Notes:**

- Replace `your_openai_api_key_here` with your actual OpenAI API key
- Get your API key from: https://platform.openai.com/api-keys
- The `.env` file should be in the project root (same level as `package.json`)

### Step 4: Start the Development Server

Due to Node.js version compatibility, you need to set the OpenSSL legacy provider:

```bash
export NODE_OPTIONS=--openssl-legacy-provider
npm start
```

**Alternative (one-liner):**

```bash
NODE_OPTIONS=--openssl-legacy-provider npm start
```

The application will open automatically at: http://localhost:3000

### Step 5: Verify Setup

1. **Check the homepage loads** without errors
2. **Verify environment variables** are loaded (no console errors about missing API keys)
3. **Test file upload** with a small audio/video file

## 🎯 Usage Guide

### 1. Choose Input Type

- **Audio**: Upload audio files for transcription
- **Video**: Upload video files (audio will be extracted automatically)
- **Text**: Type or paste text directly

### 2. Process Content

- **For Audio/Video**: Click "Convert to Transcript"
- **For Text**: Click "Process Text"

### 3. Explore Outputs

- **Transcript**: View the transcribed text (hidden for text input)
- **Summary/Insights**: AI-generated structured summary with themes
- **Questions/Quizzes**: AI-generated questions to test understanding
- **Mind Map**: Interactive hierarchical visualization

### 4. Interactive Features

- **Respond to Questions**: Use text, audio recording, or image upload
- **Navigate Mind Map**: Zoom, pan, and explore the visual structure

## 🔧 Troubleshooting

### Common Issues

#### 1. "OpenSSL Legacy Provider" Error

```bash
Error: error:0308010C:digital envelope routines::unsupported
```

**Solution:**

```bash
export NODE_OPTIONS=--openssl-legacy-provider
npm start
```

#### 2. "Module not found" Errors

```bash
npm error code ENOENT
npm error syscall open
npm error path /path/to/package.json
```

**Solution:** Ensure you're in the correct directory:

```bash
pwd  # Should show: /path/to/reflective-tool
ls   # Should show package.json, src/, etc.
```

#### 3. API Key Errors

```bash
OpenAIError: The OPENAI_API_KEY environment variable is missing or empty
```

**Solution:**

1. Check `.env` file exists in project root
2. Verify API key is correct and has credits
3. Restart the development server after adding `.env`

#### 4. Single Word Transcripts

If you're getting only "you" or single words in transcripts:

**Solution:**

1. Check browser console for audio extraction logs
2. Try a different audio/video file
3. Ensure file has clear audio content
4. Check file size (should be under 10MB)

#### 5. CORS Errors

```bash
Access to fetch at 'http://localhost:3001/api/transcribe' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:** The app now uses Vercel serverless functions, so this shouldn't occur. If it does, check your `REACT_APP_BACKEND_URL` environment variable.

### Performance Tips

- **File Size**: Keep files under 10MB for best performance
- **Audio Quality**: Clear audio produces better transcripts
- **Browser**: Use Chrome for best compatibility
- **Network**: Stable internet connection required for AI processing

## 🏗️ Project Structure

```
reflective-tool/
├── src/                    # React frontend source code
│   ├── App.tsx            # Main application component
│   ├── App.css            # Styles
│   └── index.tsx          # Entry point
├── api/                   # Vercel serverless functions
│   └── transcribe.js      # Backend API for transcription
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
└── README.md             # This file
```

## 🔑 Environment Variables Reference

| Variable                   | Description                                      | Required    | Example                     |
| -------------------------- | ------------------------------------------------ | ----------- | --------------------------- |
| `REACT_APP_OPENAI_API_KEY` | OpenAI API key for transcription and AI features | Yes         | `sk-...`                    |
| `REACT_APP_BACKEND_URL`    | Backend API URL                                  | Yes (local) | `http://localhost:3001/api` |

## 🚀 Deployment

### Vercel Deployment

The app is configured for Vercel deployment:

1. **Connect to Vercel** from your GitHub repository
2. **Set Environment Variables** in Vercel dashboard:
   - `REACT_APP_OPENAI_API_KEY`
   - `REACT_APP_BACKEND_URL` (Vercel will provide this)
   - `OPENAI_API_KEY` (for serverless functions)
3. **Deploy** - Vercel will automatically build and deploy

### Local Production Build

```bash
npm run build
serve -s build
```

## 📝 Development Notes

- **Audio Processing**: Uses client-side MediaRecorder API for compatibility
- **File Compression**: Automatic compression for files over 3MB
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Responsive Design**: Mobile-first approach with responsive UI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify environment variables are set correctly
4. Test with a simple audio file first
5. Check OpenAI API key has sufficient credits

---

**Happy Learning! 🎓**
