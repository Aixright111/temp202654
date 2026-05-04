const 默认配置 = {
    密钥: "sk-1f39f8d1260e4d69bde035430a0e2029",
    基础URL: "https://api.deepseek.com",
    模型: "deepseek-v4-flash",
    系统提示词: "你是一个有帮助的AI助手。"
};

const 存储键 = {
    对话列表: "ai对话列表",
    当前对话ID: "ai当前对话ID",
    设置: "ai设置"
};

let 当前对话ID = null;
let 对话数据 = {};
let 正在发送 = false;
let 当前配置 = { ...默认配置 };
let 当前模式 = "chat"; // "chat" 或 "search"

function 生成ID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function 格式化时间(时间戳) {
    const 日期 = new Date(时间戳);
    const 现在 = new Date();
    const 差值 = 现在 - 日期;

    if (差值 < 60000) return "刚刚";
    if (差值 < 3600000) return `${Math.floor(差值 / 60000)}分钟前`;
    if (差值 < 86400000) return `${Math.floor(差值 / 3600000)}小时前`;
    if (差值 < 604800000) return `${Math.floor(差值 / 86400000)}天前`;

    return 日期.toLocaleDateString("zh-CN", {
        月: "2-digit",
        日: "2-digit",
        时: "2-digit",
        分: "2-digit"
    });
}

function 保存到本地存储() {
    localStorage.setItem(存储键.对话列表, JSON.stringify(对话数据));
    if (当前对话ID) {
        localStorage.setItem(存储键.当前对话ID, 当前对话ID);
    }
}

function 保存设置() {
    localStorage.setItem(存储键.设置, JSON.stringify(当前配置));
}

function 从本地存储加载() {
    const 存储数据 = localStorage.getItem(存储键.对话列表);
    const 存储当前ID = localStorage.getItem(存储键.当前对话ID);
    const 存储设置 = localStorage.getItem(存储键.设置);

    if (存储数据) {
        try {
            对话数据 = JSON.parse(存储数据);
        } catch (e) {
            对话数据 = {};
        }
    }

    if (存储当前ID && 对话数据[存储当前ID]) {
        当前对话ID = 存储当前ID;
    }

    if (存储设置) {
        try {
            const 加载的设置 = JSON.parse(存储设置);
            当前配置 = { 
                ...默认配置, 
                ...加载的设置
            };
            if (!当前配置.系统提示词) {
                当前配置.系统提示词 = 默认配置.系统提示词;
            }
        } catch (e) {
            当前配置 = { ...默认配置 };
        }
    }
}

function 更新模型显示() {
    const 显示元素 = document.getElementById("当前模型显示");
    if (显示元素) {
        显示元素.textContent = 当前配置.模型;
    }
}

function 切换模式(模式) {
    当前模式 = 模式;
    const 对话模式按钮 = document.getElementById("对话模式");
    const 搜索模式按钮 = document.getElementById("搜索模式");
    const 输入容器 = document.getElementById("输入容器");
    const 输入框 = document.getElementById("输入框");
    
    if (模式 === "chat") {
        对话模式按钮.className = "flex-1 py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all border-2 border-transparent shadow-lg shadow-indigo-600/20";
        搜索模式按钮.className = "flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all border-2 border-transparent";
        输入框.placeholder = "输入你的问题...";
        输入容器.className = "bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-200/50 p-3.5 flex gap-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200";
    } else {
        对话模式按钮.className = "flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all border-2 border-transparent";
        搜索模式按钮.className = "flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-sm font-medium transition-all border-2 border-transparent shadow-lg shadow-green-500/20";
        输入框.placeholder = "输入你想搜索的内容...";
        输入容器.className = "bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-200/50 p-3.5 flex gap-3 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all duration-200";
    }
}

function 打开设置弹窗() {
    const 弹窗 = document.getElementById("设置弹窗");
    const apiKey输入 = document.getElementById("apiKey输入");
    const baseUrl输入 = document.getElementById("baseUrl输入");
    const 模型选择 = document.getElementById("模型选择");
    const 系统提示词输入 = document.getElementById("系统提示词输入");

    apiKey输入.value = 当前配置.密钥;
    baseUrl输入.value = 当前配置.基础URL;
    模型选择.value = 当前配置.模型;
    系统提示词输入.value = 当前配置.系统提示词 || "";

    弹窗.classList.remove("hidden");
    弹窗.classList.add("flex");
}

