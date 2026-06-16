import * as Ui from "./ui.js"
import * as Handlers from "./handlers.js"
import MessageHistory from "./history.js"
import {handleMessageScroll} from "./handlers.js"

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
        } else if (isArrowUp(keyPressed)) {
            event.preventDefault()
            const previous = MessageHistory.navigateToPrevious()
            if (previous !== null) {
                Ui.messageTextarea.value = previous
            }
        } else if (isArrowDown(keyPressed)) {
            event.preventDefault()
            const next = MessageHistory.navigateToNext()
            Ui.messageTextarea.value = next !== null ? next : ''
        }
    });

    document.addEventListener('keyup', event => {
        keyPressed.delete(event.code)
    })
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
