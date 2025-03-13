document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("investment-form");
  const typeSelect = document.getElementById("type");
  const customTypeField = document.getElementById("custom-type-field");
  const customTypeInput = document.getElementById("custom-type");
  const investmentList = document.getElementById("investment-list");
  const totalAmountDisplay = document.getElementById("total-amount");
  const totalInvestedDisplay = document.getElementById("total-invested"); // New
  const totalMonthlyDisplay = document.getElementById("total-monthly");
  const chartCanvas = document.getElementById("growth-chart");

  let investments = JSON.parse(localStorage.getItem("investments")) || [];
  let chart;

  // Function to calculate Future Value considering Step-Up
  const calculateFutureValue = (monthly, rate, years, stepUp = 0) => {
    const i = rate / 12 / 100; // Monthly interest rate
    const totalMonths = years * 12;
    let futureValue = 0;

    for (let year = 0; year < years; year++) {
      let increasedSIP = monthly * Math.pow(1 + stepUp / 100, year);
      for (let month = 0; month < 12; month++) {
        let monthsRemaining = totalMonths - (year * 12 + month);
        futureValue += increasedSIP * Math.pow(1 + i, monthsRemaining);
      }
    }
    return futureValue.toFixed(2);
  };

  // Function to calculate Total Invested Amount
  const calculateInvestedAmount = (monthly, years, stepUp = 0) => {
    let totalInvested = 0;
    for (let year = 0; year < years; year++) {
      let yearlyInvestment = monthly * Math.pow(1 + stepUp / 100, year) * 12;
      totalInvested += yearlyInvestment;
    }
    return totalInvested.toFixed(2);
  };

  // Function to format numbers with "L" and "Cr"
  const formatNumber = (num) => {
    const value = parseFloat(num);
    if (value >= 1e7) {
      return `${(value / 1e7).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })} Cr`;
    } else if (value >= 1e5) {
      return `${(value / 1e5).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })} L`;
    } else {
      return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    }
  };

  // Render investment list with invested amount
  const renderInvestments = () => {
    investmentList.innerHTML = "";

    if (investments.length === 0) {
      document.getElementById("results").style.display = "none";
      if (chart) {
        chart.destroy();
        chart = null;
      }
      totalAmountDisplay.innerText = "₹0.00";
      totalInvestedDisplay.innerText = "₹0.00"; // Reset total invested amount
      totalMonthlyDisplay.innerText = "₹0.00";
      chartCanvas.style.display = "none";
    } else {
      document.getElementById("results").style.display = "block";

      let totalProjected = 0;
      let totalInvested = 0;
      let totalMonthly = 0;

      investments.forEach((inv, index) => {
        const futureValue = calculateFutureValue(
          inv.monthly,
          inv.rate,
          inv.years,
          inv.stepUp
        );
        const investedAmount = calculateInvestedAmount(
          inv.monthly,
          inv.years,
          inv.stepUp
        );

        totalProjected += parseFloat(futureValue);
        totalInvested += parseFloat(investedAmount);
        totalMonthly += inv.monthly;

        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${inv.type}</strong>: ₹${inv.monthly} monthly, ${
          inv.rate
        }% return, ${inv.years} years, Step-Up: ${inv.stepUp}%.
          <br><strong>Projected Value:</strong> ${formatNumber(futureValue)}
          <br><strong>Invested Amount:</strong> ${formatNumber(investedAmount)}
          <button onclick="deleteInvestment(${index})">X</button>
        `;
        li.addEventListener("click", () => {
          if (investments.length) {
            renderGraph(inv);
          }
        });
        investmentList.appendChild(li);
      });

      totalAmountDisplay.innerText = formatNumber(totalProjected);
      totalInvestedDisplay.innerText = formatNumber(totalInvested); // Display total invested
      totalMonthlyDisplay.innerText = formatNumber(totalMonthly);
    }
  };

  const renderGraph = (investment) => {
    const { monthly, rate, years, stepUp } = investment;
    const labels = [];
    const contributions = [];
    const interest = [];

    let currentMonthly = monthly;
    let totalContribution = 0;

    for (let i = 1; i <= years; i++) {
      const annualContribution = currentMonthly * 12;
      totalContribution += annualContribution;
      const futureValue = calculateFutureValue(monthly, rate, i, stepUp);

      labels.push(`${i} Yr`);
      contributions.push(totalContribution);
      interest.push(futureValue - totalContribution);

      currentMonthly *= 1 + stepUp / 100;
    }

    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Contribution",
            data: contributions,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
          {
            label: "Interest Earned",
            data: interest,
            backgroundColor: "rgba(153, 102, 255, 0.6)",
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

    chartCanvas.style.display = "block";
  };

  window.deleteInvestment = (index) => {
    investments.splice(index, 1);
    localStorage.setItem("investments", JSON.stringify(investments));
    renderInvestments();
  };

  typeSelect.addEventListener("change", () => {
    customTypeField.style.display =
      typeSelect.value === "Other" ? "block" : "none";
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
    const stepUp = parseFloat(document.getElementById("Step-Up").value) || 0;
    const rate = parseFloat(document.getElementById("rate").value);
    const years = parseInt(document.getElementById("duration").value);

    const newInvestment = { type, monthly, rate, years, stepUp };
    investments.push(newInvestment);
    localStorage.setItem("investments", JSON.stringify(investments));
    renderInvestments();
  });

  renderInvestments();
});
