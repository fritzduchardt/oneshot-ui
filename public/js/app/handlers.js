import * as Backend from './backend.js'
import * as Ui from './ui.js';
import * as Store from "./store.js";
import * as Msg from "./msgs.js";
import * as History from "./history.js";
import {messageTextarea} from "./ui.js"

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
