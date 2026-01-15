const https = require("https");

const apiKey = "AIzaSyAkKAZ9k-J_UFD3v2iqKlhQiHujOOn8rjw";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https
  .get(url, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        if (json.error) {
          console.error("Error fetching models:", json.error);
        } else {
          console.log("Available Models:");
          json.models.forEach((model) => {
            if (
              model.supportedGenerationMethods &&
              model.supportedGenerationMethods.includes("generateContent")
            ) {
              console.log(`- ${model.name} (${model.displayName})`);
            }
          });
        }
      } catch (e) {
        console.error("Error parsing response:", e.message);
        console.log("Raw data:", data);
      }
    });
  })
  .on("error", (e) => {
    console.error("Network error:", e);
  });