function 关闭设置弹窗() {
    const 弹窗 = document.getElementById("设置弹窗");
    弹窗.classList.add("hidden");
    弹窗.classList.remove("flex");
}

function 重置设置() {
    当前配置 = { ...默认配置 };
    保存设置();
    更新模型显示();
    关闭设置弹窗();
}

function 渲染对话列表() {
    const 列表元素 = document.getElementById("对话列表");
    列表元素.innerHTML = "";

    const 排序对话 = Object.entries(对话数据)
        .sort((a, b) => b[1].更新时间 - a[1].更新时间);

    if (排序对话.length === 0) {
        列表元素.innerHTML = '<p class="text-center text-gray-500 py-8 px-4 text-sm">暂无对话记录</p>';
        return;
    }

    排序对话.forEach(([id, 对话]) => {
        const 项 = document.createElement("div");
        项.className = `group relative mb-1.5 rounded-xl cursor-pointer transition-all duration-200 ${id === 当前对话ID ? "bg-gray-700/50" : "hover:bg-gray-800"}`;
        项.dataset.id = id;

        const 标题 = 对话.消息.length > 0 
            ? 对话.消息[0].内容.substring(0, 20) + (对话.消息[0].内容.length > 20 ? "..." : "")
            : "新对话";

        项.innerHTML = `
            <div class="px-3.5 py-3" data-id="${id}">
                <div class="text-sm font-medium text-gray-200 truncate">${标题}</div>
                <div class="text-xs text-gray-500 mt-1">${格式化时间(对话.更新时间)}</div>
            </div>
            <button class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200" data-id="${id}" title="删除">
                ×
            </button>
        `;

        项.querySelector("[data-id]:not(button)").addEventListener("click", () => 切换对话(id));
        项.querySelector("button").addEventListener("click", (e) => {
            e.stopPropagation();
            删除对话(id);
        });

        列表元素.appendChild(项);
    });
}

function 创建新对话() {
    const id = 生成ID();
    对话数据[id] = {
        消息: [],
        创建时间: Date.now(),
        更新时间: Date.now()
    };
    当前对话ID = id;
    保存到本地存储();
    渲染对话列表();
    清空消息列表();
    更新对话标题("新对话");
}

function 切换对话(id) {
    if (!对话数据[id]) return;
    当前对话ID = id;
    保存到本地存储();
    渲染对话列表();
    渲染消息();

    const 对话 = 对话数据[id];
    const 标题 = 对话.消息.length > 0 
        ? 对话.消息[0].内容.substring(0, 20) + (对话.消息[0].内容.length > 20 ? "..." : "")
        : "新对话";
    更新对话标题(标题);
}

function 更新对话标题(标题) {
    document.getElementById("对话标题").textContent = 标题;
}

function 删除对话(id) {
    if (!confirm("确定要删除这个对话吗？")) return;

    delete 对话数据[id];

    if (当前对话ID === id) {
        const 排序对话 = Object.entries(对话数据)
            .sort((a, b) => b[1].更新时间 - a[1].更新时间);
        const 剩余ID = 排序对话.map(([id]) => id);
        当前对话ID = 剩余ID.length > 0 ? 剩余ID[0] : null;
    }

    保存到本地存储();
    渲染对话列表();

    if (当前对话ID) {
        渲染消息();
        const 对话 = 对话数据[当前对话ID];
        const 标题 = 对话.消息.length > 0 
            ? 对话.消息[0].内容.substring(0, 20) + (对话.消息[0].内容.length > 20 ? "..." : "")
            : "新对话";
        更新对话标题(标题);
    } else {
        清空消息列表();
        更新对话标题("新对话");
    }
}

function 清空所有对话() {
    if (!confirm("确定要清空所有对话记录吗？此操作不可撤销。")) return;

    对话数据 = {};
    当前对话ID = null;
    保存到本地存储();
    渲染对话列表();
    清空消息列表();
    更新对话标题("新对话");
}

