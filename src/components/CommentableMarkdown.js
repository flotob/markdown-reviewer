import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';

// Simple comment button that appears on hover
function CommentButton({ hasComments, commentsCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-8 h-8 rounded-full flex items-center justify-center
        transition-all duration-200 shadow-sm
        ${hasComments 
          ? 'bg-law-secondary text-white hover:bg-law-primary' 
          : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800'}
      `}
    >
      {hasComments ? (
        <span className="text-sm font-medium">{commentsCount}</span>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
    </button>
  );
}

// Wrapper for paragraphs and headings that adds hover effect and comment button
function CommentableBlock({ children, comments = [], onCommentClick }) {
  return (
    <div className="group relative -ml-4 pl-4 border-l-2 border-transparent hover:border-law-secondary/20 transition-all duration-200">
      <div className="transition-colors duration-200 hover:bg-law-paper/10">
        {children}
      </div>
      
      {/* Comment button container */}
      <div className="absolute -right-12 top-1/2 -translate-y-1/2
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <CommentButton
          hasComments={comments.length > 0}
          commentsCount={comments.length}
          onClick={onCommentClick}
        />
      </div>
    </div>
  );
}

// Comment input overlay
function CommentOverlay({ top, onSubmit, onCancel }) {
  const [comment, setComment] = useState('');
  
  return (
    <div 
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all"
        style={{ marginTop: `${top}px` }}
      >
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-serif text-law-primary">Add Comment</h3>
        </div>
        <div className="p-4">
          <textarea
            className="w-full h-32 p-3 border border-gray-200 rounded-md 
                       focus:ring-2 focus:ring-law-accent focus:border-transparent
                       resize-none"
            placeholder="Write your comment here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            autoFocus
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-law-primary text-white rounded-md 
                       hover:bg-law-secondary transition-colors"
            onClick={() => onSubmit(comment)}
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual comment in the comments panel
function Comment({ author, date, content }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex items-center mb-2">
        <span className="font-medium text-law-primary">{author}</span>
        <span className="mx-2 text-gray-300">•</span>
        <span className="text-sm text-gray-500">
          {new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
    </div>
  );
}

// Sliding comments panel
function CommentsPanel({ comments, onClose }) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-law-paper border-l border-gray-200 
                    shadow-lg transform transition-transform duration-200 ease-in-out z-40">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-serif text-law-primary">
            Comments ({comments.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {comments.map((comment) => (
            <Comment key={comment.id} {...comment} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommentableMarkdown({ content, onSave }) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);
  
  // Parse comments from markdown content
  const parseComments = (text) => {
    const commentRegex = /<!--comment\nauthor: (.*)\ndate: (.*)\nid: (.*)\n([\s\S]*?)-->/g;
    const comments = [];
    let match;
    
    while ((match = commentRegex.exec(text)) !== null) {
      comments.push({
        author: match[1],
        date: match[2],
        id: match[3],
        content: match[4].trim()
      });
    }
    
    return comments;
  };

  // Add a new comment to the markdown content
  const addComment = (text) => {
    if (!text.trim()) return;
    
    const comment = {
      author: 'You',
      date: new Date().toISOString(),
      id: uuidv4(),
      content: text.trim()
    };

    const commentMd = `\n<!--comment\nauthor: ${comment.author}\ndate: ${comment.date}\nid: ${comment.id}\n${comment.content}\n-->`;
    onSave(content + commentMd);
    setShowCommentInput(false);
  };

  // Handle clicking on a paragraph or heading
  const handleBlockClick = (e) => {
    const block = e.target.closest('p, h1, h2, h3, h4, h5, h6');
    if (!block) return;

    const rect = block.getBoundingClientRect();
    setCommentTarget({
      element: block,
      top: rect.top + window.scrollY
    });
    setShowCommentInput(true);
  };

  return (
    <div className="relative">
      <div 
        className="prose prose-lg max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8"
        onClick={handleBlockClick}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, children }) => {
              const comments = parseComments(node.children?.[0]?.value || '');
              return (
                <CommentableBlock
                  comments={comments}
                  onCommentClick={() => {
                    setSelectedComments(comments);
                    setShowCommentsPanel(true);
                  }}
                >
                  <p>{children}</p>
                </CommentableBlock>
              );
            },
            h1: ({ children }) => (
              <CommentableBlock
                comments={[]}
                onCommentClick={() => {
                  setSelectedComments([]);
                  setShowCommentsPanel(true);
                }}
              >
                <h1>{children}</h1>
              </CommentableBlock>
            ),
            h2: ({ children }) => (
              <CommentableBlock
                comments={[]}
                onCommentClick={() => {
                  setSelectedComments([]);
                  setShowCommentsPanel(true);
                }}
              >
                <h2>{children}</h2>
              </CommentableBlock>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {showCommentInput && commentTarget && (
        <CommentOverlay
          top={commentTarget.top}
          onSubmit={addComment}
          onCancel={() => setShowCommentInput(false)}
        />
      )}

      {showCommentsPanel && (
        <CommentsPanel
          comments={selectedComments}
          onClose={() => setShowCommentsPanel(false)}
        />
      )}
    </div>
  );
} 