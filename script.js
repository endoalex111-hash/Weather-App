const apiKey = 'PJA9PASQNQDF7JF4SUV97TUQE';

/* Fetch weather from Visual Crossing API */
async function getWeather(location) {
    try {
        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?unitGroup=metric&key=${apiKey}&include=hours`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.errorCode || !data.days) {
            return null;
        }

        return data;
    } catch (error) {
        console.error("API fetch error:", error);
        return null;
    }
}

/* Map condition to Feather icon */
function getWeatherIcon(condition = "") {
    condition = condition.toLowerCase();

    if (condition.includes("cloud")) return "cloud";
    if (condition.includes("rain")) return "cloud-rain";
    if (condition.includes("clear")) return "sun";
    if (condition.includes("snow")) return "cloud-snow";
    if (condition.includes("wind")) return "wind";

    return "cloud";
}

/* Display current weather */
function displayCurrentWeather(data) {
    if (!data || !data.days) {
        document.getElementById("weatherDisplay").innerHTML = "No weather data available";
        return;
    }

    // ✅ Use currentConditions OR fallback to today's data
    const current = data.currentConditions || data.days[0];

    const icon = getWeatherIcon(current.conditions || "");

    document.getElementById("weatherDisplay").innerHTML = `
        <div class="container__location-data">
            <h2>${data.resolvedAddress}</h2>
        </div>
        <div class="container__weather-info">
            <i data-feather="${icon}" class="weather-icon"></i>
            <div class="weather-info">
                <p>${current.conditions || "N/A"}</p>
                <p>🌡️ ${current.temp ?? current.tempmax ?? "--"} °C</p>
                <p>💨 ${current.windspeed ?? "--"} km/h</p>
                <p>🌧️ ${current.precipprob ?? 0}%</p>
            </div>
        </div>
    `;

    if (window.feather) feather.replace();
}

/* Display 24-hour forecast */
function displayHourly(data) {
    if (!data || !data.days || !data.days[0].hours) return;

    const hours = data.days[0].hours;
    const now = new Date().getHours();

    let html = "";

    hours.slice(now, now + 24).forEach(hour => {
        const icon = getWeatherIcon(hour.conditions);
        const time = hour.datetime ? hour.datetime.slice(0,5) : '';

        html += `
        <div class="hour-card">
            <p>${time}</p>
            <i data-feather="${icon}"></i>
            <p>${hour.temp}°C</p>
        </div>
        `;
    });

    document.getElementById("hourlyDisplay").innerHTML = html;

    if (window.feather) feather.replace();
}

/* Show loading state */
function showLoading() {
    document.getElementById("weatherDisplay").innerHTML = "Loading...";
    document.getElementById("hourlyDisplay").innerHTML = "";
}

let currentLocation = "";

/* Search button */
document.getElementById("searchBtn").addEventListener("click", async () => {
    const location = document.getElementById("locationInput").value.trim();
    if (!location) return alert("Please enter a location");

    currentLocation = location;
    showLoading();

    const data = await getWeather(location);
    if (!data) {
        document.getElementById("weatherDisplay").innerHTML = "Location not found";
        return;
    }

    displayCurrentWeather(data);
    displayHourly(data);
});

/* Refresh button */
document.getElementById("refreshBtn").addEventListener("click", async () => {
    if (!currentLocation) return;
    showLoading();

    const data = await getWeather(currentLocation);
    if (!data) {
        document.getElementById("weatherDisplay").innerHTML = "Location not found";
        return;
    }

    displayCurrentWeather(data);
    displayHourly(data);
});

/* Auto-detect user location */
navigator.geolocation.getCurrentPosition(
    async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        currentLocation = `${lat},${lon}`;

        const data = await getWeather(currentLocation);
        displayCurrentWeather(data);
        displayHourly(data);
    },
    () => {
        document.getElementById("weatherDisplay").innerHTML = "Location access denied";
    }
);

const slider = document.getElementById("hourlyDisplay");

let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
});

slider.addEventListener("mouseleave", () => {
    isDown = false;
});

slider.addEventListener("mouseup", () => {
    isDown = false;
});

slider.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
});
