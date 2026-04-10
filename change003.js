/**
 * 台北氣象監測系統 - 優化版：單次抓取，重複使用
 */

// 1. 全域變數：儲存圖表實例與資料緩存
let charts = { temp: null, aqi: null };
let weatherDataCache = null; // 儲存 API 回傳的資料

document.addEventListener('DOMContentLoaded', () => {
    // 頁面載入後立即抓取資料 (只抓這一次)
    fetchAllData();
    // 初始化選單點擊事件
    initNavigation();
});

/**
 * 2. 核心：只執行一次的資料抓取
 */
async function fetchAllData() {
    const lat = 25.03;
    const lon = 121.56;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,pm2_5,pm10&daily=sunrise,sunset&timezone=Asia%2FTaipei&forecast_days=1`;

    try {
        console.log("正在執行全域資料抓取...");
        const response = await fetch(url);
        if (!response.ok) throw new Error("網路請求失敗");
        
        // 將資料存入緩存
        weatherDataCache = await response.json();
        console.log("資料快取成功！");

    } catch (error) {
        console.error("初始抓取失敗:", error);
        const infoBox = document.getElementById('sun-info');
        if (infoBox) infoBox.innerText = "資料連線失敗，請刷新頁面。";
    }
}

/**
 * 3. 側邊欄導覽切換邏輯
 */
function initNavigation() {
    const menuLinks = document.querySelectorAll('#menu-list a');
    const sections = document.querySelectorAll('.content-section');

    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');

            // 切換 Active 樣式
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // 切換區塊顯示
            sections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            const activeSection = document.getElementById(targetId);
            activeSection.style.display = 'block';
            activeSection.classList.add('active');

            // 觸發繪製：如果切換到圖表區塊，且已有快取資料
            if (targetId === 'projects-section') {
                if (weatherDataCache) {
                    renderChartsFromCache();
                } else {
                    // 防呆：如果 API 還沒跑完使用者就點進來
                    console.log("資料還在路上，請稍候...");
                }
            }
        });
    });
}

/**
 * 4. 使用快取資料進行繪圖
 */
function renderChartsFromCache() {
    // 呼叫原本的繪圖函式，但資料來源改為 weatherDataCache
    renderTemperatureChart(weatherDataCache.hourly);
    renderAQIChart(weatherDataCache.hourly);
    updateSunInfo(weatherDataCache.daily);
}

/**
 * 5. 繪圖與更新函式 (保持原本邏輯，但移除銷毀前的重複檢查改由內建處理)
 */
function renderTemperatureChart(hourly) {
    const ctx = document.getElementById('tempChart').getContext('2d');
	
	ctx.parentElement.style.height = '350px'; 
    ctx.parentElement.style.position = 'relative';
	
	
    if (charts.temp) charts.temp.destroy();

    charts.temp = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hourly.time.map(t => t.split('T')[1]),
            datasets: [{
                label: '台北氣溫 (°C)',
                data: hourly.temperature_2m,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderAQIChart(hourly) {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    if (charts.aqi) charts.aqi.destroy();

    const currentPm25 = hourly.pm2_5[0];
    const currentPm10 = hourly.pm10[0];

    charts.aqi = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['PM2.5', 'PM10'],
            datasets: [{
                label: '濃度 (μg/m³)',
                data: [currentPm25, currentPm10],
                backgroundColor: [currentPm25 > 35 ? '#dc3545' : '#198754', '#0dcaf0'],
                borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateSunInfo(daily) {
    const infoBox = document.getElementById('sun-info');
    if (!infoBox) return;
    const sunrise = daily.sunrise[0].split('T')[1];
    const sunset = daily.sunset[0].split('T')[1];
    infoBox.innerHTML = `☀️ 日出：<strong>${sunrise}</strong> | 🌙 日落：<strong>${sunset}</strong>`;
}