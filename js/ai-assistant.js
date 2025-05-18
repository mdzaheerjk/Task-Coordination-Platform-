document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('aiChat');
    const aiForm = document.getElementById('aiForm');

    // Typing animation
    function typeMessage(element, text, speed = 50) {
        let i = 0;
        element.innerHTML = '';
        const typing = setInterval(() => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);
            }
        }, speed);
    }

    // Message bubble animation
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${isUser ? 'user' : ''}`;
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        messageDiv.innerHTML = `
            ${!isUser ? '<div class="ai-avatar"><i class="bi bi-robot"></i></div>' : ''}
            <div class="message-content"></div>
        `;
        
        document.getElementById('aiChat').appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
            typeMessage(messageDiv.querySelector('.message-content'), text);
        }, 100);
    }

    // AI thinking animation
    function showThinking() {
        const thinking = document.createElement('div');
        thinking.className = 'ai-message thinking';
        thinking.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        document.getElementById('aiChat').appendChild(thinking);
        return thinking;
    }

    function simulateAIResponse(userMessage) {
        // Simulate AI thinking
        setTimeout(() => {
            const responses = [
                "I understand you're asking about " + userMessage + ". Let me help you with that.",
                "That's an interesting question about " + userMessage + ". Here's what I know...",
                "Based on your query about " + userMessage + ", I would suggest..."
            ];
            addMessage(responses[Math.floor(Math.random() * responses.length)]);
        }, 1000);
    }

    aiForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        const input = document.getElementById('aiInput');
        const message = input.value.trim();
        
        if (message) {
            addMessage(message, true);
            input.value = '';
            simulateAIResponse(message);
        }
    });
}); 