/**
 * 台北氣象監測系統 - 整合 Chart.js 與 Open-Meteo API
 */

// 全域變數，用於儲存圖表實例（銷毀舊圖表必備）
let charts = {
    temp: null,
    aqi: null
};

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
});

/**
 * 1. 側邊欄導覽切換邏輯
 */
function initNavigation() {
    const menuLinks = document.querySelectorAll('#menu-list a');
    const sections = document.querySelectorAll('.content-section');

    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');

            // 切換選單 Active 樣式
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // 切換區塊顯示
            sections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });

            const activeSection = document.getElementById(targetId);
            activeSection.classList.add('active');
            activeSection.style.display = 'block';

            // 核心邏輯：如果是切換到圖表頁面，執行 API 抓取與繪製
            if (targetId === 'projects-section') {
                fetchAndRenderWeather();
            }
        });
    });
}

/**
 * 2. 抓取 Open-Meteo 資料
 */
async function fetchAndRenderWeather() {
    // 台北經緯度
    const lat = 25.03;
    const lon = 121.56;
    
    // 包含：24小時預報、空氣品質、日出日落
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,pm2_5,pm10&daily=sunrise,sunset&timezone=Asia%2FTaipei&forecast_days=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("網路請求失敗");
        const data = await response.json();

        // 執行繪製
        renderTemperatureChart(data.hourly);
        renderAQIChart(data.hourly);
        updateSunInfo(data.daily);

    } catch (error) {
        console.error("無法取得氣象資料:", error);
        document.getElementById('sun-info').innerText = "資料載入失敗，請檢查網路連線。";
    }
}

/**
 * 3. 繪製溫度折線圖
 */
function renderTemperatureChart(hourly) {
    const ctx = document.getElementById('tempChart').getContext('2d');

    // 如果已有圖表，必須先銷毀，否則會出現重疊錯誤
    if (charts.temp) charts.temp.destroy();

    charts.temp = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hourly.time.map(t => t.split('T')[1]), // 格式化時間 14:00
            datasets: [{
                label: '台北氣溫 (°C)',
                data: hourly.temperature_2m,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4, // 曲線平滑度
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

/**
 * 4. 繪製空氣品質長條圖
 */
function renderAQIChart(hourly) {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    
    if (charts.aqi) charts.aqi.destroy();

    // 取當前小時的資料
    const currentPm25 = hourly.pm2_5[0];
    const currentPm10 = hourly.pm10[0];

    charts.aqi = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['PM2.5', 'PM10'],
            datasets: [{
                label: '濃度 (μg/m³)',
                data: [currentPm25, currentPm10],
                backgroundColor: [
                    currentPm25 > 35 ? '#dc3545' : '#198754', // 超過35顯示紅色，否則綠色
                    '#0dcaf0'
                ],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

/**
 * 5. 更新天文資訊文字
 */
function updateSunInfo(daily) {
    const infoBox = document.getElementById('sun-info');
    const sunrise = daily.sunrise[0].split('T')[1];
    const sunset = daily.sunset[0].split('T')[1];
    
    infoBox.innerHTML = `
        <span class="me-4">☀️ 台北日出：<strong>${sunrise}</strong></span>
        <span>🌙 台北日落：<strong>${sunset}</strong></span>
    `;
}