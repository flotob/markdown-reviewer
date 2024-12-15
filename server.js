const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.text({ type: 'text/markdown' }));

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
    
    console.log('Found documents:', documents);
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

// Endpoint to save document content with comments
app.put('/api/documents/:filename(*)', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'working-docs', filename);
    const newContent = req.body;

    // Validate the content has proper comment format
    const commentRegex = /<!--comment\nauthor: .*\ndate: .*\nid: .*\n[\s\S]*?-->/g;
    const invalidComments = newContent.match(/<!--(?!comment\n)[\s\S]*?-->/g);
    
    if (invalidComments) {
      throw new Error('Invalid comment format detected');
    }

    await fs.writeFile(filePath, newContent, 'utf-8');
    res.status(200).json({ message: 'Document saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save document' });
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