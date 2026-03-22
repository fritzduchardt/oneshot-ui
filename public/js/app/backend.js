import * as Config from './../config.js'
import {CHAT_TIMEOUT_MILLIS} from "./../config.js"

export async function listPatterns() {
    const url = `${Config.API_URL}/patterns/names`
    return await fetch(url)
        .then(res => res.json())
        .catch(err => console.log(err))
}

export async function getPattern(pattern) {
    const url = `${Config.API_URL}/patterns/${pattern}`
    return await fetch(url)
        .then(res => res.text())
        .catch(err => console.log(err))
}

export async function deletePattern(pattern) {
    const url = `${Config.API_URL}/patterns/${pattern}`
    return await fetch(url, {method: 'DELETE'})
        .catch(err => console.log(err))
}

export async function listModels() {
    const url = `${Config.API_URL}/models/names`
    return await fetch(url)
        .then(res => res.json())
        .catch(err => console.log(err))
}

export async function listMarkdowns() {
    const url = `${Config.API_URL}/markdown/paths`
    return await fetch(url)
        .then(res => res.json())
        .catch(err => console.log(err))
}

export async function getMarkdowns(path) {
    const url = `${Config.API_URL}/markdown/${path}`
    return await fetch(`${url}`)
        .then(res => res.text())
        .catch(err => console.log(err))
}

export async function deleteMarkdowns(path) {
    const url = `${Config.API_URL}/markdown/${path}`
    return await fetch(`${url}`, {method: 'DELETE'})
        .catch(err => console.log(err))
}

export async function chat(message, model, pattern, markdown, abortController, withMcp) {
    const url = `${Config.API_URL}/completion`
    const payload = { message, model, pattern, markdown, "with_mcp": withMcp}

    // Use a separate internal AbortController for the timeout so that the
    // caller-supplied abortController is never triggered by our own timeout.
    // A 499 means the client closed the connection – most likely the timeout
    // was firing and aborting the signal that was passed to fetch().
    const timeoutController = new AbortController()

    // Link the caller's signal to our internal one so that an explicit cancel
    // from the UI still propagates correctly.
    if (abortController.signal.aborted) {
        timeoutController.abort()
    } else {
        abortController.signal.addEventListener('abort', () => timeoutController.abort(), {once: true})
    }

    const timeoutId = setTimeout(() => {
        console.warn(`chat: timeout after ${CHAT_TIMEOUT_MILLIS}ms – aborting request`)
        timeoutController.abort()
    }, CHAT_TIMEOUT_MILLIS)

    return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Use our internal signal so only we control when the timeout fires
        signal: timeoutController.signal
    }).then(response => {
        return response.text()
    }).catch(err => {
        // Surface abort/timeout errors clearly instead of swallowing them
        if (err.name === 'AbortError') {
            console.error('chat: request aborted (timeout or manual cancel)', err)
        }
        throw err
    }).finally(() => clearTimeout(timeoutId))
}

export async function storeMarkdown(path, markdown) {
    const url = `${Config.API_URL}/markdown/store`
    const payload = { path, markdown }
    return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).then(response => response.text())
}

export async function generatePatterns() {
    const url = `${Config.API_URL}/patterns/generate`
    return await fetch(url, {
        method: 'POST',
    }).then(response => response.text())
}

export async function telegramSend(mdPath) {
    const url = `${Config.API_URL}/telegram/send`
    const payload = { markdown: mdPath}
    return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).then(response => response.text())
}