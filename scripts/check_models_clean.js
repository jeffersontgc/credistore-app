const https = require("https");

const apiKey = "AIzaSyAkKAZ9k-J_UFD3v2iqKlhQiHujOOn8rjw";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        console.log(
          JSON.stringify(
            json.models.map((m) => m.name),
            null,
            2
          )
        );
      } else {
        console.log("No models found or error:", json);
      }
    } catch (e) {
      console.error(e);
    }
  });
});
