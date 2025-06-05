// ========== DOM ELEMENT SELECTION ==========
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const recentDropdown = document.getElementById("recent-dropdown");

// ======= API Key for OpenWeatherMap (Replace if needed) =======
const API_KEY = "c2e8a7f5e127929152d99a003dc25149";

// ========== FUNCTION TO UPDATE RECENT SEARCHES ==========
const updateRecentCities = (city) => {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];

  if (!cities.includes(city)) {
    cities.unshift(city); // Add new city to start
    if (cities.length > 5) cities.pop(); // Keep max 5 entries
    localStorage.setItem("recentCities", JSON.stringify(cities));
  }

  renderRecentCities(); // Re-render dropdown
};

// ========== FUNCTION TO RENDER RECENT SEARCH DROPDOWN ==========
const renderRecentCities = () => {
  const cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  recentDropdown.innerHTML = "";

  if (cities.length === 0) {
    recentDropdown.classList.add("hidden");
    return;
  }

  recentDropdown.classList.remove("hidden");
  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    recentDropdown.appendChild(option);
  });
};

// ========== FUNCTION TO CREATE WEATHER CARD HTML ==========
const createWeatherCard = (cityName, weatherItem, index) => {
  const date = weatherItem.dt_txt.split(" ")[0];
  const tempC = (weatherItem.main.temp - 273.15).toFixed(2);
  const icon = weatherItem.weather[0].icon;
  const desc = weatherItem.weather[0].description;
  const wind = weatherItem.wind.speed;
  const humidity = weatherItem.main.humidity;

  // First card = Current weather
  if (index === 0) {
    return `
      <div class="details">
        <h2 class="text-2xl font-semibold">${cityName} (${date})</h2>
        <h6 class="mt-2">Temperature: ${tempC}°C</h6>
        <h6>Wind: ${wind} M/S</h6>
        <h6>Humidity: ${humidity}%</h6>
      </div>
      <div class="icon text-center">
        <img class="w-[100px] -mt-2" src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="icon" />
        <h6 class="capitalize -mt-2">${desc}</h6>
      </div>
    `;
  }

  // Cards for upcoming days
  return `
    <li class="card bg-gray-600 text-white p-4 rounded">
      <h3 class="text-lg font-semibold">(${date})</h3>
      <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="icon" class="w-[70px] mx-auto" />
      <h6>Temp: ${tempC}°C</h6>
      <h6>Wind: ${wind} M/S</h6>
      <h6>Humidity: ${humidity}%</h6>
    </li>
  `;
};

// ========== FETCH WEATHER DATA BY COORDINATES ==========
const getWeatherDetails = (cityName, lat, lon) => {
  const URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

  fetch(URL)
    .then(res => res.json())
    .then(data => {
      const uniqueDays = [];
      const fiveDays = data.list.filter(item => {
        const day = new Date(item.dt_txt).getDate();
        if (!uniqueDays.includes(day)) return uniqueDays.push(day);
      });

      // Clear existing UI
      cityInput.value = "";
      currentWeatherDiv.innerHTML = "";
      weatherCardsDiv.innerHTML = "";

      // Inject new cards
      fiveDays.forEach((item, index) => {
        const cardHTML = createWeatherCard(cityName, item, index);
        if (index === 0) {
          currentWeatherDiv.insertAdjacentHTML("beforeend", cardHTML);
        } else {
          weatherCardsDiv.insertAdjacentHTML("beforeend", cardHTML);
        }
      });
    })
    .catch(() => alert("Failed to fetch weather data. Try again later."));
};

// ========== CITY SEARCH: FROM INPUT ==========
const getCityCoordinates = () => {
  const cityName = cityInput.value.trim();

  if (!cityName) {
    alert("Please enter a valid city name.");
    return;
  }

  const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

  fetch(geoURL)
    .then(res => res.json())
    .then(data => {
      if (!data.length) return alert(`No results for "${cityName}".`);
      const { lat, lon, name, country } = data[0];
      const formattedName = `${name}, ${country}`;
      updateRecentCities(formattedName);
      getWeatherDetails(formattedName, lat, lon);
    })
    .catch(() => alert("Error fetching city coordinates."));
};

// ========== CURRENT LOCATION WEATHER ==========
const getUserCoordinates = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const revURL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

      fetch(revURL)
        .then(res => res.json())
        .then(data => {
          const { name, country } = data[0];
          const city = `${name}, ${country}`;
          updateRecentCities(city);
          getWeatherDetails(city, latitude, longitude);
        })
        .catch(() => alert("Failed to fetch location info."));
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        alert("Location permission denied. Please enable it and try again.");
      } else {
        alert("Error accessing your location.");
      }
    }
  );
};

// ========== EVENT LISTENERS ==========
searchButton.addEventListener("click", getCityCoordinates);
locationButton.addEventListener("click", getUserCoordinates);
recentDropdown.addEventListener("change", () => {
  cityInput.value = recentDropdown.value;
  getCityCoordinates();
});
cityInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") getCityCoordinates();
});

// ========== INITIALIZATION ==========
renderRecentCities();
