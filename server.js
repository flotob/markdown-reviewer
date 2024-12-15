const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

// Helper function to recursively find markdown files
async function findMarkdownFiles(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const markdownFiles = [];

  for (const file of files) {
    if (file.name.startsWith('.')) continue; // Skip hidden files/folders
    
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const nestedFiles = await findMarkdownFiles(fullPath);
      markdownFiles.push(...nestedFiles);
    } else if (file.name.endsWith('.md')) {
      // Get path relative to working-docs directory
      const relativePath = path.relative(path.join(__dirname, 'working-docs'), fullPath);
      markdownFiles.push({
        path: relativePath,
        title: file.name.replace('.md', '').split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      });
    }
  }
  return markdownFiles;
}

// Endpoint to list available documents
app.get('/api/documents', async (req, res) => {
  try {
    const workingDocsPath = path.join(__dirname, 'working-docs');
    const documents = await findMarkdownFiles(workingDocsPath);
    
    console.log('Found documents:', documents); // Debug log
    res.json(documents);
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// Endpoint to get document content
app.get('/api/documents/:filename(*)', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'working-docs', filename);
    const content = await fs.readFile(filePath, 'utf-8');
    res.send(content);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(404).json({ error: 'Document not found' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Working docs path: ${path.join(__dirname, 'working-docs')}`);
}); 