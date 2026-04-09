document.addEventListener('DOMContentLoaded', () => {
    // 1. 抓取所有需要的元素
    const menuLinks = document.querySelectorAll('#menu-list .list-group-item');
    const sections = document.querySelectorAll('.content-section');
    const timeDisplayP = document.getElementById('about-time-display');

    // 2. 點擊事件處理
    menuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // 防止預設跳轉行為

            const targetId = this.getAttribute('data-target');

            // --- 邏輯 A: 切換側邊欄與內容區塊的 Active 狀態 ---
            menuLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            // --- 邏輯 B: 點擊「關於技術」時抓取時間並更新 ---
            if (targetId === 'about-section' && timeDisplayP) {
                const now = new Date();
                
                // 使用 Intl.DateTimeFormat 進行安全且格式化的時間輸出
                const formattedTime = new Intl.DateTimeFormat('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).format(now);

                // 安全起見：使用 textContent 修改內容，不解析 HTML
                timeDisplayP.textContent = `最後操作時間：${formattedTime}`;
            }
        });
    });
});