import { useEffect, useState } from 'react';
import { SERVER_URL } from '../services/api';

const PDFViewer = ({ fileUrl, fileName, onClose, docId, docStatus, isReviewer, onApprove, onReject }) => {
    const [zoom, setZoom] = useState(100);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 200));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 50));
    };

    const handleReset = () => {
        setZoom(100);
    };

    // Construct full URL for local files
    const fullUrl = fileUrl.startsWith('/uploads/')
        ? `${SERVER_URL}${fileUrl}`
        : fileUrl;

    return (
        <div className="pdf-viewer-overlay" onClick={onClose}>
            <div className="pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="pdf-viewer-header">
                    <div className="pdf-viewer-title">
                        <span className="pdf-icon">📄</span>
                        <span>{fileName || 'Document Preview'}</span>
                        {isReviewer && docStatus === 'Pending' && (
                            <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                                <button
                                    onClick={() => { onApprove(docId); onClose(); }}
                                    style={{
                                        background: '#10b981', color: 'white', border: 'none',
                                        padding: '5px 10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    ✓ Approve
                                </button>
                                <button
                                    onClick={() => { onReject(docId); onClose(); }}
                                    style={{
                                        background: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e',
                                        padding: '5px 10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    ✕ Reject
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="pdf-viewer-controls">
                        <button
                            className="zoom-btn"
                            onClick={handleZoomOut}
                            disabled={zoom <= 50}
                            title="Zoom Out"
                        >
                            ➖
                        </button>
                        <span className="zoom-level">{zoom}%</span>
                        <button
                            className="zoom-btn"
                            onClick={handleZoomIn}
                            disabled={zoom >= 200}
                            title="Zoom In"
                        >
                            ➕
                        </button>
                        <button
                            className="zoom-btn"
                            onClick={handleReset}
                            title="Reset Zoom"
                        >
                            🔄
                        </button>
                        <a
                            href={fullUrl}
                            download
                            className="download-btn"
                            title="Download"
                        >
                            ⬇️
                        </a>
                        <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="new-tab-btn"
                            title="Open in New Tab"
                        >
                            🔗
                        </a>
                        <button className="close-btn" onClick={onClose} title="Close">
                            ✕
                        </button>
                    </div>
                </div>

                {/* PDF Content */}
                <div className="pdf-viewer-content">
                    <div
                        className="pdf-container"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        {fileUrl.toLowerCase().endsWith('.pdf') ? (
                            <iframe
                                src={`${fullUrl}#toolbar=0&navpanes=0`}
                                className="pdf-iframe"
                                title="PDF Preview"
                            />
                        ) : (
                            <img
                                src={fullUrl}
                                alt={fileName || 'Document'}
                                className="pdf-image"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFViewer;
