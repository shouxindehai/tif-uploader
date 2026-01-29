import { GITEE_CONFIG } from '../constants';

const BASE_URL = 'https://gitee.com/api/v5';

// Helper to convert file to Base64 (stripping the data prefix for Gitee API)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:image/tiff;base64," prefix
      const base64Content = result.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Check if we can access the repo
export const checkConnection = async (): Promise<void> => {
  const { OWNER, REPO, ACCESS_TOKEN } = GITEE_CONFIG;
  
  // API: GET /v5/repos/{owner}/{repo}
  const url = `${BASE_URL}/repos/${OWNER}/${REPO}?access_token=${ACCESS_TOKEN}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || response.statusText,
        fullError: errorData
      };
    }
  } catch (error) {
    console.error("Gitee Connection Error:", error);
    throw error;
  }
};

export const uploadFileToGitee = async (
  file: File, 
  fileName: string,
  onProgress: (progress: number) => void // Gitee API doesn't support real progress, we simulate it
): Promise<string> => {
  const { OWNER, REPO, ACCESS_TOKEN, BRANCH, FOLDER } = GITEE_CONFIG;

  // 1. Prepare Path with Date Folder (YYYYMM)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dateFolder = `${year}${month}`;

  // Path logic: FOLDER/YYYYMM/filename.tif
  const rootPart = FOLDER ? `${FOLDER}/` : '';
  const filePath = `${rootPart}${dateFolder}/${fileName}`;
  
  // Encode the path for the API call (slashes become %2F)
  const encodedFilePath = encodeURIComponent(filePath);

  // 2. Encode Content
  onProgress(20); // Simulating reading file
  const content = await fileToBase64(file);
  onProgress(50); // Simulating preparing request

  // 3. Construct API URL
  // API: POST /v5/repos/{owner}/{repo}/contents/{path}
  const url = `${BASE_URL}/repos/${OWNER}/${REPO}/contents/${encodedFilePath}`;

  const body = {
    access_token: ACCESS_TOKEN,
    content: content,
    message: `Upload ${fileName} to ${dateFolder} via Web Uploader`,
    branch: BRANCH
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify(body)
    });

    onProgress(80);

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle file already exists (422 Unprocessable Entity often means path exists)
      if (response.status === 422 && errorData.message) {
         throw new Error(`上传失败: ${errorData.message} (可能是文件名已存在)`);
      }
      
      throw new Error(`Gitee API Error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    onProgress(100);

    // 4. Construct Raw URL
    // Format: https://gitee.com/{owner}/{repo}/raw/{branch}/{path}
    // Note: Use 'raw' to get the actual file content, not the web page.
    const rawUrl = `https://gitee.com/${OWNER}/${REPO}/raw/${BRANCH}/${filePath}`;
    
    // Encode the URL properly for use in docs (spaces, chinese chars)
    return encodeURI(rawUrl);

  } catch (error: any) {
    console.error("Upload Error:", error);
    throw error;
  }
};