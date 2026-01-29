import COS from 'cos-js-sdk-v5';
import { COS_CONFIG } from '../constants';

// Initialize COS instance
const cos = new COS({
  SecretId: COS_CONFIG.SECRET_ID,
  SecretKey: COS_CONFIG.SECRET_KEY,
  Protocol: 'https:', // Force HTTPS
});

// Helper to check connectivity before main app logic
export const checkConnection = (region: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // headBucket is lightweight and checks existence + basic permissions
        cos.headBucket({
            Bucket: COS_CONFIG.BUCKET,
            Region: region
        }, (err, data) => {
            if (err) {
                 // DEBUG MODE: We attach a helper flag but KEEP the original error intact
                 const errorString = JSON.stringify(err) + (err.message || '') + (err.toString ? err.toString() : '');
                 
                 const isCorsOrNetwork = 
                    err.statusCode === 0 || 
                    errorString.includes('Network Error') || 
                    errorString.includes('CORS') || 
                    errorString.includes('AccessForbidden') ||
                    (err.error && err.error.Code === 'AccessForbidden');

                 // Attach a custom property to the error object for UI logic, 
                 // but reject with the WHOLE object so user can see it.
                 (err as any).isCorsOrNetwork = isCorsOrNetwork;
                 
                 // If status is 404, it specifically means Bucket Not Found
                 if(err.statusCode === 404) {
                     (err as any).isNotFound = true;
                 }

                 console.log("Raw COS Error (CheckConnection):", err);
                 reject(err);
            } else {
                resolve();
            }
        })
    })
}

export const uploadFileToCOS = (
  file: File, 
  fileName: string,
  region: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Clean the file name to avoid path issues
    const cleanFileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
    const key = `${COS_CONFIG.FOLDER}/${cleanFileName}`;

    cos.putObject({
      Bucket: COS_CONFIG.BUCKET,
      Region: region,
      Key: key,
      Body: file,
      onProgress: (progressData) => {
        onProgress(progressData.percent);
      },
    }, (err, data) => {
      if (err) {
        console.error('COS Upload Error Details:', err);
        
        const errorString = JSON.stringify(err) + (err.message || '') + (err.toString ? err.toString() : '');
        const isCorsOrNetwork = 
            err.statusCode === 0 || 
            errorString.includes('Network Error') || 
            errorString.includes('CORS') || 
            errorString.includes('AccessForbidden') ||
            (err.error && err.error.Code === 'AccessForbidden');

        (err as any).isCorsOrNetwork = isCorsOrNetwork;
        
        reject(err);
      } else {
        // Construct the public URL
        const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
        const url = `https://${COS_CONFIG.BUCKET}.cos.${region}.myqcloud.com/${encodedKey}`;
        resolve(url);
      }
    });
  });
};