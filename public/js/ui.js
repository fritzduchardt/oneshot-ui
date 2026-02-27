const getRequiredElementById = (id) => {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Missing required element with id="${id}"`);
    }

    return element;
};

export const messageTextarea = getRequiredElementById("message");
