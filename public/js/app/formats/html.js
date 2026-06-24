import * as Config from '../../config.js'

export function convertMarkdownToHtml(markdown, skipTrimFilename, skipParseMetadata, skipCode, mdPath) {

    // strip spaces
    let content = markdown.trim()

    // parse metadata
    let metadata
    if (!skipParseMetadata) {
        let res = parseMetadata(content)
        content = res.content
        metadata = res.metadata
    }

    // trim filename
    let filename = ''
    if (!skipTrimFilename) {
        const ret = trimFilename(content)
        content = ret.markdown
        filename = ret.filename
    }

    // convert regular html links to open in new tab
    let html = convertContentToHtml(content, skipCode, mdPath)

    return {
        html: html,
        metadata,
        markdown,
        filename
    }
}

function trimFilename(markdown) {
    // regex: match leading FILENAME header line
    const filenamePattern = /^\s*FILENAME:\s+(.*?)\n/
    const filenameMatch = markdown.match(filenamePattern)
    let filename = ''
    if (filenameMatch) {
        markdown = markdown.slice(filenameMatch[0].length).trim()
        filename = filenameMatch[1].trim()
    }
    return {markdown, filename}
}

function parseMetadata(markdown) {
    const metadata = new Map()
    let content = markdown

    // split into lines and manually check for opening --- on first line
    const lines = markdown.split('\n')

    const firstNonEmptyIndex = lines.findIndex(line => line.trim() !== "");

    // first line must be exactly --- (trimmed)
    if (lines.length < 2 || lines[firstNonEmptyIndex].trim() !== '---') {
        return {metadata, content}
    }

    // find the closing --- line starting from line index 1
    let closingIndex = -1
    for (let i = firstNonEmptyIndex + 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
            closingIndex = i
            break
        }
    }

    // no closing --- found, return as-is
    if (closingIndex === -1) {
        return {metadata, content}
    }

    // lines between opening and closing --- are the metadata block
    const metadataLines = lines.slice(1, closingIndex)

    metadataLines.forEach((line) => {
        const separatorIndex = line.indexOf(':')
        if (separatorIndex === -1) return
        const key = line.slice(0, separatorIndex).trim()
        const value = line.slice(separatorIndex + 1).trim()
        if (key) metadata.set(key, value)
    })

    // content is everything after the closing ---
    content = lines.slice(closingIndex + 1).join('\n').trimStart()

    return {metadata, content}
}

function convertMarkdownTablesToHtml(content) {
    // regex: match markdown table blocks (header, separator, body)
    const tablePattern = /^(\|.+\|\n)(^\|[-| :]+\|\n)((?:^\|.+\|\n?)*)/gm

    return content.replace(tablePattern, (_, headerRow, separatorRow, bodyRows) => {
        const parseColumns = (row) =>
            // regex: trim leading and trailing pipe
            row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())

        const alignments = parseColumns(separatorRow).map((cell) => {
            // regex: detect center alignment
            if (/^:-+:$/.test(cell)) return 'center'
            // regex: detect right alignment
            if (/^-+:$/.test(cell)) return 'right'
            // regex: detect left alignment
            if (/^:-+$/.test(cell)) return 'left'
            return ''
        })

        const isNoWrapCell = (cell) => cell.length < 20

        const buildStyleAttr = (cell, i) => {
            const styles = []
            if (alignments[i]) styles.push(`text-align:${alignments[i]}`)
            if (isNoWrapCell(cell)) styles.push('white-space:nowrap')
            return styles.length ? ` style="${styles.join(';')}"` : ''
        }

        const headerCells = parseColumns(headerRow)
            .map((cell, i) => {
                const styleAttr = buildStyleAttr(cell, i)
                return `<th${styleAttr}>${cell}</th>`
            })
            .join('')

        const bodyHtml = bodyRows
            .trim()
            .split('\n')
            .filter((row) => row.trim())
            .map((row) => {
                const cells = parseColumns(row)
                    .map((cell, i) => {
                        const styleAttr = buildStyleAttr(cell, i)
                        return `<td${styleAttr}>${cell}</td>`
                    })
                    .join('')
                return `<tr>${cells}</tr>`
            })
            .join('')

        return `<table class="content-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyHtml}</tbody></table>\n`
    })
}

// map of obsidian-style callout types to emoji icons
const CALLOUT_ICONS = {
    tip: '💡',
    note: 'ℹ️',
    info: 'ℹ️',
    warning: '⚠️',
    caution: '⚠️',
    danger: '🔥',
    error: '❌',
    success: '✅',
    check: '✅',
    done: '✅',
    question: '❓',
    help: '❓',
    faq: '❓',
    important: '❗',
    bug: '🐛',
    example: '📋',
    quote: '💬',
    cite: '💬',
    abstract: '📝',
    summary: '📝',
    tldr: '📝',
    todo: '☑️',
    failure: '❌',
    fail: '❌',
    missing: '❌',
}

