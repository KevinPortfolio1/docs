document.addEventListener('DOMContentLoaded', () => {
    const menuLinks = document.querySelectorAll('#menu-list .list-group-item');
    const sections = document.querySelectorAll('.content-section');
    
    // 全域圖表快取
    let charts = { temp: null, aqi: null };
    let weatherDataCache = null;

    // --- 初始化：先抓取氣象資料備用 ---
    async function fetchWeatherData() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.56&hourly=temperature_2m,relative_humidity_2m,pm2_5,pm10&daily=sunrise,sunset&timezone=Asia%2FTaipei&forecast_days=1`;
        try {
            const response = await fetch(url);
            weatherDataCache = await response.json();
            console.log("Weather data cached.");
        } catch (e) {
            console.error("Fetch error:", e);
        }
    }
    fetchWeatherData();

    // --- 核心導覽邏輯 ---
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');

            // 1. UI 切換：側邊欄狀態
            menuLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            // 2. UI 切換：內容區塊顯隱 (統一使用 Class 控制)
            sections.forEach(sec => sec.classList.remove('active'));
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');

            // 3. 根據不同的標籤執行特定功能
            handleSectionLogic(targetId);
        });
    });

    function handleSectionLogic(id) {
        if (id === 'about-section') {
            // 更新最後操作時間
            const display = document.getElementById('about-time-display');
            display.textContent = `最後操作時間：${new Date().toLocaleString('zh-TW')}`;
        } 
        else if (id === 'skills-section') {
            // 更新即時氣溫文字
            updateSkillsData();
        } 
        else if (id === 'projects-section') {
            // 繪製圖表
            if (weatherDataCache) {
                renderAllCharts(weatherDataCache);
            }
        }
    }

    // --- 功能子函式 ---
    async function updateSkillsData() {
        const displayArea = document.getElementById('about-time-display2');
        if (!weatherDataCache) {
            displayArea.innerText = "資料載入中...";
            return;
        }
        const temp = weatherDataCache.hourly.temperature_2m[0];
        displayArea.innerHTML = `
            <p>最後更新：${weatherDataCache.hourly.time[0].replace('T', ' ')}</p>
            <h3 class="text-primary">${temp}°C</h3>
            <p>即時氣象連線正常</p>
        `;
    }

    function renderAllCharts(data) {
        // 溫度圖表
        const tCtx = document.getElementById('tempChart').getContext('2d');
        if (charts.temp) charts.temp.destroy();
        charts.temp = new Chart(tCtx, {
            type: 'line',
            data: {
                labels: data.hourly.time.map(t => t.split('T')[1]),
                datasets: [{
                    label: '台北氣溫 (°C)',
                    data: data.hourly.temperature_2m,
                    borderColor: '#0d6efd',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(13, 110, 253, 0.1)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // AQI 圖表 (PM2.5)
        const aCtx = document.getElementById('aqiChart').getContext('2d');
        if (charts.aqi) charts.aqi.destroy();
        charts.aqi = new Chart(aCtx, {
            type: 'bar',
            data: {
                labels: ['PM2.5', 'PM10'],
                datasets: [{
                    label: 'μg/m³',
                    data: [data.hourly.pm2_5[0], data.hourly.pm10[0]],
                    backgroundColor: ['#198754', '#0dcaf0']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // 日月資訊
        const sunrise = data.daily.sunrise[0].split('T')[1];
        const sunset = data.daily.sunset[0].split('T')[1];
        document.getElementById('sun-info').innerHTML = `☀️ 日出：${sunrise} | 🌙 日落：${sunset}`;
    }
});