import * as Ui from './ui.js'
import * as Html from './html.js'
import * as Md from "./md.js"
import * as Backend from './backend.js'
import * as Store from "./store.js"
import * as Sound from './sound.js'
import {playAcknowledgementSound} from "./sound.js"

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
    actionButtons.append(createCopyButton(response.markdown, "Copy MD"))
    actionButtons.append(createCopyButton(Md.convertMarkdownToPlainText(plain_response), "Copy"))
    const link = ""
    actionButtons.append(createShareButton(link))
    if (response.filename) {
        actionButtons.append(createStoreButton(response.filename, response.markdown))
    }
    const links = parent.querySelectorAll(".prompt-link")
    links.forEach(link => {
        link.addEventListener('click', () => {
            Ui.messageTextarea.value = link.innerHTML
            Ui.chatButton.click()
        })
    })
    parent.append(actionButtons)
    scrollMessagesToBottom()
    if (!Ui.toggleSound.classList.contains("pressed")) {
        Sound.playAcknowledgementSound()
    }
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
        Ui.chatButton.click()
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

function createShareButton(message) {
    const btn = document.createElement('button');
    btn.className = "action-button"
    btn.innerHTML = "Share"
    btn.addEventListener('click', () => {
        Backend.telegramSend(message)
            .catch(err => console.error('Failed to telegram send', err))
    })
    return btn;
}

function createStoreButton(filename, markdown) {
    const btn = document.createElement('button');
    btn.title = filename
    btn.className = "action-button"
    btn.innerHTML = `Store`
    btn.addEventListener('click', () => {
        Backend.storeMarkdown(filename, markdown)
            .then(() => {
                btn.innerText = `Stored: ${filename}`
                btn.disabled = true
            })
        Backend.listMarkdowns()
            .then(markdown => {
                Html.loadDropdown(markdown, Ui.markdownDropdown, Store.getMarkdown(), "None")
            })
    })
    return btn;
}
