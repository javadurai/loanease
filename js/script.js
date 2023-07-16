// Constant variables for number formatting and date picker format
const AMOUNT_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const DATE_PICKER_FORMAT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" });
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" });
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Field selectors
const loanAmountField = document.querySelector("#loan_amount");
const interestRateField = document.querySelector("#interest_rate");
const loanPeriodField = document.querySelector("#loan_period");
const loanStartDateField = document.querySelector("#loan_start_date");
const partPayInstallmentField = document.querySelector("#part_payment_installment");
const monthlyPaymentAmountField = document.querySelector("#monthly_installment");
const numberOfPaymentsField = document.querySelector("#total_installments");
const actNumberOfPaymentsField = document.querySelector("#actual_installments_made");
const totalExtraPaymentsField = document.querySelector("#total_prepayments_made");
const totalInterestField = document.querySelector("#total_interest_payable");
const whatYouSavedField = document.querySelector("#total_savings");
const earlyPaymentsSection = document.querySelector("#early_payments_section");
const totalPaymentHeader = document.querySelector("#total_payment_hdr");

// Table selectors
const amortTable = document.querySelector("#amortization_table");
const amortTableBody = amortTable.querySelector("tbody");

// const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
// const popoverList = [...popoverTriggerList].map((popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl));

const currentDate = new Date()
  .toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })
  .split(" ")
  .join("-");

const defaultValues = {
  loanAmount: "50,000",
  interestRate: "5.8",
  loanPeriod: "4",
  loanStartDate: currentDate,
  partPayInstallment: "",
  partPayment: "off",
};

// Define pie chart colors and labels as constants
const CHART_COLORS = ["#28a745", "#dd5182"];
const CHART_LABELS = ["Principal Amount", "Total Interest"];

// Function to generate chart data
const generatePieChartData = (data = [0, 0]) => {
  return {
    labels: CHART_LABELS,
    datasets: [
      {
        data,
        backgroundColor: CHART_COLORS,
      },
    ],
  };
};

// Function to generate chart options
const generatePieChartOptions = () => {
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
          pointStyle: "circle",
        },
      },
    },
  };
};

// Initialize the chart
const pieChart = new Chart(document.getElementById("chart-area"), {
  type: "pie",
  data: generatePieChartData(),
  options: generatePieChartOptions(),
  plugins: [ChartDataLabels],
});

// Function to update and render the chart
const renderPieChart = (principle, interest) => {
  pieChart.data.datasets[0].data = [principle, interest];
  pieChart.update();
};

// month picker
$(".monthpicker")
  .datepicker({
    format: "MM-yyyy",
    minViewMode: "months",
    autoclose: true,
  })
  .on("change", calculateEmiAmount);

// Set up event listeners
loanAmountField.addEventListener("change", calculateEmiAmount);
interestRateField.addEventListener("change", calculateEmiAmount);
loanPeriodField.addEventListener("change", calculateEmiAmount);
loanStartDateField.addEventListener("change", calculateEmiAmount);
partPayInstallmentField.addEventListener("change", calculateEmiAmount);

// Calculate EMI amount on document load
window.addEventListener("DOMContentLoaded", calculateEmiAmount);

function areRequiredFieldsNotEmpty(fields) {
  return fields.every(isFieldNotEmpty);
}

function isFieldNotEmpty(field) {
  return Boolean(field.value);
}

// Function to format the input values
const formatInputValue = (inputValue) => {
  return Number(inputValue.replace(/,/g, ""));
};

// Function to calculate the monthly payment
const calculateMonthlyPayment = (loanAmount, interestRate, totalPayments) => {
  const rateVariable = Math.pow(1 + interestRate, totalPayments);
  return Math.round(loanAmount * interestRate * (rateVariable / (rateVariable - 1)));
};

// Function to populate extra payment schedule
const populateExtraPaymentSchedule = (partPayment, partPayInstallment, totalPayments, partPaymentFrequency, extraPaymentsList) => {
  const extraPaymentSchedule = new Map();
  const frequencyFactor = partPaymentFrequency == "monthly" ? 1 : partPaymentFrequency == "quarterly" ? 4 : 12;

  if (partPayment == "scheduled_plan") {
    for (let index = 0; index < totalPayments; index++) {
      extraPaymentSchedule.set(index + 1, index % frequencyFactor == 0 ? partPayInstallment : null);
    }
  } else {
    extraPaymentsList.forEach((payment) => {
      if (isFieldNotEmpty(payment)) {
        extraPaymentSchedule.set(Number(payment.getAttribute("data-index")) + 1, formatInputValue(payment.value));
      }
    });
  }

  return extraPaymentSchedule;
};

