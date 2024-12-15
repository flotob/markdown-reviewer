import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        console.log('Received documents:', data); // Debug log
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
      <article className="prose prose-lg max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
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