function 清空消息列表() {
    const 消息列表 = document.getElementById("消息列表");
    消息列表.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full px-6">
            <div class="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
                <span class="text-4xl">✦</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">你好，我是 AI 助手</h3>
            <p class="text-gray-500 text-center max-w-md">有什么可以帮助你的吗？开始对话吧！</p>
        </div>
    `;
}

function 渲染消息() {
    const 消息列表 = document.getElementById("消息列表");
    消息列表.innerHTML = "";

    if (!当前对话ID || !对话数据[当前对话ID]) {
        清空消息列表();
        return;
    }

    const 消息 = 对话数据[当前对话ID].消息;

    if (消息.length === 0) {
        清空消息列表();
        return;
    }

    消息.forEach(msg => {
        if (msg.类型 === "search") {
            try {
                const 搜索结果 = JSON.parse(msg.内容);
                添加搜索结果到界面(搜索结果, false);
            } catch (e) {
                添加消息到界面(msg.角色, msg.内容, msg.时间, false);
            }
        } else {
            添加消息到界面(msg.角色, msg.内容, msg.时间, false, msg.类型);
        }
    });

    滚动到底部();
}

function 添加搜索结果到界面(结果, 滚动 = true) {
    const 消息列表 = document.getElementById("消息列表");
    const 欢迎区域 = 消息列表.querySelector(".flex.flex-col.items-center");
    if (欢迎区域) 欢迎区域.remove();

    const 消息元素 = document.createElement("div");
    消息元素.className = "py-6 px-6 bg-gradient-to-b from-green-50 to-white animate-fadeIn";

    let html = `
        <div class="max-w-3xl mx-auto flex gap-4">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-green-500/30 flex-shrink-0">
                🔍
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-800 mb-3">搜索结果</div>
    `;

    html += `
                <div class="space-y-3">
    `;

    if (结果 && 结果.length > 0) {
        结果.forEach((item, index) => {
            const 标题 = item.title || "无标题";
            const url = item.url || "#";
            const 摘要 = item.highlights?.[0] || item.summary || "无摘要";
            html += `
                <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <a href="${url}" target="_blank" class="text-green-600 hover:text-green-800 font-semibold text-sm truncate flex-1">
                            ${转义HTML(标题)}
                        </a>
                        <span class="text-xs text-gray-400 flex-shrink-0">#${index + 1}</span>
                    </div>
                    <p class="text-gray-600 text-sm leading-relaxed">${转义HTML(摘要)}</p>
                </div>
            `;
        });
    } else {
        html += `
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p class="text-yellow-800 text-sm">没有找到相关结果</p>
            </div>
        `;
    }

    html += `
                </div>
            </div>
        </div>
    `;

    消息元素.innerHTML = html;
    消息列表.appendChild(消息元素);

    if (滚动) 滚动到底部();

    return 消息元素;
}

function 添加消息到界面(角色, 内容, 时间, 滚动 = true, 类型 = "text") {
    const 消息列表 = document.getElementById("消息列表");
    const 欢迎区域 = 消息列表.querySelector(".flex.flex-col.items-center");
    if (欢迎区域) 欢迎区域.remove();

    const 消息元素 = document.createElement("div");
    
    const 时间文本 = 时间 ? 格式化时间(时间) : "刚刚";
    const 角色名称 = 角色 === "用户" ? "你" : "AI 助手";

    if (角色 === "用户") {
        消息元素.className = "py-6 px-6 bg-gradient-to-b from-gray-50 to-white animate-fadeIn";
        消息元素.innerHTML = `
            <div class="max-w-3xl mx-auto flex gap-4">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-500/30 flex-shrink-0">
                    U
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-gray-800 mb-1">${角色名称}</div>
                    <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">${转义HTML(内容)}</div>
                    <div class="text-xs text-gray-400 mt-2">${时间文本}</div>
                </div>
            </div>
        `;
    } else {
        消息元素.className = "py-6 px-6 bg-white animate-fadeIn";
        消息元素.innerHTML = `
            <div class="max-w-3xl mx-auto flex gap-4">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0">
                    ✦
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-gray-800 mb-1">${角色名称}</div>
                    <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">${转义HTML(内容)}</div>
                    <div class="text-xs text-gray-400 mt-2">${时间文本}</div>
                </div>
            </div>
        `;
    }

    消息列表.appendChild(消息元素);

    if (滚动) 滚动到底部();

    return 消息元素;
}

function 转义HTML(文本) {
    if (!文本) return "";
    const div = document.createElement("div");
    div.textContent = 文本;
    return div.innerHTML;
}

function 显示加载() {
    const 消息列表 = document.getElementById("消息列表");
    const 欢迎区域 = 消息列表.querySelector(".flex.flex-col.items-center");
    if (欢迎区域) 欢迎区域.remove();

    const 加载元素 = document.createElement("div");
    加载元素.className = "py-6 px-6 bg-white animate-fadeIn";
    加载元素.id = "加载中";
    加载元素.innerHTML = `
        <div class="max-w-3xl mx-auto flex gap-4">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-emerald-500/30 flex-shrink-0">
                ✦
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-800 mb-1">AI 助手</div>
                <div class="flex gap-2 py-2">
                    <div class="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: -0.32s"></div>
                    <div class="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: -0.16s"></div>
                    <div class="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    `;
    消息列表.appendChild(加载元素);
    滚动到底部();
}

