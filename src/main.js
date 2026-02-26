import * as Backend from './app/api/backend.js'
import * as Html from "./app/html/html.js";

async function initializeApp() {
    registerButtonEventListeners()
    await loadModels()
}

function registerButtonEventListeners() {
    registerButtonClickListener('toggle-sound', handleToggleSoundButtonClick)
    registerButtonClickListener('toggle-input', handleToggleInputButtonClick)
    registerButtonClickListener('send-button', handleSendButtonClick)
    registerButtonClickListener('chat-button', handleChatButtonClick)
    registerButtonClickListener('refreshBtn', handleRefreshButtonClick)
}

function registerButtonClickListener(buttonId, handler) {
    const button = document.getElementById(buttonId)

    if (!button) {
        console.debug(`button ${buttonId} not found`)
        return
    }

    button.addEventListener('click', handler)
}

function handleSendButtonClick(event) {
    const message = document.getElementById('message')
    const model = document.getElementById('model')
    const markdown = document.getElementById('markdown')
    Backend.chat(message, model, markdown).catch(error => console.log(error))
}

function handleToggleSoundButtonClick() {
    console.log('Toggle sound clicked')
}

function handleToggleInputButtonClick() {
    console.log('Toggle input clicked')
}

function handleChatButtonClick() {
    console.log('Chat clicked')
}

async function handleRefreshButtonClick() {
    console.log('Refresh clicked')

    try {
        const todos = await fetch('/api/todos').then((res) => res.json())
        console.log('Todos:', todos)
    } catch (err) {
        console.error('Failed to fetch todos', err)
    }
}

async function loadModels() {
    const models = await Backend.listModels()
    let dd = document.getElementById("model");
    Html.loadDropdown(models, dd)
    new Choices(dd, {searchable: true})
}

document.addEventListener('DOMContentLoaded', () => {
    let promise = initializeApp()
})
