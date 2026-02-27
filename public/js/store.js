import * as Config from './config.js'
const PATTERN_STORAGE_KEY = "pattern";
const MODEL_STORAGE_KEY = "model";
const MARKDOWN_STORAGE_KEY = "markdown";
const MESSAGE = "message";

export function setMessage(message) {
    window.localStorage.setItem(MESSAGE, String(message ?? ""));
}

export function setPattern(pattern) {
    window.localStorage.setItem(PATTERN_STORAGE_KEY, String(pattern ?? ""));
}

export function setModel(model) {
    window.localStorage.setItem(MODEL_STORAGE_KEY, String(model ?? ""));
}

export function setMarkdown(markdown) {
    window.localStorage.setItem(MARKDOWN_STORAGE_KEY, String(markdown ?? ""));
}

export function getPattern() {
    return window.localStorage.getItem(PATTERN_STORAGE_KEY) ?? "";
}

export function getModel() {
    return window.localStorage.getItem(MODEL_STORAGE_KEY) ?? "";
}

export function getMarkdown() {
    return window.localStorage.getItem(MARKDOWN_STORAGE_KEY) ?? "";
}

export function getMessage() {
    return window.localStorage.getItem(MESSAGE) ?? "";
}
