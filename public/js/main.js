import * as Backend from './app/backend.js'
import * as Dom from "./app/dom.js";
import * as Handlers from "./app/handlers.js";
import * as Store from "./app/store.js";
import * as Ui from "./app/ui.js";
import * as Keys from "./app/keys.js";
import * as Msg from "./app/msgs.js";
import {APP_VERSION} from "../sw.js";
import * as Config from "./config.js";

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
    Keys.registerKeyListener()

    // focus
    registerFocusListener()

    // buttons
    Ui.chatButton.addEventListener("click", () => {
        Handlers.handleSendButtonClick(false)
    })
    Ui.mcpButton.addEventListener("click", () => {
        Handlers.handleSendButtonClick(true)
    })
    Ui.chartButton.addEventListener("click", () => {
        Handlers.handleChartButtonClick()
    })
    registerButtonClickListener('toggle-sound', Handlers.handleToggleSoundButtonClick)
    registerButtonClickListener('toggle-input', Handlers.handleToggleInputButtonClick)
    registerButtonClickListener('show-pattern', Handlers.handleShowPattern)
    registerButtonClickListener('show-markdown', Handlers.handleShowMarkdown)
    registerButtonClickListener('button-scroll-up', () => Handlers.handleMessageScroll("up"))
    registerButtonClickListener('button-scroll-down', () => Handlers.handleMessageScroll("down"))
    registerErrorHandler()

    // SSE stream listener - connects to server-sent events endpoint and publishes incoming events as messages
    registerSseListener()

    document.getElementById("message").focus()
}

function registerButtonClickListener(buttonId, handler) {
    const button = document.getElementById(buttonId)

    if (!button) {
        console.debug(`button ${buttonId} not found`)
        return
    }

    button.addEventListener('click', handler)
}

function registerFocusListener() {
    Ui.messageTextarea.addEventListener("focus", () => {
        const value = Ui.messageTextarea.value
        // if content starts with a word followed by colon, select all text after the word and colon
        const prefixMatch = value.match(/^(\w+:\s+)/)
        if (prefixMatch) {
            const prefixLength = prefixMatch[1].length
            Ui.messageTextarea.setSelectionRange(prefixLength, value.length)
        } else {
            Ui.messageTextarea.select()
        }
    })
}

// format any error-like value into a readable string
function formatErrorArg(arg) {
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`
    if (typeof arg === "object") {
        try { return JSON.stringify(arg) } catch (_) { return String(arg) }
    }
    return String(arg)
}

function registerErrorHandler() {

    // intercept unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason
        const errorText = reason instanceof Error
            ? `${reason.name}: ${reason.message}`
            : formatErrorArg(reason)
        Msg.addErrorMessage(`Unhandled rejection: ${errorText}`)
    })

    // intercept uncaught synchronous errors
    window.addEventListener("error", (event) => {
        const msg = event.error instanceof Error
            ? `${event.error.name}: ${event.error.message}`
            : event.message || "Unknown error"
        Msg.addErrorMessage(`Uncaught error: ${msg}`)
    })
}

// connect to SSE stream endpoint and publish each incoming event as a bot message
function registerSseListener() {
    const sseUrl = `${Config.API_URL}/stream`
    const eventSource = new EventSource(sseUrl)

    eventSource.addEventListener('update', (event) => {
        let data
        // attempt to parse JSON payload, fall back to raw string
        try {
            data = JSON.parse(event.data)
        } catch (_) {
            console.error(`Failed to convert message: ${event.data}`)
            data = event.data
        }
        Msg.addNotification(data.message, data.image, data.basepath)
    })

    eventSource.addEventListener('error', (event) => {
        // log SSE connection errors without showing error messages for routine reconnects
        console.warn('SSE stream error, connection may be retrying', event)
    })

    eventSource.addEventListener('open', () => {
        console.debug('SSE stream connected:', sseUrl)
    })
}

async function loadMessage(message) {
    Ui.messageTextarea.value = message
}

async function loadModels(selected) {
    const models = await Backend.listModels()
    Dom.loadDropdown(models, Ui.modelDropdown, selected, selected ? false : "Please select")
}

async function loadPatterns(selected) {
    await Backend.generatePatterns()
        .then(() => {
            Backend.listPatterns()
                .then((patterns) => {
                    Dom.loadDropdown(patterns, Ui.patternDropdown, selected, selected ? false : "Please select")
                })
        })
}

async function loadMarkdown(selected) {
    const data = await Backend.listMarkdowns()
    data[data.length] = "weaviate"
    Dom.loadDropdown(data, Ui.markdownDropdown, selected, "None")
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(reason => console.error(reason))
})

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { type: 'module'})
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err))
    })
}
