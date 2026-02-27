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

export function convertMarkdownToHtml(markdown) {
    const metadata = new Map()

    const metadataHeaderPattern = /^---\n([\s\S]*?)\n---\n/
    const metadataMatch = markdown.match(metadataHeaderPattern)

    let content = markdown
    if (metadataMatch) {
        const metadataBlock = metadataMatch[1]
        content = markdown.slice(metadataMatch[0].length)

        metadataBlock.split("\n").forEach((line) => {
            const separatorIndex = line.indexOf(":")
            if (separatorIndex === -1) return
            const key = line.slice(0, separatorIndex).trim()
            const value = line.slice(separatorIndex + 1).trim()
            if (key) metadata.set(key, value)
        })
    }

    const html = content
        .replace(/^###### (.+)$/gm, "<h6>$1</h6>")
        .replace(/^##### (.+)$/gm, "<h5>$1</h5>")
        .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        .replace(/```(\w+)?\n([\s\S]*?)```/gm, (_, lang, code) => {
            const langAttr = lang ? ` class="language-${lang}"` : ""
            return `<pre><code${langAttr}>${escapeHtml(code.trimEnd())}</code></pre>`
        })
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
        .replace(/__(.+?)__/g, "<strong>$1</strong>")
        .replace(/_(.+?)_/g, "<em>$1</em>")
        .replace(/~~(.+?)~~/g, "<del>$1</del>")
        .replace(/^\s*[-*+] (.+)$/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
        .replace(/^\s*\d+\. (.+)$/gm, "<li>$1</li>")
        .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
        .replace(/^---$/gm, "<hr>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')
        .replace(/\n\n+/g, "</p><p>")
        .replace(/^(?!<[a-z])(.+)$/gm, (line) => line.trim() ? line : "")

    return {
        html: `<p>${html}</p>`,
        metadata
    }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}