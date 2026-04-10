/**
 * Developer System - 核心邏輯控制
 * 包含：頁面切換、氣象資料抓取、Chart.js 圖表渲染
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 元素選取 ---
    const heroScreen = document.getElementById('hero-screen');
    const mainApp = document.getElementById('main-app');
    const menuLinks = document.querySelectorAll('#menu-list .list-group-item');
    const sections = document.querySelectorAll('.content-section');
    
    // 按鈕選取 (Hero 頁面按鈕與 Nav 上的進入按鈕)
    const startBtns = document.querySelectorAll('a[href="#main-app"], .btn-light[href="#main-app"]');
    const homeBtn = document.querySelector('a[href="/"]'); // 首頁按鈕回歸初始

    // 全域圖表快取與資料
    let charts = { temp: null, aqi: null };
    let weatherDataCache = null;

    // ==========================================
    // 1. 頁面進入/切換邏輯
    // ==========================================

    /**
     * 切換從 Hero 到 Main System
     */
    function enterSystem(e) {
        if (e) e.preventDefault();
        
        // 隱藏 Hero，顯示 Main
        heroScreen.classList.add('hidden-section'); // 配合 CSS 的 display: none
        mainApp.style.display = 'flex'; // 顯示佈局
        
        // 進入後預設觸發第一個標籤的邏輯 (如果是 projects 則畫圖)
        const activeSectionId = document.querySelector('.content-section.active').id;
        handleSectionLogic(activeSectionId);

        // 平滑捲動至系統區
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 綁定所有「進入系統」的按鈕
    startBtns.forEach(btn => {
        btn.addEventListener('click', enterSystem);
    });

    // 回首頁邏輯 (重置狀態)
    if (homeBtn) {
        homeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            heroScreen.classList.remove('hidden-section');
            mainApp.style.display = 'none';
        });
    }

    // ==========================================
    // 2. 氣象資料抓取 (API)
    // ==========================================

    async function fetchWeatherData() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.56&hourly=temperature_2m,relative_humidity_2m,pm2_5,pm10&daily=sunrise,sunset&timezone=Asia%2FTaipei&forecast_days=1`;
        try {
            const response = await fetch(url);
            weatherDataCache = await response.json();
            console.log("氣象資料已緩存");
            
            // 如果當前頁面已經是在圖表頁，立即渲染
            const currentActive = document.querySelector('.content-section.active').id;
            if (currentActive === 'projects-section') {
                renderAllCharts(weatherDataCache);
            }
        } catch (e) {
            console.error("資料抓取失敗:", e);
            const sunInfo = document.getElementById('sun-info');
            if (sunInfo) sunInfo.textContent = "無法取得即時資料，請檢查網路連線。";
        }
    }

    // 初始執行一次
    fetchWeatherData();

    // ==========================================
    // 3. 側邊欄導覽邏輯
    // ==========================================

    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');

            // UI 切換：側邊欄狀態
            menuLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            // UI 切換：內容區塊顯隱
            sections.forEach(sec => sec.classList.remove('active'));
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');

            // 執行對應區塊的邏輯
            handleSectionLogic(targetId);
        });
    });

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
    // 4. 功能子函式 (更新內容 & 繪製圖表)
    // ==========================================

    function updateSkillsData() {
        const displayArea = document.getElementById('about-time-display2');
        if (!weatherDataCache) {
            displayArea.innerText = "資料載入中...";
            return;
        }
        const temp = weatherDataCache.hourly.temperature_2m[0];
        displayArea.innerHTML = `
            <p class="mb-1 text-muted">最後更新：${weatherDataCache.hourly.time[0].replace('T', ' ')}</p>
            <h3 class="text-primary display-6 fw-bold">${temp}°C</h3>
            <p class="badge bg-success">系統連線正常</p>
            <p>目前台北地區氣溫數據已透過 Open-Meteo API 同步。</p>
        `;
    }

    function renderAllCharts(data) {
        // 溫度趨勢圖 (Line Chart)
        const tCtx = document.getElementById('tempChart').getContext('2d');
        if (charts.temp) charts.temp.destroy();
        charts.temp = new Chart(tCtx, {
            type: 'line',
            data: {
                labels: data.hourly.time.map(t => t.split('T')[1]),
                datasets: [{
                    label: '台北氣溫 (°C)',
                    data: data.hourly.temperature_2m,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

        // 空氣品質圖 (Bar Chart)
        const aCtx = document.getElementById('aqiChart').getContext('2d');
        if (charts.aqi) charts.aqi.destroy();
        charts.aqi = new Chart(aCtx, {
            type: 'bar',
            data: {
                labels: ['PM2.5', 'PM10'],
                datasets: [{
                    label: 'μg/m³',
                    data: [data.hourly.pm2_5[0], data.hourly.pm10[0]],
                    backgroundColor: ['#10b981', '#06b6d4'],
                    borderRadius: 8
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });

        // 天文資訊 (日出日落)
        const sunrise = data.daily.sunrise[0].split('T')[1];
        const sunset = data.daily.sunset[0].split('T')[1];
        const sunElement = document.getElementById('sun-info');
        if (sunElement) {
            sunElement.innerHTML = `☀️ 日出時間：${sunrise} &nbsp;&nbsp; | &nbsp;&nbsp; 🌙 日落時間：${sunset}`;
        }
    }
});