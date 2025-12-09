class MessagesManager {
    constructor() {
        this.messages = [];
        this.selectedMessage = null;
        this.init();
    }

    async init() {
        await this.loadMessages();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // New message form
        const newMessageForm = document.getElementById('new-message-form');
        if (newMessageForm) {
            newMessageForm.addEventListener('submit', (e) => this.handleNewMessage(e));
        }
    }

    async loadMessages() {
        try {
            const messageList = document.getElementById('message-list');
            if (messageList) {
                messageList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
            }

            const response = await fetch(`${API_BASE}/messages`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.messages = await response.json();
                this.renderMessages();
            } else if (response.status === 401) {
                this.showAuthRequired();
            } else {
                throw new Error('Failed to load messages');
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showError();
        }
    }

    renderMessages() {
        const messageList = document.getElementById('message-list');
        if (!messageList) return;

        if (this.messages.length === 0) {
            messageList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No messages yet</p>
                </div>
            `;
            return;
        }

        let messagesHTML = '';
        
        this.messages.forEach(message => {
            const messageDate = new Date(message.createdAt).toLocaleDateString();
            const messageTime = new Date(message.createdAt).toLocaleTimeString();
            const isUnread = !message.read && message.receiver._id === window.driftwearApp.currentUser._id;
            
            messagesHTML += `
                <div class="message-item ${isUnread ? 'unread' : ''}" data-id="${message._id}">
                    <div class="message-avatar">
                        ${message.sender.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="message-content">
                        <div class="message-sender">${message.sender.name}</div>
                        <div class="message-preview">${message.subject}</div>
                        <div class="message-time">${messageDate} ${messageTime}</div>
                    </div>
                </div>
            `;
        });

        messageList.innerHTML = messagesHTML;

        // Add click event listeners to message items
        document.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', () => {
                const messageId = item.dataset.id;
                this.selectMessage(messageId);
            });
        });
    }

    async selectMessage(messageId) {
        try {
            const response = await fetch(`${API_BASE}/messages/${messageId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.selectedMessage = await response.json();
                this.renderMessageDetail();
            } else {
                throw new Error('Failed to load message');
            }
        } catch (error) {
            console.error('Error loading message:', error);
            window.driftwearApp.showNotification('Failed to load message', 'error');
        }
    }

    renderMessageDetail() {
        const messageDetail = document.getElementById('message-detail');
        if (!messageDetail || !this.selectedMessage) return;

        const messageDate = new Date(this.selectedMessage.createdAt).toLocaleDateString();
        const messageTime = new Date(this.selectedMessage.createdAt).toLocaleTimeString();

        messageDetail.innerHTML = `
            <div class="message-header">
                <div class="message-subject">${this.selectedMessage.subject}</div>
                <div class="message-time">${messageDate} ${messageTime}</div>
            </div>
            <div class="message-body">
                <p><strong>From:</strong> ${this.selectedMessage.sender.name} (${this.selectedMessage.sender.email})</p>
                <p><strong>To:</strong> ${this.selectedMessage.receiver.name} (${this.selectedMessage.receiver.email})</p>
                <div style="margin-top: 20px;">
                    ${this.selectedMessage.content}
                </div>
            </div>
            <div class="message-reply">
                <h4>Reply</h4>
                <form id="reply-form">
                    <div class="form-group">
                        <textarea rows="4" placeholder="Type your reply..." style="width: 100%;"></textarea>
                    </div>
                    <button type="submit" class="btn">Send Reply</button>
                </form>
            </div>
        `;

        // Add event listener for reply form
        const replyForm = document.getElementById('reply-form');
        if (replyForm) {
            replyForm.addEventListener('submit', (e) => this.handleReply(e));
        }
    }

    async handleNewMessage(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            receiverId: 'admin', // For simplicity, we're always sending to admin
            subject: formData.get('subject'),
            content: formData.get('content')
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const response = await fetch(`${API_BASE}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                window.driftwearApp.showNotification('Message sent successfully!');
                closeNewMessageModal();
                this.loadMessages(); // Reload messages
            } else {
                window.driftwearApp.showNotification(result.error || 'Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            window.driftwearApp.showNotification('An error occurred while sending your message', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async handleReply(e) {
        e.preventDefault();
        
        const form = e.target;
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();
        
        if (!content) {
            window.driftwearApp.showNotification('Please enter a message', 'error');
            return;
        }

        const data = {
            receiverId: this.selectedMessage.sender._id,
            subject: `Re: ${this.selectedMessage.subject}`,
            content: content
        };

        try {
            const response = await fetch(`${API_BASE}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                window.driftwearApp.showNotification('Reply sent successfully!');
                textarea.value = '';
                this.loadMessages(); // Reload messages
            } else {
                window.driftwearApp.showNotification(result.error || 'Failed to send reply', 'error');
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            window.driftwearApp.showNotification('An error occurred while sending your reply', 'error');
        }
    }

    showAuthRequired() {
        const messageList = document.getElementById('message-list');
        if (messageList) {
            messageList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-lock"></i>
                    <p>Please login to view messages</p>
                    <a href="/signup.html" class="btn">Login or Sign Up</a>
                </div>
            `;
        }
    }

    showError() {
        const messageList = document.getElementById('message-list');
        if (messageList) {
            messageList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load messages. Please try again.</p>
                </div>
            `;
        }
    }
}

// Modal functions
function openNewMessageModal() {
    document.getElementById('new-message-modal').style.display = 'flex';
}

function closeNewMessageModal() {
    document.getElementById('new-message-modal').style.display = 'none';
    document.getElementById('new-message-form').reset();
}

// Initialize messages manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('message-list')) {
        window.messagesManager = new MessagesManager();
    }
});