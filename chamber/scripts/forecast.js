const today = document.querySelector('#today');
const tomorrow = document.querySelector('#tomorrow');
const dayAfter = document.querySelector('#day-after');

const forecastKey = "34d1509fdd133fa5d098f80e900a17f3"
const forecastLat = "7.9527706"
const forecastLong = "-1.0307118"

const forecastURL = `//api.openweathermap.org/data/2.5/forecast?lat=${forecastLat}&lon=${forecastLong}&appid=${forecastKey}&units=imperial`

async function apiFetch() {
  try {
    const res = await fetch(forecastURL);
    if (res.ok) {
      const data = await res.json();
      displayForecast(data);
    } else {
        throw Error(await res.text());
    }
  } catch (error) {
      console.log(error);
  }
}

function displayForecast(data) {
  today.innerHTML = `Today: ${data.list[0].main.temp.toFixed(0)}°F`
  tomorrow.innerHTML = `Tomorrow: ${data.list[1].main.temp.toFixed(0)}°F`
  dayAfter.innerHTML = `Day After: ${data.list[2].main.temp.toFixed(0)}°F`
}

apiFetch();