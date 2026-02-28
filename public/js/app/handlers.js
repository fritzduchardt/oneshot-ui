import * as Backend from './backend.js'
import * as Ui from './ui.js';
import * as Store from "./store.js";
import * as Msg from "./msgs.js";

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
    Msg.addUserMessage(message, new Map([["model", model], ["pattern", pattern], ["mcp", withMcp]]))
    Store.setMessage(message)
    Store.setMarkdown(markdown)
    Store.setModel(model)
    Store.setPattern(pattern)

    const botMessage = Msg.addPendingMessage()
    try {
        const response = await Backend.chat(message, model, pattern, markdown, withMcp)
        Msg.addBotMessage(response, botMessage)
    } catch (error) {
        Msg.addBotMessage("Request failed: " + String(error?.message ?? error), botMessage)
    }
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
    const pattern = Ui.patternDropdown.value
    Backend.getPattern(pattern)
        .then((pattern) => {
            const parent = Msg.addPendingMessage();
            Ui.messagesDiv.append(parent)
            Msg.addBotMessage(pattern, parent)
        })
}

export function handleShowMarkdown() {
    const md = Ui.markdownDropdown.value
    Backend.getMarkdowns(md)
        .then((markdown) => {
            const parent = Msg.addPendingMessage();
            Ui.messagesDiv.append(parent)
            Msg.addBotMessage(markdown, parent)
        })
}
