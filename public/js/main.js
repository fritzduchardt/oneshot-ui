import * as Backend from './backend.js'
import * as Html from "./html.js";
import * as Handlers from "./handlers.js";
import * as Store from "./store.js";
import {APP_VERSION} from "./sw.js";

async function initializeApp() {

    // buttons
    registerButtonClickListener('chat-button', Handlers.handleSendButtonClick)
    registerButtonClickListener('agent-button', Handlers.handleAgentButtonClick)
    registerButtonClickListener('toggle-sound', Handlers.handleToggleSoundButtonClick)
    registerButtonClickListener('toggle-input', Handlers.handleToggleInputButtonClick)

    // dropdowns
    await loadModels(Store.getModel())
    await loadPatterns(Store.getPattern())
    await loadMarkdown(Store.getMarkdown())

    // version
    document.getElementById("version").innerHTML = APP_VERSION;
}

function registerButtonClickListener(buttonId, handler) {
    const button = document.getElementById(buttonId)

    if (!button) {
        console.debug(`button ${buttonId} not found`)
        return
    }

    button.addEventListener('click', handler)
}

async function loadModels(selected) {
    const models = await Backend.listModels()
    let dd = document.getElementById("model");
    Html.loadDropdown(models, dd, selected, selected ? false : "Please select")
}

async function loadPatterns(selected) {
    const data = await Backend.listPatterns()
    let dd = document.getElementById("pattern");
    Html.loadDropdown(data, dd, selected, selected ? false : "Please select")
}

async function loadMarkdown(selected) {
    const data = await Backend.listMarkdowns()
    let dd = document.getElementById("markdown");
    Html.loadDropdown(data, dd, selected, "None")
}

document.addEventListener('DOMContentLoaded', () => {
    let promise = initializeApp()
})

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js', { type: 'module' })
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err))
    })
}
