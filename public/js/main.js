import * as Backend from './backend.js'
import * as Html from "./html.js";
import * as Handlers from "./handlers.js";
import * as Store from "./store.js";
import * as Ui from "./ui.js";
import {APP_VERSION} from "./sw.js";

async function initializeApp() {

    // version
    Ui.version.innerHTML = APP_VERSION;

    // all the loading
    await loadModels(Store.getModel())
    await loadPatterns(Store.getPattern())
    await loadMarkdown(Store.getMarkdown())
    await loadMessage(Store.getMessage())
    $("#markdown").select2()
    $("#pattern").select2()
    $("#model").select2({
    })

    // keys
    registerKeyListener()

    // focus
    registerFocusListener()

    // buttons
    Ui.chatButton.addEventListener("click", function (e) {
        Handlers.handleSendButtonClick(false)
    })
    Ui.mcpButton.addEventListener("click", function (e) {
        Handlers.handleSendButtonClick(true)
    })
    registerButtonClickListener('agent-button', Handlers.handleAgentButtonClick)
    registerButtonClickListener('toggle-sound', Handlers.handleToggleSoundButtonClick)
    registerButtonClickListener('toggle-input', Handlers.handleToggleInputButtonClick)
    registerButtonClickListener('show-pattern', Handlers.handleShowPattern)
    registerButtonClickListener('show-markdown', Handlers.handleShowMarkdown)
}

function registerButtonClickListener(buttonId, handler) {
    const button = document.getElementById(buttonId)

    if (!button) {
        console.debug(`button ${buttonId} not found`)
        return
    }

    button.addEventListener('click', handler)
}

function registerKeyListener() {
    const keyPressed = new Set()
    document.addEventListener('keydown', event => {
        keyPressed.add(event.code)
        if (keyPressed.has('Enter') && keyPressed.has('ControlLeft') && document.activeElement ==  Ui.messageTextarea) {
            Handlers.handleSendButtonClick(true)
                .catch(err => console.error('Failed to send message', err))
        } else if (keyPressed.has('Enter') && document.activeElement ==  Ui.messageTextarea) {
            Handlers.handleSendButtonClick(false)
                .catch(err => console.error('Failed to send message', err))
        }
    });

    document.addEventListener('keyup', event => {
        keyPressed.delete(event.code)
    })
}

function registerFocusListener() {
    Ui.messageTextarea.addEventListener("focus", () => {
        Ui.messageTextarea.select()
    })
}

async function loadMessage(message) {
    Ui.messageTextarea.value = message
}

async function loadModels(selected) {
    const models = await Backend.listModels()
    Html.loadDropdown(models, Ui.modelDropdown, selected, selected ? false : "Please select")
}

async function loadPatterns(selected) {
    await Backend.generatePatterns()
        .then(() => {
            Backend.listPatterns()
                .then((patterns) => {
                    Html.loadDropdown(patterns, Ui.patternDropdown, selected, selected ? false : "Please select")
                })
        })
}

async function loadMarkdown(selected) {
    const data = await Backend.listMarkdowns()
    Html.loadDropdown(data, Ui.markdownDropdown, selected, "None")
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(reason => console.error(reason))
})

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js', { type: 'module' })
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err))
    })
}
