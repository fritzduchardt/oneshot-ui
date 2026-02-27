import * as Backend from './backend.js'
import * as Ui from './ui.js';
import * as Store from "./store.js";
import * as Msg from "./messages.js";

export async function handleSendButtonClick(event) {
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
    Msg.addBotMessage(message)
    Store.setMarkdown(markdown)
    Store.setModel(model)
    Store.setPattern(pattern)
    const res = await Backend.chat(message, model, pattern, markdown).catch(error => console.log(error))
    Msg.addBotMessage(res)
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

export function handleChatButtonClick() {
    console.log('Chat clicked')
}