// Changed convertCallouts to manual line-by-line parsing to replace regex-based approach
// Callout html snippets are stored as placeholders to prevent convertContentToHtml from processing them
function convertCallouts(content, calloutBlocks) {
    const lines = content.split('\n')
    const resultLines = []
    let i = 0
    while (i < lines.length) {
        const line = lines[i]
        // Check if this line starts a callout: > [!type] optional title
        const calloutMatch = line.match(/^>\s*\[!(\w+)\](.*)$/)
        if (calloutMatch) {
            const typeOriginal = calloutMatch[1]
            const type = typeOriginal.toLowerCase()
            const icon = CALLOUT_ICONS[type] || '📌'
            const titleRest = calloutMatch[2].trim()
            const title = titleRest || typeOriginal.charAt(0).toUpperCase() + typeOriginal.slice(1)
            // Collect body lines that start with "> " (as required by original pattern)
            const bodyLines = []
            i++ // move past the opening line
            while (i < lines.length) {
                const bodyLine = lines[i]
                if (bodyLine.match(/^\s*$/)) {
                    i++
                    continue
                }
                // Only lines that start with "> " (including the space) are part of callout body
                if (bodyLine.startsWith('>')) {
                    // Strip leading "> " and one optional space (already consumed by startsWith)
                    const stripped = bodyLine.slice(1).trim()
                    bodyLines.push(stripped)
                    i++
                } else if (bodyLine === '>') {
                    // Original pattern did not match ">" alone, so we break here for consistency
                    break
                } else {
                    // End of callout body
                    break
                }
            }
            const bodyText = bodyLines.join('\n').trim()
            // Build callout html and store as placeholder to avoid re-processing by convertContentToHtml
            const html = `<div class="callout callout-${type}"><div class="callout-title"><span class="callout-icon">${icon}</span>${title}</div><div class="callout-body">${convertContentToHtml(bodyText)}</div></div>`
            const placeholder = `@@CALLOUTBLOCK${calloutBlocks.length}@@`
            calloutBlocks.push(html)
            resultLines.push(placeholder)
            // i is now positioned after the last consumed body line (or at the break line)
        } else {
            resultLines.push(line)
            i++
        }
    }
    return resultLines.join('\n')
}

