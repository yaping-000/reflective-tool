import React, { useState, useEffect } from "react"
import Tree from "react-d3-tree"
import "./App.css"

async function generateQuestionsWithChatGPT(
  transcript: string
): Promise<string[]> {
  try {
    console.log(
      "Calling ChatGPT API with transcript:",
      transcript.substring(0, 100) + "..."
    )

    const prompt = `A student has provided the following material (transcript or text):

"${transcript}"

Your task:
- Analyze the material and identify the main concepts, facts, or ideas.
- Generate 2–3 open-ended or short-answer quiz questions that test the student's understanding of the material.
- The questions should require the student to recall, explain, or apply what they learned (not just reflect or give opinions).
- Do NOT generate multiple choice questions. Do NOT ask for personal reflection.
- Focus on comprehension, recall, and application.

Return only the final quiz questions as a list.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    console.log("ChatGPT API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ChatGPT API error:", errorText)
      throw new Error(
        `Failed to generate questions with ChatGPT: ${response.status}`
      )
    }

    const data = await response.json()
    console.log("ChatGPT API response data:", data)

    const content = data.choices[0].message.content
    console.log("ChatGPT response content:", content)

    // Parse the response to extract questions
    const questions = content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) =>
        line
          .replace(/^\d+\.\s*/, "")
          .replace(/^[-*]\s*/, "")
          .trim()
      )
      .filter((line) => line.length > 10 && line.endsWith("?"))

    console.log("Parsed questions:", questions)

    return questions.length > 0
      ? questions
      : [
          "What is one key concept from this material?",
          "Explain an important idea in your own words.",
          "How could you apply something you learned from this material?",
        ]
  } catch (error) {
    console.error("Error generating questions with ChatGPT:", error)
    // Fallback to basic questions
    return [
      "What is one key concept from this material?",
      "Explain an important idea in your own words.",
      "How could you apply something you learned from this material?",
    ]
  }
}

async function generateSummaryWithChatGPT(
  transcript: string
): Promise<Array<{ type: string; content: string; section?: string }>> {
  try {
    console.log(
      "Calling ChatGPT API for summary with transcript:",
      transcript.substring(0, 100) + "..."
    )

    const prompt = `A student has shared this reflection transcript:

"${transcript}"

Please analyze this transcript and create a well-structured summary with the following format:

**Key Themes:**
• [Theme 1 - 1-2 sentences]
• [Theme 2 - 1-2 sentences]

**Important Insights:**
• [Insight 1 - 1-2 sentences]
• [Insight 2 - 1-2 sentences]

**Personal Growth:**
• [Growth area 1 - 1-2 sentences]
• [Growth area 2 - 1-2 sentences]

Focus on extracting meaningful insights rather than just summarizing what was said. Use clear, concise language and ensure each bullet point is substantive.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    })

    console.log("ChatGPT API response status for summary:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ChatGPT API error for summary:", errorText)
      throw new Error(
        `Failed to generate summary with ChatGPT: ${response.status}`
      )
    }

    const data = await response.json()
    console.log("ChatGPT API response data for summary:", data)

    const content = data.choices[0].message.content
    console.log("ChatGPT summary response content:", content)

    // Parse the response to extract structured summary
    const lines = content.split("\n").filter((line) => line.trim().length > 0)
    const structuredSummary: Array<{
      type: string
      content: string
      section?: string
    }> = []

    let currentSection = ""

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Check for section headers
      if (trimmedLine.startsWith("**") && trimmedLine.endsWith(":**")) {
        currentSection = trimmedLine.replace(/\*\*/g, "").replace(/:/g, "")
        structuredSummary.push({ type: "header", content: currentSection })
      }
      // Check for bullet points
      else if (
        trimmedLine.startsWith("•") ||
        trimmedLine.startsWith("-") ||
        trimmedLine.startsWith("*")
      ) {
        const bulletContent = trimmedLine.replace(/^[•\-*]\s*/, "").trim()
        if (bulletContent.length > 10) {
          structuredSummary.push({
            type: "bullet",
            content: bulletContent,
            section: currentSection,
          })
        }
      }
      // Check for numbered points
      else if (/^\d+\./.test(trimmedLine)) {
        const numberedContent = trimmedLine.replace(/^\d+\.\s*/, "").trim()
        if (numberedContent.length > 10) {
          structuredSummary.push({
            type: "bullet",
            content: numberedContent,
            section: currentSection,
          })
        }
      }
    }

    console.log("Parsed structured summary:", structuredSummary)

    return structuredSummary.length > 0
      ? structuredSummary
      : [
          { type: "header", content: "Key Themes" },
          {
            type: "bullet",
            content: "Key insights and themes from the reflection",
            section: "Key Themes",
          },
          { type: "header", content: "Important Insights" },
          {
            type: "bullet",
            content: "Personal growth and learning moments",
            section: "Important Insights",
          },
          { type: "header", content: "Personal Growth" },
          {
            type: "bullet",
            content: "Areas for further exploration",
            section: "Personal Growth",
          },
        ]
  } catch (error) {
    console.error("Error generating summary with ChatGPT:", error)
    // Fallback to basic summary
    return [
      { type: "header", content: "Key Themes" },
      {
        type: "bullet",
        content: "Key insights and themes from the reflection",
        section: "Key Themes",
      },
      { type: "header", content: "Important Insights" },
      {
        type: "bullet",
        content: "Personal growth and learning moments",
        section: "Important Insights",
      },
      { type: "header", content: "Personal Growth" },
      {
        type: "bullet",
        content: "Areas for further exploration",
        section: "Personal Growth",
      },
    ]
  }
}

