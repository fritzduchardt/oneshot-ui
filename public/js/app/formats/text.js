export function convertMarkdownToPlainText(markdown) {
    let content = stripMarkdownMetadata(markdown)
    content = stripFencedCodeBlocks(content)
    content = stripInlineCode(content)
    content = stripImages(content)
    content = convertLinksToHttpFormat(content)
    content = stripDoubleBrackets(content)
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
    const metadataHeaderPattern = /^[\s\S]*?^---\n([\s\S]*?)\n---\n/m
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

function convertLinksToHttpFormat(text) {
    return text
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$2")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
        .replace(/\[([^\]]+)\]\[([^\]]+)\]/g, "$1")
        .replace(/<(https?:\/\/[^>]+)>/g, "$1")
}

function stripDoubleBrackets(text) {
    return text.replace(/\[\[([\s\S]+?)\]\]/g, "$1")
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