/**
 * TempText Backend API Integration & Service Handler
 */

const CONFIG = {
  API_BASE_URL: window.TEMPTEXT_API_BASE || 'http://localhost:8000',
  ENDPOINTS: {
    UPLOAD: '/api/upload',
    DELETE: '/api/delete',       // DELETE /api/delete/{secureToken}
    ADMIN_FILES: '/api/admin/files' // GET /api/admin/files & DELETE /api/admin/files/{fileId}
  }
};

/**
 * Perform file upload via POST /api/upload using XMLHttpRequest
 */
function uploadTextFile(file, callbacks = {}) {
  const { onProgress, onSuccess, onError } = callbacks;

  const xhr = new XMLHttpRequest();
  const targetUrl = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.UPLOAD}`;

  const formData = new FormData();
  formData.append('file', file);

  if (xhr.upload && typeof onProgress === 'function') {
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });
  }

  xhr.addEventListener('load', () => {
    let data;
    try {
      data = JSON.parse(xhr.responseText);
    } catch (e) {
      data = null;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      if (data && data.filename && (data.public_url || data.url) && data.delete_token) {
        if (typeof onSuccess === 'function') {
          onSuccess(data);
        }
      } else {
        const errorMsg = (data && (data.message || data.detail)) ? (data.message || data.detail) : 'Upload succeeded but server response was invalid.';
        if (typeof onError === 'function') onError(errorMsg);
      }
    } else {
      let errorMessage = 'An unexpected server error occurred. Please try again.';

      if (xhr.status === 413) {
        errorMessage = 'HTTP 413: File is too large. Maximum allowed file size is 10 MB.';
      } else if (xhr.status === 409) {
        errorMessage = 'A file with this name already exists. Please rename your file and try again.';
      } else if (xhr.status === 400 || xhr.status === 415) {
        errorMessage = (data && (data.message || data.detail)) ? (data.message || data.detail) : 'Invalid request. Please select a valid text file.';
      } else if (data && (data.message || data.detail)) {
        errorMessage = data.message || data.detail;
      } else if (xhr.status >= 500) {
        errorMessage = `Server error (${xhr.status}). Please try again later.`;
      }

      if (typeof onError === 'function') {
        onError(errorMessage);
      }
    }
  });

  xhr.addEventListener('error', () => {
    if (typeof onError === 'function') {
      onError('Network error: Failed to connect to the server. Please check your internet connection.');
    }
  });

  xhr.addEventListener('timeout', () => {
    if (typeof onError === 'function') {
      onError('Upload timed out. The server took too long to respond. Please try again.');
    }
  });

  xhr.open('POST', targetUrl, true);
  xhr.timeout = 60000;
  xhr.send(formData);

  return xhr;
}

/**
 * Delete file using uploader deletion token
 * DELETE /api/delete/{deleteToken}
 */
function deleteFileByToken(deleteToken, callbacks = {}) {
  const { onSuccess, onError } = callbacks;
  const targetUrl = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.DELETE}/${encodeURIComponent(deleteToken)}`;

  fetch(targetUrl, { method: 'DELETE' })
    .then(async res => ({ ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) }))
    .then(({ ok, status, data }) => {
      if (!ok) throw new Error(data.detail || data.message || `Delete failed (${status}).`);
      return data;
    })
    .then(data => {
      if (typeof onSuccess === 'function') onSuccess(data);
    })
    .catch(err => {
      if (typeof onError === 'function') onError(err.message || 'Network error: Unable to connect to server to delete file.');
    });
}

/**
 * Admin: Fetch list of all active uploaded files
 * GET /api/admin/files
 */
function fetchAdminFiles(callbacks = {}) {
  const { onSuccess, onError } = callbacks;
  const targetUrl = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.ADMIN_FILES}`;

  fetch(targetUrl)
    .then(res => res.json())
    .then(data => {
      if (typeof onSuccess === 'function') onSuccess(data);
    })
    .catch(err => {
      if (typeof onError === 'function') onError('Unable to connect to server to load files.');
    });
}

/**
 * Admin: Delete file by fileId
 * DELETE /api/admin/files/{fileId}
 */
function adminDeleteFile(fileId, callbacks = {}) {
  const { onSuccess, onError } = callbacks;
  const targetUrl = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.ADMIN_FILES}/${encodeURIComponent(fileId)}`;

  fetch(targetUrl, { method: 'DELETE' })
    .then(res => res.json().catch(() => ({ success: res.ok })))
    .then(data => {
      if (typeof onSuccess === 'function') onSuccess(data);
    })
    .catch(err => {
      if (typeof onError === 'function') onError('Network error: Failed to delete file.');
    });
}
