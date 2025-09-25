// JavaScript for the AI News Generation System

class NewsGeneratorApp {
    constructor() {
        this.currentSessionId = null;
        this.isProcessing = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkSystemStatus();
    }

    setupEventListeners() {
        // File upload form
        const uploadForm = document.getElementById('uploadForm');
        uploadForm.addEventListener('submit', (e) => this.handleFileUpload(e));

        // File input change
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFileChange(e));

        // Regenerate button
        const regenerateBtn = document.getElementById('regenerateBtn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateContent());
        }

        // Download buttons
        const downloadAudio = document.getElementById('downloadAudio');
        const downloadTranscript = document.getElementById('downloadTranscript');
        
        if (downloadAudio) {
            downloadAudio.addEventListener('click', (e) => this.handleDownload(e, 'audio'));
        }
        
        if (downloadTranscript) {
            downloadTranscript.addEventListener('click', (e) => this.handleDownload(e, 'transcript'));
        }
    }

    async handleFileUpload(e) {
        e.preventDefault();
        
        if (this.isProcessing) {
            return;
        }

        const formData = new FormData(e.target);
        const fileInput = document.getElementById('fileInput');
        
        if (!fileInput.files[0]) {
            this.showAlert('Please select a file to upload.', 'warning');
            return;
        }

        this.isProcessing = true;
        this.showProgress(true);
        this.updateProgress(10, 'Uploading file...');

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.currentSessionId = result.session_id;
                this.updateProgress(100, 'Processing complete!');
                this.displayResults(result.result);
                this.showAlert('File processed successfully!', 'success');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showAlert(`Error: ${error.message}`, 'danger');
        } finally {
            this.isProcessing = false;
            this.showProgress(false);
        }
    }

    handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            const fileName = file.name;
            
            // Update UI to show selected file
            const fileInfo = document.createElement('div');
            fileInfo.className = 'alert alert-info mt-2';
            fileInfo.innerHTML = `
                <i class="fas fa-file me-2"></i>
                <strong>Selected:</strong> ${fileName} (${fileSize} MB)
            `;
            
            // Remove previous file info
            const existingInfo = document.querySelector('.alert-info');
            if (existingInfo) {
                existingInfo.remove();
            }
            
            e.target.parentNode.appendChild(fileInfo);
        }
    }

    displayResults(result) {
        // Hide welcome message
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // Show results container
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.style.display = 'block';
        resultsContainer.classList.add('fade-in-up');

        // Display summary
        this.displaySummary(result.summary);

        // Display personas
        this.displayPersonas(result.personas);

        // Display dialogue preview
        this.displayDialoguePreview(result.dialogue);

        // Setup audio player
        this.setupAudioPlayer(result.audio_file);

        // Setup download links
        this.setupDownloadLinks(result.audio_file, result.transcript_file);

        // Display metadata
        this.displayMetadata(result.metadata);
    }

    displaySummary(summary) {
        const summaryContent = document.getElementById('summaryContent');
        summaryContent.innerHTML = `
            <div class="summary-text">
                ${summary}
            </div>
        `;
    }

    displayPersonas(personas) {
        const personasList = document.getElementById('personasList');
        personasList.innerHTML = '';

        personas.forEach(persona => {
            const personaCard = document.createElement('div');
            personaCard.className = 'persona-card';
            personaCard.innerHTML = `
                <div class="persona-name">${persona.name}</div>
                <div class="persona-type">${this.capitalizeFirst(persona.type)}</div>
                <div class="persona-expertise">${persona.expertise}</div>
            `;
            personasList.appendChild(personaCard);
        });
    }

    displayDialoguePreview(dialogue) {
        const dialoguePreview = document.getElementById('dialoguePreview');
        dialoguePreview.innerHTML = '';

        // Show first 5 turns as preview
        const previewTurns = dialogue.slice(0, 5);
        
        previewTurns.forEach((turn, index) => {
            const turnDiv = document.createElement('div');
            turnDiv.className = 'dialogue-turn';
            turnDiv.innerHTML = `
                <div class="dialogue-speaker">${turn.speaker}:</div>
                <div class="dialogue-content">${turn.content}</div>
            `;
            dialoguePreview.appendChild(turnDiv);
        });

        if (dialogue.length > 5) {
            const moreDiv = document.createElement('div');
            moreDiv.className = 'text-center mt-3';
            moreDiv.innerHTML = `
                <small class="text-muted">
                    ... and ${dialogue.length - 5} more turns
                </small>
            `;
            dialoguePreview.appendChild(moreDiv);
        }
    }

    setupAudioPlayer(audioFile) {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer && audioFile) {
            audioPlayer.src = `/download/${audioFile}`;
            audioPlayer.load();
        }
    }

    setupDownloadLinks(audioFile, transcriptFile) {
        const downloadAudio = document.getElementById('downloadAudio');
        const downloadTranscript = document.getElementById('downloadTranscript');

        if (downloadAudio && audioFile) {
            downloadAudio.href = `/download/${audioFile}`;
            downloadAudio.download = audioFile;
        }

        if (downloadTranscript && transcriptFile) {
            downloadTranscript.href = `/download/${transcriptFile}`;
            downloadTranscript.download = transcriptFile;
        }
    }

    displayMetadata(metadata) {
        // You can add metadata display here if needed
        console.log('Processing metadata:', metadata);
    }

    async regenerateContent() {
        if (!this.currentSessionId) {
            this.showAlert('No session to regenerate. Please upload a file first.', 'warning');
            return;
        }

        this.showAlert('Regeneration feature coming soon!', 'info');
    }

    handleDownload(e, type) {
        e.preventDefault();
        const link = e.target.closest('a');
        if (link && link.href) {
            // Create temporary link and click it
            const tempLink = document.createElement('a');
            tempLink.href = link.href;
            tempLink.download = link.download || '';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
        }
    }

    showProgress(show) {
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) {
            progressContainer.style.display = show ? 'block' : 'none';
        }
    }

    updateProgress(percentage, text) {
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.getElementById('progressText');

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
        }

        if (progressText) {
            progressText.textContent = text;
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert-dismissible');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of main content
        const main = document.querySelector('main');
        if (main) {
            main.insertBefore(alertDiv, main.firstChild);
        }

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    async checkSystemStatus() {
        try {
            const response = await fetch('/api/test');
            const result = await response.json();
            
            if (result.success) {
                console.log('System test passed:', result);
            } else {
                console.warn('System test failed:', result.error);
            }
        } catch (error) {
            console.error('System status check failed:', error);
        }
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewsGeneratorApp();
});

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});
