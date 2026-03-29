import React from 'react';
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react';

export default function ChatPanel({
  messages,
  isTyping,
  input,
  setInput,
  onSubmit,
  onPromptClick,
  onClose,
  messagesRef,
  starterPrompts = [],
  title = 'LoadLink AI',
  subtitle = 'Basic driver help in seconds',
  isFloating = false,
}) {
  const hasConversation = messages.some((message) => message.sender === 'user');

  return (
    <div className={`linkai-panel${isFloating ? ' is-floating' : ''}`}>
      <div className="linkai-header">
        <div className="linkai-brand">
          <div className="linkai-avatar">
            <Bot size={18} />
          </div>
          <div>
            <div className="linkai-title-row">
              <h4>{title}</h4>
              <span className="linkai-status">Online</span>
            </div>
            <p>{subtitle}</p>
          </div>
        </div>

        {onClose && (
          <button type="button" onClick={onClose} className="linkai-close" aria-label="Close assistant">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="linkai-capability-row">
        <span className="linkai-capability-chip">Loads</span>
        <span className="linkai-capability-chip">Bookings</span>
        <span className="linkai-capability-chip">Wallet</span>
        <span className="linkai-capability-chip">KYC</span>
      </div>

      <div className="linkai-messages" ref={messagesRef}>
        {!hasConversation && starterPrompts.length > 0 && (
          <div className="linkai-starter-card">
            <div className="linkai-starter-head">
              <Sparkles size={14} />
              <span>Popular help</span>
            </div>
            <div className="linkai-starter-grid">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="linkai-starter-chip"
                  onClick={() => onPromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`linkai-message-row${message.sender === 'user' ? ' is-user' : ''}`}
          >
            <div className={`linkai-message-bubble${message.sender === 'user' ? ' is-user' : ''}`}>
              {message.text}
            </div>
            {message.sender === 'ai' && message.suggestions?.length > 0 && (
              <div className="linkai-suggestion-row">
                {message.suggestions.map((suggestion) => (
                  <button
                    key={`${message.id}-${suggestion}`}
                    type="button"
                    className="linkai-suggestion-chip"
                    onClick={() => onPromptClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="linkai-message-row">
            <div className="linkai-message-bubble">
              <span className="linkai-typing">
                <Loader2 size={14} className="animate-spin" />
                Thinking...
              </span>
            </div>
          </div>
        )}
      </div>

      <form className="linkai-composer" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Ask about loads, bookings, wallet, KYC..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="submit" aria-label="Send message">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
