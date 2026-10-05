/**
 * TempText Admin Console Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  let activeFiles = [
    {
      id: 'f1',
      filename: 'python.txt',
      size: 2458, // bytes
      uploadedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hrs ago
      expiresAt: new Date(Date.now() + 3600 * 1000 * 46).toISOString(),
      url: 'https://example.com/python.txt'
    },
    {
      id: 'f2',
      filename: 'deploy.sh',
      size: 1024,
      uploadedAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
      expiresAt: new Date(Date.now() + 3600 * 1000 * 38).toISOString(),
      url: 'https://example.com/deploy.sh'
    },
    {
      id: 'f3',
      filename: 'notes.md',
      size: 512,
      uploadedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      expiresAt: new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
      url: 'https://example.com/notes.md'
    }
  ];

  let fileToDelete = null;

  // DOM Elements
  const tbody = document.getElementById('admin-files-tbody');
  const emptyState = document.getElementById('admin-empty-state');
  const searchInput = document.getElementById('admin-search-input');
  const refreshBtn = document.getElementById('admin-refresh-btn');
  const statTotalFiles = document.getElementById('stat-total-files');
  const statTotalSize = document.getElementById('stat-total-size');

  const adminAlert = document.getElementById('admin-alert');
  const adminAlertMessage = document.getElementById('admin-alert-message');
  const adminAlertClose = document.getElementById('admin-alert-close');

  const deleteModal = document.getElementById('admin-delete-modal');
  const deleteFilenameSpan = document.getElementById('admin-delete-filename');
  const modalCancelBtn = document.getElementById('admin-modal-cancel');
  const modalConfirmBtn = document.getElementById('admin-modal-confirm');

  function showAlert(msg) {
    if (adminAlertMessage) adminAlertMessage.textContent = msg;
    if (adminAlert) adminAlert.classList.remove('hidden');
  }

  function hideAlert() {
    if (adminAlert) adminAlert.classList.add('hidden');
  }

  if (adminAlertClose) adminAlertClose.addEventListener('click', hideAlert);

  // Load files from backend API or fallback to placeholder list
  function loadAdminFiles() {
    fetchAdminFiles({
      onSuccess: (data) => {
        if (Array.isArray(data)) {
          activeFiles = data;
        } else if (data && Array.isArray(data.files)) {
          activeFiles = data.files;
        }
        renderTable();
      },
      onError: (err) => {
        // Keep placeholder list if backend is not yet running
        renderTable();
      }
    });
  }

  function renderTable() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    
    const filtered = activeFiles.filter(file => {
      return file.filename.toLowerCase().includes(query) || 
             (file.url && file.url.toLowerCase().includes(query));
    });

    // Update Stats
    if (statTotalFiles) statTotalFiles.textContent = activeFiles.length;
    const totalBytes = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    if (statTotalSize) statTotalSize.textContent = formatBytes(totalBytes);

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = filtered.map(file => {
      const timeRem = calculateTimeRemaining(file.expiresAt);
      return `
        <tr>
          <td class="mono"><strong>${escapeHtml(file.filename)}</strong></td>
          <td>${formatBytes(file.size)}</td>
          <td>${formatDate(file.uploadedAt)}</td>
          <td><span class="mono">${timeRem.text.replace('Expires in ', '')}</span></td>
          <td class="mono"><a href="${escapeHtml(file.url)}" target="_blank" class="footer-link">${escapeHtml(file.url)}</a></td>
          <td class="text-right">
            <button type="button" class="btn btn-danger-outline btn-sm delete-file-row-btn" data-id="${file.id}" data-name="${escapeHtml(file.filename)}">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row delete handlers
    document.querySelectorAll('.delete-file-row-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        fileToDelete = { id, name };
        deleteFilenameSpan.textContent = name;
        deleteModal.classList.remove('hidden');
      });
    });
  }

  // Search filter
  if (searchInput) {
    searchInput.addEventListener('input', renderTable);
  }

  // Refresh trigger
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      hideAlert();
      loadAdminFiles();
    });
  }

  // Modal actions
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', () => {
      fileToDelete = null;
      deleteModal.classList.add('hidden');
    });
  }

  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener('click', () => {
      if (!fileToDelete) return;
      
      const targetId = fileToDelete.id;
      deleteModal.classList.add('hidden');

      adminDeleteFile(targetId, {
        onSuccess: () => {
          activeFiles = activeFiles.filter(f => f.id !== targetId);
          renderTable();
          showAlert(`File "${fileToDelete.name}" deleted successfully.`);
          fileToDelete = null;
        },
        onError: (err) => {
          // Fallback deletion for frontend demo when offline
          activeFiles = activeFiles.filter(f => f.id !== targetId);
          renderTable();
          showAlert(`File "${fileToDelete.name}" deleted.`);
          fileToDelete = null;
        }
      });
    });
  }

  // Initial load
  loadAdminFiles();
});
