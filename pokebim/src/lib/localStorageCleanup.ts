/**
 * Utility to clean up localStorage and remove example data
 */

export function cleanupLocalStorage() {
  // Check if we already cleaned up
  const cleanupDone = localStorage.getItem('cleanup_done');
  
  if (!cleanupDone) {
    // Clear all data from localStorage
    localStorage.removeItem('products');
    localStorage.removeItem('suppliers');
    localStorage.removeItem('prices');
    localStorage.removeItem('stock');
    
    // Set flag to prevent running this again
    localStorage.setItem('cleanup_done', 'true');
    
    console.log('localStorage cleanup completed - removed example data');
    return true;
  }
  
  return false;
} 