// Constant variables for number formatting and date picker format
const AMOUNT_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const DATE_PICKER_FORMAT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" });
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" });
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

// Field selectors
const loanAmountField = document.querySelector("#loan_amount");
const interestRateField = document.querySelector("#interest_rate");
const loanPeriodField = document.querySelector("#loan_period");
const loanStartDateField = document.querySelector("#loan_start_date");
const partPayInstallmentField = document.querySelector("#part_payment_installment");
const monthlyPaymentAmountField = document.querySelector("#monthly_installment");
const totalAmountPaidField = document.querySelector("#total_amount_paid");
const actNumberOfPaymentsField = document.querySelector("#actual_installments_made");
const totalExtraPaymentsField = document.querySelector("#total_prepayments_made");
const totalInterestField = document.querySelector("#total_interest_payable");
const whatYouSavedField = document.querySelector("#total_savings");
const earlyPaymentsSection = document.querySelector("#early_payments_section");
const totalPaymentHeader = document.querySelector("#total_payment_hdr");
const interestRateRange = document.getElementById("interest_rate_range");
const loanPeriodRange = document.getElementById("loan_period_range");
const loanAmountRange = document.getElementById("loan_amount_range");

// Table selectors
const amortTable = document.querySelector("#amortization_table");
const amortTableBody = amortTable.querySelector("tbody");

function areRequiredFieldsNotEmpty(fields) {
  return fields.every(isFieldNotEmpty);
}

function isFieldNotEmpty(field) {
  return Boolean(field.value);
}

// Function to format the input values
const toNumber = (inputValue) => {
  return Number(inputValue.replace(/,/g, ""));
};

/**
 * The function writeFields takes several numeric values, formats them, and then writes these values
 * into their corresponding fields in the HTML.
 */
function writeFields(monthlyPayment, loanAmount, totalPayments, scheduleSize, totalExtraPayments, totalInterestPaid, whatYouSaved) {
  monthlyPaymentAmountField.innerHTML = toAmount(monthlyPayment);
  loanAmountField.value = toAmount(loanAmount);
  totalAmountPaidField.innerHTML = toAmount(totalPayments);
  actNumberOfPaymentsField.innerHTML = scheduleSize;
  totalExtraPaymentsField.innerHTML = toAmount(totalExtraPayments);
  totalInterestField.innerHTML = toAmount(totalInterestPaid);
  whatYouSavedField.innerHTML = toAmount(whatYouSaved);
}

function setDefaultValues() {
  loanAmountField.value = defaultValues.loanAmount;
  interestRateField.value = defaultValues.interestRate;
  interestRateRange.value = defaultValues.interestRate;
  loanPeriodField.value = defaultValues.loanPeriod;
  loanPeriodRange.value = defaultValues.loanPeriod;
  loanStartDateField.value = defaultValues.loanStartDate;
  partPayInstallmentField.value = defaultValues.partPayInstallment;
  document.getElementById(defaultValues.partPayment).checked = true;
  calculateEmiAmount();
}

function checkDefaultValues() {
  const isDefault = loanAmountField.value === defaultValues.loanAmount && interestRateField.value === defaultValues.interestRate && loanPeriodField.value === defaultValues.loanPeriod && loanStartDateField.value === defaultValues.loanStartDate && partPayInstallmentField.value === defaultValues.partPayInstallment && document.getElementById(defaultValues.partPayment).checked;

  document.getElementById("defaultValuesButton").style.display = isDefault ? "none" : "block";
}

function createRangeHandlers(fieldID, rangeID, ticksClass, tickIncrement, tickFormatter = (value) => value, inputFormatter = (value) => value, rangeFormatter = (value) => value) {
  var field = document.getElementById(fieldID);
  var range = document.getElementById(rangeID);
  var ticks = document.querySelector(ticksClass);

  field.addEventListener("input", function () {
    range.value = rangeFormatter(field.value);
  });

  range.addEventListener("input", function () {
    field.value = inputFormatter(range.value);
  });

  for (let i = parseFloat(range.min); i <= parseFloat(range.max); i += tickIncrement) {
    var tick = document.createElement("p");
    tick.textContent = tickFormatter(i);
    ticks.appendChild(tick);
  }
}
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
loanAmountRange.addEventListener("change", calculateEmiAmount);
interestRateField.addEventListener("change", calculateEmiAmount);
interestRateRange.addEventListener("change", calculateEmiAmount);
loanPeriodField.addEventListener("change", calculateEmiAmount);
loanPeriodRange.addEventListener("change", calculateEmiAmount);
loanStartDateField.addEventListener("change", calculateEmiAmount);
partPayInstallmentField.addEventListener("change", calculateEmiAmount);

// Calculate EMI amount on document load
window.addEventListener("DOMContentLoaded", calculateEmiAmount);

createRangeHandlers("interest_rate", "interest_rate_range", ".interest_rate_ticks", 5);
createRangeHandlers("loan_period", "loan_period_range", ".loan_period_ticks", 3);
createRangeHandlers(
  "loan_amount",
  "loan_amount_range",
  ".loan_amount_ticks",
  10000,
  (value) => value / 1000 + "K",
  AMOUNT_FORMAT.format,
  (value) => toNumber(value)
);

