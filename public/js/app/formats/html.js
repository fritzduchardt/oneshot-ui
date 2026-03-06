export function convertMarkdownToHtml(markdown, skipTrimFilename, skipParseMetadata, skipCode) {

    // strip spaces
    markdown = markdown.trim()

    // trim filename
    let filename = ""
    if (!skipTrimFilename) {
        const ret = trimFilename(markdown)
        markdown = ret.markdown
        filename = ret.filename
    }

    // parse metadata
    let metadata
    let content = markdown
    if (!skipParseMetadata) {
        let res = parseMetadata(markdown)
        content = res.content
        metadata = res.metadata
    }

    // convert tables
    content = convertMarkdownTablesToHtml(content)

    const html = convertContentToHtml(content, skipCode)

    return {
        html: html,
        metadata,
        markdown,
        filename
    }
}

function trimFilename(markdown) {
    // regex: match leading FILENAME header line
    const filenamePattern = /^FILENAME:\s+([\S]*?)\n/
    const filenameMatch = markdown.match(filenamePattern)
    let filename = ""
    if (filenameMatch) {
        markdown = markdown.slice(filenameMatch[0].length)
        filename = filenameMatch[1]
    }
    return {markdown, filename}
}

function parseMetadata(markdown) {
    const metadata = new Map()
    // regex: match --- metadata block at top of content
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
    return {metadata, content}
}

function convertMarkdownTablesToHtml(content) {
    // regex: match markdown table blocks (header, separator, body)
    const tablePattern = /^(\|.+\|\n)(^\|[-| :]+\|\n)((?:^\|.+\|\n?)*)/gm

    return content.replace(tablePattern, (_, headerRow, separatorRow, bodyRows) => {
        const parseColumns = (row) =>
            // regex: trim leading and trailing pipe
            row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim())

        const alignments = parseColumns(separatorRow).map((cell) => {
            // regex: detect center alignment
            if (/^:-+:$/.test(cell)) return "center"
            // regex: detect right alignment
            if (/^-+:$/.test(cell)) return "right"
            // regex: detect left alignment
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

function convertContentToHtml(content, skipCode) {

    let codeBlocks = []
    let inlineCodeBlocks = []
    if (!skipCode) {
        // regex: match fenced code blocks and HTML <pre><code> blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```|<pre><code[\s\S]*?<\/code><\/pre>/g, (match, lang, code) => {
            let htmlBlock = match
            if (match.startsWith("```")) {
                const langAttr = lang ? ` class="language-${lang}"` : ""
                code = code.trimEnd()
                htmlBlock = `<pre><code${langAttr}>${escapeHtml(code)}</code></pre>`
            }
            const placeholder = `@@CODEBLOCK${codeBlocks.length}@@`
            codeBlocks.push(htmlBlock)
            return placeholder
        })

        content = content.replace(/`([^`]+)`/g, (match, code) => {
            const placeholder = `@@INLINECODEPROTECT${inlineCodeBlocks.length}@@`
            inlineCodeBlocks.push(`<code>${escapeHtml(code)}</code>`)
            return placeholder
        })
    }

    let html = convertNonCodeMarkdownToHtml(content)

    if (!skipCode) {
        html = restoreCodeBlocks(html, codeBlocks)
        html = restoreInlineCodeBlocks(html, inlineCodeBlocks)
    }
    return `<p>${html}</p>`
}

function convertNonCodeMarkdownToHtml(content) {
    return content
        // regex: h6 heading
        .replace(/^###### (.+)$/gm, "<h6>$1</h6>")
        // regex: h5 heading
        .replace(/^##### (.+)$/gm, "<h5>$1</h5>")
        // regex: h4 heading
        .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
        // regex: h3 heading
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        // regex: h2 heading
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        // regex: h1 heading
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        // regex: bold+italic (***text***)
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        // regex: bold (**text**)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // regex: italic (*text*)
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // regex: bold+italic (___text___)
        .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
        // regex: bold (__text__)
        .replace(/__(.+?)__/g, "<strong>$1</strong>")
        // regex: italic (_text_)
        .replace(/_(.+?)_/g, "<em>$1</em>")
        // regex: strikethrough (~~text~~)
        .replace(/~~(.+?)~~/g, "<del>$1</del>")
        // regex: prompt links ([[text]])
        .replace(/\[\[([\s\S]+?)\]\]/g, '<span class="prompt-link">$1</span>')
        // regex: unordered list items
        .replace(/^\s*[-*+] (.+)$/gm, "<li>$1</li>")
        // regex: wrap consecutive <li> into <ul>
        .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
        // regex: ordered list items
        .replace(/^\s*(\d+)\. (.+)$/gm, (_, num, text) => `<li value="${num}">${text}</li>`)
        // regex: wrap consecutive <li value="n"> into <ol>
        .replace(/(<li value="\d+">[^]*?<\/li>\n?)+/g, (match) => `<ol>${match}</ol>`)
        // regex: blockquote
        .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
        // regex: horizontal rule
        .replace(/^---$/gm, "<hr>")
        // regex: links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a target="_blank" href="$2">$1</a>')
        // regex: images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')
        // regex: paragraph breaks
        .replace(/\n\n+/g, "</p><p>")
        // regex: trim plain lines that are not HTML tags
        .replace(/^(?!<[a-z])(.+)$/gm, (line) => line.trim() ? line : "")
}

function restoreCodeBlocks(html, codeBlocks) {
    return codeBlocks.reduce((acc, block, index) => {
        // regex: match code block placeholder for given index
        const placeholderPattern = new RegExp(`@@CODEBLOCK${index}@@`, "g")
        return acc.replace(placeholderPattern, block)
    }, html)
}

function restoreInlineCodeBlocks(html, inlineCodeBlocks) {
    return inlineCodeBlocks.reduce((acc, block, index) => {
        const placeholderPattern = new RegExp(`@@INLINECODEPROTECT${index}@@`, "g")
        return acc.replace(placeholderPattern, block)
    }, html)
}

function escapeHtml(text) {
    return text
        // regex: escape &
        .replace(/&/g, "&amp;")
        // regex: escape <
        .replace(/</g, "&lt;")
        // regex: escape >
        .replace(/>/g, "&gt;")
        // regex: escape "
        .replace(/"/g, "&quot;")
        // regex: escape '
        .replace(/'/g, "&#039;")
}