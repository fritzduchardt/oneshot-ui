const getRequiredElementById = (id) => {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Missing required element with id="${id}"`);
    }

    return element;
};

export const messageTextarea = getRequiredElementById("message");
export const messagesDiv = getRequiredElementById("messages");
export const modelDropdown = getRequiredElementById("model");
export const patternDropdown = getRequiredElementById("pattern");
export const markdownDropdown = getRequiredElementById("markdown");
export const inputSection = getRequiredElementById("input-section");
export const version = getRequiredElementById("version");
export const chatButton = getRequiredElementById("chat-button");
export const toggleSound = getRequiredElementById("toggle-sound");
export const toggleInput = getRequiredElementById("toggle-input");
