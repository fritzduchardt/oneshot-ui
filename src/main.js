import * as Backend from './app/backend.js'
import * as Html from "./app/html.js";
import * as Handlers from "./app/handlers.js";
import * as Store from "./app/store.js";

async function initializeApp() {

    // buttons
    registerButtonClickListener('send-button', Handlers.handleSendButtonClick)
    registerButtonClickListener('toggle-sound', Handlers.handleToggleSoundButtonClick)
    registerButtonClickListener('toggle-input', Handlers.handleToggleInputButtonClick)

    // dropdowns
    await loadModels(Store.getModel())
    await loadPatterns(Store.getPattern())
    await loadMarkdown(Store.getMarkdown())
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
    Html.loadDropdown(models, dd, selected, "Please select")
}

async function loadPatterns(selected) {
    const data = await Backend.listPatterns()
    let dd = document.getElementById("pattern");
    Html.loadDropdown(data, dd, selected, "Please select")
}

async function loadMarkdown(selected) {
    const data = await Backend.listMarkdowns()
    let dd = document.getElementById("markdown");
    Html.loadDropdown(data, dd, selected, "None")
}

document.addEventListener('DOMContentLoaded', () => {
    let promise = initializeApp()
})
