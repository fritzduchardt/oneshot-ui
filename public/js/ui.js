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
export const inputSection = getRequiredElementById("input-section");
