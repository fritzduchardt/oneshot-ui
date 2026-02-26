import * as Backend from './backend.js'
import * as Ui from './ui.js';

export async function handleSendButtonClick(event) {
    const message = document.getElementById('message').value
    const model = document.getElementById('model').value
    const pattern = document.getElementById('pattern').value
    const markdown = document.getElementById('markdown').value
    const res = await Backend.chat(message, model, pattern, markdown).catch(error => console.log(error))
    Ui.messageTextarea.value += res
}

export function handleToggleSoundButtonClick() {
    console.log('Toggle sound clicked')
}

export function handleToggleInputButtonClick() {
    console.log('Toggle input clicked')
}

export function handleChatButtonClick() {
    console.log('Chat clicked')
}
