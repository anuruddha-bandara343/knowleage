import { useState } from 'react';
import { SERVER_URL } from '../services/api';

const PDFPreview = ({ fileUrl }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // If no file, don't render
    if (!fileUrl) return null;

    // Check extension
    const ext = fileUrl.split('.').pop()?.toLowerCase();

    // Construct full URL
    const fullUrl = fileUrl.startsWith('/') ? `${SERVER_URL}${fileUrl}` : fileUrl;

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    // Modal Content
    const Modal = ({ children }) => (
        <div className="preview-modal-overlay" onClick={toggleFullscreen}>
            <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
                <button className="preview-close-btn" onClick={toggleFullscreen}>×</button>
                {children}
            </div>
        </div>
    );

    // For PDFs
    if (ext === 'pdf') {
        return (
            <>
                <div className="pdf-preview">
                    <iframe
                        src={`${fullUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        title="Document Preview"
                        width="100%"
                        height="500px"
                        style={{ border: 'none', borderRadius: 'var(--radius)' }}
                    >
                    </iframe>
                    <div className="preview-overlay">
                        <button className="btn-expand" onClick={toggleFullscreen}>
                            ⤢ Expand to Read
                        </button>
                    </div>
                </div>

                {isFullscreen && (
                    <Modal>
                        <iframe
                            src={`${fullUrl}#toolbar=1&view=FitH`}
                            title="Full Document"
                            width="100%"
                            height="100%"
                            style={{ border: 'none', height: '90vh' }}
                        >
                        </iframe>
                    </Modal>
                )}
            </>
        );
    }

    // Fallback for non-PDFs (images)
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        return (
            <>
                <div className="image-preview" onClick={toggleFullscreen} style={{ cursor: 'zoom-in' }}>
                    <img src={fullUrl} alt="Preview" style={{ maxWidth: '100%', borderRadius: 'var(--radius)' }} />
                </div>

                {isFullscreen && (
                    <Modal>
                        <img src={fullUrl} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} />
                    </Modal>
                )}
            </>
        );
    }

    return (
        <div className="no-preview">
            <p>Preview not available for this file type.</p>
        </div>
    );
};

export default PDFPreview;
