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
function Comment({ author, date, content, id, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const textareaRef = React.useRef(null);

  // Focus textarea when entering edit mode
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editedContent.length, editedContent.length);
    }
  }, [isEditing, editedContent]);

  const handleSubmit = () => {
    if (editedContent.trim() && editedContent !== content) {
      onEdit(id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditedContent(content);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3 group relative">
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

      {isEditing ? (
        <div>
          <textarea
            ref={textareaRef}
            className="w-full p-2 border border-gray-200 rounded-md 
                     focus:ring-2 focus:ring-blue-400 focus:border-transparent
                     resize-none text-sm text-gray-700"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Edit your comment... (Cmd+Enter to save, Esc to cancel)"
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={() => {
                setEditedContent(content);
                setIsEditing(false);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!editedContent.trim() || editedContent === content}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md 
                       hover:bg-blue-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="text-gray-700 whitespace-pre-wrap cursor-pointer hover:bg-blue-50/40 rounded p-1 -m-1 transition-colors"
        >
          {content}
        </div>
      )}
      
      {/* Delete button */}
      <button
        onClick={() => onDelete(id)}
        className="absolute top-3 right-3 w-6 h-6 rounded-full 
                 flex items-center justify-center
                 text-gray-400 hover:text-red-500 hover:bg-red-50
                 transition-all duration-200"
        title="Delete comment"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Sliding comments panel
function CommentsPanel({ comments = [], title = "Comments", onAddComment, onDeleteComment, onEditComment }) {
  const [sortNewestFirst, setSortNewestFirst] = useState(false);
  
  // Sort comments by date
  const sortedComments = React.useMemo(() => {
    const sorted = [...comments].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortNewestFirst ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [comments, sortNewestFirst]);

  return (
    <div className="w-96 bg-law-paper border-l border-gray-200 shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif text-law-primary">
            {title} ({comments.length})
          </h3>
          {comments.length > 1 && (
            <button
              onClick={() => setSortNewestFirst(!sortNewestFirst)}
              className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 
                       hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title={sortNewestFirst ? "Show oldest first" : "Show newest first"}
            >
              <span>{sortNewestFirst ? "Newest" : "Oldest"} first</span>
              <svg 
                className={`w-4 h-4 transform transition-transform ${sortNewestFirst ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            Click anywhere in the document to add a comment.
          </div>
        ) : (
          sortedComments.map((comment) => (
            <Comment 
              key={comment.id} 
              {...comment} 
              onDelete={onDeleteComment}
              onEdit={onEditComment}
            />
          ))
        )}
      </div>
      {onAddComment && <CommentInput onSubmit={onAddComment} />}
    </div>
  );
}

// Split content into sections with line IDs
const parseSections = (markdown) => {
  const lines = markdown.split('\n');
  const lineMap = new Map(); // Map to store line -> comments associations
  const sections = [];
  let currentSection = {
    content: [],
    comments: [],
    startLine: 0,
    lineId: null
  };
  
  let inComment = false;
  let commentBuffer = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineId = `line-${i + 1}`;
    
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
        // Support both old and new comment formats
        const targetLineId = commentText.match(/<!--comment:?(line-\d+)?\n/)?.[1];
        const match = commentText.match(/<!--comment(?::line-\d+)?\nauthor: (.*)\ndate: (.*)\nid: (.*)\n([\s\S]*?)-->/);
        
        if (match) {
          const comment = {
            author: match[1],
            date: match[2],
            id: match[3],
            content: match[4].trim()
          };
          
          // If we have a line ID in the comment, use it
          if (targetLineId && lineMap.has(targetLineId)) {
            const targetSection = sections.find(s => s.lineId === targetLineId);
            if (targetSection) {
              targetSection.comments.push(comment);
            }
          } else {
            // Fallback to previous behavior for old comments
            let targetSection = null;
            for (let j = sections.length - 1; j >= 0; j--) {
              if (sections[j].content.some(l => l.trim())) {
                targetSection = sections[j];
                break;
              }
            }
            if (targetSection) {
              targetSection.comments.push(comment);
            }
          }
        }
      }
      continue;
    }
    
    // Handle section content
    if (line.trim() !== '') {
      // Start new section on headings, list items, or bold text that looks like a label
      if (currentSection.content.length > 0 && 
          (line.startsWith('#') || 
           line.startsWith('- ') || 
           line.startsWith('**') ||
           /^[A-Za-z]+:/.test(line))) {
        if (!currentSection.lineId) {
          currentSection.lineId = `line-${currentSection.startLine + 1}`;
        }
        sections.push({ ...currentSection });
        lineMap.set(lineId, sections.length);
        currentSection = {
          content: [line],
          comments: [],
          startLine: i,
          lineId
        };
      } else {
        if (!currentSection.lineId) {
          currentSection.lineId = lineId;
        }
        currentSection.content.push(line);
      }
      lineMap.set(lineId, sections.length);
    } else if (currentSection.content.length > 0) {
      if (!currentSection.lineId) {
        currentSection.lineId = `line-${currentSection.startLine + 1}`;
      }
      sections.push({ ...currentSection });
      currentSection = {
        content: [],
        comments: [],
        startLine: i + 1,
        lineId: null
      };
    }
  }
  
  // Add final section if it has content
  if (currentSection.content.length > 0) {
    if (!currentSection.lineId) {
      currentSection.lineId = `line-${currentSection.startLine + 1}`;
    }
    sections.push(currentSection);
  }
  
  return { sections, lineMap };
};

export default function CommentableMarkdown({ content, onSave }) {
  const [sections, setSections] = useState([]);
  const [lineMap, setLineMap] = useState(new Map());
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedComments, setSelectedComments] = useState(null);
  
  // Parse sections whenever content changes
  React.useEffect(() => {
    const { sections: parsedSections, lineMap: parsedLineMap } = parseSections(content);
    setSections(parsedSections);
    setLineMap(parsedLineMap);
  }, [content]);

  // Add a new comment to the markdown content
  const addComment = async (text, sectionIndex) => {
    if (!text.trim()) return;
    
    const section = sections[sectionIndex];
    const comment = {
      author: 'You',
      date: new Date().toISOString(),
      id: uuidv4(),
      content: text.trim()
    };

    const commentMd = `\n<!--comment:${section.lineId}\nauthor: ${comment.author}\ndate: ${comment.date}\nid: ${comment.id}\n${comment.content}\n-->`;
    
    // Find the section's end in the original content
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

  // Delete a comment from the markdown content
  const deleteComment = async (commentId) => {
    if (!selectedSection) return;
    
    // Find the section's content in the original markdown
    const lines = content.split('\n');
    let newLines = [];
    
    // Go through each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // If we find a comment start, check if it's the one we want to delete
      if (line.startsWith('<!--comment')) {
        const nextLines = [];
        let j = i;
        // Collect all lines of the comment
        while (j < lines.length && !lines[j].includes('-->')) {
          nextLines.push(lines[j]);
          j++;
        }
        if (j < lines.length) {
          nextLines.push(lines[j]); // Add closing -->
        }
        
        // Check if this is the comment we want to delete
        const commentText = nextLines.join('\n');
        if (commentText.includes(`id: ${commentId}`)) {
          // Skip this comment
          i = j;
          continue;
        }
      }
      
      newLines.push(line);
    }
    
    const newContent = newLines.join('\n');
    
    try {
      // Save to file first
      await onSave(newContent);
      
      // Only update UI after successful save
      const updatedSections = [...sections];
      const sectionComments = updatedSections[selectedSection].comments;
      updatedSections[selectedSection].comments = sectionComments.filter(
        comment => comment.id !== commentId
      );
      
      setSections(updatedSections);
      setSelectedComments(updatedSections[selectedSection].comments);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      // TODO: Show error message to user
    }
  };

  // Edit a comment in the markdown content
  const editComment = async (commentId, newContent) => {
    if (!selectedSection) return;
    
    // Find the section's content in the original markdown
    const lines = content.split('\n');
    let newLines = [];
    const currentSection = sections[selectedSection];
    
    // Go through each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // If we find a comment start, check if it's the one we want to edit
      if (line.startsWith('<!--comment')) {
        const nextLines = [];
        let j = i;
        // Collect all lines of the comment
        while (j < lines.length && !lines[j].includes('-->')) {
          nextLines.push(lines[j]);
          j++;
        }
        if (j < lines.length) {
          nextLines.push(lines[j]); // Add closing -->
        }
        
        // Check if this is the comment we want to edit
        const commentText = nextLines.join('\n');
        if (commentText.includes(`id: ${commentId}`)) {
          // Parse the existing comment to preserve metadata
          const match = commentText.match(/<!--comment(?::line-\d+)?\nauthor: (.*)\ndate: (.*)\nid: (.*)\n/);
          if (match) {
            const [, author, date, id] = match;
            // Reconstruct the comment with proper formatting
            const updatedComment = `<!--comment:${currentSection.lineId}\nauthor: ${author}\ndate: ${date}\nid: ${id}\n${newContent}\n-->`;
            newLines.push(updatedComment);
            i = j;
            continue;
          }
        }
      }
      
      newLines.push(line);
    }
    
    const newFileContent = newLines.join('\n');
    
    try {
      // Save to file first
      await onSave(newFileContent);
      
      // Only update UI after successful save
      const updatedSections = [...sections];
      const sectionComments = updatedSections[selectedSection].comments;
      const commentIndex = sectionComments.findIndex(c => c.id === commentId);
      if (commentIndex !== -1) {
        sectionComments[commentIndex] = {
          ...sectionComments[commentIndex],
          content: newContent
        };
      }
      
      // Update both states together to avoid race conditions
      const newComments = updatedSections[selectedSection].comments;
      setSections(updatedSections);
      setSelectedComments(newComments);
    } catch (error) {
      console.error('Failed to edit comment:', error);
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
      <div className="flex-1 relative mr-96">
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

      <div className="fixed top-0 right-0 h-screen">
        <CommentsPanel
          comments={selectedComments || []}
          title={selectedSection !== null 
            ? "Comments for Selected Section" 
            : "Select a Section to View Comments"}
          onAddComment={selectedSection !== null 
            ? (text) => addComment(text, selectedSection)
            : null}
          onDeleteComment={deleteComment}
          onEditComment={editComment}
        />
      </div>
    </div>
  );
} 