async function generateMindMapWithChatGPT(transcript: string): Promise<any> {
  try {
    console.log(
      "Calling ChatGPT API for mind map with transcript:",
      transcript.substring(0, 100) + "..."
    )

    const prompt = `You are a mind map generator assistant.

Analyze the following transcript or text content and create a hierarchical mind map that extracts and organizes the KEY CONCEPTS, THEMES, and INSIGHTS from the material. Do NOT simply repeat or summarize the transcript - instead, identify the main ideas, concepts, and relationships.

Your task:
1. Identify the central topic or main subject
2. Extract 3-5 key themes or categories from the content
3. For each theme, identify 2-3 important subtopics or concepts
4. Add relevant details or examples that support each subtopic

Focus on:
- Main concepts and ideas
- Key themes and patterns
- Important relationships between ideas
- Supporting evidence or examples
- Learning objectives or takeaways

### Output format:
Return only valid JSON with this structure:

{
  "topic": "string (central topic - the main subject or theme)",
  "categories": [
    {
      "title": "string (category title - a key theme or concept area)",
      "type": "category",
      "nodes": [
        {
          "title": "string (subtopic - specific concept or idea within the category)",
          "type": "subtopic",
          "children": [
            {
              "title": "string (detail - supporting point, example, or explanation)",
              "type": "detail"
            }
          ]
        }
      ]
    }
  ]
}

Do not include markdown, code fences, or commentary. Focus on extracting meaningful concepts, not just repeating the text.

Content to analyze:
"${transcript}"`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert educational content analyzer. Your job is to extract key concepts, themes, and insights from educational content and organize them into meaningful hierarchical structures. Focus on identifying the most important ideas and relationships, not on summarizing or repeating the content.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })

    console.log("ChatGPT API response status for mind map:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ChatGPT API error for mind map:", errorText)
      throw new Error(
        `Failed to generate mind map with ChatGPT: ${response.status}`
      )
    }

    const data = await response.json()
    console.log("ChatGPT API response data for mind map:", data)

    const content = data.choices[0].message.content
    console.log("ChatGPT mind map response content:", content)

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response")
    }

    const mindMapStructure = JSON.parse(jsonMatch[0])
    console.log("Parsed mind map structure:", mindMapStructure)

    return mindMapStructure
  } catch (error) {
    console.error("Error generating mind map with ChatGPT:", error)
    // Fallback to basic mind map structure
    return {
      topic: "Reflection Topics",
      categories: [
        {
          title: "Key Themes",
          type: "category",
          nodes: [
            {
              title: "Main theme 1",
              type: "subtopic",
              children: [
                {
                  title: "Supporting detail 1",
                  type: "detail",
                },
                {
                  title: "Supporting detail 2",
                  type: "detail",
                },
              ],
            },
            {
              title: "Main theme 2",
              type: "subtopic",
              children: [
                {
                  title: "Supporting detail 3",
                  type: "detail",
                },
              ],
            },
          ],
        },
        {
          title: "Important Insights",
          type: "category",
          nodes: [
            {
              title: "Insight 1",
              type: "subtopic",
              children: [
                {
                  title: "Explanation",
                  type: "detail",
                },
              ],
            },
          ],
        },
        {
          title: "Personal Growth",
          type: "category",
          nodes: [
            {
              title: "Growth area 1",
              type: "subtopic",
              children: [
                {
                  title: "Development opportunity",
                  type: "detail",
                },
              ],
            },
          ],
        },
      ],
    }
  }
}

