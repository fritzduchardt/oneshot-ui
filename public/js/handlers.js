import * as Backend from './backend.js'
import * as Ui from './ui.js';
import * as Store from "./store.js";
import * as Msg from "./msgs.js";
import * as Md from "./md.js";

export async function handleSendButtonClick() {
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
    Msg.addUserMessage(message, new Map([["model", model], ["pattern", pattern]]))
    Store.setMessage(message)
    Store.setMarkdown(markdown)
    Store.setModel(model)
    Store.setPattern(pattern)

    const botMessage = Msg.addPendingMessage()
    try {
        const plain_response = await Backend.chat(message, model, pattern, markdown)
        const response = Md.convertMarkdownToHtml(plain_response ?? "")
        Msg.addBotMessage(response.html, response.metadata, botMessage)
    } catch (error) {
        Msg.addBotMessage("Request failed.", new Map([["error", String(error?.message ?? error)]]), botMessage)
    }
}

export function handleAgentButtonClick() {
    console.log('Agent button clicked')
}

export function handleToggleSoundButtonClick() {
    console.log('Toggle sound clicked')
}

export function handleToggleInputButtonClick() {
    Ui.inputSection.classList.toggle('hidden');
}
