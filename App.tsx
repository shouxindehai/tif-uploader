import React, { useState } from 'react';
import { Login } from './components/Login';
import { FileUploader } from './components/FileUploader';
import { Layout, Github } from 'lucide-react';
import { GITEE_CONFIG } from './constants';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-red-600 p-1.5 rounded-lg">
               <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg text-slate-800 tracking-tight">Gitee Tiff Manager</h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-slate-500 hidden sm:flex items-center gap-1">
                <Github className="w-3 h-3" />
                Repo: {GITEE_CONFIG.REPO}
             </span>
             <button 
                onClick={() => setIsLoggedIn(false)}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
             >
                退出登录
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8 text-center sm:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">上传 TIF 素材</h2>
            <p className="text-slate-500">
                将 TIF 文件推送到 Gitee 仓库，生成永久访问链接。
            </p>
        </div>
        
        <FileUploader />
      </main>
    </div>
  );
};

export default App;