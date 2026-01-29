import React, { useState } from 'react';
import { APP_CONFIG, GITEE_CONFIG } from '../constants';
import { checkConnection } from '../services/giteeService';
import { Lock, User, ArrowRight, Github, Loader2, AlertTriangle, ShieldAlert, Bug, Settings } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [rawError, setRawError] = useState<any>(null);
  
  const [isChecking, setIsChecking] = useState(false);
  const [canBypass, setCanBypass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setRawError(null);
    setCanBypass(false);

    // 1. Basic Auth Check
    if (username !== APP_CONFIG.USERNAME || password !== APP_CONFIG.PASSWORD) {
      setErrorMsg('用户名或密码错误');
      return;
    }

    // 2. Connection Check (Gitee)
    setIsChecking(true);
    try {
        if (!GITEE_CONFIG.ACCESS_TOKEN || GITEE_CONFIG.ACCESS_TOKEN.includes('你的')) {
             throw new Error("请先在 constants.ts 中配置 Gitee Access Token");
        }

        await checkConnection();
        setIsChecking(false);
        onLoginSuccess();
    } catch (err: any) {
        setIsChecking(false);
        console.error("Connection check failed", err);
        setRawError(err);
        setCanBypass(true);

        if (err.status === 401) {
            setErrorMsg('认证失败：Token 无效或过期 (401 Unauthorized)');
        } else if (err.status === 404) {
             setErrorMsg(`无法连接：找不到仓库 ${GITEE_CONFIG.OWNER}/${GITEE_CONFIG.REPO} (404 Not Found)`);
        } else if (err.status === 403) {
            setErrorMsg('权限不足：Token 只有只读权限或被限制 (403 Forbidden)');
        } else {
            setErrorMsg('连接错误: ' + (err.message || '未知错误'));
        }
    }
  };

  const handleBypass = () => {
      onLoginSuccess();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-red-600 p-8 text-center relative overflow-hidden">
           {/* Abstract pattern */}
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <h1 className="text-2xl font-bold text-white mb-2 relative z-10">Tencent Docs Helper</h1>
          <p className="text-red-100 text-sm relative z-10">Gitee Storage Edition / 码云存储助手</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
            
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-500 flex flex-col gap-1">
             <div className="flex items-center gap-2 font-semibold text-slate-700 mb-1">
                <Settings className="w-3 h-3" />
                <span>当前配置 (constants.ts)</span>
             </div>
             <p>仓库: <span className="font-mono text-slate-700">{GITEE_CONFIG.OWNER}/{GITEE_CONFIG.REPO}</span></p>
             <p>分支: <span className="font-mono text-slate-700">{GITEE_CONFIG.BRANCH}</span></p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="admin"
                  disabled={isChecking}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="password"
                  disabled={isChecking}
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                </div>

                {/* Debug Info Box */}
                <div className="bg-slate-800 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                    <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-slate-700 pb-1">
                        <Bug className="w-3 h-3" />
                        <strong>Gitee API Error</strong>
                    </div>
                    <pre className="whitespace-pre-wrap break-all">
                        {rawError ? JSON.stringify(rawError, null, 2) : 'No error details'}
                    </pre>
                </div>
                
                {canBypass && (
                    <button
                        type="button"
                        onClick={handleBypass}
                        className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <ShieldAlert className="w-3 h-3" />
                        忽略检查，强制进入
                    </button>
                )}
            </div>
          )}

          <button
            type="submit"
            disabled={isChecking}
            className={`w-full flex items-center justify-center space-x-2 font-semibold py-3 px-4 rounded-lg transition-all duration-200 
              ${isChecking 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'}`}
          >
            {isChecking ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>连接 Gitee 仓库...</span>
                </>
            ) : (
                <>
                    <span>验证并连接</span>
                    <Github className="h-4 w-4" />
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};