const fs = require('fs');
const path = require('path');

try {
  const source = path.resolve(__dirname, '../node_modules/yargs/index.mjs');
  const target = path.resolve(__dirname, '../node_modules/yargs/yargs.mjs');

  // Check if target already exists
  if (fs.existsSync(target)) {
    console.log('yargs.mjs already exists, skipping link creation');
    process.exit(0);
  }

  // Create symbolic link
  fs.symlinkSync(source, target, 'file');
  console.log('Successfully created symbolic link for yargs');
} catch (error) {
  console.error('Error creating symbolic link:', error);
  // Don't fail the build if link creation fails
  process.exit(0);
} 