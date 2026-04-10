/**
 * changeall.js
 * 功能：頁面狀態切換、API 資料抓取、Chart.js 圖表渲染
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 元素選取 ---
    const heroScreen = document.getElementById('hero-screen');
    const mainApp = document.getElementById('main-app');
    const startBtn = document.getElementById('start-btn'); // Hero 頁面按鈕
    
    const menuLinks = document.querySelectorAll('#menu-list .list-group-item');
    const sections = document.querySelectorAll('.content-section');

    // 全域圖表實例快取 (避免重複渲染產生的錯誤)
    let charts = { temp: null, aqi: null };
    let weatherDataCache = null;

    // ==========================================
    // 2. 核心切換邏輯 (取代原本的導覽行為)
    // ==========================================

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // 隱藏 Hero 區塊
            heroScreen.classList.add('hidden-section');
            
            // 顯示主程式區塊 (對應 CSS 的 display: flex 佈局)
            mainApp.style.display = 'flex';

            // 進入後，如果目前標籤是 projects-section 且資料已備齊，則畫圖
            const activeSectionId = document.querySelector('.content-section.active').id;
            handleSectionLogic(activeSectionId);

            // 確保視窗回到頂部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==========================================
    // 3. 氣象 API 資料抓取
    // ==========================================

    async function fetchWeatherData() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.56&hourly=temperature_2m,relative_humidity_2m,pm2_5,pm10&daily=sunrise,sunset&timezone=Asia%2FTaipei&forecast_days=1`;
        
        try {
            const response = await fetch(url);
            weatherDataCache = await response.json();
            console.log("氣象資料已成功存入快取");
            
            // 如果當前頁面已經是在圖表頁面，立即渲染一次
            const currentActive = document.querySelector('.content-section.active').id;
            if (currentActive === 'projects-section' && mainApp.style.display === 'flex') {
                renderAllCharts(weatherDataCache);
            }
        } catch (e) {
            console.error("無法取得 API 資料:", e);
        }
    }

    // 啟動即抓取
    fetchWeatherData();

    // ==========================================
    // 4. 側邊選單導覽邏輯
    // ==========================================

    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');

            // 切換側邊欄 UI
            menuLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            // 切換右側內容區塊
            sections.forEach(sec => sec.classList.remove('active'));
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');

            // 根據切換到的區塊執行對應邏輯
            handleSectionLogic(targetId);
        });
    });

    /**
     * 處理不同區塊的特定邏輯
     * @param {string} id - 區塊的 ID
     */
    function handleSectionLogic(id) {
        if (id === 'about-section') {
            const display = document.getElementById('about-time-display');
            display.textContent = `最後操作時間：${new Date().toLocaleString('zh-TW')}`;
        } 
        else if (id === 'skills-section') {
            updateSkillsData();
        } 
        else if (id === 'projects-section') {
            if (weatherDataCache) {
                renderAllCharts(weatherDataCache);
            }
        }
    }

    // ==========================================
    // 5. 子功能：更新氣溫文字 & 渲染圖表
    // ==========================================

    function updateSkillsData() {
        const displayArea = document.getElementById('about-time-display2');
        if (!weatherDataCache) {
            displayArea.innerText = "資料載入中...";
            return;
        }
        const temp = weatherDataCache.hourly.temperature_2m[0];
        displayArea.innerHTML = `
            <div class="p-3 border rounded-3 bg-white">
                <p class="text-muted mb-1 small">台北最新觀測</p>
                <h3 class="text-primary mb-0">${temp}°C</h3>
                <p class="mb-0 mt-2 small text-success">● 即時氣象連線正常</p>
            </div>
        `;
    }

    function renderAllCharts(data) {
        // 溫度圖表 (Line)
        const tCtx = document.getElementById('tempChart').getContext('2d');
        if (charts.temp) charts.temp.destroy(); // 銷毀舊圖表防止殘留
        charts.temp = new Chart(tCtx, {
            type: 'line',
            data: {
                labels: data.hourly.time.map(t => t.split('T')[1]),
                datasets: [{
                    label: '24小時溫度預報',
                    data: data.hourly.temperature_2m,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

        // 空氣品質圖表 (Bar)
        const aCtx = document.getElementById('aqiChart').getContext('2d');
        if (charts.aqi) charts.aqi.destroy();
        charts.aqi = new Chart(aCtx, {
            type: 'bar',
            data: {
                labels: ['PM2.5', 'PM10'],
                datasets: [{
                    label: '濃度 (μg/m³)',
                    data: [data.hourly.pm2_5[0], data.hourly.pm10[0]],
                    backgroundColor: ['#198754', '#0dcaf0']
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });

        // 更新天文資訊
        const sunrise = data.daily.sunrise[0].split('T')[1];
        const sunset = data.daily.sunset[0].split('T')[1];
        const sunInfo = document.getElementById('sun-info');
        if (sunInfo) {
            sunInfo.innerHTML = `☀️ 日出時間：${sunrise} | 🌙 日落時間：${sunset}`;
        }
    }
});