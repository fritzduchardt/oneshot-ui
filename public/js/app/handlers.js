import * as Backend from './backend.js'
import * as Ui from './ui.js';
import * as Store from "./store.js";
import * as Msg from "./msgs.js";
import * as History from "./history.js";

export async function handleSendButtonClick(withMcp) {
    const message = document.getElementById('message').value
    const model = document.getElementById('model').value
    if (!model) {
        Ui.modelDropdown.focus()
        return
    }
    const pattern = document.getElementById('pattern').value
    if (!pattern) {
        Ui.modelDropdown.focus()
        return
    }
    const markdown = document.getElementById('markdown').value
    const abortController = new AbortController()
    Msg.addUserMessage(message, new Map([["model", model], ["pattern", pattern], ["mcp", withMcp]]), abortController)
    Store.setMessage(message)
    Store.setMarkdown(markdown)
    Store.setModel(model)
    Store.setPattern(pattern)

    const botMessage = Msg.addPendingMessage()
    try {
        const response = await Backend.chat(message, model, pattern, markdown, abortController, withMcp)
        Msg.addBotMessage(response, botMessage)
    } catch (error) {
        if (error.name === "AbortError") {
            botMessage.remove()
        }
        Msg.addBotMessage("Request failed: " + String(error?.message ?? error), botMessage)
    }
    History.default.addMessage(message)
}

export function handleAgentButtonClick() {
    console.log('Agent button clicked')
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
}

export function handleShowMarkdown() {
    const md = Ui.markdownDropdown.value
    if (md) {
        Backend.getMarkdowns(md)
            .then((markdown) => {
                Msg.addBotMessageForMarkdown(md, markdown)
            })
    }
}
