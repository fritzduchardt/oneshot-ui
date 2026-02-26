// html utils

export function loadDropdown(options, element) {
    element.innerHTML = options
        .map((value) => `<option value="${value}">${value}</option>`)
        .join("");
}
