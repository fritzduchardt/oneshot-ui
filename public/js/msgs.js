import * as Ui from './ui.js'
import * as Html from './html.js'

export function addUserMessage(message, metadata) {
    let parent = document.createElement("div");
    parent.className = "user-message"

    const closeBtn = createCloseButton()
    parent.append(closeBtn)
    closeBtn.addEventListener('click', () => {
        parent.remove();
    });

    if (metadata.size > 0) {
        parent.append(addMetadata(metadata))
    }
    parent.append(Html.createDiv("user-message-content", message))

    Ui.messagesDiv.append(parent)
    scrollMessagesToBottom()
}

export function addBotMessage(message, metadata, parent) {

    document.querySelector(".loading-dots").remove()

    const closeBtn = createCloseButton()
    parent.append(closeBtn)
    closeBtn.addEventListener('click', () => {
        parent.remove();
    });

    if (metadata.size > 0) {
        parent.append(addMetadata(metadata))
    }

    let botMessage = Html.createDiv("bot-message-text", message)
    parent.append(botMessage)

    scrollMessagesToBottom()
}

export function addPendingMessage() {
    let parent = document.createElement("div");
    parent.className = "bot-message bot-message-pending";

    const dots = document.createElement("div");
    dots.className = "loading-dots"
    dots.innerHTML = "<span></span><span></span><span></span>"
    parent.append(dots)

    Ui.messagesDiv.append(parent)
    scrollMessagesToBottom()
    return parent
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

function scrollMessagesToBottom() {
    Ui.messagesDiv.scrollTop = Ui.messagesDiv.scrollHeight
}
