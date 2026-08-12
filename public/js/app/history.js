const MessageHistory = (() => {
    const STORAGE_KEY = 'chat_message_history';
    const MAX_HISTORY_SIZE = 100;

    let currentIndex = -1;

    // Loads history from localStorage, migrating legacy string entries to object format
    const loadHistory = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const history = stored ? JSON.parse(stored) : [];
        return history.map((item) => {
            if (typeof item === 'string') {
                return { prompt: item, pattern: '', markdown: '', model: '', type: '' };
            }
            return item;
        });
    };

    const saveHistory = (history) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    };

    // Adds an object with prompt, pattern, markdown, model and type to the history
    const addMessage = (message) => {
        if (!message || typeof message !== 'object' || !message.prompt || !message.prompt.trim()) return;

        const history = loadHistory();
        const lastItem = history[history.length - 1];

        if (lastItem && lastItem.prompt === message.prompt) return;

        history.push({
            prompt: message.prompt,
            pattern: message.pattern || '',
            markdown: message.markdown || '',
            model: message.model || '',
            type: message.type || ''
        });

        if (history.length > MAX_HISTORY_SIZE) {
            history.shift();
        }

        saveHistory(history);
        currentIndex = history.length - 1;
    };

    const navigateToPrevious = () => {
        const history = loadHistory();
        if (history.length === 0) return null;
        if (currentIndex == -1) {
            currentIndex = history.length - 2;
            return history[currentIndex] || null;
        }
        if (currentIndex > 0) {
            currentIndex--;
            return history[currentIndex] || null;
        }
    };

    const navigateToNext = () => {
        const history = loadHistory();
        if (history.length === 0) return null;
        if (currentIndex == -1) {
            return history[history.length - 1] || null;
        }
        const nextIndex = currentIndex + 1;
        if (nextIndex < history.length) {
            currentIndex = nextIndex
        }
        return history[currentIndex] || null
    };

    const clearHistory = () => {
        localStorage.removeItem(STORAGE_KEY);
        currentIndex = -1;
    };

    return {
        addMessage,
        navigateToPrevious,
        navigateToNext,
        clearHistory,
    };
})();

export default MessageHistory;