// Main function to calculate EMI amount
function calculateEmiAmount() {
  // Validate input fields
  if (!areRequiredFieldsNotEmpty([loanAmountField, interestRateField, loanPeriodField, loanStartDateField])) {
    return;
  }

  const loanAmount = formatInputValue(loanAmountField.value);
  let interestRate = interestRateField.value;
  const loanPeriod = loanPeriodField.value;
  const loanStartDate = loanStartDateField.value;
  const partPaymentsField = document.querySelector("input[name='part_payments']:checked");
  const partPayment = partPaymentsField.value;
  const isPartPaymentEnabled = partPayment != "off";
  const partPaymentFrequency = document.querySelector("input[name='schedule_frequecy']:checked").value;
  let partPayInstallment = formatInputValue(partPayInstallmentField.value);

  // Check the default values on page load
  checkDefaultValues();

  // Update UI based on part payment
  updateUIBasedOnPartPayment(isPartPaymentEnabled, partPayment);

  // Calculate EMI
  interestRate = interestRate / 12 / 100;
  const totalPayments = 12 * loanPeriod;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, totalPayments);
  const originalFullPayment = monthlyPayment * totalPayments;

  // Prepare the extra payment schedule
  const extraPaymentSchedule = populateExtraPaymentSchedule(partPayment, partPayInstallment, totalPayments, partPaymentFrequency, document.querySelectorAll(".extra_payments"));

  // Prepare amortization schedule
  const dateParts = loanStartDate.split("-");
  const nextPaymentDate = new Date(dateParts[1], MONTHS.indexOf(dateParts[0]), 1);
  const { schedule, totalInterestPaid, totalExtraPayments } = calculateAmortizationSchedule(totalPayments, monthlyPayment, nextPaymentDate, interestRate, extraPaymentSchedule, isPartPaymentEnabled, loanAmount);

  // Update table and chart
  populateAmortTable(schedule, isPartPaymentEnabled, amortTable, amortTableBody);
  renderPieChart(loanAmount, totalInterestPaid);

  // Show or hide the early payments section based on the schedule
  earlyPaymentsSection.style.display = totalPayments == schedule.length ? "none" : "revert";

  // Calculate savings
  const whatYouSaved = originalFullPayment - loanAmount - totalInterestPaid;

  // Update fields with calculated values
  writeFields(monthlyPayment, loanAmount, totalPayments, schedule, totalExtraPayments, totalInterestPaid, whatYouSaved);

  // Add event listener to extra payment fields
  document.querySelectorAll(".extra_payments").forEach((element) => {
    element.addEventListener("change", calculateEmiAmount);
  });
}

// Function to update the UI based on part payment
const updateUIBasedOnPartPayment = (isPartPaymentEnabled, partPayment) => {
  // Get DOM elements
  const partPaymentHeader = document.getElementById("part_payment_hdr");
  const totalPaymentHeader = document.getElementById("total_payment_hdr");
  const frequencySelector = document.querySelectorAll("#frequency_selector input");

  // Update Part Payment Header display property based on whether Part Payment is enabled
  partPaymentHeader.style.display = isPartPaymentEnabled ? "revert" : "none";

  // Update Total Payment Header text based on whether Part Payment is enabled
  totalPaymentHeader.innerHTML = isPartPaymentEnabled ? "(A + B + C)" : "(A + B)";

  // Update Frequency Selector items' disabled property based on whether the part payment plan is scheduled
  frequencySelector.forEach((item) => {
    item.disabled = partPayment !== "scheduled_plan";
  });

  // Update Part Payment Installment Field's disabled property and value based on whether the part payment plan is scheduled
  partPayInstallmentField.disabled = partPayment !== "scheduled_plan";
  if (partPayment !== "scheduled_plan") {
    partPayInstallmentField.value = "";
  }
};

/**
 * The function populateAmortTable populates the amortization table based on the provided schedule.
 */
function populateAmortTable(schedule, isPartPaymentEnabled, amortTable, amortTableBody) {
  if (schedule.length > 0) {
    amortTable.style.display = "revert";

    var tableBody = "";
    schedule.forEach((schedule, index) => {
      tableBody += `
          <tr class='text-center ${schedule.extra_payment && isPartPaymentEnabled ? "table-success" : ""}'>
            <td class='text-center'>${schedule.emi_number}</td>
            <td class='text-center'>${schedule.payment_date}</td>
            <td class='text-center'> $ ${schedule.beginning_balance}</td>
            <td class='text-center hide'> $ ${schedule.scheduled_payment}</td>
            <td class='text-center'> $ ${schedule.principle}</td>
            <td class='text-center'> $ ${schedule.interest}</td>
            <td class='extra_payment_col ${isPartPaymentEnabled ? "" : "hide"}'><input value='${schedule.extra_payment}' type='text' data-index='${index}' class='form-control form-control-sm extra_payments numeric' /></td>
            <td class='text-center'> $ ${schedule.total_payment}</td>
            <td class='text-center'> $ ${schedule.ending_balance}</td>
            <td class='text-center'> ${schedule.loan_paid_percentage} %</td>
          </tr>`;
    });

    amortTableBody.innerHTML = tableBody;
  } else {
    amortTable.style.display = "none";
  }
}

