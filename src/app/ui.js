const getRequiredElementById = (id) => {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Missing required element with id="${id}"`);
    }

    return element;
};

export const chatElement = getRequiredElementById("chat");
export const messagesElement = getRequiredElementById("messages");
export const toggleButtonsElement = getRequiredElementById("toggle-buttons");
export const toggleSoundButton = getRequiredElementById("toggle-sound");
export const toggleInputButton = getRequiredElementById("toggle-input");
export const inputSectionElement = getRequiredElementById("input-section");
export const messageRowElement = getRequiredElementById("message-row");
export const messageTextarea = getRequiredElementById("message");
export const sendButton = getRequiredElementById("send-button");
export const patternSelect = getRequiredElementById("pattern");
export const modelSelect = getRequiredElementById("model");
export const markdownSelect = getRequiredElementById("markdown");