function convertContentToHtml(content, skipCode, mdPath) {

    let codeBlocks = []
    let inlineCodeBlocks = []
    let chartBlocks = []
    // callout blocks stored here to prevent their html from being re-processed
    let calloutBlocks = []
    if (!skipCode) {
        // regex: match fenced code blocks and HTML <pre><code> blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```|<pre><code[\s\S]*?<\/code><\/pre>/g, (match, lang, code) => {
            let htmlBlock = match
            if (match.startsWith('```')) {
                const langAttr = lang ? ` class="language-${lang}"` : ''
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

    content = content.replace(/<!--\s*CHART\s*-->([\s\S]*?)<!--\s*CHART\s*-->/g, (match, chartHtml) => {
        const placeholder = `@@CHARTBLOCK${chartBlocks.length}@@`
        chartBlocks.push(chartHtml)
        return placeholder
    })

    content = convertHtmlLinksToNewTab(content)
    content = escapeRawHtmlTags(content)
    // pass calloutBlocks array so generated html snippets are stored as placeholders
    content = convertCallouts(content, calloutBlocks)
    content = convertMarkdownTablesToHtml(content)
    content = convertNonCodeMarkdownToHtml(content, mdPath)
    if (!skipCode) {
        content = restoreCodeBlocks(content, codeBlocks)
        content = restoreInlineCodeBlocks(content, inlineCodeBlocks)
    }
    content = restoreChartBlocks(content, chartBlocks)
    // restore callout html snippets after all other processing is done
    content = restoreCalloutBlocks(content, calloutBlocks)

    return content
}

function escapeRawHtmlTags(content) {
    return content.replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => {
        // preserve callout divs and spans generated by convertCallouts, and anchor tags
        if (/^<\/?a(\s|>)/.test(tag)) return tag
        return tag
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
    })
}

// regex: match bare https:// URLs not already inside an href attribute, not preceded by ]( (markdown link syntax), and wrap them in an anchor tag with target="_blank"
function convertHtmlLinksToNewTab(html) {
    // regex: match https:// URLs that are not preceded by href=" or href=' to avoid double-wrapping existing links
    // and not preceded by ]( to avoid matching URLs inside markdown links e.g. [text](https://...)
    return html.replace(/(?<!href=["'])(?<!\]\()https:\/\/[^\s<>"']+/g, (url) => {
        return `<a href="${url}" target="_blank">${url}</a>`
    })
}

function convertNonCodeMarkdownToHtml(content, mdPath) {
    if (mdPath) {
        if (mdPath.endsWith('.md')) {
            mdPath = getMarkdownBasePath(mdPath)
        }
        const rand = Math.random() * 99999
        // regex: pngs
        content = content.replace(/!\[([^\]]*)\]\(([^)]+png)\)/g, (_, alt, src) => `<img class="md" alt="${alt}" src="${Config.API_URL}/image/${mdPath}/${src}?${rand}">`)
    }
    // regex: markdown links
    content = content.replace(/\[([^\]]+)\]\(([^)]+md)\)/g, '<a target="_blank" title="$2" class="md" href="$2">$1</a>')

    content = content
        // strip empty line block quotes
        .replace(/^\s*>\s*$/gm, '')
        // regex: h6 heading
        .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
        // regex: h5 heading
        .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
        // regex: h4 heading
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        // regex: h3 heading
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        // regex: h2 heading
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        // regex: h1 heading
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // regex: bold+italic (***text***)
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        // regex: bold (**text**)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // regex: italic (*text*)
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // regex: bold+italic (___text___)
        .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
        // regex: bold (__text__)
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // regex: italic (_text_)
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // regex: strikethrough (~~text~~)
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        // regex: chart links ([[text]])
        .replace(/\[\[\s*(chart:[\s\S]+?)\]\]/g, '<span class="chart-link">$1</span>')
        // regex: prompt links ([[text]])
        .replace(/\[\[([\s\S]+?)\]\]/g, '<span class="prompt-link">$1</span>')
        // regex: unordered list items
        .replace(/^\s*[-*+] (.+)$/gm, '<li>$1</li>')
        // regex: wrap consecutive <li> into <ul>
        .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
        // regex: ordered list items
        .replace(/^\s*(\d+)\. (.+)$/gm, (_, num, text) => `<li value="${num}">${text}</li>`)
        // regex: wrap consecutive <li value="n"> into <ol>
        .replace(/(<li value="\d+">[^]*?<\/li>\n?)+/g, (match) => `<ol>${match}</ol>`)
        // regex: blockquote
        .replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>')
        // regex: horizontal rule
        .replace(/^---$/gm, '<hr>')
        // regex: links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a target="_blank" href="$2">$1</a>')
        // regex: paragraph breaks
        .replace(/\n\n+/g, '</p><p>')
        // regex: trim plain lines that are not HTML tags
        .replace(/^(?!<[a-z])(.+)$/gm, (line) => line.trim() ? line : '')

    return content
}

function restoreCodeBlocks(html, codeBlocks) {
    return codeBlocks.reduce((acc, block, index) => {
        // regex: match code block placeholder for given index, tolerating surrounding whitespace and line breaks introduced by markdown processing
        const placeholderPattern = new RegExp(`\\s*@@CODEBLOCK${index}@@\\s*`, 'g')
        return acc.replace(placeholderPattern, block)
    }, html)
}

function restoreInlineCodeBlocks(html, inlineCodeBlocks) {
    return inlineCodeBlocks.reduce((acc, block, index) => {
        // regex: match inline code placeholder for given index, tolerating surrounding whitespace and line breaks
        const placeholderPattern = new RegExp(`\\s*@@INLINECODEPROTECT${index}@@\\s*`, 'g')
        return acc.replace(placeholderPattern, block)
    }, html)
}

function restoreChartBlocks(html, chartBlocks) {
    return chartBlocks.reduce((acc, block, index) => {
        // regex: match chart block placeholder for given index, tolerating surrounding whitespace and line breaks introduced by markdown processing
        const placeholderPattern = new RegExp(`\\s*@@CHARTBLOCK${index}@@\\s*`, 'g')
        return acc.replace(placeholderPattern, `<p class="chart">${block}</p>`)
    }, html)
}

function restoreCalloutBlocks(html, calloutBlocks) {
    return calloutBlocks.reduce((acc, block, index) => {
        // regex: match callout block placeholder for given index, tolerating surrounding whitespace and line breaks
        const placeholderPattern = new RegExp(`\\s*@@CALLOUTBLOCK${index}@@\\s*`, 'g')
        return acc.replace(placeholderPattern, block)
    }, html)
}

function escapeHtml(text) {
    return text
        // regex: escape &
        .replace(/&/g, '&amp;')
        // regex: escape <
        .replace(/</g, '&lt;')
        // regex: escape >
        .replace(/>/g, '&gt;')
        // regex: escape "
        .replace(/"/g, '&quot;')
        // regex: escape '
        .replace(/'/g, '&#039;')
}

function getMarkdownBasePath(mdPath) {
    if (!mdPath) return ''
    const lastSlash = mdPath.lastIndexOf('/')
    return mdPath.slice(0, lastSlash)
}