// Helper function to wrap text for mind map nodes
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const avgCharWidth = fontSize * 0.6 // Approximate character width
  const maxChars = Math.floor(maxWidth / avgCharWidth)

  if (text.length <= maxChars) {
    return [text]
  }

  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    if ((currentLine + word).length <= maxChars) {
      currentLine += (currentLine ? " " : "") + word
    } else {
      if (currentLine) {
        lines.push(currentLine)
      }
      currentLine = word
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

// Convert new mind map structure to react-d3-tree format
function convertMindMapToTreeFormat(mindMapData: any) {
  if (!mindMapData || !mindMapData.topic) {
    return {
      name: "No Data",
      attributes: { type: "central" },
    }
  }

  const centralNode = {
    name: mindMapData.topic,
    attributes: { type: "central" },
    children:
      mindMapData.categories?.map((category: any) => ({
        name: category.title,
        attributes: { type: "category" },
        children:
          category.nodes?.map((node: any) => ({
            name: node.title,
            attributes: { type: "subtopic" },
            children:
              node.children?.map((child: any) => ({
                name: child.title,
                attributes: { type: "detail" },
              })) || [],
          })) || [],
      })) || [],
  }

  return centralNode
}

// Interactive Response Component
function QuestionResponse({
  questionIndex,
  question,
  activeInputType,
  setActiveInputType,
  saveResponse,
  getResponse,
  supportedAudioTypes,
  supportedImageTypes,
}: {
  questionIndex: number
  question: string
  activeInputType: string
  setActiveInputType: (index: number, type: string) => void
  saveResponse: (index: number, response: any) => void
  getResponse: (index: number) => any
  supportedAudioTypes: string[]
  supportedImageTypes: string[]
}) {
  const [textResponse, setTextResponse] = useState("")
  const [audioFile, setAudioFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [recordedChunks, setRecordedChunks] = useState([])

  const response = getResponse(questionIndex)

  const handleTextChange = (e: any) => {
    const text = e.target.value
    setTextResponse(text)
    saveResponse(questionIndex, text)
  }

  const handleAudioUpload = (event: any) => {
    const file = event.target.files?.[0]
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase()
      const isAudioSupported =
        ext && supportedAudioTypes.some((type) => type.replace(".", "") === ext)

      if (!isAudioSupported) {
        alert(
          "Unsupported audio format. Please upload MP3, WAV, M4A, or other supported audio files."
        )
        event.target.value = ""
        return
      }

      setAudioFile(file)
      saveResponse(questionIndex, { file, type: "audio-upload" })
    }
  }

  const handleImageUpload = (event: any) => {
    const file = event.target.files?.[0]
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase()
      const isImageSupported =
        ext && supportedImageTypes.some((type) => type.replace(".", "") === ext)

      if (!isImageSupported) {
        alert(
          "Unsupported image format. Please upload JPG, PNG, GIF, or other supported image files."
        )
        event.target.value = ""
        return
      }

      setImageFile(file)
      saveResponse(questionIndex, { file, type: "image-upload" })
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: any[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        const file = new File([blob], `recording-${Date.now()}.wav`, {
          type: "audio/wav",
        })
        setAudioFile(file)
        saveResponse(questionIndex, { file, type: "audio-record" })
        setRecordedChunks(chunks)
      }

      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
    }
  }

  const renderInputArea = () => {
    switch (activeInputType) {
      case "text":
        return (
          <div className="response-input-area">
            <textarea
              value={textResponse}
              onChange={handleTextChange}
              placeholder="Type your response here..."
              rows={4}
              className="response-textarea"
            />
          </div>
        )

      case "audio":
        return (
          <div className="response-input-area">
            <div className="audio-input-section">
              <div className="audio-controls">
                {!isRecording ? (
                  <button onClick={startRecording} className="record-button">
                    🎤 Start Recording
                  </button>
                ) : (
                  <button onClick={stopRecording} className="stop-button">
                    ⏹️ Stop Recording
                  </button>
                )}
                <div className="or-divider-small">— or —</div>
                <input
                  type="file"
                  id={`audio-upload-${questionIndex}`}
                  accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,audio/*"
                  onChange={handleAudioUpload}
                  className="file-input"
                />
                <label
                  htmlFor={`audio-upload-${questionIndex}`}
                  className="file-label"
                >
                  📁 Upload Audio
                </label>
              </div>
              {audioFile && (
                <div className="file-info">
                  🎵 {audioFile.name} (
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>
        )

      case "image":
        return (
          <div className="response-input-area">
            <div className="image-input-section">
              <input
                type="file"
                id={`image-upload-${questionIndex}`}
                accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <label
                htmlFor={`image-upload-${questionIndex}`}
                className="file-label"
              >
                📷 Upload Image
              </label>
              {imageFile && (
                <div className="file-info">
                  🖼️ {imageFile.name} (
                  {(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                  {imageFile.type.startsWith("image/") && (
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Uploaded"
                      className="preview-image"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="question-response">
      <div className="question-text">{question}</div>

      <div className="input-type-selector">
        <button
          className={`input-type-btn ${
            activeInputType === "text" ? "active" : ""
          }`}
          onClick={() => setActiveInputType(questionIndex, "text")}
        >
          ✏️ Text
        </button>
        <button
          className={`input-type-btn ${
            activeInputType === "audio" ? "active" : ""
          }`}
          onClick={() => setActiveInputType(questionIndex, "audio")}
        >
          🎤 Audio
        </button>
        <button
          className={`input-type-btn ${
            activeInputType === "image" ? "active" : ""
          }`}
          onClick={() => setActiveInputType(questionIndex, "image")}
        >
          📷 Image
        </button>
      </div>

      {activeInputType && renderInputArea()}

      {response && (
        <div className="response-preview">
          <strong>Your Response:</strong>
          {response.type === "text" && (
            <div className="response-content">{response.content}</div>
          )}
          {response.type === "audio-upload" && (
            <div className="response-content">🎵 Audio file uploaded</div>
          )}
          {response.type === "audio-record" && (
            <div className="response-content">🎤 Audio recorded</div>
          )}
          {response.type === "image-upload" && (
            <div className="response-content">🖼️ Image uploaded</div>
          )}
        </div>
      )}
    </div>
  )
}

function App() {
  const [inputType, setInputType] = useState<"audio" | "video" | "text">(
    "audio"
  )
  const [input, setInput] = useState("")
  const [audioFile, setAudioFile] = useState(null)
  const [transcript, setTranscript] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [error, setError] = useState("")
  const [questions, setQuestions] = useState([])
  const [summary, setSummary] = useState([])
  const [questionResponses, setQuestionResponses] = useState({})
  const [activeInputTypes, setActiveInputTypes] = useState({})
  const [mindMapData, setMindMapData] = useState(null)
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false)
  const [activeView, setActiveView] = useState("summary") // summary, questions, mindmap, transcript

  // Generate questions when transcript changes
  useEffect(() => {
    if (transcript.trim()) {
      console.log("Transcript changed, generating questions...")
      setIsGeneratingQuestions(true)
      generateQuestionsWithChatGPT(transcript)
        .then((generatedQuestions) => {
          console.log("Generated questions:", generatedQuestions)
          setQuestions(generatedQuestions)
        })
        .catch((error) => {
          console.error("Failed to generate questions:", error)
          setQuestions([
            "What is one key concept from this material?",
            "Explain an important idea in your own words.",
            "How could you apply something you learned from this material?",
          ])
        })
        .finally(() => {
          setIsGeneratingQuestions(false)
        })
    } else {
      setQuestions([])
    }
  }, [transcript])

  // Generate summary when transcript changes
  useEffect(() => {
    if (transcript.trim()) {
      console.log("Transcript changed, generating summary...")
      setIsGeneratingSummary(true)
      generateSummaryWithChatGPT(transcript)
        .then((generatedSummary) => {
          console.log("Generated summary:", generatedSummary)
          setSummary(generatedSummary)
        })
        .catch((error) => {
          console.error("Failed to generate summary:", error)
          setSummary([
            { type: "header", content: "Key Themes" },
            {
              type: "bullet",
              content: "Key insights and themes from the reflection",
              section: "Key Themes",
            },
            { type: "header", content: "Important Insights" },
            {
              type: "bullet",
              content: "Personal growth and learning moments",
              section: "Important Insights",
            },
            { type: "header", content: "Personal Growth" },
            {
              type: "bullet",
              content: "Areas for further exploration",
              section: "Personal Growth",
            },
          ])
        })
        .finally(() => {
          setIsGeneratingSummary(false)
        })
    } else {
      setSummary([])
    }
  }, [transcript])

  // Generate mind map when transcript changes
  useEffect(() => {
    if (transcript.trim()) {
      console.log("Transcript changed, generating mind map...")
      setIsGeneratingMindMap(true)
      generateMindMapWithChatGPT(transcript)
        .then((generatedMindMap) => {
          console.log("Generated mind map:", generatedMindMap)
          setMindMapData(generatedMindMap)
        })
        .catch((error) => {
          console.error("Failed to generate mind map:", error)
          setMindMapData({
            topic: "Reflection Topics",
            categories: [
              {
                title: "Key Themes",
                type: "category",
                nodes: [
                  {
                    title: "Main theme 1",
                    type: "subtopic",
                    children: [
                      {
                        title: "Supporting detail 1",
                        type: "detail",
                      },
                      {
                        title: "Supporting detail 2",
                        type: "detail",
                      },
                    ],
                  },
                  {
                    title: "Main theme 2",
                    type: "subtopic",
                    children: [
                      {
                        title: "Supporting detail 3",
                        type: "detail",
                      },
                    ],
                  },
                ],
              },
              {
                title: "Important Insights",
                type: "category",
                nodes: [
                  {
                    title: "Insight 1",
                    type: "subtopic",
                    children: [
                      {
                        title: "Explanation",
                        type: "detail",
                      },
                    ],
                  },
                ],
              },
              {
                title: "Personal Growth",
                type: "category",
                nodes: [
                  {
                    title: "Growth area 1",
                    type: "subtopic",
                    children: [
                      {
                        title: "Development opportunity",
                        type: "detail",
                      },
                    ],
                  },
                ],
              },
            ],
          })
        })
        .finally(() => {
          setIsGeneratingMindMap(false)
        })
    } else {
      setMindMapData(null)
    }
  }, [transcript])

  const supportedAudioTypes = [
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".ogg",
    ".flac",
    ".amr",
    ".wma",
    ".mp4",
  ]

  const supportedVideoTypes = [
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".wmv",
    ".flv",
    ".webm",
  ]

  const supportedImageTypes = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
  ]

  // Helper functions for question responses
  const setActiveInputType = (questionIndex: number, inputType: string) => {
    setActiveInputTypes((prev) => ({
      ...prev,
      [questionIndex]: inputType,
    }))
  }

  const saveResponse = (questionIndex: number, response: any) => {
    setQuestionResponses((prev) => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        type: activeInputTypes[questionIndex] || "text",
        content: response,
        timestamp: new Date().toISOString(),
      },
    }))
  }

  const getResponse = (questionIndex: number) => {
    return questionResponses[questionIndex] || null
  }

  const handleInputTypeChange = (type: "audio" | "video" | "text") => {
    setInputType(type)
    setInput("")
    setAudioFile(null)
    setTranscript("")
    setError("")
    setQuestions([])
    setSummary([])
    setMindMapData(null)
    setActiveView(type === "text" ? "summary" : "transcript")
  }

  const handleAudioUpload = (event: any) => {
    const file = event.target.files?.[0]
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase()
      const isAudioSupported =
        ext && supportedAudioTypes.some((type) => type.replace(".", "") === ext)
      const isVideoSupported =
        ext && supportedVideoTypes.some((type) => type.replace(".", "") === ext)

      if (
        (inputType === "audio" && !isAudioSupported) ||
        (inputType === "video" && !isVideoSupported)
      ) {
        alert(
          `Unsupported file format. Please upload a valid ${inputType} file.`
        )
        event.target.value = ""
        setAudioFile(null)
        return
      }
      setAudioFile(file)
      setError("")
      setTranscript("")
      setInput("")
      console.log("File uploaded:", file.name)
    }
  }

  const handleConvertToTranscript = async () => {
    setIsTranscribing(true)
    setError("")
    try {
      if ((inputType === "audio" || inputType === "video") && audioFile) {
        // Upload file to backend for transcription
        const formData = new FormData()
        formData.append("file", audioFile)
        const response = await fetch("http://localhost:3001/api/transcribe", {
          method: "POST",
          body: formData,
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to transcribe file")
        }
        const data = await response.json()
        setTranscript(data.transcript)
        console.log("Transcription completed:", data)
      } else if (inputType === "text" && input.trim()) {
        setTranscript(input)
      } else {
        setError(`Please provide a valid ${inputType} input first.`)
      }
    } catch (err) {
      console.error("Transcription error:", err)
      setError(err instanceof Error ? err.message : "Failed to transcribe file")
    } finally {
      setIsTranscribing(false)
    }
  }

  return (
    <div className="reflection-app">
      <h1>Reflective</h1>
      <div className="section">
        <div className="input-type-selector">
          <label>
            <input
              type="radio"
              name="input-type"
              value="audio"
              checked={inputType === "audio"}
              onChange={() => handleInputTypeChange("audio")}
            />
            Audio
          </label>
          <label>
            <input
              type="radio"
              name="input-type"
              value="video"
              checked={inputType === "video"}
              onChange={() => handleInputTypeChange("video")}
            />
            Video
          </label>
          <label>
            <input
              type="radio"
              name="input-type"
              value="text"
              checked={inputType === "text"}
              onChange={() => handleInputTypeChange("text")}
            />
            Text
          </label>
        </div>
        {inputType === "audio" && (
          <div className="audio-upload-section">
            <input
              type="file"
              id="audio-file"
              accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.amr,.wma,audio/*"
              onChange={handleAudioUpload}
              className="audio-file-input"
            />
            <label htmlFor="audio-file" className="audio-file-label">
              📁 Upload Audio File
            </label>
            {audioFile && (
              <div className="audio-file-info">
                🎵 {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)}{" "}
                MB)
              </div>
            )}
          </div>
        )}
        {inputType === "video" && (
          <div className="audio-upload-section">
            <input
              type="file"
              id="video-file"
              accept=".mp4,.mov,.avi,.mkv,.wmv,.flv,.webm,video/*"
              onChange={handleAudioUpload}
              className="audio-file-input"
            />
            <label htmlFor="video-file" className="audio-file-label">
              📁 Upload Video File
            </label>
            {audioFile && (
              <div className="audio-file-info">
                🎬 {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)}{" "}
                MB)
              </div>
            )}
          </div>
        )}
        {inputType === "text" && (
          <textarea
            id="text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste or type a paragraph as if it were spoken by a student..."
            rows={5}
          />
        )}
        <button
          onClick={handleConvertToTranscript}
          disabled={
            isTranscribing ||
            (inputType !== "text" && !audioFile && !input.trim())
          }
          className="convert-button"
        >
          {isTranscribing
            ? inputType === "text"
              ? "🔄 Analyzing..."
              : "🔄 Converting..."
            : inputType === "text"
            ? "🧠 Analyze Text"
            : "🎤 Convert to Transcript"}
        </button>
        {error && <div className="error-message">❌ {error}</div>}
      </div>
      <div className="section">
        <strong>Summary / Insights</strong>
        {isGeneratingSummary ? (
          <div className="placeholder">🤖 Generating AI-powered summary...</div>
        ) : summary.length > 0 ? (
          <div className="structured-summary">
            {summary.map((item, idx) => (
              <div key={idx} className={`summary-item ${item.type}`}>
                {item.type === "header" ? (
                  <h4 className="summary-header">{item.content}</h4>
                ) : (
                  <div className="summary-bullet">• {item.content}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="placeholder">
            (AI-powered summary will appear here after input is processed)
          </div>
        )}
      </div>
      <div className="section">
        <div className="view-selector">
          {inputType !== "text" && transcript && (
            <button
              className={`view-btn ${
                activeView === "transcript" ? "active" : ""
              }`}
              onClick={() => setActiveView("transcript")}
            >
              📝 Transcript
            </button>
          )}
          <button
            className={`view-btn ${activeView === "mindmap" ? "active" : ""}`}
            onClick={() => setActiveView("mindmap")}
          >
            🗺️ Mind Map
          </button>
          <button
            className={`view-btn ${activeView === "questions" ? "active" : ""}`}
            onClick={() => setActiveView("questions")}
          >
            ❓ Questions/Quizzes
          </button>
        </div>
        {/* Transcript View (only for audio/video) */}
        {activeView === "transcript" && inputType !== "text" && transcript && (
          <div className="view-content">
            <strong>Transcript</strong>
            <div className="transcript-box">{transcript}</div>
          </div>
        )}
        {/* Mind Map View */}
        {activeView === "mindmap" && (
          <div className="view-content">
            <strong>Mind Map</strong>
            {isGeneratingMindMap ? (
              <div className="placeholder">
                🤖 Generating AI-powered mind map...
              </div>
            ) : mindMapData ? (
              <div className="mindmap-container">
                <Tree
                  data={convertMindMapToTreeFormat(mindMapData)}
                  orientation="vertical"
                  pathFunc="step"
                  translate={{ x: 300, y: 100 }}
                  separation={{ siblings: 2.2, nonSiblings: 2.8 }}
                  nodeSize={{ x: 200, y: 100 }}
                  renderCustomNodeElement={({ nodeDatum, toggleNode }) => {
                    const isCentral = nodeDatum.attributes?.type === "central"
                    const isCategory = nodeDatum.attributes?.type === "category"
                    const isSubtopic = nodeDatum.attributes?.type === "subtopic"
                    const isDetail = nodeDatum.attributes?.type === "detail"

                    let nodeStyle = {}
                    if (isCentral) {
                      nodeStyle = {
                        fill: "#0066cc",
                        stroke: "#fff",
                        strokeWidth: 2,
                        cursor: "pointer",
                      }
                    } else if (isCategory) {
                      nodeStyle = {
                        fill: "#28a745",
                        stroke: "#fff",
                        strokeWidth: 2,
                        cursor: "pointer",
                      }
                    } else if (isSubtopic) {
                      nodeStyle = {
                        fill: "#ffc107",
                        stroke: "#fff",
                        strokeWidth: 2,
                        cursor: "pointer",
                      }
                    } else if (isDetail) {
                      nodeStyle = {
                        fill: "#dc3545",
                        stroke: "#fff",
                        strokeWidth: 2,
                        cursor: "pointer",
                      }
                    }

                    return (
                      <g>
                        <circle r={15} onClick={toggleNode} style={nodeStyle} />
                        {(() => {
                          const fontSize = isCentral
                            ? 16
                            : isCategory
                            ? 14
                            : isSubtopic
                            ? 12
                            : 10
                          const maxWidth = 110 // Maximum width for text wrapping
                          const wrappedLines = wrapText(
                            nodeDatum.name,
                            maxWidth,
                            fontSize
                          )

                          return wrappedLines.map((line, index) => (
                            <text
                              key={index}
                              x={20}
                              y={5 + index * (fontSize + 2)}
                              style={{
                                fontSize: `${fontSize}px`,
                                fontWeight: "normal",
                                fontStyle: isDetail ? "italic" : "normal",
                                fill: isCentral
                                  ? "#0066cc"
                                  : isCategory
                                  ? "#28a745"
                                  : isSubtopic
                                  ? "#ffc107"
                                  : "#dc3545",
                              }}
                            >
                              {line}
                            </text>
                          ))
                        })()}
                      </g>
                    )
                  }}
                />
              </div>
            ) : (
              <div className="placeholder">
                (AI-powered mind map will appear here after input is processed)
              </div>
            )}
          </div>
        )}
        {/* Questions/Quizzes View */}
        {activeView === "questions" && (
          <div className="view-content">
            <strong>Questions/Quizzes</strong>
            {isGeneratingQuestions ? (
              <div className="placeholder">
                🤖 Generating AI-powered questions...
              </div>
            ) : questions.length > 0 ? (
              <div className="questions-container">
                {questions.map((q, idx) => (
                  <QuestionResponse
                    key={idx}
                    questionIndex={idx}
                    question={q}
                    activeInputType={activeInputTypes[idx] || ""}
                    setActiveInputType={setActiveInputType}
                    saveResponse={saveResponse}
                    getResponse={getResponse}
                    supportedAudioTypes={supportedAudioTypes}
                    supportedImageTypes={supportedImageTypes}
                  />
                ))}
              </div>
            ) : (
              <div className="placeholder">
                (AI-powered questions will appear here after input is processed)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
