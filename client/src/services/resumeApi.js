
export async function testBackend(jobDescription) {
  const response = await fetch(
    "http://localhost:5000/api/resumes/analyze",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobDescription }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function uploadResume(resume, jobDescription) {
  const formData = new FormData();

  formData.append("resume", resume);
  formData.append("jobDescription", jobDescription);

  const response = await fetch(
    "http://localhost:5000/api/resumes/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Upload failed.");
  }

  return data;
}
