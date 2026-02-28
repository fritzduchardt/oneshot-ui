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

export function createDiv(className, html="") {
    let div = document.createElement("div")
    div.className = className
    div.innerHTML = html
    return div
}

export function createButton(className, label) {
    let button = document.createElement('button')
    button.innerHTML = label
    button.className = className
    return button
}

export function createDivWithCloseButton(className, html="") {
    let parent = document.createElement("div")
    parent.className = className
    parent.innerHTML = html
    const closeBtn = createCloseButton()
    parent.append(closeBtn)
    closeBtn.addEventListener('click', () => {
        parent.remove();
    });
    return parent
}

function createCloseButton() {
    const closeBtn = document.createElement('span');
    closeBtn.className = "close-button"
    closeBtn.innerHTML = "x"
    return closeBtn;
}
