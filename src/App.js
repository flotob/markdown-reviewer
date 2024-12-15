import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import CommentableMarkdown from './components/CommentableMarkdown';

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
        console.log('Received documents:', data);
        setDocuments(data);
      })
      .catch(error => {
        console.error('Error fetching documents:', error);
        setError(error.message);
      });
  }, []);

  if (error) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-law-primary font-serif text-xl mb-4">Documents</h2>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h2 className="text-law-primary font-serif text-xl mb-4">Documents</h2>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.path}>
            <Link
              to={`/document/${encodeURIComponent(doc.path)}`}
              className="block p-2 hover:bg-law-paper rounded transition-colors duration-150"
            >
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocumentViewer() {
  const { path } = useParams();
  const [content, setContent] = React.useState('');
  const [error, setError] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

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
      .then(text => setContent(text))
      .catch(error => {
        console.error('Error fetching document:', error);
        setError(error.message);
      });
  }, [path]);

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
    <div className="flex-1 p-8 bg-law-paper min-h-screen overflow-auto">
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
            <div className="flex-1 p-8 flex items-center justify-center">
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