export function convertMarkdownToHtml(markdown) {

    // strip spaces
    markdown = markdown.trim()

    // trim filename
    const filenamePattern = /^FILENAME:\s+([\S]*?)\n/
    const filenameMatch = markdown.match(filenamePattern)
    let filename = ""
    if (filenameMatch) {
        markdown = markdown.slice(filenameMatch[0].length)
        filename = filenameMatch[1]
    }

    const metadata = new Map()
    const metadataHeaderPattern = /^[\s\S]*?^---\n([\s\S]*?)\n---\n/m
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

    const contentWithTablesConverted = convertMarkdownTablesToHtml(content)

    const html = contentWithTablesConverted
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
        .replace(/\[\[([\s\S]+?)\]\]/g, '<span class="prompt-link">$1</span>')
        .replace(/^\s*[-*+] (.+)$/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
        .replace(/^\s*\d+\. (.+)$/gm, "<li>$1</li>")
        .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
        .replace(/^---$/gm, "<hr>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a target="_blank" href="$2">$1</a>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')
        .replace(/\n\n+/g, "</p><p>")
        .replace(/^(?!<[a-z])(.+)$/gm, (line) => line.trim() ? line : "")

    return {
        html: `<p>${html}</p>`,
        metadata,
        markdown,
        filename
    }
}

function convertMarkdownTablesToHtml(content) {
    const tablePattern = /^(\|.+\|\n)(^\|[-| :]+\|\n)((?:^\|.+\|\n?)*)/gm

    return content.replace(tablePattern, (_, headerRow, separatorRow, bodyRows) => {
        const parseColumns = (row) =>
            row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim())

        const alignments = parseColumns(separatorRow).map((cell) => {
            if (/^:-+:$/.test(cell)) return "center"
            if (/^-+:$/.test(cell)) return "right"
            if (/^:-+$/.test(cell)) return "left"
            return ""
        })

        const headerCells = parseColumns(headerRow)
            .map((cell, i) => {
                const alignAttr = alignments[i] ? ` style="text-align:${alignments[i]}"` : ""
                return `<th${alignAttr}>${cell}</th>`
            })
            .join("")

        const bodyHtml = bodyRows
            .trim()
            .split("\n")
            .filter((row) => row.trim())
            .map((row) => {
                const cells = parseColumns(row)
                    .map((cell, i) => {
                        const alignAttr = alignments[i] ? ` style="text-align:${alignments[i]}"` : ""
                        return `<td${alignAttr}>${cell}</td>`
                    })
                    .join("")
                return `<tr>${cells}</tr>`
            })
            .join("")

        return `<table class="content-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyHtml}</tbody></table>\n`
    })
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}
