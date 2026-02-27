
export function loadDropdown(options, element, selected, none) {
    let html = ""
    if (none) {
        html = `<option value=\"\">${none}</option>`
    }

    html += options
        .map((value) => `<option value="${value}">${value}</option>`)
        .join("");

    element.innerHTML = html

    if (!selected) {
        return
    }

    element.value = selected
}

export function createDiv(className, content) {
    const html = `<div class="${className}">${content}</div>`
    return html
}
