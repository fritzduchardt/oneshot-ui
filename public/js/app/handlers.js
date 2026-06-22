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
        userMessageEl.cancelBtn.disabled = true
        Msg.addBotMessage(response, userMessageEl)
    } catch (error) {
        userMessageEl.cancelBtn.disabled = true
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
    const userMessageEl = Msg.addUserMessage(message, new Map([["model", model], ["pattern", pattern]]), abortController, false)
    Store.setMessage(message)
    Store.setModel(model)
    Store.setPattern(pattern)

    try {
        const response = await Backend.chartChat(message, markdown, model, pattern, abortController)
        userMessageEl.cancelBtn.disabled = true
        Msg.addBotMessage(response, userMessageEl, true)
    } catch (error) {
        userMessageEl.cancelBtn.disabled = true
        if (userMessageEl.loadingDots) {
            userMessageEl.loadingDots.remove()
            userMessageEl.loadingDots = null
        }
    }
    History.default.addMessage(message)
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
    const pattern_name = Ui.patternDropdown.value
    if (pattern_name) {
        Backend.getPattern(pattern_name)
            .then((pattern) => {
                Msg.addBotMessageForPattern(pattern_name, pattern)
            })
    }
    Store.setPattern(pattern_name)
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