function 显示搜索加载() {
    const 消息列表 = document.getElementById("消息列表");
    const 欢迎区域 = 消息列表.querySelector(".flex.flex-col.items-center");
    if (欢迎区域) 欢迎区域.remove();

    const 加载元素 = document.createElement("div");
    加载元素.className = "py-6 px-6 bg-gradient-to-b from-green-50 to-white animate-fadeIn";
    加载元素.id = "加载中";
    加载元素.innerHTML = `
        <div class="max-w-3xl mx-auto flex gap-4">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-green-500/30 flex-shrink-0">
                🔍
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-gray-800 mb-1">搜索中</div>
                <div class="flex gap-2 py-2">
                    <div class="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce" style="animation-delay: -0.32s"></div>
                    <div class="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce" style="animation-delay: -0.16s"></div>
                    <div class="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    `;
    消息列表.appendChild(加载元素);
    滚动到底部();
}

function 移除加载() {
    const 加载元素 = document.getElementById("加载中");
    if (加载元素) 加载元素.remove();
}

function 滚动到底部() {
    const 消息列表 = document.getElementById("消息列表");
    消息列表.scrollTop = 消息列表.scrollHeight;
}

async function 执行搜索(查询) {
    const _e = [97,97,102,49,52,53,52,48,53,57,51,45,52,97,52,101,45,98,48,49,49,45,99,97,99,54,48,56];
    const _k = [54,56,48,54,99,97,99,51,45,98,98,49,48,45,52,101,48,48,45,97,52,52,55,45,51,57,48,53,52,49,100,102,49,51,97,97];
    const apiKey = _k.map(c => String.fromCharCode(c)).join('');

    const 请求体 = JSON.stringify({
        query: 查询,
        type: "auto",
        contents: {
            highlights: true
        }
    });

    const 代理列表 = [
        {
            名称: "本地代理",
            构建URL: () => "http://localhost:3000/api/exa",
            构建选项: () => ({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: 请求体
            })
        },
        {
            名称: "corsproxy.io",
            构建URL: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
            构建选项: () => ({
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey },
                body: 请求体
            })
        },
        {
            名称: "allorigins",
            构建URL: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            构建选项: () => ({
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey },
                body: 请求体
            })
        }
    ];

    const 目标URL = "https://api.exa.ai/search";
    let 最后错误 = null;

    for (const 代理 of 代理列表) {
        try {
            console.log(`尝试使用 ${代理.名称}...`);
            const 请求URL = 代理.构建URL(目标URL);
            const 请求选项 = 代理.构建选项();

            const 响应 = await fetch(请求URL, 请求选项);

            if (!响应.ok) {
                throw new Error(`${代理.名称}请求失败: ${响应.status}`);
            }

            const 数据 = await 响应.json();
            console.log(`${代理.名称}请求成功`);
            return 数据.results || [];
        } catch (错误) {
            console.log(`${代理.名称}失败: ${错误.message}`);
            最后错误 = 错误;
        }
    }

    throw new Error("搜索失败，请检查网络连接后重试。");
}

