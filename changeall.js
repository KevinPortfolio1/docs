/**
 * changeall.js
 * 功能：頁面狀態切換、多重 API 資料抓取 (天氣 + 空氣品質)、Chart.js 渲染
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 元素選取 ---
    const heroScreen = document.getElementById('hero-screen');
    const mainApp = document.getElementById('main-app');
    const startBtn = document.getElementById('start-btn');
    
    const menuLinks = document.querySelectorAll('#menu-list .list-group-item');
    const sections = document.querySelectorAll('.content-section');

    let charts = { temp: null, aqi: null };
    let weatherDataCache = null;

    // ==========================================
    // 2. 核心切換邏輯
    // ==========================================

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            heroScreen.classList.add('hidden-section');
            mainApp.style.display = 'flex';

            const activeSectionId = document.querySelector('.content-section.active').id;
            handleSectionLogic(activeSectionId);

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==========================================
    // 3. API 資料抓取 (修正：加入空氣品質 API)
    // ==========================================

    async function fetchWeatherData() {
        // 端點 1: 一般天氣 (溫度、日出日落)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.56&hourly=temperature_2m,relative_humidity_2m&daily=sunrise,sunset&timezone=Asia%2FTaipei&forecast_days=1`;
        
        // 端點 2: 空氣品質專用 (PM2.5, PM10)
        const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=25.03&longitude=121.56&hourly=pm2_5,pm10`;
        
        try {
            // 同時發送請求以提高效率
            const [weatherRes, airRes] = await Promise.all([
                fetch(weatherUrl),
                fetch(airQualityUrl)
            ]);

            const weatherData = await weatherRes.json();
            const airData = await airRes.json();

            // 將空氣品質資料合併到天氣快取中
            weatherDataCache = {
                ...weatherData,
                air_quality: airData.hourly // 新增一個 air_quality 欄位存資料
            };

            console.log("天氣與空氣品質資料已同步存入快取");
            
            const currentActive = document.querySelector('.content-section.active').id;
            if (currentActive === 'projects-section' && mainApp.style.display === 'flex') {
                renderAllCharts(weatherDataCache);
            }
        } catch (e) {
            console.error("無法取得 API 資料:", e);
        }
    }

    fetchWeatherData();

    // ==========================================
    // 4. 側邊選單導覽邏輯
    // ==========================================

    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');

            menuLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            sections.forEach(sec => sec.classList.remove('active'));
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');

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
    // 5. 子功能：渲染圖表 (修正資料來源路徑)
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
                <p class="mb-0 mt-2 small text-success">● API 數據同步正常</p>
            </div>
        `;
    }

    function renderAllCharts(data) {
        // --- 溫度圖表 ---
        const tCtx = document.getElementById('tempChart').getContext('2d');
        if (charts.temp) charts.temp.destroy();
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

        // --- 空氣品質圖表 (修正：從 air_quality 讀取) ---
        const aCtx = document.getElementById('aqiChart').getContext('2d');
        if (charts.aqi) charts.aqi.destroy();
        
        // 取得最新一小時的 PM2.5 與 PM10 數值
        const pm25 = data.air_quality ? data.air_quality.pm2_5[0] : 0;
        const pm10 = data.air_quality ? data.air_quality.pm10[0] : 0;

        charts.aqi = new Chart(aCtx, {
            type: 'bar',
            data: {
                labels: ['PM2.5', 'PM10'],
                datasets: [{
                    label: '濃度 (μg/m³)',
                    data: [pm25, pm10],
                    backgroundColor: ['#198754', '#0dcaf0']
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });

        // --- 更新天文資訊 ---
        const sunrise = data.daily.sunrise[0].split('T')[1];
        const sunset = data.daily.sunset[0].split('T')[1];
        const sunInfo = document.getElementById('sun-info');
        if (sunInfo) {
            sunInfo.innerHTML = `☀️ 日出時間：${sunrise} | 🌙 日落時間：${sunset}`;
        }
    }
});