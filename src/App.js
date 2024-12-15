import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import CommentableMarkdown from './components/CommentableMarkdown';

// Recursive component for folders and files
function FileTreeItem({ item, level = 0 }) {
  const [isOpen, setIsOpen] = React.useState(() => {
    const stored = localStorage.getItem(`folder-${item.path}`);
    return stored === null ? true : stored === 'true';
  });

  // Save collapse state to localStorage
  React.useEffect(() => {
    if (item.type === 'folder') {
      localStorage.setItem(`folder-${item.path}`, isOpen);
    }
  }, [isOpen, item.path, item.type]);

  if (item.type === 'file') {
    return (
      <li className="pl-6">
        <Link
          to={`/document/${encodeURIComponent(item.path)}`}
          className="block py-1 px-2 hover:bg-law-paper rounded transition-colors duration-150 text-sm"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>{item.title}</span>
          </div>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <div 
        className="flex items-center py-1 px-2 hover:bg-law-paper rounded transition-colors duration-150 cursor-pointer text-sm"
        style={{ paddingLeft: `${level * 1.5}rem` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg 
          className={`w-4 h-4 text-gray-500 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-4 h-4 text-gray-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="ml-2">{item.title}</span>
      </div>
      {isOpen && (
        <ul className="space-y-1">
          {item.children.map((child, index) => (
            <FileTreeItem key={child.path} item={child} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function FileList() {
  const [documents, setDocuments] = React.useState([]);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetch('http://localhost:3001/api/documents')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
      })
      .then(data => {
        // Convert flat list to tree structure
        const tree = buildFileTree(data);
        setDocuments(tree);
      })
      .catch(error => {
        console.error('Error fetching documents:', error);
        setError(error.message);
      });
  }, []);

  if (error) {
    return (
      <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-law-primary font-serif text-xl mb-4">Documents</h2>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <h2 className="text-law-primary font-serif text-xl p-4 border-b border-gray-200">Documents</h2>
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {documents.map((item) => (
            <FileTreeItem key={item.path} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
}

// Helper function to build tree structure
function buildFileTree(files) {
  const tree = [];
  const map = new Map();

  // First pass: create all folder nodes
  files.forEach(file => {
    const parts = file.path.split('/');
    let currentPath = '';

    parts.slice(0, -1).forEach(part => {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!map.has(currentPath)) {
        const folder = {
          type: 'folder',
          title: part,
          path: currentPath,
          children: []
        };
        map.set(currentPath, folder);

        if (parentPath) {
          map.get(parentPath).children.push(folder);
        } else {
          tree.push(folder);
        }
      }
    });
  });

  // Second pass: add all files to their parent folders
  files.forEach(file => {
    const parts = file.path.split('/');
    const fileName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');
    const fileNode = {
      type: 'file',
      title: file.title || fileName,
      path: file.path
    };

    if (parentPath) {
      map.get(parentPath).children.push(fileNode);
    } else {
      tree.push(fileNode);
    }
  });

  return tree;
}

function DocumentViewer() {
  const { path } = useParams();
  const [content, setContent] = React.useState('');
  const [error, setError] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    if (!path) return;
    
    setError(null);
    fetch(`http://localhost:3001/api/documents/${decodeURIComponent(path)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Document not found');
        }
        return response.text();
      })
      .then(text => {
        setContent(text);
        // After content is loaded, scroll to hash if it exists
        if (location.hash && location.hash.startsWith('#line-')) {
          setTimeout(() => {
            const element = document.getElementById(location.hash.slice(1));
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100); // Small delay to ensure content is rendered
        }
      })
      .catch(error => {
        console.error('Error fetching document:', error);
        setError(error.message);
      });
  }, [path, location.hash]);

  const handleSave = async (newContent) => {
    if (!path) return;
    
    setSaving(true);
    try {
      console.log('Saving document:', {
        path: decodeURIComponent(path),
        contentLength: newContent.length,
        firstLine: newContent.split('\n')[0],
        contentPreview: newContent.slice(0, 500) + '...'
      });

      const response = await fetch(`http://localhost:3001/api/documents/${decodeURIComponent(path)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/markdown'
        },
        body: newContent
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.details || 'Failed to save document');
      }
      
      setContent(newContent);
    } catch (error) {
      console.error('Error saving document:', {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
      setError('Failed to save comment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="font-serif text-2xl mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 flex-1 p-8 bg-law-paper min-h-screen overflow-auto">
      {saving && (
        <div className="fixed top-4 right-4 bg-law-secondary text-white px-4 py-2 rounded-md shadow-lg z-50">
          Saving...
        </div>
      )}
      <CommentableMarkdown content={content} onSave={handleSave} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <FileList />
        <Routes>
          <Route path="/document/:path" element={<DocumentViewer />} />
          <Route path="/" element={
            <div className="ml-64 flex-1 p-8 flex items-center justify-center">
              <div className="text-center">
                <h1 className="font-serif text-3xl text-law-primary mb-4">Legal Document Viewer</h1>
                <p className="text-law-ink">Select a document from the sidebar to begin.</p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 