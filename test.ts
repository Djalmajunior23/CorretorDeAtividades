console.log("Fetching health...");
fetch('http://127.0.0.1:3000/api/health')
  .then(r => r.json())
  .then(data => console.log("Response:", data))
  .catch(err => console.error("Error:", err));
