import React, { useEffect, useState, useRef } from 'react';
import useDemoVideoStore from '../store/demoVideoStore';
import { Trash2, Upload, Play, X, Film } from 'lucide-react';

const ProfileDemoVideos = () => {
  const { 
    videos, 
    fetchVideos, 
    addVideo, 
    removeVideo, 
    isLoading, 
    isUploading, 
    uploadProgress, 
    error,
    resetError
  } = useDemoVideoStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleUpload(file);
  };

  const handleUpload = async (file) => {
    // Basic validation
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB');
      return;
    }

    try {
      await addVideo(file, file.name);
    } catch (err) {
      // Error is handled in store
    }
  };

  const handleDelete = async (publicId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      await removeVideo(publicId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Film className="w-5 h-5 text-indigo-600" />
          Demo Videos
        </h2>
        <span className="text-sm text-gray-500">{videos.length} videos</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={resetError}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {videos.map((video) => (
          <div key={video.publicId} className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 aspect-video">
            <video 
              src={video.url} 
              className="w-full h-full object-cover"
              controls={false}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <a 
                href={video.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
              >
                <Play className="w-6 h-6 text-white fill-current" />
              </a>
              
              <button
                onClick={() => handleDelete(video.publicId)}
                className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
                title="Delete video"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-xs truncate">{video.title}</p>
            </div>
          </div>
        ))}

        {/* Upload Card */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer transition-colors
            ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
            ${isUploading ? 'pointer-events-none opacity-75' : ''}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            className="hidden"
          />
          
          {isUploading ? (
            <div className="w-full px-6 text-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-indigo-50 rounded-full mb-2">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Add Video</p>
              <p className="text-xs text-gray-500 mt-1">MP4, WebM up to 100MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDemoVideos;
