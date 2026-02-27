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
        metadata
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

// Convert to text


export function convertMarkdownToPlainText(markdown) {
    let content = stripMarkdownMetadata(markdown)
    content = stripFencedCodeBlocks(content)
    content = stripInlineCode(content)
    content = stripImages(content)
    content = stripLinks(content)
    content = stripEmphasis(content)
    content = stripBlockquotes(content)
    content = stripHorizontalRules(content)
    content = stripLists(content)
    content = stripMarkdownTables(content)
    content = capitalizeHeadlines(content)
    content = normalizeLineEndings(content)
    content = collapseWhitespace(content)

    return content.trim()
}

function stripMarkdownMetadata(markdown) {
    const metadataHeaderPattern = /^---\n([\s\S]*?)\n---\n/
    const metadataMatch = markdown.match(metadataHeaderPattern)
    let content = markdown
    if (metadataMatch) {
        content = markdown.slice(metadataMatch[0].length)
    }
    return content
}

function stripFencedCodeBlocks(text) {
    return text.replace(/```[\s\S]*?```/gm, (match) => {
        const lines = match.split("\n")
        const inner = lines.slice(1, Math.max(1, lines.length - 1)).join("\n")
        return inner.trim()
    })
}

function stripInlineCode(text) {
    return text.replace(/`([^`]+)`/g, "$1")
}

function stripImages(text) {
    return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1").replace(/!\[([^\]]*)\]\[([^\]]+)\]/g, "$1")
}

function stripLinks(text) {
    return text
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
        .replace(/\[([^\]]+)\]\[([^\]]+)\]/g, "$1")
        .replace(/<https?:\/\/[^>]+>/g, "")
}

function stripEmphasis(text) {
    return text
        .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/___(.+?)___/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/_(.+?)_/g, "$1")
        .replace(/~~(.+?)~~/g, "$1")
}

function stripBlockquotes(text) {
    return text.replace(/^\s*>+\s?/gm, "")
}

function stripHorizontalRules(text) {
    return text.replace(/^\s*---\s*$/gm, "")
}

function stripLists(text) {
    return text
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/^\s*\d+\.\s+/gm, "")
}

function stripMarkdownTables(text) {
    const lines = text.split("\n")
    const result = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const next = lines[i + 1]

        const isTableRow = (value) => /^\s*\|.*\|\s*$/.test(value)
        const isSeparatorRow = (value) => /^\s*\|?[\s:-]+(\|[\s:-]+)+\|?\s*$/.test(value)

        if (isTableRow(line) && typeof next === "string" && isSeparatorRow(next)) {
            const header = parseMarkdownTableRow(line)
            if (header.length) result.push(header.join(" "))

            i += 2
            while (i < lines.length && isTableRow(lines[i])) {
                const row = parseMarkdownTableRow(lines[i])
                if (row.length) result.push(row.join(" "))
                i++
            }
            i--
            continue
        }

        result.push(line)
    }

    return result.join("\n")
}

function parseMarkdownTableRow(row) {
    return row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim())
}

function capitalizeHeadlines(text) {
    return text
        .replace(/^######\s+(.+)$/gm, (_, title) => title.toUpperCase())
        .replace(/^#####\s+(.+)$/gm, (_, title) => title.toUpperCase())
        .replace(/^####\s+(.+)$/gm, (_, title) => title.toUpperCase())
        .replace(/^###\s+(.+)$/gm, (_, title) => title.toUpperCase())
        .replace(/^##\s+(.+)$/gm, (_, title) => title.toUpperCase())
        .replace(/^#\s+(.+)$/gm, (_, title) => title.toUpperCase())
}

function normalizeLineEndings(text) {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function collapseWhitespace(text) {
    return text
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
}
