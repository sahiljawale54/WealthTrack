document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("investment-form");
  const typeSelect = document.getElementById("type");
  const customTypeField = document.getElementById("custom-type-field");
  const customTypeInput = document.getElementById("custom-type");
  const investmentList = document.getElementById("investment-list");
  const totalAmountDisplay = document.getElementById("total-amount");
  const totalMonthlyDisplay = document.getElementById("total-monthly");
  const chartCanvas = document.getElementById("growth-chart");

  let investments = JSON.parse(localStorage.getItem("investments")) || [];
  let chart; // To hold the Chart.js instance

  const calculateFutureValue = (monthly, rate, years) => {
    const i = rate / 12 / 100; // Monthly rate of interest
    const n = years * 12; // Total number of payments

    const M = monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i); // Formula for SIP maturity value

    return M.toFixed(2); // Return the result formatted to 2 decimal places

    // return futureValue.toFixed(2);
  };

  const formatWithCommasAndCrore = (num) => {
    const value = parseFloat(num) / 1e7; // Convert to crore
    return `${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Cr`;
  };

  const renderInvestments = () => {
    investmentList.innerHTML = "";

    if (investments.length === 0) {
      document.getElementById("results").style.display = "none";

      if (chart) {
        chart.destroy(); // Destroy the chart if it exists
        chart = null;
      }
      totalAmountDisplay.innerText = "₹0.00";
      totalMonthlyDisplay.innerText = "₹0.00";
      chartCanvas.style.display = "none"; // Hide the chart
    } else {
      document.getElementById("results").style.display = "block";

      let totalProjected = 0;
      let totalMonthly = 0;

      investments.forEach((inv, index) => {
        const futureValue = calculateFutureValue(
          inv.monthly,
          inv.rate,
          inv.years
        );
        totalProjected += parseFloat(futureValue);
        totalMonthly += inv.monthly;

        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${inv.type}</strong>: ₹${inv.monthly} monthly, ${
          inv.rate
        }% return for ${inv.years} years.
          <br>Projected Value: ₹${formatWithCommasAndCrore(futureValue)}
          <button onclick="deleteInvestment(${index})">X</button>
        `;
        li.addEventListener("click", () => {
          if (investments.length) {
            renderGraph(inv);
          }
        });
        investmentList.appendChild(li);
      });

      totalAmountDisplay.innerText = formatWithCommasAndCrore(totalProjected);
      totalMonthlyDisplay.innerText = totalMonthly;
    }
  };

  const renderGraph = (investment) => {
    const { monthly, rate, years } = investment;
    const labels = [];
    const contributions = [];
    const interest = [];

    for (let i = 1; i <= years; i++) {
      const annualContribution = monthly * 12 * i;
      const futureValue = calculateFutureValue(monthly, rate, i);
      labels.push(`${i} Yr`);
      contributions.push(annualContribution); // Convert to crore
      interest.push(futureValue - annualContribution); // Convert to crore
    }

    if (chart) chart.destroy(); // Destroy the previous chart if it exists

    chart = new Chart(chartCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Contribution",
            data: contributions,
            backgroundColor: "rgba(75, 192, 192)",
          },
          {
            label: "Interest Earned",
            data: interest,
            backgroundColor: "rgba(153, 102, 255)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    chartCanvas.style.display = "block"; // Show the chart
  };

  window.deleteInvestment = (index) => {
    investments.splice(index, 1);
    localStorage.setItem("investments", JSON.stringify(investments));
    renderInvestments();
  };

  typeSelect.addEventListener("change", () => {
    if (typeSelect.value === "Other") {
      customTypeField.style.display = "block";
    } else {
      customTypeField.style.display = "none";
      customTypeInput.value = "";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let type = typeSelect.value;
    if (type === "Other") {
      type = customTypeInput.value.trim();
      if (!type) {
        alert("Please enter a custom type.");
        return;
      }
    }

    const monthly = parseFloat(document.getElementById("amount").value);
    const rate = parseFloat(document.getElementById("rate").value);
    const years = parseInt(document.getElementById("duration").value);

    const newInvestment = { type, monthly, rate, years };
    investments.push(newInvestment);
    localStorage.setItem("investments", JSON.stringify(investments));
    // form.reset();
    renderInvestments();
  });

  renderInvestments();
});
