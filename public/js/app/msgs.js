import * as Ui from './ui.js'
import * as Dom from './dom.js'
import * as Html from "./formats/html.js"
import * as Text from "./formats/text.js"
import * as Backend from './backend.js'
import * as Store from "./store.js"
import * as Sound from './sound.js'

export function addUserMessage(message, metadata, abortController, withMcp) {
    let parent = Dom.createDivWithCloseButton("user-message");

    if (metadata.size > 0) {
        parent.append(addMetadata(metadata))
    }
    parent.append(Dom.createDiv("user-message-content", message))

    let actionButtons = Dom.createDiv("action-buttons");
    actionButtons.append(createPromptAgainButton(message, withMcp))
    // store reference to cancel button so it can be disabled when response arrives
    const cancelBtn = createCancelRequestButton(abortController)
    actionButtons.append(cancelBtn)
    parent.append(actionButtons)
    // attach cancel button reference to parent so handlers.js can disable it
    parent.cancelBtn = cancelBtn
    Ui.messagesDiv.append(parent)
    scrollMessagesToBottom()
    return parent
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
    actionButtons.append(createDeletePatternButton(patternName))
    parent.append(actionButtons)
    scrollToTop(parent)
}

export function addBotMessageForMarkdown(mdPath, md) {

    const parent = Dom.createDivWithCloseButton("bot-message");
    Ui.messagesDiv.append(parent)

    const response = Html.convertMarkdownToHtml(md, false, false, false, mdPath)

    let metadata = response.metadata
    metadata.set("path", mdPath)
    parent.append(addMetadata(metadata))

    let botMessage = Dom.createDiv("bot-message-text", response.html)
    parent.append(botMessage)
    addMarkdownLinks(botMessage)

    let actionButtons = document.createElement('div');
    actionButtons.className = "action-buttons"
    actionButtons.append(createDeleteMarkdownButton(mdPath))
    if (mdPath.match("/Food/")) {
        actionButtons.append(createShareButton(mdPath))
    }
    parent.append(actionButtons)
    scrollToTop(parent)
}

function addMarkdownLinks(botMessage) {
    botMessage.querySelectorAll("a.md").forEach(mdLink => {
        mdLink.addEventListener('click', event => {
            event.preventDefault()
            Backend.getMarkdowns(mdLink.title)
                .then(markdown => {
                    addBotMessageForMarkdown(mdLink.title, markdown)
                })
        })
    })
}

export function addBotMessage(plain_response, parent) {

    const response = Html.convertMarkdownToHtml(plain_response)

    const loadingDots = parent.querySelector(".loading-dots")
    if (loadingDots) {
        loadingDots.remove()
    }

    if (response.metadata.size > 0) {
        parent.append(addMetadata(response.metadata))
    }

    let botMessage = Dom.createDiv("bot-message-text", response.html)
    parent.append(botMessage)

    // add action buttons at bottom of message
    let actionButtons = document.createElement('div');
    actionButtons.className = "action-buttons"
    actionButtons.append(createCopyButton(response.markdown, "Copy MD"))
    actionButtons.append(createCopyButton(Text.convertMarkdownToPlainText(plain_response), "Copy"))
    if (response.filename) {
        if (response.filename.match("/Food/")) {
            actionButtons.append(createShareButton(response.filename))
        }
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

    // add copy buttons inside each code block
    botMessage.querySelectorAll("pre code").forEach(codeBlock => {
        codeBlock.parentElement.append(createCopyButton(codeBlock.innerText, "Copy"))
    })

    addMarkdownLinks(botMessage)
    requestAnimationFrame(() => {
        botMessage.querySelectorAll("script").forEach(scriptTag => {
            const code = scriptTag.textContent || scriptTag.innerText
            try {
                const fn = new Function(code)
                fn()
            } catch (err) {
                console.error('Failed to execute script from bot message:', err)
            }
        })
    })
    // scrollToTop(parent)

    if (!isMobileDevice() && !Ui.toggleSound.classList.contains("pressed")) {
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

export function scrollToTop(domElement) {
    if (!domElement) {
        return
    }
    domElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// Action Buttons

function createPromptAgainButton(prompt, withMcp) {
    const btn = Dom.createButton("action-button", "Prompt again");
    btn.addEventListener('click', () => {
        Ui.messageTextarea.value = prompt
        if (withMcp) {
            Ui.mcpButton.click()
        } else {
            Ui.chatButton.click()
        }
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
        // show loading animation while waiting for server response
        btn.classList.add("button-loading")
        btn.disabled = true

        Backend.storeMarkdown(filename, markdown)
            .then(() => {
                btn.classList.remove("button-loading")
                btn.innerText = `Stored: ${filename}`
            })
            .catch(err => {
                // restore button state on error so user can retry
                btn.classList.remove("button-loading")
                btn.disabled = false
                console.error('Failed to store markdown', err)
            })

        Backend.listMarkdowns()
            .then(markdown => {
                Dom.loadDropdown(markdown, Ui.markdownDropdown, Store.getMarkdown(), "None")
            })
    })
    return btn;
}

function createDeletePatternButton(pattern) {
    const btn = Dom.createButton( "action-button", "Delete")
    btn.addEventListener('click', () => {
        Backend.deletePattern(pattern)
            .then(() => {
                btn.disabled = true
            })
            .catch(err => console.error('Failed to delete pattern', err))
    })
    return btn;
}

function createDeleteMarkdownButton(path) {
    const btn = Dom.createButton( "action-button", "Delete")
    btn.addEventListener('click', () => {
        Backend.deleteMarkdowns(path)
            .then(() => {
                btn.disabled = true
            })
            .catch(err => console.error('Failed to delete markdown', err))
    })
    return btn;
}

function createCancelRequestButton(abortController) {
    const btn = Dom.createButton( "action-button", "Cancel")
    btn.addEventListener('click', () => {
        abortController.abort("user abort")
        btn.disabled = true
    })
    return btn;
}

function isMobileDevice() {
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
        return navigator.userAgentData.mobile
    }
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent || "")
}