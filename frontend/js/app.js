/**
 * TempText Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- State Variables ---
  let selectedFile = null;
  let currentUploadResponse = null;
  let countdownIntervalId = null;

  // --- DOM Elements ---
  const errorAlert = document.getElementById('error-alert');
  const errorMessage = document.getElementById('error-message');
  const errorCloseBtn = document.getElementById('error-close-btn');

  const uploadSection = document.getElementById('upload-section');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const dropZoneEmpty = document.getElementById('drop-zone-empty');
  const dropZoneSelected = document.getElementById('drop-zone-selected');
  const selectedFilename = document.getElementById('selected-filename');
  const selectedFilesize = document.getElementById('selected-filesize');
  const removeFileBtn = document.getElementById('remove-file-btn');
  const uploadBtn = document.getElementById('upload-btn');

  const progressSection = document.getElementById('progress-section');
  const progressPercent = document.getElementById('progress-percent');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressBarElement = document.getElementById('progress-bar-element');
  const uploadingFilename = document.getElementById('uploading-filename');

  const successSection = document.getElementById('success-section');
  const resultFilename = document.getElementById('result-filename');
  const countdownTimer = document.getElementById('countdown-timer');
  const publicUrlInput = document.getElementById('public-url-input');
  const copyUrlBtn = document.getElementById('copy-url-btn');
  const downloadFileBtn = document.getElementById('download-file-btn');
  const copyCurlBtn = document.getElementById('copy-curl-btn');
  const deleteFileBtn = document.getElementById('delete-file-btn');
  const uploadAnotherBtn = document.getElementById('upload-another-btn');

  // Confirmation Modal Elements
  const deleteModal = document.getElementById('delete-modal');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmDeleteBtn = document.getElementById('modal-confirm-delete-btn');

  // --- Error Banner Management ---
  function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.remove('hidden');
  }

  function hideError() {
    errorAlert.classList.add('hidden');
    errorMessage.textContent = '';
  }

  errorCloseBtn.addEventListener('click', hideError);

  // --- File Selection & Validation ---
  function handleFile(file) {
    hideError();

    const validation = validateSelectedFile(file);
    if (!validation.valid) {
      resetFileSelection();
      showError(validation.error);
      return;
    }

    selectedFile = file;
    selectedFilename.textContent = file.name;
    selectedFilesize.textContent = formatBytes(file.size);

    dropZoneEmpty.classList.add('hidden');
    dropZoneSelected.classList.remove('hidden');
    uploadBtn.disabled = false;
  }

  function resetFileSelection() {
    selectedFile = null;
    currentUploadResponse = null;
    fileInput.value = '';
    selectedFilename.textContent = '';
    selectedFilesize.textContent = '';

    dropZoneSelected.classList.add('hidden');
    dropZoneEmpty.classList.remove('hidden');
    uploadBtn.disabled = true;
  }

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileSelection();
    hideError();
  });

  // --- Drag and Drop Events ---
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleFile(dt.files[0]);
    }
  });

  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener('click', () => {
    if (!selectedFile) {
      fileInput.click();
    }
  });

  dropZone.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !selectedFile) {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // --- Upload Action ---
  uploadBtn.addEventListener('click', () => {
    if (!selectedFile) return;

    hideError();

    uploadSection.classList.add('hidden');
    progressSection.classList.remove('hidden');
    uploadingFilename.textContent = selectedFile.name;
    
    progressBarFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressBarElement.setAttribute('aria-valuenow', '0');

    uploadTextFile(selectedFile, {
      onProgress: (percent) => {
        progressBarFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        progressBarElement.setAttribute('aria-valuenow', percent.toString());
      },
      onSuccess: (response) => {
        showSuccessState(response);
      },
      onError: (errMessage) => {
        progressSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        showError(errMessage);
      }
    });
  });

  // --- Success State Render ---
  function showSuccessState(data) {
    currentUploadResponse = data;
    progressSection.classList.add('hidden');
    successSection.classList.remove('hidden');

    const fileName = data.filename;
    const fileUrl = data.public_url || data.url;

    resultFilename.textContent = fileName;
    publicUrlInput.value = fileUrl;

    // Timer Setup
    if (countdownIntervalId) clearInterval(countdownIntervalId);

    function updateTimer() {
      const remaining = calculateTimeRemaining(data.expires_at);
      countdownTimer.textContent = remaining.text;
      if (remaining.expired) {
        clearInterval(countdownIntervalId);
      }
    }

    updateTimer();
    countdownIntervalId = setInterval(updateTimer, 1000);
  }

  // --- Action Buttons ---
  copyUrlBtn.addEventListener('click', () => {
    copyToClipboard(publicUrlInput.value, copyUrlBtn);
  });

  downloadFileBtn.addEventListener('click', () => {
    const fileUrl = currentUploadResponse.download_url;
    const fileName = resultFilename.textContent || 'file.txt';
    downloadFileFromUrl(fileUrl, fileName);
  });

  copyCurlBtn.addEventListener('click', () => {
    const fileUrl = publicUrlInput.value;
    const curlCommand = `curl ${fileUrl}`;
    copyToClipboard(curlCommand, copyCurlBtn);
  });

  // Uploader Deletion Flow
  deleteFileBtn.addEventListener('click', () => {
    deleteModal.classList.remove('hidden');
  });

  modalCancelBtn.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
  });

  modalConfirmDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    const token = currentUploadResponse && currentUploadResponse.delete_token;
    if (!token) {
      showError('Deletion token is unavailable. This file cannot be deleted from this page.');
      return;
    }
    
    deleteFileByToken(token, {
      onSuccess: () => {
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        successSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        resetFileSelection();
        showError('File deleted successfully.');
        // Change alert styling to success temporarily
        errorAlert.classList.remove('alert-danger');
        errorAlert.classList.add('alert-success');
        setTimeout(() => {
          errorAlert.classList.remove('alert-success');
          errorAlert.classList.add('alert-danger');
          hideError();
        }, 3000);
      },
      onError: (err) => {
        showError(err || 'Failed to delete file.');
      }
    });
  });

  publicUrlInput.addEventListener('focus', () => {
    publicUrlInput.select();
  });

  uploadAnotherBtn.addEventListener('click', () => {
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    successSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    resetFileSelection();
    hideError();
  });
});
