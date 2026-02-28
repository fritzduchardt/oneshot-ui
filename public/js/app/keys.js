import * as Ui from "./ui.js"
import * as Handlers from "./handlers.js"
import MessageHistory from "./history.js    "

export function registerMessageKeyListener() {
    const keyPressed = new Set()
    document.addEventListener('keydown', event => {
        keyPressed.add(event.code)
        event.preventDefault()
        if (keyPressed.has('Enter') && keyPressed.has('ControlLeft') && document.activeElement ==  Ui.messageTextarea) {
            Handlers.handleSendButtonClick(true)
                .catch(err => console.error('Failed to send message', err))
        } else if (keyPressed.has('Enter') && document.activeElement ==  Ui.messageTextarea) {
            Handlers.handleSendButtonClick(false)
                .catch(err => console.error('Failed to send message', err))
        }
    });

    document.addEventListener('keyup', event => {
        keyPressed.delete(event.code)
    })
}

export function registerHistoryKeyListener() {
    document.addEventListener('keydown', event => {
        if (document.activeElement !== Ui.messageTextarea) return

        if (event.code === 'ArrowUp') {
            event.preventDefault()
            const previous = MessageHistory.navigateToPrevious()
            if (previous !== null) {
                Ui.messageTextarea.value = previous
            }
        } else if (event.code === 'ArrowDown') {
            event.preventDefault()
            const next = MessageHistory.navigateToNext()
            Ui.messageTextarea.value = next !== null ? next : ''
        }
    })
}
