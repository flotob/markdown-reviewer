const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.text({ type: 'text/markdown' }));

// Helper function to format title from filename
function formatTitle(filename) {
  return filename
    .replace('.md', '')
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to recursively find markdown files
async function findMarkdownFiles(dir, baseDir = dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const markdownFiles = [];

  for (const file of files) {
    if (file.name.startsWith('.')) continue; // Skip hidden files/folders
    
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const nestedFiles = await findMarkdownFiles(fullPath, baseDir);
      markdownFiles.push(...nestedFiles);
    } else if (file.name.endsWith('.md')) {
      // Get path relative to working-docs directory
      const relativePath = path.relative(baseDir, fullPath);
      
      // Try to read the first line of the file for a title
      let title = formatTitle(file.name);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const firstLine = content.split('\n')[0];
        if (firstLine.startsWith('# ')) {
          title = firstLine.substring(2).trim();
        }
      } catch (error) {
        console.warn(`Could not read title from ${fullPath}:`, error);
      }

      markdownFiles.push({
        path: relativePath,
        title
      });
    }
  }

  // Sort files: folders first, then alphabetically
  return markdownFiles.sort((a, b) => {
    const aIsFolder = !a.path.includes('.');
    const bIsFolder = !b.path.includes('.');
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.path.localeCompare(b.path);
  });
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

    console.log('Save request received:', {
      filename,
      filePath,
      contentLength: newContent.length,
      firstLine: newContent.split('\n')[0],
      contentPreview: newContent.slice(0, 500) + '...'
    });

    // Validate the content has proper comment format
    const validCommentRegex = /<!--comment(?::line-\d+)?[\s\n]+author:[\s\n]+.*?[\s\n]+date:[\s\n]+.*?[\s\n]+id:[\s\n]+.*?[\s\n]+[\s\S]*?-->/g;
    const invalidComments = newContent.match(/<!--(?!comment(?::line-\d+)?[\s\n]+author:)[\s\S]*?-->/g);
    
    if (invalidComments) {
      console.error('Invalid comments found:', {
        invalidComments,
        regex: validCommentRegex.toString(),
        content: newContent,
        allComments: newContent.match(/<!--[\s\S]*?-->/g)
      });
      throw new Error('Invalid comment format detected');
    }

    // Log all comments in the content
    const comments = newContent.match(validCommentRegex);
    console.log('Valid comments found:', {
      count: comments?.length || 0,
      comments,
      allComments: newContent.match(/<!--[\s\S]*?-->/g)
    });

    // Check if directory exists
    const dir = path.dirname(filePath);
    try {
      await fs.access(dir);
    } catch (e) {
      console.log('Creating directory:', dir);
      await fs.mkdir(dir, { recursive: true });
    }

    await fs.writeFile(filePath, newContent, 'utf-8');
    console.log('File saved successfully:', filePath);
    res.status(200).json({ message: 'Document saved successfully' });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      path: error.path
    });
    res.status(500).json({ error: 'Failed to save document', details: error.message });
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