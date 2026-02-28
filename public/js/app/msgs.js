import * as Ui from './ui.js'
import * as Dom from './dom.js'
import * as Html from "./formats/html.js"
import * as Text from "./formats/text.js"
import * as Backend from './backend.js'
import * as Store from "./store.js"
import * as Sound from './sound.js'

export function addUserMessage(message, metadata) {
    let parent = Dom.createDivWithCloseButton("user-message");

    if (metadata.size > 0) {
        parent.append(addMetadata(metadata))
    }
    parent.append(Dom.createDiv("user-message-content", message))

    let actionButtons = Dom.createDiv("action-buttons");
    actionButtons.append(createPromptAgainButton(message))
    parent.append(actionButtons)

    Ui.messagesDiv.append(parent)
    scrollMessagesToBottom()
}

export function addBotMessageForPattern(patternName, patternContent) {

    const parent = Dom.createDivWithCloseButton("bot-message");
    Ui.messagesDiv.append(parent)

    const response = Html.convertMarkdownToHtml(patternContent, true, true, true)

    let metadata = new Map()
    metadata.set("pattern", patternName)
    parent.append(addMetadata(metadata))

    let botMessage = Dom.createDiv("bot-message-text", response.html)
    parent.append(botMessage)

    let actionButtons = document.createElement('div');
    actionButtons.className = "action-buttons"
    actionButtons.append(createDeletePatternButton())
    parent.append(actionButtons)

    scrollMessagesToBottom()
}

export function addBotMessageForMarkdown(mdPath, md) {

    const parent = Dom.createDivWithCloseButton("bot-message");
    Ui.messagesDiv.append(parent)

    const response = Html.convertMarkdownToHtml(md, true, false, false)

    let metadata = response.metadata
    metadata.set("path", mdPath)
    parent.append(addMetadata(metadata))

    let botMessage = Dom.createDiv("bot-message-text", response.html)
    parent.append(botMessage)

    let actionButtons = document.createElement('div');
    actionButtons.className = "action-buttons"
    actionButtons.append(createDeleteMarkdownButton())
    parent.append(actionButtons)

    scrollMessagesToBottom()
}

export function addBotMessage(plain_response, parent) {

    const response = Html.convertMarkdownToHtml(plain_response)

    document.querySelector(".loading-dots").remove()

    if (response.metadata.size > 0) {
        parent.append(addMetadata(response.metadata))
    }

    let botMessage = Dom.createDiv("bot-message-text", response.html)
    parent.append(botMessage)

    let actionButtons = document.createElement('div');
    actionButtons.className = "action-buttons"
    actionButtons.append(createCopyButton(response.markdown, "Copy MD"))
    actionButtons.append(createCopyButton(Text.convertMarkdownToPlainText(plain_response), "Copy"))
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
    let parent = Dom.createDivWithCloseButton("bot-message bot-message-pending");

    const dots = Dom.createDiv("loading-dots", "<span></span><span></span><span></span>");
    parent.append(dots)

    Ui.messagesDiv.append(parent)
    scrollMessagesToBottom()
    return parent
}

function addMetadata(metadata) {
    let parent = Dom.createDiv("message-tags")
    for (const [key, value] of metadata) {
        parent.append(Dom.createDiv("message-tag", `${key}: ${value}`))
    }
    return parent
}

function scrollMessagesToBottom() {
    Ui.messagesDiv.scrollTop = Ui.messagesDiv.scrollHeight
}

// Action Buttons

function createPromptAgainButton(prompt) {
    const btn = Dom.createButton("action-button", "Prompt again");
    btn.addEventListener('click', () => {
        Ui.messageTextarea.value = prompt
        Ui.chatButton.click()
    })
    return btn;
}

function createCopyButton(message, label) {
    const btn = Dom.createButton("action-button", label);
    btn.addEventListener('click', () => {
        navigator.clipboard.writeText(message)
            .catch(err => console.error('Failed to write to clipboard', err))
    })
    return btn;
}

function createShareButton(message) {
    const btn = Dom.createButton("action-button", "Share");
    btn.addEventListener('click', () => {
        Backend.telegramSend(message)
            .catch(err => console.error('Failed to telegram send', err))
    })
    return btn;
}

function createStoreButton(filename, markdown) {
    const btn = Dom.createButton("action-button", "Store");
    btn.title = filename
    btn.addEventListener('click', () => {
        Backend.storeMarkdown(filename, markdown)
            .then(() => {
                btn.innerText = `Stored: ${filename}`
                btn.disabled = true
            })
        Backend.listMarkdowns()
            .then(markdown => {
                Dom.loadDropdown(markdown, Ui.markdownDropdown, Store.getMarkdown(), "None")
            })
    })
    return btn;
}

function createDeletePatternButton() {
    const btn = Dom.createButton( "action-button", "Delete")
    btn.addEventListener('click', () => {
    })
    return btn;
}

function createDeleteMarkdownButton() {
    const btn = Dom.createButton( "action-button", "Delete")
    btn.addEventListener('click', () => {
    })
    return btn;
}