function getPartPaymentSchedule() {
  var result = [];

  $(".extra_payments").each(function () {
    var installmentNumber = $(this).data("index");
    var partPayment = $(this).val();

    result.push({
      installmentNumber: installmentNumber,
      partPayment: partPayment,
    });
  });

  return result;
}

// Main function to calculate EMI amount
function calculateEmiAmount() {
  // Validate input fields
  if (!areRequiredFieldsNotEmpty([loanAmountField, interestRateField, loanPeriodField, loanStartDateField])) {
    return;
  }

  const loanAmount = toNumber(loanAmountField.value);
  const yearlyInterest = interestRateField.value;
  const months = loanPeriodField.value * 12;
  const loanStartDate = loanStartDateField.value;
  const partPaymentsField = document.querySelector("input[name='part_payments']:checked");
  const partPaymentFrequency = partPaymentsField.value;
  const partPayInstallment = toNumber(partPayInstallmentField.value);
  const dateParts = loanStartDate.split("-");
  const nextPaymentDate = new Date(dateParts[1], MONTHS.indexOf(dateParts[0]), 1);
  const customPartPaymentSchedule = getPartPaymentSchedule();

  let { schedule, totalPartPayment, totalInterestPaid, moneySaved, monthlyPayment, totalAmount } = calculateLoanSchedule(loanAmount, yearlyInterest, months, partPaymentFrequency, partPayInstallment, nextPaymentDate, customPartPaymentSchedule);

  // Check the default values on page load
  checkDefaultValues();

  // Update UI based on part payment
  updateUIBasedOnPartPayment(partPaymentFrequency);

  // Prepare the extra payment schedule
  // const extraPaymentSchedule = populateExtraPaymentSchedule(partPayment, partPayInstallment, totalPayments, partPaymentFrequency, document.querySelectorAll(".extra_payments"));

  // Prepare amortization schedule
  // const { schedule, totalInterestPaid, totalExtraPayments } = calculateAmortizationSchedule(totalPayments, monthlyPayment, nextPaymentDate, interestRate, extraPaymentSchedule, isPartPaymentEnabled, loanAmount);

  // Update table and chart
  populateAmortTable(schedule, partPaymentFrequency, amortTable, amortTableBody);

  renderChart(loanAmount, totalInterestPaid, schedule);

  // Show or hide the early payments section based on the schedule
  // earlyPaymentsSection.style.display = totalPayments == schedule.length ? "none" : "revert";

  // Update fields with calculated values
  writeFields(monthlyPayment, loanAmount, totalAmount, schedule.length, totalPartPayment, totalInterestPaid, moneySaved);

  // Add event listener to extra payment fields
  document.querySelectorAll(".extra_payments").forEach((element) => {
    element.addEventListener("change", calculateEmiAmount);
  });
}

// Function to update the UI based on part payment
const updateUIBasedOnPartPayment = (partPaymentFrequency) => {
  // Get DOM elements
  const partPaymentHeader = document.getElementById("part_payment_hdr");
  const totalPaymentHeader = document.getElementById("total_payment_hdr");

  // Update Part Payment Header display property based on whether Part Payment is enabled
  partPaymentHeader.style.display = partPaymentFrequency !== "off" ? "revert" : "none";

  partPayInstallmentField.disabled = partPaymentFrequency === "off" || partPaymentFrequency === "custom";
  if (partPaymentFrequency === "off" || partPaymentFrequency === "custom") {
    partPayInstallmentField.value = "";
  }

  // Update Total Payment Header text based on whether Part Payment is enabled
  totalPaymentHeader.innerHTML = partPaymentFrequency !== "off" ? "(A + B + C)" : "(A + B)";
};

/**
 * The function populateAmortTable populates the amortization table based on the provided schedule.
 */
function populateAmortTable(amortSchedule, partPaymentFrequency, amortTable, amortTableBody) {
  if (amortSchedule.length > 0) {
    amortTable.style.display = "revert";

    var tableBody = "";
    amortSchedule.forEach((installment, index) => {
      tableBody += `
          <tr class='text-center ${installment.partPaymentMade != "0" && partPaymentFrequency !== "off" ? "table-success" : ""}'>
            <td class='text-center'>${installment.installmentNumber}</td>
            <td class='text-center'>${installment.installmentDate}</td>
            <td class='text-center detailed-info'> $ ${installment.openingBalance}</td>
            <td class='text-center mon_pay hide'> $ ${installment.monthlyPayment}</td>
            <td class='text-center'> $ ${installment.principal}</td>
            <td class='text-center'> $ ${installment.monthlyInterest}</td>
            <td class='extra_payment_col ${partPaymentFrequency !== "off" ? "" : "hide"}'>
              <span class=' ${partPaymentFrequency !== "custom" ? "" : "hide"}'>$ ${installment.partPaymentMade} </span>
              <input value='${installment.partPaymentMade != "0" ? installment.partPaymentMade : ""}' type='text' data-index='${installment.installmentNumber}' class='form-control form-control-sm extra_payments numeric ${partPaymentFrequency === "custom" ? "" : "hide"}' /></td>
            <td class='text-center'> $ ${installment.monthlyPaymentWithPartPayment}</td>
            <td class='text-center'> $ ${installment.remainingLoanAmount}</td>
            <td class='text-center detailed-info'> ${installment.loanPaid} %</td>
          </tr>`;
    });

    amortTableBody.innerHTML = tableBody;
  } else {
    amortTable.style.display = "none";
  }
}

setDefaultValues();
