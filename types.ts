export interface UploadState {
  status: 'idle' | 'selected' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
  resultUrl?: string;
}

export interface FileData {
  originalFile: File | null;
  newName: string;
}

export interface COSCredentials {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
  folder: string;
}