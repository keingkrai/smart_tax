'use client';

import { useState, useCallback } from 'react';

export default function FileUpload({ onFileSelect, onProcess, uploading, file, previewUrl }) {
  const acceptTypes = 'application/pdf,image/png,image/jpeg,image/jpg,image/gif';
  const employee = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('token')) : null;

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e) => {
    prevent(e);
    const selectedFile = e.dataTransfer.files?.[0] ?? null;
    onFileSelect(selectedFile);
  }, [onFileSelect]);

  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0] ?? null;
    onFileSelect(selectedFile);
  };

  const humanFile = file ? `${file.name} • ${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'No file selected';
  console.log(employee)

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border border-gray-100">
      <div className='flex justify-between'>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome {employee?.name}</h1>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Upload Your Document</h2>
      </div>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          onDragOver={prevent}
          onDragEnter={prevent}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <svg className="w-10 h-10 mb-4 text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">PDF, PNG, JPG, GIF (MAX. 15MB)</p>
            <p className="mt-3 text-sm text-gray-500 font-medium">{humanFile}</p>
            {previewUrl && (
              <div className="mt-4">
                <img src={previewUrl} alt="preview" className="h-28 w-auto rounded-lg border-2 border-white shadow-md" />
              </div>
            )}
          </div>
          <input id="dropzone-file" type="file" accept={acceptTypes} className="hidden" onChange={handleInputChange} />
        </label>
      </div>

      <div className="flex gap-4 justify-end mt-6">
        <button
          onClick={onProcess}
          disabled={!file || uploading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {uploading ? 'Processing...' : 'Process Document'}
        </button>
      </div>
    </div>
  );
}
