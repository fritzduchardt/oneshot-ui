import * as Ui from "./ui.js"
import * as Handlers from "./handlers.js"
import MessageHistory from "./history.js"

export function registerKeyListener() {
    const keyPressed = new Set()
    document.addEventListener('keydown', event => {
        keyPressed.add(event.code)
        if (document.activeElement !== Ui.messageTextarea) return
        if (isCtrlEnter(keyPressed)) {
            event.preventDefault()
            Handlers.handleSendButtonClick(true)
                .catch(err => console.error('Failed to send message', err))
        } else if (isEnterOnly(keyPressed)) {
            event.preventDefault()
            Handlers.handleSendButtonClick(false)
                .catch(err => console.error('Failed to send message', err))
        } else if (isCtrlArrowUp(keyPressed)) {
            event.preventDefault()
            Handlers.handleMessageScroll("up")
        } else if (isCtrlArrowDown(keyPressed)) {
            event.preventDefault()
            Handlers.handleMessageScroll("down")
        // Populates UI elements when reading previous/next history entry
        } else if (isArrowUp(keyPressed)) {
            event.preventDefault()
            const previous = MessageHistory.navigateToPrevious()
            if (previous !== null) {
                applyHistoryToUi(previous)
            }
        } else if (isArrowDown(keyPressed)) {
            event.preventDefault()
            const next = MessageHistory.navigateToNext()
            if (next !== null) {
                applyHistoryToUi(next)
            } else {
                Ui.messageTextarea.value = ''
            }
        }
    });

    document.addEventListener('keyup', event => {
        keyPressed.delete(event.code)
    })
}

// Writes properties from a history item to UI elements
function applyHistoryToUi(item) {
    if (!item) return
    if (typeof item === 'string') {
        Ui.messageTextarea.value = item
        return
    }
    Ui.messageTextarea.value = item.prompt || ''
    if (item.pattern !== undefined) {
        $("#pattern").val(item.pattern).trigger('change')
    }
    if (item.markdown !== undefined) {
        $("#markdown").val(item.markdown).trigger('change')
    }
    if (item.model !== undefined) {
        $("#model").val(item.model).trigger('change')
    }
}

function isCtrlEnter(keyPressed) {
    return keyPressed.has('Enter') && keyPressed.has('ControlLeft')
}

function isCtrlArrowDown(keyPressed) {
    return keyPressed.has('ArrowDown') && keyPressed.has('ControlLeft')
}

function isArrowDown(keyPressed) {
    return keyPressed.has('ArrowDown')
}

function isCtrlArrowUp(keyPressed) {
    return keyPressed.has('ArrowUp') && keyPressed.has('ControlLeft')
}

function isArrowUp(keyPressed) {
    return keyPressed.has('ArrowUp')
}

function isEnterOnly(keyPressed) {
    return keyPressed.has('Enter') && !keyPressed.has('ControlLeft') && !keyPressed.has('ShiftLeft') && !keyPressed.has('ShiftRight')
}
