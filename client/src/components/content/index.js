// Content components - re-export existing components with new organization
// These re-export from the original location for backward compatibility

export { default as UploadContent } from '../UploadForm';
export { default as ContentList } from '../Feed';
// Note: ContentDetails and MetadataForm are new components to be added

// Alias for backward compatibility
export { default as UploadForm } from '../UploadForm';
export { default as Feed } from '../Feed';