function calculateAmortizationSchedule(totalPayments, monthlyPayment, nextPaymentDate, interestRate, extraPaymentSchedule, isPartPaymentEnabled, loanAmount) {
  let schedule = [];
  let currentBalance = loanAmount;
  let totalExtraPayments = 0;
  let totalInterestPaid = 0;

  for (let paymentNumber = 1; paymentNumber <= totalPayments; paymentNumber++) {
    let currentPaymentAmount = Math.min(currentBalance, monthlyPayment);
    nextPaymentDate = new Date(nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1));

    let interestForThisMonth = currentBalance * interestRate;
    totalInterestPaid += interestForThisMonth;

    let extraPaymentThisMonth = extraPaymentSchedule.get(paymentNumber) || 0;
    if (currentPaymentAmount + extraPaymentThisMonth > currentBalance - interestForThisMonth) {
      extraPaymentThisMonth = currentBalance - (currentPaymentAmount - interestForThisMonth);
    }

    let totalPaymentThisMonth = currentPaymentAmount + (isPartPaymentEnabled ? extraPaymentThisMonth : 0);
    totalExtraPayments += isPartPaymentEnabled ? extraPaymentThisMonth : 0;

    const endingBalance = currentBalance - (totalPaymentThisMonth < monthlyPayment ? totalPaymentThisMonth : currentPaymentAmount - interestForThisMonth + (isPartPaymentEnabled ? extraPaymentThisMonth : 0));

    let formattedEndingBalance = AMOUNT_FORMAT.format(Math.round(endingBalance));

    schedule.push({
      emi_number: paymentNumber,
      payment_date: nextPaymentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      }),
      beginning_balance: AMOUNT_FORMAT.format(Math.round(currentBalance)),
      scheduled_payment: AMOUNT_FORMAT.format(currentPaymentAmount),
      total_payment: AMOUNT_FORMAT.format(Math.round(totalPaymentThisMonth)),
      principle: AMOUNT_FORMAT.format(Math.round(currentPaymentAmount - interestForThisMonth)),
      interest: AMOUNT_FORMAT.format(Math.round(interestForThisMonth)),
      extra_payment: extraPaymentSchedule.get(paymentNumber) != null ? AMOUNT_FORMAT.format(Math.round(extraPaymentThisMonth)) : "",
      ending_balance: formattedEndingBalance,
      loan_paid_percentage: ((endingBalance * 100) / loanAmount).toFixed(2),
    });

    if (currentBalance < monthlyPayment) break;

    currentBalance = Number((currentBalance - (currentPaymentAmount - interestForThisMonth) - (isPartPaymentEnabled ? extraPaymentThisMonth : 0)).toFixed(2));
    if (currentBalance <= 0) break;
  }

  return { schedule, totalInterestPaid, totalExtraPayments };
}

/**
 * The function writeFields takes several numeric values, formats them, and then writes these values
 * into their corresponding fields in the HTML.
 */
function writeFields(monthlyPayment, loanAmount, totalPayments, schedule, totalExtraPayments, totalInterestPaid, whatYouSaved) {
  monthlyPaymentAmountField.innerHTML = AMOUNT_FORMAT.format(monthlyPayment);
  loanAmountField.value = AMOUNT_FORMAT.format(loanAmount);
  numberOfPaymentsField.innerHTML = totalPayments;
  actNumberOfPaymentsField.innerHTML = schedule.length;
  totalExtraPaymentsField.innerHTML = AMOUNT_FORMAT.format(totalExtraPayments);
  totalInterestField.innerHTML = AMOUNT_FORMAT.format(Math.round(totalInterestPaid));
  whatYouSavedField.innerHTML = AMOUNT_FORMAT.format(whatYouSaved);
}

function setDefaultValues() {
  loanAmountField.value = defaultValues.loanAmount;
  interestRateField.value = defaultValues.interestRate;
  loanPeriodField.value = defaultValues.loanPeriod;
  loanStartDateField.value = defaultValues.loanStartDate;
  partPayInstallmentField.value = defaultValues.partPayInstallment;
  document.getElementById(defaultValues.partPayment).checked = true;
  calculateEmiAmount();
}

function checkDefaultValues() {
  const isDefault = loanAmountField.value === defaultValues.loanAmount && interestRateField.value === defaultValues.interestRate && loanPeriodField.value === defaultValues.loanPeriod && loanStartDateField.value === defaultValues.loanStartDate && partPayInstallmentField.value === defaultValues.partPayInstallment && document.getElementById(defaultValues.partPayment).checked;

  document.getElementById("defaultValuesButton").style.display = isDefault ? "none" : "block";
}

setDefaultValues();

// $(document).ready(function () {
//   $("#loan_amount").inputmask("", {
//     regex: "^[1-9][0-9]{0,2}(,[0-9]{2})*(,[0-9]{3})?$",
//   });
// });
