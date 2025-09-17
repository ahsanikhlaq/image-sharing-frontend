import React, { useState, useRef } from 'react';

// Icon components remain the same
const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10"/>
    <polyline points="1,20 1,14 7,14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21,15 16,10 5,21"/>
  </svg>
);

function ImageUpload() {
  const [imageData, setImageData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareId, setShareId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // Dynamic base URL that works in both development and production
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  // Handle paste event for images
  const handlePaste = async (event) => {
    const clipboardItems = event.clipboardData.items;
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.indexOf("image") === 0) {
        const file = item.getAsFile();
        const imageURL = URL.createObjectURL(file);
        setImageData({ url: imageURL, file });
        setImageFile(file);
        setError('');
        break;
      }
    }
  };

  // Handle file upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    const imageURL = URL.createObjectURL(file);
    setImageData({ url: imageURL, file });
    setImageFile(file);
    setError('');
  };

  // Upload image to server and get shareable URL
  const generateShareableUrl = async () => {
    if (!imageFile) {
      setError('Please select an image first');
      return;
    }
    
    setIsUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      
      // Use relative URL in production, full URL in development
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/upload' 
        : `${BASE_URL}/api/upload`;
        
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Create shareable URL with current domain in production
        const fullShareUrl = process.env.NODE_ENV === 'production'
          ? `${window.location.origin}/share/${data.shareId}`
          : `${BASE_URL}/share/${data.shareId}`;
          
        setShareUrl(fullShareUrl);
        setShareId(data.shareId);
        
        // Update preview to use server URL to verify accessibility
        if (imageData?.url) {
          URL.revokeObjectURL(imageData.url); // Clean up local URL
        }
        setImageData({ url: fullShareUrl, file: null });
        setImageFile(null); // Clear local file after successful upload
      } else {
        setError(data.message || "Upload failed!");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Remove image (and delete from server if uploaded)
  const handleRemoveImage = async () => {
    if (imageData?.url) {
      URL.revokeObjectURL(imageData.url); // Only if local URL
    }
    
    // If already uploaded, delete from server
    if (shareId) {
      try {
        // Use relative URL in production, full URL in development
        const deleteUrl = process.env.NODE_ENV === 'production'
          ? `/api/delete/${shareId}`
          : `${BASE_URL}/api/delete/${shareId}`;
          
        await fetch(deleteUrl, {
          method: 'DELETE',
        });
        // No need to check response, assume success for simplicity
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
    
    setImageData(null);
    setImageFile(null);
    setShareUrl('');
    setShareId('');
    setError('');
    setCopied(false);
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <ShareIcon />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Image Share</h1>
          <p className="text-gray-600">Upload images and generate shareable links instantly</p>
        </div>
        
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Upload Section */}
          <div className="p-8">
            {!imageData ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
                onClick={triggerFileInput}
                onPaste={handlePaste}
                tabIndex={0}
              >
                <div className="flex flex-col items-center">
                  <div className="bg-blue-100 rounded-full p-4 mb-4">
                    <UploadIcon />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Drop, paste, or click to upload
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Support for JPG, PNG, GIF up to 5MB
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Drag & Drop</span>
                    <span>•</span>
                    <span>Ctrl+V to Paste</span>
                    <span>•</span>
                    <span>Click to Browse</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={imageData.url} 
                  alt="Uploaded preview" 
                  className="w-full max-h-96 object-contain rounded-xl shadow-lg"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={triggerFileInput}
                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                    title="Change Image"
                  >
                    <RefreshIcon />
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all"
                    title="Remove Image"
                  >
                    <XIcon />
                  </button>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {/* Generate Button */}
            {imageData && !shareUrl && (
              <div className="mt-6">
                <button
                  onClick={generateShareableUrl}
                  disabled={isUploading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshIcon className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon />
                      <span>Generate Shareable Link</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Share URL Section */}
          {shareUrl && (
            <div className="bg-gray-50 border-t px-8 py-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 flex items-center">
                  <ImageIcon className="mr-2" />
                  Shareable Link Generated
                </h3>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Ready to Share
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white border rounded-lg p-3">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="w-full text-sm text-gray-700 outline-none"
                  />
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckIcon />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Share this link with anyone to let them view your image. Links expire after 30 days.
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Secure • Private • Fast</p>
        </div>
      </div>
    </div>
  );
}

export default ImageUpload;