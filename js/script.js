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
const numberOfPaymentsField = document.querySelector("#total_installments");
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
  monthlyPaymentAmountField.innerHTML = monthlyPayment;
  loanAmountField.value = AMOUNT_FORMAT.format(loanAmount);
  numberOfPaymentsField.innerHTML = totalPayments;
  actNumberOfPaymentsField.innerHTML = scheduleSize;
  totalExtraPaymentsField.innerHTML = totalExtraPayments;
  totalInterestField.innerHTML = totalInterestPaid;
  whatYouSavedField.innerHTML = whatYouSaved;
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
        extraPaymentSchedule.set(Number(payment.getAttribute("data-index")) + 1, toNumber(payment.value));
      }
    });
  }

  return extraPaymentSchedule;
};

function getPartPaymentSchedule(){
  var result = [];

  $(".extra_payments").each(function() {
      var installmentNumber = $(this).data("index");
      var partPayment = $(this).val();

      result.push({
          installmentNumber: installmentNumber,
          partPayment: partPayment
      });
  });  

  console.log(result)

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

  let { schedule, totalPartPayment, totalInterestPaid, moneySaved, monthlyPayment, totalAmount } = calculateLoanSchedule(loanAmount, yearlyInterest, months, partPaymentFrequency, partPayInstallment, nextPaymentDate, customPartPaymentSchedule );

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

  partPayInstallmentField.disabled = partPaymentFrequency === "off";
  if(partPaymentFrequency === "off"){
    partPayInstallmentField.value = "";
  }

  // Update Total Payment Header text based on whether Part Payment is enabled
  totalPaymentHeader.innerHTML = partPaymentFrequency !== "off" ? "(A + B + C)" : "(A + B)";
};

/**
 * The function populateAmortTable populates the amortization table based on the provided schedule.
 */
function populateAmortTable(schedule, partPaymentFrequency, amortTable, amortTableBody) {
  if (schedule.length > 0) {
    amortTable.style.display = "revert";

    var tableBody = "";
    schedule.forEach((schedule, index) => {
      tableBody += `
          <tr class='text-center ${schedule.partPaymentMade && partPaymentFrequency !== "off" ? "table-success" : ""}'>
            <td class='text-center'>${schedule.installmentNumber}</td>
            <td class='text-center'>${schedule.installmentDate}</td>
            <td class='text-center'> $ ${schedule.openingBalance}</td>
            <td class='text-center hide'> $ ${schedule.monthlyPayment}</td>
            <td class='text-center'> $ ${schedule.principal}</td>
            <td class='text-center'> $ ${schedule.monthlyInterest}</td>
            <td class='extra_payment_col ${partPaymentFrequency !== "off" ? "" : "hide"}'><input value='${schedule.partPaymentMade}' type='text' data-index='${schedule.installmentNumber}' class='form-control form-control-sm extra_payments numeric' /></td>
            <td class='text-center'> $ ${schedule.monthlyPaymentWithPartPayment}</td>
            <td class='text-center'> $ ${schedule.remainingLoanAmount}</td>
            <td class='text-center'> ${schedule.loanPaid} %</td>
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

setDefaultValues();
