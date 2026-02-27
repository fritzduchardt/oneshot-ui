import * as Ui from './ui.js'
import * as Html from './html.js'

export function addUserMessage(message, metadata) {
    let parent = document.createElement("div");
    parent.className = "user-message"

    // close button
    const closeBtn = createCloseButton()
    parent.append(closeBtn)
    closeBtn.addEventListener('click', () => {
        parent.remove();
    });

    if (metadata.size > 0) {
        parent.append(addMetadata(metadata))
    }
    parent.append(Html.createDiv( "user-message-content", message))

    Ui.messagesDiv.append(parent)

}

export function addBotMessage(message, metadata) {
    // parent div
    let parent = document.createElement("div");
    parent.className = "bot-message";

    // close button
    const closeBtn = createCloseButton()
    parent.append(closeBtn)
    closeBtn.addEventListener('click', () => {
        parent.remove();
    });

    // metadata divs
    if (metadata.size > 0) {
        parent.append(addMetadata(metadata))
    }

    // actual message content
    let botMessage = Html.createDiv("bot-message-text", message)
    parent.append(botMessage)

    Ui.messagesDiv.append(parent)
}

function addMetadata(metadata) {
    let parent = document.createElement("div")
    parent.className = "message-tags"
    for (const [key, value] of metadata) {
        parent.append(Html.createDiv("message-tag", `${key}: ${value}`))
    }
    return parent
}

function createCloseButton() {
    const closeBtn = document.createElement('span');
    closeBtn.className = "close-button"
    closeBtn.innerHTML = "x"
    return closeBtn;
}
