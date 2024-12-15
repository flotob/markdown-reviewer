import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';

// Simple comment button that appears on hover
function CommentButton({ hasComments, commentsCount, onClick }) {
  if (!hasComments) return null;
  
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full flex items-center justify-center
                bg-blue-500 text-white hover:bg-blue-600
                transition-all duration-200 shadow-sm"
    >
      <span className="text-sm font-medium">{commentsCount}</span>
    </button>
  );
}

// Wrapper for paragraphs and headings that adds hover effect and comment button
function CommentableBlock({ children, comments = [], onClick }) {
  const hasComments = comments.length > 0;
  
  return (
    <div className="group relative">
      {/* Apply hover styles directly to the prose element */}
      <div
        onClick={onClick}
        className={`relative -ml-4 pl-4 cursor-pointer
                   border-l-2 transition-all duration-200
                   ${hasComments 
                     ? 'border-blue-500 bg-blue-50/30' 
                     : 'border-transparent hover:border-blue-200'}
                   hover:bg-blue-50/20`}
      >
        {children}
      </div>
      
      {/* Comment button container - only visible when has comments */}
      {hasComments && (
        <div className="absolute -right-12 top-1/2 -translate-y-1/2">
          <CommentButton
            hasComments={hasComments}
            commentsCount={comments.length}
            onClick={onClick}
          />
        </div>
      )}
    </div>
  );
}

// Comment input field for the sidebar
function CommentInput({ onSubmit }) {
  const [comment, setComment] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment);
      setComment('');
    }
  };

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (comment.trim()) {
          onSubmit(comment);
          setComment('');
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [comment, onSubmit]);
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
      <textarea
        className="w-full h-24 p-3 border border-gray-200 rounded-md 
                   focus:ring-2 focus:ring-blue-400 focus:border-transparent
                   resize-none text-sm"
        placeholder="Write your comment here... (Cmd+Enter to save)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={!comment.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md 
                   hover:bg-blue-600 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Comment
        </button>
      </div>
    </form>
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
function CommentsPanel({ comments = [], title = "Comments", onAddComment }) {
  return (
    <div className="w-96 bg-law-paper border-l border-gray-200 shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-serif text-law-primary">
          {title} ({comments.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No comments yet. Click the + button to add one.
          </div>
        ) : (
          comments.map((comment) => (
            <Comment key={comment.id} {...comment} />
          ))
        )}
      </div>
      {onAddComment && <CommentInput onSubmit={onAddComment} />}
    </div>
  );
}

// Split content into sections (paragraphs and their comments)
const parseSections = (markdown) => {
  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = {
    content: [],
    comments: [],
    startLine: 0
  };
  
  let inComment = false;
  let commentBuffer = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle comment start
    if (line.startsWith('<!--comment')) {
      inComment = true;
      commentBuffer = [line];
      continue;
    }
    
    // Handle comment content
    if (inComment) {
      commentBuffer.push(line);
      if (line.includes('-->')) {
        inComment = false;
        const commentText = commentBuffer.join('\n');
        const match = commentText.match(/<!--comment\nauthor: (.*)\ndate: (.*)\nid: (.*)\n([\s\S]*?)-->/);
        
        if (match && sections.length > 0) {
          // Add comment to the most recent section
          const lastSection = sections[sections.length - 1];
          lastSection.comments.push({
            author: match[1],
            date: match[2],
            id: match[3],
            content: match[4].trim()
          });
        }
      }
      continue;
    }
    
    // Handle section content
    if (line.trim() !== '') {
      if (currentSection.content.length > 0 && 
          (line.startsWith('#') || line.startsWith('**') || line.startsWith('- '))) {
        // New section starts with heading or list item
        sections.push({ ...currentSection });
        currentSection = {
          content: [line],
          comments: [],
          startLine: i
        };
      } else {
        currentSection.content.push(line);
      }
    } else if (currentSection.content.length > 0) {
      // Empty line after content = end of section
      sections.push({ ...currentSection });
      currentSection = {
        content: [],
        comments: [],
        startLine: i + 1
      };
    }
  }
  
  // Add final section if it has content
  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }
  
  return sections;
};

export default function CommentableMarkdown({ content, onSave }) {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedComments, setSelectedComments] = useState(null);
  
  // Parse sections whenever content changes
  React.useEffect(() => {
    setSections(parseSections(content));
  }, [content]);

  // Add a new comment to the markdown content
  const addComment = async (text, sectionIndex) => {
    if (!text.trim()) return;
    
    const comment = {
      author: 'You',
      date: new Date().toISOString(),
      id: uuidv4(),
      content: text.trim()
    };

    const commentMd = `\n<!--comment\nauthor: ${comment.author}\ndate: ${comment.date}\nid: ${comment.id}\n${comment.content}\n-->`;
    
    // Find the section's end in the original content
    const section = sections[sectionIndex];
    const lines = content.split('\n');
    let endLine = section.startLine;
    
    // Find the end of this section's content
    while (endLine < lines.length && lines[endLine].trim() !== '') {
      endLine++;
    }
    
    // Insert comment after the section
    const newContent = [
      ...lines.slice(0, endLine),
      commentMd,
      ...lines.slice(endLine)
    ].join('\n');

    try {
      // Save to file first
      await onSave(newContent);
      
      // Only update UI after successful save
      const updatedSections = [...sections];
      updatedSections[sectionIndex].comments.push(comment);
      
      setSections(updatedSections);
      setSelectedComments(updatedSections[sectionIndex].comments);
    } catch (error) {
      console.error('Failed to save comment:', error);
      // TODO: Show error message to user
    }
  };

  // Handle selecting a section
  const handleSelectSection = (comments, sectionIndex) => {
    setSelectedSection(sectionIndex);
    setSelectedComments(comments);
  };

  return (
    <div className="flex">
      <div className="flex-1 relative">
        <div className="prose prose-lg max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          {sections.map((section, index) => (
            <CommentableBlock
              key={index}
              comments={section.comments}
              onClick={() => handleSelectSection(section.comments, index)}
            >
              <div 
                className={`transition-all duration-300 ${
                  selectedSection === index ? 'ring-2 ring-blue-200 rounded' : ''
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content.join('\n')}
                </ReactMarkdown>
              </div>
            </CommentableBlock>
          ))}
        </div>
      </div>

      <CommentsPanel
        comments={selectedComments || []}
        title={selectedSection !== null 
          ? "Comments for Selected Section" 
          : "Select a Section to View Comments"}
        onAddComment={selectedSection !== null 
          ? (text) => addComment(text, selectedSection)
          : null}
      />
    </div>
  );
} 