const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        // Check if response has content
        const text = await response.text();
        let data = {};

        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response:', text);
                throw new Error('Server returned invalid response');
            }
        }

        if (!response.ok) {
            throw new Error(data.error || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (error) {
        // Handle network errors (including CORS)
        if (error.message === 'Failed to fetch') {
            console.error('Network error - possible CORS issue. API_BASE:', API_BASE);
            throw new Error('Unable to connect to server. Check your connection.');
        }
        throw error;
    }
}

export const api = {
    // Auth
    login: (email, password) =>
        request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    register: (userData) =>
        request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        }),

    // User
    getProfile: () => request('/users/me'),

    updateProfile: (updates) =>
        request('/users/me', {
            method: 'PUT',
            body: JSON.stringify(updates),
        }),

    getUserProfile: (userId) => request(`/users/${userId}`),

    getUserRatings: (userId) => request(`/users/${userId}/ratings`),

    // Books
    searchBooks: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                searchParams.append(key, value);
            }
        });
        return request(`/books?${searchParams.toString()}`);
    },

    getBook: (bookId) => request(`/books/${bookId}`),

    getMyBooks: () => request('/books/user/my-listings'),

    createBook: (bookData) =>
        request('/books', {
            method: 'POST',
            body: JSON.stringify(bookData),
        }),

    updateBook: (bookId, updates) =>
        request(`/books/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        }),

    deleteBook: (bookId) =>
        request(`/books/${bookId}`, {
            method: 'DELETE',
        }),

    // Transactions
    getTransactions: (params = {}) => {
        const searchParams = new URLSearchParams(params);
        return request(`/transactions?${searchParams.toString()}`);
    },

    getTransaction: (transactionId) => request(`/transactions/${transactionId}`),

    createTransaction: (bookId) =>
        request('/transactions', {
            method: 'POST',
            body: JSON.stringify({ book_id: bookId }),
        }),

    approveTransaction: (transactionId) =>
        request(`/transactions/${transactionId}/approve`, {
            method: 'PUT',
        }),

    rejectTransaction: (transactionId, reason) =>
        request(`/transactions/${transactionId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        }),

    confirmPickup: (transactionId) =>
        request(`/transactions/${transactionId}/confirm-pickup`, {
            method: 'PUT',
        }),

    confirmReturn: (transactionId) =>
        request(`/transactions/${transactionId}/confirm-return`, {
            method: 'PUT',
        }),

    rateTransaction: (transactionId, ratingData) =>
        request(`/transactions/${transactionId}/rate`, {
            method: 'POST',
            body: JSON.stringify(ratingData),
        }),

    // Google Books API (for ISBN lookup)
    lookupISBN: async (isbn) => {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        );
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            return {
                title: book.title || '',
                author: book.authors ? book.authors.join(', ') : '',
                publisher: book.publisher || '',
                description: book.description || '',
                page_count: book.pageCount || null,
                cover_url: book.imageLinks?.thumbnail || null,
            };
        }

        return null;
    },

    // Messages
    getMessages: (transactionId) => request(`/messages/${transactionId}`),

    sendMessage: (transactionId, content, messageType = 'text') =>
        request(`/messages/${transactionId}`, {
            method: 'POST',
            body: JSON.stringify({ content, message_type: messageType }),
        }),

    // Disputes
    getDisputes: () => request('/disputes'),

    getDispute: (disputeId) => request(`/disputes/${disputeId}`),

    createDispute: (transactionId, reason, description, evidenceUrls = []) =>
        request('/disputes', {
            method: 'POST',
            body: JSON.stringify({
                transaction_id: transactionId,
                reason,
                description,
                evidence_urls: evidenceUrls,
            }),
        }),

    addDisputeEvidence: (disputeId, evidenceUrl) =>
        request(`/disputes/${disputeId}/add-evidence`, {
            method: 'PUT',
            body: JSON.stringify({ evidence_url: evidenceUrl }),
        }),

    // Notifications
    getNotifications: (limit = 20, unreadOnly = false) =>
        request(`/notifications?limit=${limit}&unread_only=${unreadOnly}`),

    markNotificationRead: (notificationId) =>
        request(`/notifications/${notificationId}/read`, {
            method: 'PUT',
        }),

    markAllNotificationsRead: () =>
        request('/notifications/read-all', {
            method: 'PUT',
        }),
};