async function 发送消息() {
    if (正在发送) return;

    const 输入框 = document.getElementById("输入框");
    const 发送按钮 = document.getElementById("发送按钮");
    const 内容 = 输入框.value.trim();

    if (!内容) return;

    if (!当前对话ID) {
        创建新对话();
    }

    正在发送 = true;
    发送按钮.disabled = true;
    输入框.value = "";
    输入框.style.height = "auto";

    const 用户消息时间 = Date.now();
    添加消息到界面("用户", 内容, 用户消息时间);

    对话数据[当前对话ID].消息.push({
        角色: "用户",
        内容: 内容,
        时间: 用户消息时间
    });

    if (对话数据[当前对话ID].消息.length === 1) {
        const 标题 = 内容.substring(0, 20) + (内容.length > 20 ? "..." : "");
        更新对话标题(标题);
        渲染对话列表();
    }

    if (当前模式 === "search") {
        await 处理搜索请求(内容, 用户消息时间);
    } else {
        await 处理对话请求(内容, 用户消息时间);
    }

    正在发送 = false;
    发送按钮.disabled = false;
    输入框.focus();
}

async function 处理搜索请求(查询, 用户消息时间) {
    显示搜索加载();

    try {
        const 搜索结果 = await 执行搜索(查询);
        移除加载();

        const 搜索消息时间 = Date.now();
        添加搜索结果到界面(搜索结果);

        对话数据[当前对话ID].消息.push({
            角色: "ai",
            内容: JSON.stringify(搜索结果),
            时间: 搜索消息时间,
            类型: "search"
        });

        对话数据[当前对话ID].更新时间 = Date.now();
        保存到本地存储();
        渲染对话列表();
    } catch (错误) {
        移除加载();
        添加消息到界面("ai", `搜索失败: ${错误.message}`, Date.now());
    }
}

async function 处理对话请求(内容, 用户消息时间) {
    显示加载();

    try {
        const 响应 = await fetch(`${当前配置.基础URL}/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${当前配置.密钥}`
            },
            body: JSON.stringify({
                model: 当前配置.模型,
                messages: [
                    { role: "system", content: 当前配置.系统提示词 || 默认配置.系统提示词 },
                    ...对话数据[当前对话ID].消息.map(msg => ({
                        role: msg.角色 === "用户" ? "user" : "assistant",
                        content: msg.内容
                    }))
                ],
                temperature: 0.7,
                max_tokens: 2000,
                stream: true
            })
        });

        移除加载();

        if (!响应.ok) {
            const 错误数据 = await 响应.json().catch(() => ({}));
            throw new Error(错误数据.error?.message || `请求失败: ${响应.status}`);
        }

        const AI回复时间 = Date.now();
        const 当前对话ID副本 = 当前对话ID;
        const 消息元素 = 添加消息到界面("ai", "", AI回复时间, true);
        const AI文本元素 = 消息元素.querySelector(".text-gray-700");

        const 读取器 = 响应.body.getReader();
        const 解码器 = new TextDecoder();
        let AI回复 = "";

        while (true) {
            const { done, value } = await 读取器.read();
            if (done) break;
            
            if (当前对话ID副本 !== 当前对话ID) break;

            const 块 = 解码器.decode(value);
            const 行 = 块.split("\n");

            for (let i = 0; i < 行.length; i++) {
                const 单行 = 行[i].trim();
                if (!单行) continue;
                if (!单行.startsWith("data: ")) continue;

                const 数据 = 单行.substring(6);
                if (数据 === "[DONE]") continue;

                try {
                    const JSON数据 = JSON.parse(数据);
                    if (JSON数据.choices && JSON数据.choices.length > 0) {
                        const 增量 = JSON数据.choices[0].delta;
                        if (增量.content) {
                            AI回复 += 增量.content;
                            AI文本元素.innerHTML = 转义HTML(AI回复);
                            滚动到底部();
                        }
                    }
                } catch (e) {
                    console.error("解析流数据失败:", e);
                }
            }
        }

        if (当前对话ID副本 === 当前对话ID) {
            对话数据[当前对话ID].消息.push({
                角色: "ai",
                内容: AI回复,
                时间: AI回复时间,
                类型: "text"
            });

            对话数据[当前对话ID].更新时间 = Date.now();
            保存到本地存储();
            渲染对话列表();
        }

    } catch (错误) {
        移除加载();
        添加消息到界面("ai", `抱歉，发生了错误: ${错误.message}`, Date.now());
    }
}

