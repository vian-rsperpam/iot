// Blynk Auth Token (replace with your actual token)
const authToken = "YsbTfvxeT2ELebjYFtpheuUsBqCJFlh_";

// Target specific HTML elements
const sideMenu = document.querySelector("aside");
const menuBtn = document.querySelector("#menu-btn");
const closeBtn = document.querySelector("#close-btn");
const themeToggler = document.querySelector(".theme-toggler");

const temperatureHistoryDiv = document.getElementById("temperature-history");
const humidityHistoryDiv = document.getElementById("humidity-history");
const temperatureGaugeDiv = document.getElementById("temperature-gauge");
const humidityGaugeDiv = document.getElementById("humidity-gauge");

const historyCharts = [temperatureHistoryDiv, humidityHistoryDiv];
const gaugeCharts = [temperatureGaugeDiv, humidityGaugeDiv];

let newTempXArray = [], newTempYArray = [], newHumidityXArray = [], newHumidityYArray = [];
const MAX_GRAPH_POINTS = 12;

let chartBGColor = getComputedStyle(document.body).getPropertyValue("--chart-background");
let chartFontColor = getComputedStyle(document.body).getPropertyValue("--chart-font-color");
let chartAxisColor = getComputedStyle(document.body).getPropertyValue("--chart-axis-color");

// Initialize Chart and Gauge layouts
function initializeCharts() {
  const temperatureTrace = {
    x: [], y: [], name: "Temperature", mode: "lines+markers", type: "line",
  };
  const humidityTrace = {
    x: [], y: [], name: "Humidity", mode: "lines+markers", type: "line",
  };

  const layoutConfig = {
    autosize: true,
    font: { size: 12, color: chartFontColor, family: "poppins, san-serif" },
    colorway: ["#05AD86"],
    margin: { t: 40, b: 40, l: 60, r: 60, pad: 10 },
    plot_bgcolor: chartBGColor,
    paper_bgcolor: chartBGColor,
    xaxis: { color: chartAxisColor, linecolor: chartAxisColor, autorange: true },
    yaxis: { color: chartAxisColor, linecolor: chartAxisColor, autorange: true },
  };

  Plotly.newPlot(temperatureHistoryDiv, [temperatureTrace], { ...layoutConfig, title: { text: "Temperature" } });
  Plotly.newPlot(humidityHistoryDiv, [humidityTrace], { ...layoutConfig, title: { text: "Humidity" } });

  const gaugeLayout = { width: 300, height: 250, margin: { t: 0, b: 0, l: 0, r: 0 } };
  const gaugeDataTemplate = {
    domain: { x: [0, 1], y: [0, 1] },
    value: 0,
    type: "indicator",
    mode: "gauge+number+delta",
    delta: { reference: 30 },
    gauge: { axis: { range: [null, 50] }, steps: [{ range: [0, 20], color: "lightgray" }, { range: [20, 30], color: "gray" }] },
  };

  Plotly.newPlot(temperatureGaugeDiv, [{ ...gaugeDataTemplate, title: { text: "Temperature" } }], gaugeLayout);
  Plotly.newPlot(humidityGaugeDiv, [{ ...gaugeDataTemplate, title: { text: "Humidity" } }], gaugeLayout);
}

// Event listeners for toggling side menu and theme
menuBtn.addEventListener("click", () => { sideMenu.style.display = "block"; });
closeBtn.addEventListener("click", () => { sideMenu.style.display = "none"; });
themeToggler.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme-variables");
  themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
  themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");

  chartBGColor = getComputedStyle(document.body).getPropertyValue("--chart-background");
  chartFontColor = getComputedStyle(document.body).getPropertyValue("--chart-font-color");
  chartAxisColor = getComputedStyle(document.body).getPropertyValue("--chart-axis-color");
  updateChartsBackground();
});

// Function to fetch data from Blynk
async function fetchData(pin) {
  const response = await fetch(`https://blynk.cloud/external/api/get?token=${authToken}&${pin}`);
  return parseFloat(await response.text());
}

// Retrieve sensor readings from Blynk and update UI
async function retrieveSensorReadings() {
  try {
    const temperature = await fetchData("V0");
    const humidity = await fetchData("V1");
    updateSensorReadings({ temperature, humidity });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Function to update HTML elements and charts
function updateSensorReadings({ temperature, humidity }) {
  document.getElementById("temperature").innerHTML = `${temperature} °C`;
  document.getElementById("humidity").innerHTML = `${humidity} %`;
  updateGauge(temperature, humidity);
  updateCharts(temperatureHistoryDiv, newTempXArray, newTempYArray, temperature);
  updateCharts(humidityHistoryDiv, newHumidityXArray, newHumidityYArray, humidity);
}

// Update gauge charts
function updateGauge(temperature, humidity) {
  Plotly.update(temperatureGaugeDiv, { value: temperature }, [0]);
  Plotly.update(humidityGaugeDiv, { value: humidity }, [0]);
}

// Update line charts
function updateCharts(lineChartDiv, xArray, yArray, sensorRead) {
  const timestamp = new Date();
  if (xArray.length >= MAX_GRAPH_POINTS) xArray.shift();
  if (yArray.length >= MAX_GRAPH_POINTS) yArray.shift();
  xArray.push(timestamp);
  yArray.push(sensorRead);
  Plotly.update(lineChartDiv, { x: [xArray], y: [yArray] });
}

// Apply dark mode to charts
function updateChartsBackground() {
  const updateSettings = {
    plot_bgcolor: chartBGColor,
    paper_bgcolor: chartBGColor,
    font: { color: chartFontColor },
    xaxis: { color: chartAxisColor, linecolor: chartAxisColor },
    yaxis: { color: chartAxisColor, linecolor: chartAxisColor },
  };
  historyCharts.forEach((chart) => Plotly.relayout(chart, updateSettings));
  gaugeCharts.forEach((chart) => Plotly.relayout(chart, updateSettings));
}

// Initialize charts on load
window.addEventListener("load", initializeCharts);

// Retrieve data every 5 seconds
setInterval(retrieveSensorReadings, 5000);
