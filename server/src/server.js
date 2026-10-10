// 1. Import required packages
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");

// Load environment variables BEFORE importing aiService
require("dotenv").config();

// Import Gemini AI service
const { analyzeResume } = require("./services/aiService");

// 2. Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Allow requests from React
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// 4. Configure PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB
  },
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype !== "application/pdf" ||
      !file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      return callback(new Error("Only PDF files are allowed."));
    }

    callback(null, true);
  },
});

// 5. Test the backend
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Resume Builder backend is running!",
  });
});

// 6. Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
  });
});

// 7. Upload PDF, extract text, and analyze with Gemini AI
app.post(
  "/api/resumes/upload",
  upload.single("resume"),
  async (req, res, next) => {
    let parser;

    try {
      const { jobDescription } = req.body;

      // Check whether a resume was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a resume PDF.",
        });
      }

      // Check whether a job description was provided
      if (
        typeof jobDescription !== "string" ||
        !jobDescription.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Job description is required.",
        });
      }

      // Extract text from the uploaded PDF
      parser = new PDFParse({
        data: req.file.buffer,
      });

      const pdfData = await parser.getText();
      const resumeText = pdfData.text.trim();

      // Check whether the PDF contains readable text
      if (!resumeText) {
        return res.status(400).json({
          success: false,
          message:
            "No readable text found. Your PDF may be scanned or image-based.",
        });
      }

      // Send resume text and job description to Gemini
      const analysis = await analyzeResume(
        resumeText,
        jobDescription.trim()
      );

      // Return the analysis to React
      return res.json({
        success: true,
        message: "Resume analyzed successfully!",
        resume: {
          filename: req.file.originalname,
          size: req.file.size,
        },
        analysis,
      });
    } catch (error) {
      next(error);
    } finally {
      // Release PDF parser resources
      if (parser) {
        await parser.destroy().catch(() => {});
      }
    }
  }
);

// 8. Keep the old JSON test endpoint
app.post("/api/resumes/analyze", (req, res) => {
  const { jobDescription } = req.body;

  if (
    typeof jobDescription !== "string" ||
    !jobDescription.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Job description is required.",
    });
  }

  res.json({
    success: true,
    message: "React successfully connected to Express!",
    receivedJobDescription: jobDescription,
  });
});

// 9. Handle upload and server errors
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File must be smaller than 5 MB."
        : err.message;

    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Handle other errors
  return res.status(500).json({
    success: false,
    message: "An error occurred while processing your resume.",
  });
});

// 10. Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