function 初始化() {
    从本地存储加载();
    更新模型显示();
    渲染对话列表();
    切换模式("search"); // 默认设置为搜索模式

    if (当前对话ID) {
        渲染消息();
        const 对话 = 对话数据[当前对话ID];
        const 标题 = 对话.消息.length > 0 
            ? 对话.消息[0].内容.substring(0, 20) + (对话.消息[0].内容.length > 20 ? "..." : "")
            : "新对话";
        更新对话标题(标题);
    }

    const 输入框 = document.getElementById("输入框");
    const 发送按钮 = document.getElementById("发送按钮");
    const 新建对话按钮 = document.getElementById("新建对话");
    const 清空对话按钮 = document.getElementById("清空对话");
    const 侧边栏开关 = document.getElementById("侧边栏开关");
    const 侧边栏 = document.getElementById("侧边栏");
    const 遮罩层 = document.getElementById("遮罩层");
    const 设置按钮 = document.getElementById("设置按钮");
    const 关闭设置 = document.getElementById("关闭设置");
    const 保存设置按钮 = document.getElementById("保存设置");
    const 重置设置按钮 = document.getElementById("重置设置");
    const 设置弹窗 = document.getElementById("设置弹窗");
    const 对话模式按钮 = document.getElementById("对话模式");
    const 搜索模式按钮 = document.getElementById("搜索模式");

    发送按钮.addEventListener("click", 发送消息);

    输入框.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            发送消息();
        }
    });

    输入框.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 144) + "px";
    });

    新建对话按钮.addEventListener("click", 创建新对话);
    清空对话按钮.addEventListener("click", 清空所有对话);

    if (侧边栏开关) {
        侧边栏开关.addEventListener("click", () => {
            侧边栏.classList.toggle("-translate-x-full");
            侧边栏.classList.toggle("fixed");
            侧边栏.classList.toggle("z-50");
            侧边栏.classList.toggle("h-full");
            侧边栏.classList.toggle("lg:translate-x-0");
            侧边栏.classList.toggle("lg:relative");
            侧边栏.classList.toggle("lg:z-auto");
            遮罩层.classList.toggle("hidden");
        });
        遮罩层.addEventListener("click", () => {
            侧边栏.classList.add("-translate-x-full");
            侧边栏.classList.remove("fixed", "z-50", "h-full");
            侧边栏.classList.add("lg:translate-x-0", "lg:relative", "lg:z-auto");
            遮罩层.classList.add("hidden");
        });
    }

    设置按钮.addEventListener("click", 打开设置弹窗);
    关闭设置.addEventListener("click", 关闭设置弹窗);
    设置弹窗.addEventListener("click", (e) => {
        if (e.target === 设置弹窗) {
            关闭设置弹窗();
        }
    });

    保存设置按钮.addEventListener("click", () => {
        当前配置.密钥 = document.getElementById("apiKey输入").value || 默认配置.密钥;
        当前配置.基础URL = document.getElementById("baseUrl输入").value || 默认配置.基础URL;
        当前配置.模型 = document.getElementById("模型选择").value || 默认配置.模型;
        当前配置.系统提示词 = document.getElementById("系统提示词输入").value || 默认配置.系统提示词;
        保存设置();
        更新模型显示();
        关闭设置弹窗();
    });

    重置设置按钮.addEventListener("click", () => {
        if (confirm("确定要重置为默认设置吗？")) {
            重置设置();
        }
    });

    对话模式按钮.addEventListener("click", () => 切换模式("chat"));
    搜索模式按钮.addEventListener("click", () => 切换模式("search"));
}

document.addEventListener("DOMContentLoaded", 初始化);
