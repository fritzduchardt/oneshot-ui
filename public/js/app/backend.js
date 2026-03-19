import * as Config from './../config.js'

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
    setTimeout(() => abortController.abort(), Config.CHAT_TIMEOUT_MILLIS);

    return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal
    }).then(response => {
        return response.text()
    })
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
