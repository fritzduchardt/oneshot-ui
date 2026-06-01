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

    // add loading dots inside the user message to indicate pending bot response
    const dots = Dom.createDiv("loading-dots user-message-loading", "<span></span><span></span><span></span>");
    parent.loadingDots = dots
    parent.append(dots)

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
    actionButtons.append(createStoreButton(mdPath, response.markdown))
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

export function addBotMessage(plain_response, userMessageEl, hideCopy= false) {

    const response = Html.convertMarkdownToHtml(plain_response)

    // remove loading dots from user message if reference provided
    if (userMessageEl && userMessageEl.loadingDots) {
        userMessageEl.loadingDots.remove()
        userMessageEl.loadingDots = null
    }

    const parent = Dom.createDivWithCloseButton("bot-message");
    Ui.messagesDiv.append(parent)

    if (response.metadata.size > 0) {
        parent.append(addMetadata(response.metadata))
    }

    let botMessage = Dom.createDiv("bot-message-text", response.html)
    parent.append(botMessage)

    // add action buttons at bottom of message
    let actionButtons = document.createElement('div');
    actionButtons.className = "action-buttons"
    if (!hideCopy) {
        actionButtons.append(createCopyButton(response.markdown, "Copy MD"))
        actionButtons.append(createCopyButton(Text.convertMarkdownToPlainText(plain_response), "Copy"))
    }
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

    if (!isMobileDevice() && !Ui.toggleSound.classList.contains("pressed")) {
        Sound.playAcknowledgementSound()
    }
}


export function addNotification(message, image, basepath) {
    let parent = Dom.createDivWithCloseButton("bot-message");
    let response = Html.convertMarkdownToHtml(
        message, false, false, true, basepath
    )
    if (response.metadata.size > 0) {
        parent.append(addMetadata(response.metadata))
    }
    parent.append(Dom.createDiv("bot-message-text", response.html))
    const shouldScroll = isScrolledNearBottom(Ui.messagesDiv)
    Ui.messagesDiv.append(parent)
    if (shouldScroll) {
        scrollMessagesToBottom()
    }
    if (!isMobileDevice() && !Ui.toggleSound.classList.contains("pressed")) {
        Sound.playAcknowledgementSound()
    }
    return parent
}

function isScrolledNearBottom(element, threshold = 80) {
    return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
}

export function addErrorMessage(errorText) {
    const parent = Dom.createDivWithCloseButton("bot-message bot-message-error")
    const label = Dom.createDiv("message-tags")
    label.append(Dom.createDiv("message-tag", "error"))
    parent.append(label)
    parent.append(Dom.createDiv("bot-message-text", escapeHtml(errorText)))
    Ui.messagesDiv.append(parent)
    scrollMessagesToBottom()
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
    Ui.messagesDiv.focus()
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

// escape HTML special characters for safe display of error text
function escapeHtml(text) {
    if (!text) {
        return "text undefined"
    }
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}
