const MessageHistory = (() => {
    const STORAGE_KEY = 'chat_message_history';
    const MAX_HISTORY_SIZE = 100;

    let currentIndex = -1;

    const loadHistory = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    };

    const saveHistory = (history) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    };

    const addMessage = (message) => {
        if (!message || !message.trim()) return;

        const history = loadHistory();

        if (history[history.length - 1] === message) return;

        history.push(message);

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
