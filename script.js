
let prompt = document.querySelector("#prompt")
let submitbtn = document.querySelector("#submit")
let chatContainer = document.querySelector(".chat-container")
let imagebtn = document.querySelector("#image")
let image = document.querySelector("#image img")
let imageinput = document.querySelector("#image input")


const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyAKvWqlhxIJw7_SXmLS583ZWXFJtIqKGy8"


let user = {
  message: null,
  file: {
    mime_type: null,
    data: null
  }
}

// improved generateResponse with error propagation and response.ok check
async function generateResponse(aiChatBox) {
  let text = aiChatBox.querySelector(".ai-chat-area")
  const RequestOption = {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // keep the structure you expect; check API docs if needed
      contents: [
        {
          parts: [
            { text: user.message || "" },
            ...(user.file && user.file.data ? [{ inline_data: user.file }] : [])
          ]
        }
      ]
    })
  }

  try {
    const response = await fetch(Api_Url, RequestOption)

    // Better debugging: if response isn't ok, read and throw the body so catch can show it
    if (!response.ok) {
      const bodyText = await response.text()
      throw new Error(`HTTP ${response.status}: ${bodyText}`)
    }

    const data = await response.json()

    // defensive checks for expected shape
    if (!data?.candidates?.length) {
      throw new Error("No candidates returned by API. Response: " + JSON.stringify(data))
    }

    let apiResponse = (data.candidates[0].content?.parts?.[0]?.text || "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim()

    text.innerHTML = apiResponse || "(no text returned)"
  }
  catch (error) {
    console.error("Generate error:", error)
    // show error inside the ai chat box so you see it in the UI
    text.innerHTML = `<div style="color:crimson">Error: ${String(error).replace(/</g,'&lt;')}</div>`
  }
  finally {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" })
    // reset the UI selection image & user.file (keep same shape)
    image.src = `img.svg`
    image.classList.remove("choose")
    user.file = { mime_type: null, data: null }
  }
}

function createChatBox(html, classes) {
  let div = document.createElement("div")
  div.innerHTML = html
  div.classList.add(classes)
  return div
}

function handlechatResponse(userMessage) {
  user.message = userMessage
  let html = `<img src="user.png" alt="" id="userImage" width="8%">
<div class="user-chat-area">
${escapeHtml(user.message || "")}
${user.file && user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
</div>`
  prompt.value = ""
  let userChatBox = createChatBox(html, "user-chat-box")
  chatContainer.appendChild(userChatBox)

  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" })

  setTimeout(() => {
    let html = `<img src="ai.png" alt="" id="aiImage" width="10%">
    <div class="ai-chat-area">
      <img src="loading.webp" alt="" class="load" width="50px">
    </div>`
    let aiChatBox = createChatBox(html, "ai-chat-box")
    chatContainer.appendChild(aiChatBox)
    generateResponse(aiChatBox)
  }, 600)
}

// tiny helper to avoid XSS when inserting user text
function escapeHtml(unsafe) {
  if (!unsafe) return ""
  return unsafe.replace(/[&<>"'`=\/]/g, function(s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    })[s]
  })
}


// events
prompt.addEventListener("keydown", (e) => {
  if (e.key == "Enter") {
    e.preventDefault()
    handlechatResponse(prompt.value)
  }
})

submitbtn.addEventListener("click", () => {
  handlechatResponse(prompt.value)
})

imageinput.addEventListener("change", () => {
  const file = imageinput.files[0]
  if (!file) return
  let reader = new FileReader()
  reader.onload = (e) => {
    let base64string = e.target.result.split(",")[1]
    // crucial: set actual mime_type from file.type
    user.file = { mime_type: file.type || "application/octet-stream", data: base64string }
    image.src = `data:${user.file.mime_type};base64,${user.file.data}`
    image.classList.add("choose")
  }
  reader.readAsDataURL(file)
})

imagebtn.addEventListener("click", () => {
  imagebtn.querySelector("input").click()
})



