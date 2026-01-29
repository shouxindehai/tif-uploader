// SECURITY WARNING: In a production environment, Access Tokens should NEVER be exposed 
// in frontend code. Since this is a personal tool, we use hardcoded keys.

export const GITEE_CONFIG = {
  // 你的 Gitee 私人令牌 (Personal Access Token)
  // 获取地址: https://gitee.com/profile/personal_access_tokens
  ACCESS_TOKEN: 'e8f81000af54931b092a59a29ec214c9', 
  
  // 你的 Gitee 用户名 (例如: https://gitee.com/zhangsan 中的 zhangsan)
  OWNER: 'shenboyu2020',
  
  // 你的仓库名称 (例如: my-images)
  REPO: 'pidiao-tif',
  
  // 分支名称，默认为 master
  BRANCH: 'master',
  
  // 仓库内的文件夹路径，例如 'images' 或 'tif_files'，留空则传到根目录
  FOLDER: '皮雕tif'
};

export const COS_CONFIG = {
  SECRET_ID: '',
  SECRET_KEY: '',
  BUCKET: '',
  REGION: 'ap-guangzhou',
  FOLDER: ''
};

export const APP_CONFIG = {
  // Simple check for personal use
  USERNAME: 'admin',
  PASSWORD: 'password'
};