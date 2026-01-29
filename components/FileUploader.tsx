import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, Check, Copy, RefreshCw, Loader2, AlertTriangle, Bug, GitBranch, FolderOpen } from 'lucide-react';
import { UploadState, FileData } from '../types';
import { uploadFileToGitee } from '../services/giteeService';
import { GITEE_CONFIG } from '../constants';

export const FileUploader: React.FC = () => {
  const [fileData, setFileData] = useState<FileData>({ originalFile: null, newName: '' });
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [rawError, setRawError] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get current display folder
  const getCurrentFolder = () => {
      const now = new Date();
      const dateFolder = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      return GITEE_CONFIG.FOLDER ? `${GITEE_CONFIG.FOLDER}/${dateFolder}` : dateFolder;
  };

  const displayFolder = getCurrentFolder();

  const handleFileSelect = (file: File) => {
    const isTiff = file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff');
    if (!isTiff) {
        alert('请只上传 .tif 或 .tiff 格式的文件');
        return;
    }

    const nameParts = file.name.split('.');
    nameParts.pop(); 
    const nameWithoutExt = nameParts.join('.');

    setFileData({
      originalFile: file,
      newName: nameWithoutExt
    });
    setUploadState({ status: 'selected', progress: 0 });
    setRawError(null);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!fileData.originalFile) return;

    setUploadState({ status: 'uploading', progress: 0 });
    setRawError(null);

    try {
      const originalExt = fileData.originalFile.name.split('.').pop();
      const finalFileName = `${fileData.newName}.${originalExt}`;

      const url = await uploadFileToGitee(
        fileData.originalFile, 
        finalFileName, 
        (progress) => {
           setUploadState(prev => ({ ...prev, progress: progress }));
        }
      );

      setUploadState({
        status: 'success',
        progress: 100,
        resultUrl: url
      });
    } catch (error: any) {
      console.error(error);
      setRawError(error);
      
      setUploadState({
        status: 'error',
        progress: 0,
        message: error.message || '上传失败，请检查配置或文件名重复'
      });
    }
  };

  const handleReset = () => {
    setFileData({ originalFile: null, newName: '' });
    setUploadState({ status: 'idle', progress: 0 });
    setRawError(null);
  };

  const copyToClipboard = () => {
    if (uploadState.resultUrl) {
      navigator.clipboard.writeText(uploadState.resultUrl);
      alert('链接已复制到剪贴板！');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50">
                <div className="flex flex-col">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-red-600" />
                        <span>上传文件</span>
                    </h2>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <FolderOpen className="w-3 h-3" />
                        <span className="font-mono">{GITEE_CONFIG.REPO}/{displayFolder}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                     <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {GITEE_CONFIG.BRANCH}
                    </span>
                    {uploadState.status !== 'idle' && (
                        <button onClick={handleReset} className="ml-auto text-slate-400 hover:text-slate-600 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-8">
                {uploadState.status === 'idle' && (
                    <div
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all duration-300 group"
                    >
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            accept=".tif,.tiff"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        />
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-medium text-slate-700 mb-1">点击或拖拽上传 TIF 文件</p>
                        <p className="text-sm text-slate-400">支持 .tif, .tiff 格式</p>
                    </div>
                )}

                {uploadState.status === 'selected' && (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                                <FileImage className="w-8 h-8 text-red-600" />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                        重命名文件 (不含后缀)
                                    </label>
                                    <input
                                        type="text"
                                        value={fileData.newName}
                                        onChange={(e) => setFileData(prev => ({ ...prev, newName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-medium text-slate-800"
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        原始文件名: {fileData.originalFile?.name}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <FolderOpen className="w-3 h-3" />
                                        目标路径: {displayFolder}/{fileData.newName}.tif
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleReset} className="text-slate-400 hover:text-red-500 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={handleUpload}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md shadow-red-200 transition-all active:scale-[0.99]"
                        >
                            提交到 Gitee 仓库
                        </button>
                    </div>
                )}

                {uploadState.status === 'uploading' && (
                    <div className="text-center py-8">
                         <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">正在提交...</h3>
                        <p className="text-slate-500 mb-6 text-sm">正在上传至 {displayFolder}</p>
                        
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-red-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadState.progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {uploadState.status === 'success' && (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8" />
                        </div>
                        
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">上传成功!</h3>
                            <p className="text-slate-500">文件已推送到 Gitee 仓库: {displayFolder}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Gitee Raw 链接 (可用于外部引用)
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    readOnly 
                                    value={uploadState.resultUrl} 
                                    className="flex-1 bg-white border border-slate-300 text-slate-600 text-sm rounded-lg px-3 py-2 focus:outline-none"
                                />
                                <button 
                                    onClick={copyToClipboard}
                                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                    复制
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                注意: 某些情况 Gitee Raw 链接可能会直接下载文件而不是在浏览器预览。
                            </p>
                        </div>

                        <button 
                            onClick={handleReset}
                            className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline"
                        >
                            上传另一个文件
                        </button>
                    </div>
                )}

                {uploadState.status === 'error' && (
                    <div className="text-center py-6">
                         <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-red-600 mb-2">上传失败</h3>
                        <p className="text-slate-600 mb-6 bg-red-50 p-3 rounded-lg text-sm inline-block mx-auto border border-red-100">
                            {uploadState.message}
                        </p>
                        
                         {/* Debug Info Box for Upload */}
                        <div className="bg-slate-800 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto text-left max-w-lg mx-auto mb-6">
                            <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-slate-700 pb-1">
                                <Bug className="w-3 h-3" />
                                <strong>调试详细信息 (API Error)</strong>
                            </div>
                            <pre className="whitespace-pre-wrap break-all">
                                {rawError ? JSON.stringify(rawError, null, 2) : 'No error details'}
                            </pre>
                        </div>

                        <br />
                        <button 
                            onClick={() => setUploadState({ status: 'selected', progress: 0 })}
                            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
                        >
                            重试
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};