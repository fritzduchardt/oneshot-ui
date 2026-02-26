import * as Backend from './app/backend.js'
import * as Html from "./app/html.js";
import * as Handlers from "./app/handlers.js";

async function initializeApp() {

    // buttons
    registerButtonClickListener('send-button', Handlers.handleSendButtonClick)
    registerButtonClickListener('toggle-sound', Handlers.handleToggleSoundButtonClick)
    registerButtonClickListener('toggle-input', Handlers.handleToggleInputButtonClick)

    // dropdowns
    await loadModels()
    await loadPatterns()
    await loadMarkdown()
}

function registerButtonClickListener(buttonId, handler) {
    const button = document.getElementById(buttonId)

    if (!button) {
        console.debug(`button ${buttonId} not found`)
        return
    }

    button.addEventListener('click', handler)
}

async function loadModels() {
    const models = await Backend.listModels()
    let dd = document.getElementById("model");
    Html.loadDropdown(models, dd)
}

async function loadPatterns() {
    const data = await Backend.listPatterns()
    let dd = document.getElementById("pattern");
    Html.loadDropdown(data, dd)
}

async function loadMarkdown() {
    const data = await Backend.listMarkdowns()
    let dd = document.getElementById("markdown");
    Html.loadDropdown(data, dd)
}

document.addEventListener('DOMContentLoaded', () => {
    let promise = initializeApp()
})
