document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  const lucide = window.lucide
  lucide.createIcons()

  // Check if user is logged in
  const username = localStorage.getItem("chatUsername")
  if (!username) {
    window.location.href = "index.html"
    return
  }

  // DOM elements
  const currentUsernameEl = document.getElementById("currentUsername")
  const currentChannelEl = document.getElementById("currentChannel")
  const channelListEl = document.getElementById("channelList")
  const messageContainerEl = document.getElementById("messageContainer")
  const messageFormEl = document.getElementById("messageForm")
  const messageInputEl = document.getElementById("messageInput")
  const onlineUsersContainerEl = document.getElementById("onlineUsersContainer")
  const logoutButtonEl = document.getElementById("logoutButton")
  const replyContainerEl = document.getElementById("replyContainer")
  const replyingToTextEl = document.getElementById("replyingToText")
  const cancelReplyButtonEl = document.getElementById("cancelReplyButton")

  // Templates
  const channelTemplate = document.getElementById("channelTemplate").content
  const messageTemplate = document.getElementById("messageTemplate").content
  const reactionTemplate = document.getElementById("reactionTemplate").content
  const onlineUserTemplate = document.getElementById("onlineUserTemplate").content

  // App state
  let currentChannel = "general"
  let channelMessages = {}
  let replyingTo = null
  const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"]
  const channels = ["general", "tech", "gaming", "music"]
  const onlineTime =
    localStorage.getItem("chatLoginTime") ||
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

  // Initialize app
  init()

  // Functions
  function init() {
    // Set current username
    currentUsernameEl.textContent = username

    // Load messages from localStorage
    loadMessages()

    // Set up channels
    setupChannels()

    // Set up online users
    setupOnlineUsers()

    // Set up event listeners
    setupEventListeners()

    // Set up midnight cleanup
    setupMidnightCleanup()

    // Render messages for current channel
    renderMessages()
  }

  function loadMessages() {
    const savedMessages = localStorage.getItem("chatMessages")
    if (savedMessages) {
      try {
        channelMessages = JSON.parse(savedMessages)
      } catch (error) {
        console.error("Failed to parse saved messages:", error)
        initializeDefaultMessages()
      }
    } else {
      initializeDefaultMessages()
    }
  }

  function initializeDefaultMessages() {
    channelMessages = {
      general: [
        {
          id: "1",
          username: "System",
          content: "Welcome to the #general channel!",
          timestamp: Date.now(),
          reactions: {},
        },
      ],
      tech: [
        {
          id: "1",
          username: "System",
          content: "Welcome to the #tech channel! Discuss programming, gadgets, and more.",
          timestamp: Date.now(),
          reactions: {},
        },
      ],
      gaming: [
        {
          id: "1",
          username: "System",
          content: "Welcome to the #gaming channel! Share your favorite games and gaming moments.",
          timestamp: Date.now(),
          reactions: {},
        },
      ],
      music: [
        {
          id: "1",
          username: "System",
          content: "Welcome to the #music channel! Discuss your favorite artists and songs.",
          timestamp: Date.now(),
          reactions: {},
        },
      ],
    }
    saveMessages()
  }

  function setupChannels() {
    channelListEl.innerHTML = ""

    channels.forEach((channel) => {
      const channelEl = channelTemplate.cloneNode(true)
      const channelButton = channelEl.querySelector(".channel-button")
      const channelName = channelEl.querySelector("span")

      channelName.textContent = channel

      if (channel === currentChannel) {
        channelButton.classList.add("bg-gray-700")
      }

      channelButton.addEventListener("click", () => {
        switchChannel(channel)
      })

      channelListEl.appendChild(channelEl)
    })
  }

  function setupOnlineUsers() {
    onlineUsersContainerEl.innerHTML = ""

    const userEl = onlineUserTemplate.cloneNode(true)
    const avatarText = userEl.querySelector(".avatar-text")
    const userName = userEl.querySelector(".user-name")
    const onlineTimeEl = userEl.querySelector(".online-time")

    avatarText.textContent = getInitials(username)
    userName.textContent = username
    onlineTimeEl.textContent = `Online since ${onlineTime}`

    onlineUsersContainerEl.appendChild(userEl)
  }

  function setupEventListeners() {
    // Message form submission
    messageFormEl.addEventListener("submit", (e) => {
      e.preventDefault()
      sendMessage()
    })

    // Logout button
    logoutButtonEl.addEventListener("click", () => {
      logout()
    })

    // Cancel reply button
    cancelReplyButtonEl.addEventListener("click", () => {
      cancelReply()
    })

    // Close emoji popups when clicking outside
    document.addEventListener("click", (e) => {
      const emojiButtons = document.querySelectorAll(".emoji-button")
      const emojiPopups = document.querySelectorAll(".emoji-popup")
      const moreButtons = document.querySelectorAll(".more-button")
      const morePopups = document.querySelectorAll(".more-popup")

      let clickedInsideEmojiPopup = false
      let clickedInsideMorePopup = false

      emojiPopups.forEach((popup) => {
        if (popup.contains(e.target)) {
          clickedInsideEmojiPopup = true
        }
      })

      emojiButtons.forEach((button) => {
        if (button.contains(e.target)) {
          clickedInsideEmojiPopup = true
        }
      })

      morePopups.forEach((popup) => {
        if (popup.contains(e.target)) {
          clickedInsideMorePopup = true
        }
      })

      moreButtons.forEach((button) => {
        if (button.contains(e.target)) {
          clickedInsideMorePopup = true
        }
      })

      if (!clickedInsideEmojiPopup) {
        emojiPopups.forEach((popup) => {
          popup.classList.add("hidden")
        })
      }

      if (!clickedInsideMorePopup) {
        morePopups.forEach((popup) => {
          popup.classList.add("hidden")
        })
      }
    })
  }

  function setupMidnightCleanup() {
    const checkMidnight = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()

      // If it's midnight (00:00)
      if (hours === 0 && minutes === 0) {
        localStorage.removeItem("chatMessages")
        initializeDefaultMessages()
        renderMessages()
      }
    }

    // Check every minute
    setInterval(checkMidnight, 60000)

    // Calculate time until next check
    const now = new Date()
    const secondsUntilNextMinute = 60 - now.getSeconds()

    // Align first check with the minute mark
    setTimeout(() => {
      checkMidnight()
    }, secondsUntilNextMinute * 1000)
  }

  function switchChannel(channel) {
    currentChannel = channel
    currentChannelEl.textContent = channel
    messageInputEl.placeholder = `Message #${channel}...`

    // Update active channel in UI
    const channelButtons = channelListEl.querySelectorAll(".channel-button")
    channelButtons.forEach((button) => {
      if (button.querySelector("span").textContent === channel) {
        button.classList.add("bg-gray-700")
      } else {
        button.classList.remove("bg-gray-700")
      }
    })

    // Cancel any active reply when switching channels
    cancelReply()

    // Render messages for the new channel
    renderMessages()
  }

  function renderMessages() {
    messageContainerEl.innerHTML = ""

    const messages = channelMessages[currentChannel] || []

    messages.forEach((message) => {
      const messageEl = createMessageElement(message)
      messageContainerEl.appendChild(messageEl)
    })

    // Scroll to bottom
    messageContainerEl.scrollTop = messageContainerEl.scrollHeight
  }

  function createMessageElement(message) {
    const messageEl = messageTemplate.cloneNode(true)
    const messageContainer = messageEl.querySelector(".message-container")
    const messageUsername = messageEl.querySelector(".message-username")
    const messageTime = messageEl.querySelector(".message-time")
    const messageContent = messageEl.querySelector(".message-content")
    const reactionsContainer = messageEl.querySelector(".reactions-container")
    const emojiButton = messageEl.querySelector(".emoji-button")
    const emojiPopup = messageEl.querySelector(".emoji-popup")
    const emojiList = messageEl.querySelector(".emoji-list")
    const replyButton = messageEl.querySelector(".reply-button")
    const moreOptionsContainer = messageEl.querySelector(".more-options-container")
    const moreButton = messageEl.querySelector(".more-button")
    const morePopup = messageEl.querySelector(".more-popup")
    const deleteButton = messageEl.querySelector(".delete-button")
    const replyInfo = messageEl.querySelector(".reply-info")

    // Set message data
    messageUsername.textContent = message.username === username ? "You" : message.username
    messageTime.textContent = formatTime(message.timestamp)
    messageContent.textContent = message.content

    // Check if this is the user's own message
    const isOwnMessage = message.username === username
    if (isOwnMessage) {
      messageContainer.classList.add("own-message")
      moreOptionsContainer.classList.remove("hidden")
    }

    // Check if message is deleted
    if (message.deleted) {
      messageContainer.classList.add("deleted")
      emojiButton.parentElement.classList.add("hidden")
      replyButton.classList.add("hidden")
      moreOptionsContainer.classList.add("hidden")
    }

    // Set up reply info if this is a reply
    if (message.replyTo) {
      const replyToMessage = findMessageById(message.replyTo)
      if (replyToMessage) {
        replyInfo.classList.remove("hidden")
        replyInfo.querySelector(".reply-username").textContent = replyToMessage.username
        replyInfo.querySelector(".reply-content").textContent = replyToMessage.content
      }
    }

    // Set up reactions
    if (Object.keys(message.reactions).length > 0) {
      reactionsContainer.classList.remove("hidden")

      Object.values(message.reactions).forEach((reaction) => {
        const reactionEl = createReactionElement(reaction, message.id, isOwnMessage)
        reactionsContainer.appendChild(reactionEl)
      })
    }

    // Set up emoji popup
    EMOJIS.forEach((emoji) => {
      const emojiEl = document.createElement("button")
      emojiEl.className = "text-lg hover:bg-gray-700 p-1 rounded"
      emojiEl.textContent = emoji
      emojiEl.addEventListener("click", () => {
        addReaction(message.id, emoji)
        emojiPopup.classList.add("hidden")
      })
      emojiList.appendChild(emojiEl)
    })

    // Set up emoji button
    emojiButton.addEventListener("click", (e) => {
      e.stopPropagation()
      emojiPopup.classList.toggle("hidden")

      // Close all other emoji popups
      document.querySelectorAll(".emoji-popup").forEach((popup) => {
        if (popup !== emojiPopup) {
          popup.classList.add("hidden")
        }
      })
    })

    // Set up reply button
    replyButton.addEventListener("click", () => {
      startReply(message)
    })

    // Set up more button
    if (moreButton) {
      moreButton.addEventListener("click", (e) => {
        e.stopPropagation()
        morePopup.classList.toggle("hidden")

        // Close all other more popups
        document.querySelectorAll(".more-popup").forEach((popup) => {
          if (popup !== morePopup) {
            popup.classList.add("hidden")
          }
        })
      })
    }

    // Set up delete button
    if (deleteButton) {
      deleteButton.addEventListener("click", () => {
        deleteMessage(message.id)
        morePopup.classList.add("hidden")
      })
    }

    // Initialize Lucide icons in the message element
    setTimeout(() => {
      lucide.createIcons({
        attrs: {
          class: ["w-4", "h-4"],
        },
        elements: [messageContainer],
      })
    }, 0)

    return messageContainer
  }

  function createReactionElement(reaction, messageId, isOwnMessage) {
    const reactionEl = reactionTemplate.cloneNode(true)
    const reactionButton = reactionEl.querySelector(".reaction")
    const reactionEmoji = reactionEl.querySelector(".reaction-emoji")
    const reactionCount = reactionEl.querySelector(".reaction-count")

    reactionEmoji.textContent = reaction.emoji
    reactionCount.textContent = reaction.users.length

    // Check if user has reacted
    if (reaction.users.includes(username)) {
      reactionButton.classList.add("active")
    }

    // Set appropriate classes based on message ownership
    if (isOwnMessage) {
      if (reaction.users.includes(username)) {
        reactionButton.classList.add("bg-purple-700")
        reactionButton.classList.remove("bg-purple-700/50")
      } else {
        reactionButton.classList.add("bg-purple-700/50")
        reactionButton.classList.remove("bg-purple-700")
      }
    } else {
      if (reaction.users.includes(username)) {
        reactionButton.classList.add("bg-gray-600")
        reactionButton.classList.remove("bg-gray-600/50")
      } else {
        reactionButton.classList.add("bg-gray-600/50")
        reactionButton.classList.remove("bg-gray-600")
      }
    }

    reactionButton.addEventListener("click", () => {
      addReaction(messageId, reaction.emoji)
    })

    return reactionButton
  }

  function sendMessage() {
    const content = messageInputEl.value.trim()
    if (!content) return

    const message = {
      id: Date.now().toString(),
      username: username,
      content: content,
      timestamp: Date.now(),
      reactions: {},
      replyTo: replyingTo,
    }

    // Add message to channel
    if (!channelMessages[currentChannel]) {
      channelMessages[currentChannel] = []
    }

    channelMessages[currentChannel].push(message)

    // Save messages
    saveMessages()

    // Clear input and reset reply
    messageInputEl.value = ""
    cancelReply()

    // Render messages
    renderMessages()
  }

  function addReaction(messageId, emoji) {
    const messages = channelMessages[currentChannel] || []
    const messageIndex = messages.findIndex((m) => m.id === messageId)

    if (messageIndex === -1) return

    const message = { ...messages[messageIndex] }

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = { emoji, users: [username] }
    } else {
      const userIndex = message.reactions[emoji].users.indexOf(username)
      if (userIndex === -1) {
        message.reactions[emoji] = {
          ...message.reactions[emoji],
          users: [...message.reactions[emoji].users, username],
        }
      } else {
        message.reactions[emoji] = {
          ...message.reactions[emoji],
          users: message.reactions[emoji].users.filter((u) => u !== username),
        }

        if (message.reactions[emoji].users.length === 0) {
          delete message.reactions[emoji]
        }
      }
    }

    messages[messageIndex] = message
    channelMessages[currentChannel] = messages

    // Save messages
    saveMessages()

    // Render messages
    renderMessages()
  }

  function deleteMessage(messageId) {
    const messages = channelMessages[currentChannel] || []
    const messageIndex = messages.findIndex((m) => m.id === messageId)

    if (messageIndex === -1) return

    messages[messageIndex] = {
      ...messages[messageIndex],
      deleted: true,
      content: "This message has been deleted",
    }

    channelMessages[currentChannel] = messages

    // Save messages
    saveMessages()

    // Render messages
    renderMessages()
  }

  function startReply(message) {
    replyingTo = message.id
    replyingToTextEl.textContent = `Replying to ${message.username === username ? "yourself" : message.username}`
    replyContainerEl.classList.remove("hidden")
    messageInputEl.focus()
  }

  function cancelReply() {
    replyingTo = null
    replyContainerEl.classList.add("hidden")
  }

  function findMessageById(messageId) {
    const messages = channelMessages[currentChannel] || []
    return messages.find((m) => m.id === messageId)
  }

  function saveMessages() {
    localStorage.setItem("chatMessages", JSON.stringify(channelMessages))
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function getInitials(name) {
    return name.substring(0, 2).toUpperCase()
  }

  function logout() {
    localStorage.removeItem("chatUsername")
    localStorage.removeItem("chatLoginTime")
    window.location.href = "index.html"
  }
})
