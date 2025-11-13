// ===== DOM Elements =====
const prompt = document.querySelector("#prompt");
const submitBtn = document.querySelector("#submit");
const chatContainer = document.querySelector(".chat-container");
const imageBtn = document.querySelector("#image");
const image = document.querySelector("#image img");
const imageInput = document.querySelector("#image input");

// ===== Gemini API Endpoint =====
// ⚠️ For production, NEVER expose your API key in frontend code!
// Use a backend proxy or environment variable instead.
const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY";

// ===== User Object =====
let user = {
  message: null,
  file: {
    mime_type: null,
    data: null,
  },
};

// ===== Generate AI Response =====
async function generateResponse(aiChatBox) {
  const text = aiChatBox.querySelector(".ai-chat-area");

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: user.message },
            ...(user.file.data ? [{ inline_data: user.file }] : []),
          ],
        },
      ],
    }),
  };

  try {
    const response = await fetch(Api_Url, requestOptions);
    const data = await response.json();

    // Parse AI response safely
    const apiResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text
        ?.replace(/\*\*(.*?)\*\*/g, "$1")
        ?.trim() || "⚠️ No response from API.";

    text.innerHTML = apiResponse;
  } catch (error) {
    console.error("Fetch Error:", error);
    text.innerHTML = "❌ Error: Unable to get AI response.";
  } finally {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });
    image.src = `img.svg`;
    image.classList.remove("choose");
    user.file = { mime_type: null, data: null };
  }
}

// ===== Create Chat Box =====
function createChatBox(html, classes) {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.classList.add(classes);
  return div;
}

// ===== Handle Chat Response =====
function handleChatResponse(userMessage) {
  if (!userMessage.trim()) return;

  user.message = userMessage;
  prompt.value = "";

  // User Chat Box
  const userHtml = `
    <img src="user.png" alt="User" id="userImage" width="8%">
    <div class="user-chat-area">
      ${user.message}
      ${
        user.file.data
          ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />`
          : ""
      }
    </div>
  `;

  const userChatBox = createChatBox(userHtml, "user-chat-box");
  chatContainer.appendChild(userChatBox);
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth",
  });

  // AI Loading Placeholder
  setTimeout(() => {
    const aiHtml = `
      <img src="ai.png" alt="AI" id="aiImage" width="10%">
      <div class="ai-chat-area">
        <img src="loading.webp" alt="Loading" class="load" width="50px">
      </div>
    `;
    const aiChatBox = createChatBox(aiHtml, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);

    // Call Gemini API
    generateResponse(aiChatBox);
  }, 600);
}

// ===== Event Listeners =====
prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleChatResponse(prompt.value);
});

submitBtn.addEventListener("click", () => {
  handleChatResponse(prompt.value);
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64string = e.target.result.split(",")[1];
    user.file = {
      mime_type: file.type,
      data: base64string,
    };
    image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
    image.classList.add("choose");
  };

  reader.readAsDataURL(file);
});

imageBtn.addEventListener("click", () => {
  imageBtn.querySelector("input").click();
});

