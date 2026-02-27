import * as Ui from './ui.js'
import * as Html from './html.js'

function createRandomId() {
    return Math.random().toString(36).substr(2, 16)
}

export function addUserMessage(message) {
    const randomId = createRandomId();
    Ui.messagesDiv.innerHTML = Html.createDiv(randomId, "userMessage", message)
}

export function addBotMessage(message, metadata) {
    const randomId = createRandomId();
    Ui.messagesDiv.innerHTML = Html.createDiv(randomId, "botMessage", message)
    if (metadata.size() == 0) {
        return
    }
    const botMessage = document.getElementById(randomId)
    let metaDataHtml = "<div class='message-tags'>"
    for (const [key, value] of metadata) {
        metaDataHtml += Html.createDiv("", "message-tag", `${key}: ${value}`)
    }
    metaDataHtml += "</div>"
    botMessage.append(metaDataHtml)
}
