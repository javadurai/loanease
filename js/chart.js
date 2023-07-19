/**
 * Loan Repayment Visualization Script
 *
 * This script visualizes a loan repayment schedule by generating two types of charts:
 * a Pie chart and a Bar chart. The Pie chart shows the breakdown of the total payment
 * between the Principal Amount and the Total Interest. The Bar chart illustrates the
 * yearly repayments, including the principal and interest amounts, as well as the
 * remaining balance at the end of each year.
 *
 * This script is designed to work with the Chart.js library and the ChartDataLabels
 * plugin. Make sure these libraries are properly installed and imported before running
 * this script.
 *
 * Code Audit Details:
 *
 * - Last audited: July 16, 2023
 * - Audited by: Jabadurai Selvaraj
 * - Result of Audit: The script is running as expected and generates accurate charts
 *   based on the provided loan repayment schedule. No bugs or issues were found during
 *   the audit.
 *
 * Please maintain this audit trail for future code reviews and improvements.
 */

// Define constants
const PIE_CHART_COLORS = ["#28a745", "#dd5182"];
const PIE_CHART_LABELS = ["Principal Amount", "Total Interest"];
const BAR_CHART_principal_COLOR = "rgb(25, 135, 84)";
const BAR_CHART_INTEREST_COLOR = "rgb(220, 53, 69)";
const BAR_CHART_BALANCE_COLOR = "rgb(108, 117, 125)";
const BAR_CHART_POINT_COLOR = "white";
const AMOUNT_LABELS = {
  principal: "principal",
  Interest: "Interest",
  Balance: "Balance",
};
const TOOLTIP_STYLE = {
  borderColor: "rgb(0, 0, 255)",
  backgroundColor: "rgb(255, 0, 0)",
  borderWidth: 2,
  borderDash: [2, 2],
  borderRadius: 2,
};
let barChartYearlyData = [];

// Function to construct individual dataset for the bar chart
const createBarChartDataset = (label, backgroundColor, pointStyle, data, yAxisID, order, stack, type) => {
  return {
    label,
    backgroundColor,
    pointStyle,
    data,
    yAxisID,
    order,
    stack,
    type,
  };
};

// Function to construct pie chart data
const constructPieChartData = (data = [0, 0]) => {
  return {
    labels: PIE_CHART_LABELS,
    datasets: [
      {
        data,
        backgroundColor: PIE_CHART_COLORS,
      },
    ],
  };
};

// Function to accumulate and group data for bar chart by year
const accumulateBarChartData = (data = []) => {
  // Group data by year and calculate the sum of principal, monthlyInterest, and remainingLoanAmount for each year
  let groupedDataByYear = data.reduce((accumulator, currentValue) => {
    let year = currentValue.installmentDate.split(" ")[1];
    if (!accumulator[year]) {
      accumulator[year] = {
        principal: 0,
        interest: 0,
        remainingLoanAmount: Infinity, // set initial remainingLoanAmount to Infinity
        loanPaid: 0,
      };
    }
    accumulator[year].principal += parseInt(currentValue.principal.replace(",", ""));
    accumulator[year].interest += parseInt(currentValue.monthlyInterest);
    let currentBalance = parseInt(currentValue.remainingLoanAmount.replace(",", ""));
    accumulator[year].remainingLoanAmount = Math.min(accumulator[year].remainingLoanAmount, currentBalance); // update only if current balance is lower
    accumulator[year].loanPaid = parseFloat(currentValue.loanPaid);
    return accumulator;
  }, {});

  barChartYearlyData = groupedDataByYear;
  // Extract labels/dates, principal, monthlyInterest and remainingLoanAmount datasets
  let labels = Object.keys(groupedDataByYear);
  let principal = Object.values(groupedDataByYear).map((item) => item.principal);
  let interest = Object.values(groupedDataByYear).map((item) => item.interest);
  let remainingLoanAmount = Object.values(groupedDataByYear).map((item) => item.remainingLoanAmount);

  return {
    labels: labels,
    datasets: [createBarChartDataset("principal", BAR_CHART_principal_COLOR, "rect", principal, "bar-y-axis", 2, "combined", "bar"), createBarChartDataset("Interest", BAR_CHART_INTEREST_COLOR, "triangle", interest, "bar-y-axis", 3, "combined", "bar"), createBarChartDataset("Balance", BAR_CHART_BALANCE_COLOR, BAR_CHART_POINT_COLOR, remainingLoanAmount, "line-y-axis", 1, "combined", "line")],
  };
};

// Function to construct pie chart options
const constructPieChartOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        formatter: (value, ctx) => {
          const dataArr = ctx.chart.data.datasets[0].data;
          const sum = dataArr.reduce((a, b) => a + b, 0);
          const percentage = ((value * 100) / sum).toFixed(2) + "%";
          return percentage;
        },
        color: "#fff",
        font: {
          weight: "bold",
        },
      },
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: (context) => {
            return "circle";
          },
        },
      },
      title: {
        display: true,
        text: "Break-up of Total Payment",
      },
    },
  };
};

// Helper function to generate chart options
const createLabelStrings = (label, key, axisData) => {
  if (label === AMOUNT_LABELS.Balance) {
    return [`Year: ${key}`, `Balance: $${AMOUNT_FORMAT.format(axisData.remainingLoanAmount)}`, `Cumulative Repayment: ${axisData.loanPaid.toFixed(2)}%`];
  }

  return [`Year: ${key}`, `${label}: $${AMOUNT_FORMAT.format(axisData[label.toLowerCase()])}`, `Total Payment: $${AMOUNT_FORMAT.format(axisData.principal + axisData.interest)}`];
};

// Function to construct bar chart options
const constructBarChartOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: "#fff",
        font: { weight: "bold" },
        display: false,
      },
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        usePointStyle: false,
        displayColors: false,
        callbacks: {
          labelColor: (context) => TOOLTIP_STYLE,
          labelTextColor: (context) => "#fff",
          title: (context) => "",
          label: (context) => {
            const label = context.dataset.label || "";
            const key = context.label;
            const axisData = barChartYearlyData[key];
            return createLabelStrings(label, key, axisData);
          },
        },
      },
      title: {
        display: true,
        text: "Payment Per Year",
      },
    },
    scales: {
      "bar-y-axis": {
        position: "right",
        beginAtZero: false,
        title: {
          display: true,
          text: "Principal and Interest",
        },
        grid: { display: false },
      },
      "line-y-axis": {
        position: "left",
        beginAtZero: false,
        title: {
          display: true,
          text: "Balance",
        },
        grid: { display: false },
      },
    },
  };
};

// Initialize the charts
const pieChart = new Chart(document.getElementById("pie-chart-area"), {
  type: "pie",
  data: constructPieChartData(),
  options: constructPieChartOptions(),
  plugins: [ChartDataLabels],
});

const barChart = new Chart(document.getElementById("bar-chart-area"), {
  type: "bar",
  data: accumulateBarChartData(),
  options: constructBarChartOptions(),
  plugins: [ChartDataLabels],
});

// Function to update and render the chart
const renderChart = (principal, monthlyInterest, schedule) => {
  pieChart.data.datasets[0].data = [principal, monthlyInterest];
  pieChart.update();

  let updatedBarChartData = accumulateBarChartData(schedule);

  // Update the labels of the chart
  barChart.data.labels = updatedBarChartData.labels;

  // Update each dataset in the chart
  updatedBarChartData.datasets.forEach((dataset, i) => {
    barChart.data.datasets[i].data = dataset.data;
  });

  // Update the chart to reflect the new data
  barChart.update();
};
