const fs = require('fs');
const path = require('path');

async function createYargsLink() {
  try {
    const yargsDir = path.join(process.cwd(), 'node_modules', 'yargs');
    const sourcePath = path.join(yargsDir, 'index.mjs');
    const targetPath = path.join(yargsDir, 'yargs.mjs');

    // Verificar que el directorio de yargs existe
    if (!fs.existsSync(yargsDir)) {
      console.log('Yargs directory not found, skipping link creation');
      return;
    }

    // Verificar que el archivo fuente existe
    if (!fs.existsSync(sourcePath)) {
      console.log('Yargs index.mjs not found, skipping link creation');
      return;
    }

    // Eliminar el enlace existente si existe
    try {
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    } catch (e) {
      console.log('Failed to remove existing link:', e.message);
    }

    // Crear el enlace simbólico
    try {
      // En Windows, necesitamos permisos de administrador para crear enlaces simbólicos
      // así que copiamos el archivo en su lugar
      if (process.platform === 'win32') {
        fs.copyFileSync(sourcePath, targetPath);
        console.log('Created yargs.mjs copy on Windows');
      } else {
        fs.symlinkSync(sourcePath, targetPath);
        console.log('Created yargs.mjs symbolic link');
      }
    } catch (e) {
      console.log('Failed to create link:', e.message);
      // Si falla el enlace simbólico, intentamos copiar el archivo
      try {
        fs.copyFileSync(sourcePath, targetPath);
        console.log('Created yargs.mjs copy as fallback');
      } catch (e) {
        console.log('Failed to create copy:', e.message);
      }
    }
  } catch (error) {
    console.error('Error in createYargsLink:', error);
    process.exit(1);
  }
}

createYargsLink(); 