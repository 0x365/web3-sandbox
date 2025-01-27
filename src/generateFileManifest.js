const fs = require('fs');
const path = require('path');

// Specify the public folder path
const PUBLIC_FOLDER = path.join(__dirname, '..', 'public/targets');
const OUTPUT_FILE = path.join(PUBLIC_FOLDER, "..", 'fileManifest.json');

// Function to check if a path has an extension (indicating a file)
const hasExtension = (filePath) => {
  return path.extname(filePath) !== '';
};

// Function to create an array of files in the directory
const listFilesInDirectory = (directory) => {
  let files = [];
  // Read all items in the current directory
  const items = fs.readdirSync(directory);

  items.forEach((item) => {
    const fullPath = path.join(directory, item);

    if (fs.lstatSync(fullPath).isDirectory()) {
      // Recursively process subdirectories
      files = files.concat(listFilesInDirectory(item));
    } else if (hasExtension(item)) {
      // Add files with extensions to the list
      files.push(item); // Add full path to the file
    }
  });

  return files;
};

// Generate the array of files
const files = listFilesInDirectory(PUBLIC_FOLDER);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(files, null, 2));

console.log(files);

