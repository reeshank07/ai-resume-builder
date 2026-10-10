
import { useState } from "react";
import "./App.css";
import { uploadResume } from "./services/resumeApi";

function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Store AI analysis and uploaded resume information
  const [analysis, setAnalysis] = useState(null);
  const [resumeInfo, setResumeInfo] = useState(null);

  // Handle the selected PDF file
  function handleFileChange(event) {
    const file = event.target.files[0];

    setMessage("");
    setAnalysis(null);
    setResumeInfo(null);

    if (!file) {
      setResume(null);
      return;
    }

    // Check file type
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setResume(null);
      setMessage("Please select a PDF file.");
      event.target.value = "";
      return;
    }

    // Check file size: maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setResume(null);
      setMessage("Please select a PDF smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setResume(file);
    setMessage(`Selected file: ${file.name}`);
  }

  // Submit the resume and job description
  async function handleSubmit(event) {
    event.preventDefault();

    if (!resume) {
      setMessage("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setMessage("Please enter a job description.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Uploading resume and analyzing with AI...");

      // Send the resume and job description to the backend
      const data = await uploadResume(resume, jobDescription);

      // Store the analysis returned by Gemini
      setAnalysis(data.analysis);
      setResumeInfo(data.resume);

      setMessage(data.message || "Resume analyzed successfully!");
    } catch (error) {
      setAnalysis(null);
      setResumeInfo(null);

      setMessage(
        error.message || "Unable to analyze the resume. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI Resume Builder</h1>
        <p>
          Upload your resume and compare it with your target job description.
        </p>
      </header>

      <main className="resume-card">
        <h2>Resume Analyzer</h2>

        <p className="subtitle">
          Start by uploading your resume and entering the job description.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="resume">Upload Resume (PDF)</label>

            <input
              id="resume"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />

            <small>PDF only, maximum file size 5 MB.</small>
          </div>

          <div className="form-group">
            <label htmlFor="jobDescription">
              Target Job Description
            </label>

            <textarea
              id="jobDescription"
              rows="8"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(event) =>
                setJobDescription(event.target.value)
              }
            />
          </div>

          <button
            className="analyze-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Analyzing Resume..." : "Analyze Resume →"}
          </button>
        </form>

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}

        {/* Display AI analysis results */}
        {analysis && (
          <section className="analysis-results">
            <h2>Resume Analysis Results</h2>

            {resumeInfo && (
              <p className="resume-filename">
                Resume: <strong>{resumeInfo.filename}</strong>
              </p>
            )}

            {/* Match score */}
            <div className="score-card">
              <h3>Resume Match Score</h3>

              <p className="match-score">
                {analysis.matchScore ?? 0}%
              </p>

              <div
                className="score-bar"
                role="progressbar"
                aria-label="Resume match score"
                aria-valuenow={Math.max(
                  0,
                  Math.min(100, Number(analysis.matchScore) || 0)
                )}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, Number(analysis.matchScore) || 0)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Matched skills */}
            <div className="result-card">
              <h3>✅ Matched Skills</h3>

              {analysis.matchedSkills?.length > 0 ? (
                <ul>
                  {analysis.matchedSkills.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              ) : (
                <p>No matched skills were returned.</p>
              )}
            </div>

            {/* Missing skills */}
            <div className="result-card">
              <h3>📌 Missing Skills</h3>

              {analysis.missingSkills?.length > 0 ? (
                <ul>
                  {analysis.missingSkills.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              ) : (
                <p>No missing skills were returned.</p>
              )}
            </div>

            {/* Resume strengths */}
            <div className="result-card">
              <h3>💪 Strengths</h3>

              {analysis.strengths?.length > 0 ? (
                <ul>
                  {analysis.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              ) : (
                <p>No strengths were returned.</p>
              )}
            </div>

            {/* Improvement suggestions */}
            <div className="result-card">
              <h3>🚀 Improvement Suggestions</h3>

              {analysis.suggestions?.length > 0 ? (
                <ul>
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p>No suggestions were returned.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;