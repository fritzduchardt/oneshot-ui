import * as Ui from './ui.js'
import * as Html from './html.js'
import * as Md from "./md.js"

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

    let actionButtons = document.createElement('div');
    actionButtons.className = "action-buttons"
    actionButtons.append(createPromptAgainButton(message))
    parent.append(actionButtons)

    Ui.messagesDiv.append(parent)
    scrollMessagesToBottom()
}

export function addBotMessage(plain_response, parent) {

    const response = Md.convertMarkdownToHtml(plain_response)

    document.querySelector(".loading-dots").remove()

    const closeBtn = createCloseButton()
    parent.append(closeBtn)
    closeBtn.addEventListener('click', () => {
        parent.remove();
    });

    if (response.metadata.size > 0) {
        parent.append(addMetadata(response.metadata))
    }

    let botMessage = Html.createDiv("bot-message-text", response.html)
    parent.append(botMessage)

    let actionButtons = document.createElement('div');
    actionButtons.className = "action-buttons"
    actionButtons.append(createCopyButton(plain_response, "Copy"))
    actionButtons.append(createCopyButton(plain_response, "Copy MD"))
    parent.append(actionButtons)

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

function scrollMessagesToBottom() {
    Ui.messagesDiv.scrollTop = Ui.messagesDiv.scrollHeight
}

// Action Buttons

function createCloseButton() {
    const closeBtn = document.createElement('span');
    closeBtn.className = "close-button"
    closeBtn.innerHTML = "x"
    return closeBtn;
}

function createPromptAgainButton(prompt) {
    const btn = document.createElement('button');
    btn.className = "action-button"
    btn.innerHTML = "Prompt again"
    btn.addEventListener('click', () => {
        Ui.messageTextarea.value = prompt
    })
    return btn;
}

function createCopyButton(message, label) {
    const btn = document.createElement('button');
    btn.className = "action-button"
    btn.innerHTML = label
    btn.addEventListener('click', () => {
        navigator.clipboard.writeText(message)
            .catch(err => console.error('Failed to write to clipboard', err))
    })
    return btn;
}
