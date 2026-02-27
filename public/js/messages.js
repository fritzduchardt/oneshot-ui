import * as Ui from './ui.js'
import * as Html from './html.js'

export function addUserMessage(message) {
    Ui.messagesDiv.innerHTML = Html.createDiv("userMessage", message)
}

export function addBotMessage(message) {
    Ui.messagesDiv.innerHTML = Html.createDiv("botMessage", message)
}
