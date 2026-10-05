/**
 * TempText Utility Functions
 */

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Known text file extensions for frontend validation
const ALLOWED_TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'json', 'py', 'js', 'html', 'css', 'csv'
]);

/**
 * Format raw byte count into human-readable string (e.g., 2.4 KB, 8.1 MB)
 */
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Validate selected file for size (<= 10MB) and format (Text files only)
 * Returns { valid: boolean, error: string | null }
 */
function validateSelectedFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Size Check: 10 MB limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: `File size (${formatBytes(file.size)}) exceeds the 10 MB limit.` 
    };
  }

  // Type Check
  const extension = file.name.includes('.') 
    ? file.name.split('.').pop().toLowerCase() 
    : '';

  const isAllowedExt = ALLOWED_TEXT_EXTENSIONS.has(extension);

  if (!isAllowedExt) {
    return { 
      valid: false, 
      error: 'Unsupported file format. Allowed extensions: .txt, .md, .csv, .json, .py, .js, .html, .css.'
    };
  }

  return { valid: true, error: null };
}

/**
 * Copy text to clipboard and provide temporary UI button feedback
 */
async function copyToClipboard(text, buttonElement) {
  if (!text || !buttonElement) return;

  let success = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      success = true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      success = document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }

  if (success) {
    const textSpan = buttonElement.querySelector('.btn-text');
    const originalText = textSpan ? textSpan.textContent : buttonElement.textContent;

    buttonElement.classList.add('copied');
    if (textSpan) {
      textSpan.textContent = 'Copied!';
    } else {
      buttonElement.textContent = 'Copied!';
    }

    setTimeout(() => {
      buttonElement.classList.remove('copied');
      if (textSpan) {
        textSpan.textContent = originalText;
      } else {
        buttonElement.textContent = originalText;
      }
    }, 2000);
  }
}

/**
 * Trigger browser file download from a given URL
 */
function downloadFileFromUrl(url, filename = 'download.txt') {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Format duration until expiration date (e.g., "Expires in 47 hours 32 minutes" or "File expired")
 */
function calculateTimeRemaining(expiresAtIso) {
  const target = new Date(expiresAtIso).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (isNaN(target) || diff <= 0) {
    return { expired: true, text: 'File expired' };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (hours === 0 && minutes === 0) {
    parts.push(`${seconds} seconds`);
  }

  return { expired: false, text: `Expires in ${parts.join(' ')}` };
}

/**
 * Format ISO Date into readable format
 */
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Helper to safely sanitize HTML input
 */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
