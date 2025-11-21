import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, Key, Settings } from 'lucide-react';

const App = () => {
    // 状态用于存储配置检查结果
    const [configStatus, setConfigStatus] = useState([]);

    useEffect(() => {
        const results = [];

        // ----------------------------------------------------
        // 1. 检查 __firebase_config
        // ----------------------------------------------------
        const configString = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
        let configResult = { 
            name: '__firebase_config (数据库配置)', 
            icon: <Settings className="w-5 h-5 text-yellow-600" />,
            status: '未检查', 
            details: '正在检查...' 
        };

        if (configString === null) {
            configResult.status = '缺失';
            configResult.icon = <AlertTriangle className="w-5 h-5 text-red-600" />;
            configResult.details = '全局变量 __firebase_config 未定义。这是连接Firestore的必需配置。';
        } else if (configString.trim() === '' || configString.trim() === '{}') {
            configResult.status = '空/无效';
            configResult.icon = <AlertTriangle className="w-5 h-5 text-red-600" />;
            configResult.details = '变量已定义，但内容为空字符串或空 JSON ({})。配置无效。';
        } else {
            try {
                const parsedConfig = JSON.parse(configString);
                if (typeof parsedConfig === 'object' && parsedConfig !== null && Object.keys(parsedConfig).length > 3) {
                    configResult.status = '有效';
                    configResult.icon = <CheckCircle className="w-5 h-5 text-green-600" />;
                    configResult.details = `已成功解析。包含 ${Object.keys(parsedConfig).length} 个关键字段 (如 apiKey, projectId 等)。`;
                } else {
                     configResult.status = '结构异常';
                    configResult.icon = <AlertTriangle className="w-5 h-5 text-orange-600" />;
                    configResult.details = '已解析为JSON，但结构不完整或字段太少，可能不是有效的Firebase配置。';
                }
            } catch (e) {
                configResult.status = '解析失败';
                configResult.icon = <AlertTriangle className="w-5 h-5 text-red-600" />;
                configResult.details = `变量内容不是有效的 JSON 字符串。解析错误: ${e.message}`;
            }
        }
        results.push(configResult);

        // ----------------------------------------------------
        // 2. 检查 __initial_auth_token
        // ----------------------------------------------------
        const authToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        let tokenResult = { 
            name: '__initial_auth_token (认证令牌)', 
            icon: <Key className="w-5 h-5 text-yellow-600" />,
            status: '未检查', 
            details: '正在检查...' 
        };

        if (authToken === null) {
            tokenResult.status = '缺失';
            tokenResult.icon = <HelpCircle className="w-5 h-5 text-gray-500" />;
            tokenResult.details = '全局变量 __initial_auth_token 未定义。应用将尝试使用匿名登录。';
        } else if (typeof authToken === 'string' && authToken.length > 50) {
            // Firebase Custom Token 通常是一个很长的 JWT 字符串
            tokenResult.status = '有效';
            tokenResult.icon = <CheckCircle className="w-5 h-5 text-green-600" />;
            tokenResult.details = `已检测到 ${authToken.length} 字符的认证令牌。`;
        } else {
            tokenResult.status = '空/过短';
            tokenResult.icon = <AlertTriangle className="w-5 h-5 text-orange-600" />;
            tokenResult.details = '令牌已定义，但为空或长度过短。可能需要使用匿名登录。';
        }
        results.push(tokenResult);


        setConfigStatus(results);

    }, []);

    const StatusCard = ({ name, status, details, icon }) => {
        let color = 'border-gray-300 bg-white';
        if (status.includes('缺失') || status.includes('无效') || status.includes('失败')) {
            color = 'border-red-500 bg-red-50';
        } else if (status === '有效') {
            color = 'border-green-500 bg-green-50';
        }

        return (
            <div className={`p-5 rounded-xl shadow-lg border-2 ${color} transition duration-300`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        {icon}
                        <h3 className="ml-3 text-lg font-bold text-gray-800">{name}</h3>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full 
                        ${status === '有效' ? 'bg-green-200 text-green-800' : 
                          status.includes('缺失') || status.includes('无效') || status.includes('失败') ? 'bg-red-200 text-red-800' : 
                          'bg-orange-200 text-orange-800'}`
                    }>
                        {status}
                    </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                    {details}
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-indigo-600" />
                Firebase 运行时配置诊断
            </h1>
            <p className="text-gray-600 mb-8">
                此工具用于检查您的 Canvas 环境是否正确提供了 Firestore 所需的全局变量。请将红色或橙色的结果反馈给您的平台管理员。
            </p>

            <div className="space-y-6">
                {configStatus.map((item, index) => (
                    <StatusCard key={index} {...item} />
                ))}
            </div>

            <div className="mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-indigo-600 mb-3">结论与下一步</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>**如果 `__firebase_config` 显示“有效”：** 您的环境是正确的，之前的错误可能是暂时的网络问题，您现在可以恢复使用带有 Firebase 的应用代码。</li>
                    <li>**如果 `__firebase_config` 显示“缺失”或“无效”：** 这就是导致同步失败的原因。您需要联系平台管理员，要求他们提供标准的 Firebase Web SDK 配置 JSON 字符串给 `__firebase_config` 变量。</li>
                    <li>**如果 `__initial_auth_token` 缺失：** 通常是可以接受的，因为应用会尝试使用匿名登录作为回退方案。</li>
                </ul>
            </div>
        </div>
    );
};

export default App;