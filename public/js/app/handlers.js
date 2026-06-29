import * as Backend from './backend.js'
import * as Ui from './ui.js';
import * as Store from "./store.js";
import * as Msg from "./msgs.js";
import * as History from "./history.js";

export async function handleSendButtonClick(withMcp) {
    const message = Ui.messageTextarea.value
    const model = Ui.modelDropdown.value
    if (!model) {
        Ui.modelDropdown.focus()
        return
    }
    const pattern = Ui.patternDropdown.value
    if (!pattern) {
        Ui.modelDropdown.focus()
        return
    }
    const markdown = Ui.markdownDropdown.value
    const abortController = new AbortController()
    const userMessageEl = Msg.addUserMessage(message, new Map([["model", model], ["pattern", pattern], ["mcp", withMcp]]), abortController, withMcp)
    Store.setMessage(message)
    Store.setMarkdown(markdown)
    Store.setModel(model)
    Store.setPattern(pattern)

    try {
        const response = await Backend.chat(message, model, pattern, markdown, abortController, withMcp)
        Msg.addBotMessage(response, userMessageEl)
    } catch (error) {
        if (userMessageEl.loadingDots) {
            userMessageEl.loadingDots.remove()
            userMessageEl.loadingDots = null
        }
    }
    History.default.addMessage(message)
}


export async function handleChartButtonClick() {
    const message = Ui.messageTextarea.value
    const model = Ui.modelDropdown.value
    const markdown = Ui.markdownDropdown.value
    if (!model) {
        Ui.modelDropdown.focus()
        return
    }
    const pattern = document.getElementById('pattern').value
    if (!pattern) {
        Ui.modelDropdown.focus()
        return
    }
    const abortController = new AbortController()
    const userMessageEl = Msg.addUserMessage(message, new Map([["model", model], ["pattern", pattern]]), abortController, false, false)
    const visibleBotMsg = getVisibleBotMessage()
    visibleBotMsg.append(userMessageEl)
    Store.setMessage(message)
    Store.setModel(model)
    Store.setPattern(pattern)

    try {
        const response = await Backend.chartChat(message, markdown, model, pattern, abortController)
        const botMessage = Msg.addBotMessage(response, userMessageEl, true, false)
        if (visibleBotMsg === Ui.messagesDiv) {
            Ui.messagesDiv.append(botMessage)
        } else {
            userMessageEl.classList.add("chat-message")
            userMessageEl.append(botMessage)
        }
    } catch (error) {
        if (userMessageEl.loadingDots) {
            userMessageEl.loadingDots.remove()
            userMessageEl.loadingDots = null
        }
    }
    History.default.addMessage(message)
}

// Improved code: fixed getVisibleBotMessage so it actually returns the first visible bot message instead of always returning Ui.messagesDiv
function getVisibleBotMessage() {
    const botMessages = document.querySelectorAll('.bot-message')
    if (botMessages.length === 0) return Ui.messagesDiv

    const cRect = Ui.messagesDiv.getBoundingClientRect()
    let lastMessage = null
    // check for window that is fully visible
    for (const msg of botMessages) {
        const rect = msg.getBoundingClientRect()
        if (rect.top > cRect.top && rect.bottom < cRect.bottom) {
            lastMessage = msg
        }
    }
    // check for window that has upper border visible
    if (lastMessage === null) {
        for (const msg of botMessages) {
            const rect = msg.getBoundingClientRect()
            if (rect.top > cRect.top && rect.top < cRect.bottom) {
                lastMessage = msg
            }
        }
    }
    // check for window that has lower border visible
    if (lastMessage === null) {
        for (const msg of botMessages) {
            const rect = msg.getBoundingClientRect()
            if (rect.bottom > cRect.top && rect.bottom < cRect.bottom) {
                lastMessage = msg
            }
        }
    }
    if (lastMessage === null || lastMessage ===  botMessages[botMessages.length - 1]) {
        return Ui.messagesDiv
    }
    return lastMessage
}

export function handleToggleSoundButtonClick() {
    Ui.toggleSound.classList.toggle("pressed")
}

export function handleToggleInputButtonClick() {
    Ui.toggleInput.classList.toggle("pressed")
    Ui.inputSection.classList.toggle('hidden')
}

// Added: Toggle notifications - uses localStorage to persist the disabled state
export function handleToggleNotificationsButtonClick() {
    const currentlyEnabled = localStorage.getItem('notifications_enabled') !== 'false';
    const newState = !currentlyEnabled;
    localStorage.setItem('notifications_enabled', newState.toString());
    Ui.toggleNotifications.classList.toggle('pressed', !newState);
}

export function handleShowPattern() {
    let patternName = Ui.patternDropdown.value
    if (patternName === "grep") {
        const prompt = Ui.messageTextarea.value
        let indexOfColon = prompt.indexOf(":")
        if (indexOfColon > -1) {
            patternName = prompt.substring(0, indexOfColon)
        }
    }
    if (patternName) {
        Backend.getPattern(patternName)
            .then((pattern) => {
                Msg.addBotMessageForPattern(patternName, pattern)
            })
    }
    Store.setPattern(patternName)
}

export function handleShowMarkdown() {
    const md = Ui.markdownDropdown.value
    if (md) {
        Backend.getMarkdowns(md)
            .then((markdown) => {
                Msg.addBotMessageForMarkdown(md, markdown)
            })
        Store.setMarkdown(md)
    }
}

export function handleMessageScroll(dir) {
    const botMessages = document.querySelectorAll('.bot-message')
    if (botMessages.length === 0) return

    let bestIndex = 0
    let minDistance = Infinity
    botMessages.forEach((msg, idx) => {
        const rect = msg.getBoundingClientRect()
        const distance = Math.abs(rect.top)
        if (distance < minDistance) {
            minDistance = distance
            bestIndex = idx
        }
    })
    let currentBotMessageIndex = bestIndex

    if (dir === "down") {
        currentBotMessageIndex = Math.min(currentBotMessageIndex + 1, botMessages.length - 1)
    } else {
        currentBotMessageIndex = Math.max(currentBotMessageIndex - 1, 0)
    }
    const targetMessage = botMessages[currentBotMessageIndex]
    if (targetMessage) {
        Msg.scrollToTop(targetMessage)
        botMessages.forEach((msg, idx) => {
            if (idx === currentBotMessageIndex) {
                msg.classList.add('highlighted-bot-message')
            } else {
                msg.classList.remove('highlighted-bot-message')
            }
        })
        console.log(`Navigated to bot message, index: ${currentBotMessageIndex}`)
    }
}
