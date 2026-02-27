import * as Ui from './ui.js'
import * as Html from './html.js'

export function addUserMessage(message) {
    Ui.messagesDiv.append(Html.createDiv( "user-message", message))
}

export function addBotMessage(message, metadata) {
    let botMessage = Html.createDiv("bot-message", message)

    if (metadata.size > 0) {
        botMessage.append(createMetaDataDiv(metadata))
    }

    Ui.messagesDiv.append(botMessage)
}

function createMetaDataDiv(metadata) {
    let parent = document.createElement("div")
    parent.className = "message-tags"
    for (const [key, value] of metadata) {
        parent.append(Html.createDiv("message-tag", `${key}: ${value}`))
    }
    return parent
}
