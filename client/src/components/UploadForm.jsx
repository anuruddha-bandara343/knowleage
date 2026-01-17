import { useState, useRef } from 'react';
import { documentAPI } from '../services/api';

const UploadForm = ({ userId, onUploadSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        domain: '',
        region: '',
        tags: '',
        fileUrl: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]); // Multiple files
    const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [duplicateWarning, setDuplicateWarning] = useState(null);
    const [badgesEarned, setBadgesEarned] = useState([]);
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setDuplicateWarning(null);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Check total files count (max 10)
            if (files.length > 10) {
                setMessage({ type: 'error', text: '⚠️ Maximum 10 files allowed' });
                return;
            }
            // Check each file size (10MB max)
            for (const file of files) {
                if (file.size > 10 * 1024 * 1024) {
                    setMessage({ type: 'error', text: `⚠️ ${file.name} is too large (max 10MB)` });
                    return;
                }
            }
            setSelectedFiles(files);
            setMessage({ type: '', text: '' });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            if (files.length > 10) {
                setMessage({ type: 'error', text: '⚠️ Maximum 10 files allowed' });
                return;
            }
            for (const file of files) {
                if (file.size > 10 * 1024 * 1024) {
                    setMessage({ type: 'error', text: `⚠️ ${file.name} is too large (max 10MB)` });
                    return;
                }
            }
            setSelectedFiles(files);
        }
    };

    const handleSubmit = async (e, confirmDuplicate = false) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        setBadgesEarned([]);

        try {
            const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
            const metadata = [];

            if (formData.region) {
                metadata.push({ key: 'Region', value: formData.region });
            }

            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('uploaderId', userId);
            submitData.append('domain', formData.domain);
            submitData.append('region', formData.region);
            submitData.append('tags', JSON.stringify(tags));
            submitData.append('metadata', JSON.stringify(metadata));
            submitData.append('confirmDuplicate', confirmDuplicate);

            if (uploadMethod === 'file' && selectedFiles.length > 0) {
                selectedFiles.forEach(file => {
                    submitData.append('files', file);
                });
            } else if (uploadMethod === 'url' && formData.fileUrl) {
                submitData.append('fileUrl', formData.fileUrl);
            }

            const response = await documentAPI.uploadWithFile(submitData);
            const { data } = response.data;

            if (data.badgesEarned?.length > 0) {
                setBadgesEarned(data.badgesEarned);
            }

            setMessage({
                type: 'success',
                text: data.isNewVersion
                    ? `✅ New version (v${data.document.versionCount}) added!`
                    : data.complianceCheck?.passed === false
                        ? '⚠️ Document flagged for compliance review'
                        : '✅ Document uploaded successfully!'
            });

            setDuplicateWarning(null);
            setFormData({
                title: '',
                description: '',
                domain: '',
                region: '',
                tags: '',
                fileUrl: ''
            });
            setSelectedFiles([]);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            if (onUploadSuccess) {
                onUploadSuccess(data);
            }

        } catch (error) {
            if (error.response?.data?.code === 'DUPLICATE_WARNING') {
                setDuplicateWarning(error.response.data.data.similarDocuments);
                setMessage({
                    type: 'warning',
                    text: '⚠️ Similar document(s) found. Review and confirm to proceed.'
                });
            } else {
                setMessage({
                    type: 'error',
                    text: error.response?.data?.message || 'Upload failed. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        const icons = {
            pdf: '📄',
            doc: '📝', docx: '📝',
            xls: '📊', xlsx: '📊',
            ppt: '📽️', pptx: '📽️',
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
            zip: '📦', rar: '📦'
        };
        return icons[ext] || '📎';
    };

    return (
        <div className="card upload-card">
            <h2 className="card-title text-white">📤 Upload Document</h2>
            <p className="form-hint">Upload knowledge content to the repository</p>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            {badgesEarned.length > 0 && (
                <div className="badges-earned">
                    <h4>🎉 New Badges Earned!</h4>
                    {badgesEarned.map((badge, idx) => (
                        <span key={idx} className="badge-item">🏆 {badge}</span>
                    ))}
                </div>
            )}

            {duplicateWarning && (
                <div className="duplicate-warning">
                    <h4>⚠️ Similar Documents Found</h4>
                    {duplicateWarning.map((doc, idx) => (
                        <div key={idx} className="duplicate-item">
                            <span>{doc.title}</span>
                            <span className="similarity">{doc.similarity} match</span>
                        </div>
                    ))}
                    <div className="duplicate-actions">
                        <button
                            onClick={(e) => handleSubmit(e, true)}
                            className="btn btn-primary btn-sm"
                        >
                            Upload as New Version
                        </button>
                        <button
                            onClick={() => setDuplicateWarning(null)}
                            className="btn btn-sm btn-outline"
                        >
                            Edit Title
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label text-white">Document Title *</label>
                    <input
                        type="text"
                        name="title"
                        className="form-input"
                        placeholder="Enter document title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label text-white">Description</label>
                    <textarea
                        name="description"
                        className="form-input form-textarea"
                        placeholder="Brief description of the document"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label text-white">Domain</label>
                        <select
                            name="domain"
                            className="form-select"
                            value={formData.domain}
                            onChange={handleChange}
                        >
                            <option value="">Select Domain</option>
                            <option value="IT">IT</option>
                            <option value="Engineering">Engineering</option>
                            <option value="HR">HR</option>
                            <option value="Finance">Finance</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Operations">Operations</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label text-white">Region</label>
                        <select
                            name="region"
                            className="form-select"
                            value={formData.region}
                            onChange={handleChange}
                        >
                            <option value="">Select Region</option>
                            <option value="Asia">Asia</option>
                            <option value="EU">EU (Europe)</option>
                            <option value="Americas">Americas</option>
                            <option value="Global">Global</option>
                        </select>
                        {formData.region === 'EU' && (
                            <small className="form-warning">⚠️ EU region may trigger GDPR compliance check</small>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label text-white">Tags</label>
                    <input
                        type="text"
                        name="tags"
                        className="form-input"
                        placeholder="Comma-separated tags (e.g., Engineering, Best Practice)"
                        value={formData.tags}
                        onChange={handleChange}
                    />
                </div>

                {/* Upload Method Toggle */}
                <div className="form-group">
                    <label className="form-label text-white">Attachment (Optional)</label>
                    <div className="upload-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${uploadMethod === 'file' ? 'active' : ''}`}
                            onClick={() => setUploadMethod('file')}
                        >
                            📁 Upload File
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${uploadMethod === 'url' ? 'active' : ''}`}
                            onClick={() => setUploadMethod('url')}
                        >
                            🔗 Enter URL
                        </button>
                    </div>
                </div>

                {uploadMethod === 'file' ? (
                    <div className="form-group">
                        <div
                            className={`file-drop-zone ${selectedFiles.length > 0 ? 'has-file' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {selectedFiles.length > 0 ? (
                                <div className="selected-files-grid">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="selected-file-item">
                                            {file.type.startsWith('image/') ? (
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="file-thumbnail"
                                                />
                                            ) : (
                                                <span className="file-icon-large">{getFileIcon(file.name)}</span>
                                            )}
                                            <span className="file-name-small">{file.name.substring(0, 15)}...</span>
                                            <button
                                                type="button"
                                                className="remove-file-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <div className="add-more-files" onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}>
                                        <span>+</span>
                                        <span>Add More</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="drop-placeholder">
                                    <span className="drop-icon">📤</span>
                                    <span>Drop files here or click to browse</span>
                                    <span className="drop-hint">PDF, Word, Excel, Images (max 10 files, 10MB each)</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
                            multiple
                            style={{ display: 'none' }}
                        />
                    </div>
                ) : (
                    <div className="form-group">
                        <input
                            type="url"
                            name="fileUrl"
                            className="form-input"
                            placeholder="https://example.com/document.pdf"
                            value={formData.fileUrl}
                            onChange={handleChange}
                        />
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={loading || duplicateWarning}
                >
                    {loading ? (
                        <>
                            <span className="spinner-small"></span>
                            Uploading...
                        </>
                    ) : (
                        '🚀 Upload Document'
                    )}
                </button>
            </form>

            {/* Spacer for mobile bottom nav */}
            <div className="d-block d-md-none" style={{ height: '100px' }}></div>
        </div>
    );
};

export default UploadForm;
