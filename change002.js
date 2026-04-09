document.addEventListener('DOMContentLoaded', () => {
    const menuLinks = document.querySelectorAll('#menu-list a');
    const sections = document.querySelectorAll('.content-section');

    menuLinks.forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault();

            // 1. 取得目標 Section ID
            const targetId = this.getAttribute('data-target');

            // 2. 切換選單 Active 狀態
            menuLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');


            // 4. 如果點擊的是「動態更改 抓取資料」區塊
            if (targetId === 'skills-section') {
                const displayArea = document.getElementById('about-time-display2');
                displayArea.innerText = "資料讀取中...";

                try {
                    // 呼叫 Open-Meteo API (台北座標)
                    const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=25.04&longitude=121.53&current=temperature_2m,relative_humidity_2m&timezone=Asia%2FTaipei");
                    const data = await response.json();

                    const temp = data.current.temperature_2m;
                    const humidity = data.current.relative_humidity_2m;
                    const time = data.current.time.replace('T', ' ');

                    // --- 安全的做法：手動建立 DOM 節點 ---
        
        // 1. 先清空容器
        displayArea.textContent = "";

        // 2. 建立時間元素
        const timePara = document.createElement('p');
        timePara.textContent = `最後更新時間：${time}`;
        
        // 3. 建立溫度元素
        const tempPara = document.createElement('p');
        tempPara.className = "display-4 text-primary";
        tempPara.textContent = `${temp}°C`;

        // 4. 建立濕度元素
        const humiPara = document.createElement('p');
        humiPara.textContent = `相對濕度：${humidity}%`;

        // 5. 一次性加入到容器中
        displayArea.append(timePara, tempPara, humiPara);
                } catch (error) {
                    displayArea.innerText = "抓取失敗，請檢查網路連線。";
                    console.error("API Error:", error);
                }
            }
        });
    });
});