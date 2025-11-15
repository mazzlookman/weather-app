interface WeatherData {
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
}

let currentPage = 1;
let rowsPerPage = 10;
let renderedData: { time: string; temperature: number }[] = [];
let filteredData: { time: string; temperature: number }[] = [];

async function fetchWeatherData() {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&hourly=temperature_2m";

  try {
    const response = await fetch(url);
    const data: WeatherData = await response.json();
    prepareData(data);
    populateDateFilter();
    applyFilter(); // Default tanpa filter
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

function prepareData(data: WeatherData) {
  renderedData = data.hourly.time.map((time, index) => ({
    time,
    temperature: data.hourly.temperature_2m[index],
  }));

  // Sort DESC based on time
  renderedData.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

function populateDateFilter() {
  const dateSelect = document.getElementById("date-filter") as HTMLSelectElement;

  // Ambil tanggal unik dari time, lalu sort ASC
  const uniqueDates = [
    ...new Set(renderedData.map((entry) => entry.time.split("T")[0])),
  ].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  uniqueDates.forEach((date) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = new Date(date).toLocaleDateString("id-ID"); // Format lokal
    dateSelect.appendChild(option);
  });

  // Event listener untuk filter
  dateSelect.addEventListener("change", () => {
    currentPage = 1;
    applyFilter();
  });
}

function applyFilter() {
  const selectedDate = (document.getElementById("date-filter") as HTMLSelectElement).value;

  if (selectedDate) {
    filteredData = renderedData.filter((entry) => entry.time.startsWith(selectedDate));
    // Keep filtered dates DESC (paling baru di atas)
    filteredData.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  } else {
    filteredData = [...renderedData]; // Copy all data
    // Sort ascending jika filter ALL
    filteredData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }

  currentPage = 1;
  setupPagination();
  displayPage(currentPage);
}

function setupPagination() {
  const pagination = document.getElementById("pagination") as HTMLElement;
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;

    li.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      displayPage(currentPage);
      setupPagination();
    });

    pagination.appendChild(li);
  }
}

function displayPage(page: number) {
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const tableBody = document.getElementById("weather-table-body") as HTMLElement;
  tableBody.innerHTML = "";

  const pageData = filteredData.slice(start, end);

  pageData.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(entry.time).toLocaleString("id-ID")}</td>
      <td>${renderTemperatureBadge(entry.temperature)}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderTemperatureBadge(temp: number): string {
  let badgeClass = "badge-warm";

  if (temp < 20) {
    badgeClass = "badge-cold";
  } else if (temp > 30) {
    badgeClass = "badge-hot";
  }

  return `<span class="badge ${badgeClass}">${temp} °C</span>`;
}

fetchWeatherData();
