document.addEventListener('DOMContentLoaded', () => {
    // 为所有代码块添加复制按钮
    document.querySelectorAll('pre[class*="language-"]').forEach(pre => {
        const button = document.createElement('button');
        button.className = 'code-copy-button';
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>复制';
        
        // 添加复制功能
        button.addEventListener('click', async () => {
            const code = pre.querySelector('code').innerText;
            
            try {
                await navigator.clipboard.writeText(code);
                button.classList.add('copied');
                button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>已复制';
                
                // 2秒后恢复原始状态
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>复制';
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
                button.innerHTML = '复制失败';
            }
        });
        
        pre.appendChild(button);
    });
});
