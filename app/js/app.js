const AMOUNT_FORMAT = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const DATE_FORMAT = new Intl.DateTimeFormat(
  new Intl.DateTimeFormat(
    "en-US"
    // , {
    //   day: "numeric",
    //   month: "short",
    //   year: "numeric"
    // }
  )
);

const loanAmountField = document.querySelector("#loan_amount");
const interestRateField = document.querySelector("#interest_rate");
const loanPeriodField = document.querySelector("#loan_period");
const loanStartDateField = document.querySelector("#loan_start_date");
const amortTable = document.querySelector("#amort_table");
const amortTableBody = document.querySelector("#amort_table tbody");

const emiAmountField = document.querySelector("#emi_amount");
const numberOfPaymentsField = document.querySelector("#number_of_payments");
const actNumberOfPaymentsField = document.querySelector(
  "#actual_number_of_payments"
);
const totalEarlyPaymentsField = document.querySelector("#total_early_payments");
const totalInterestField = document.querySelector("#total_interest");

var amortSchedule = [];

loanAmountField.addEventListener("change", e => calculateEmiAmount());
interestRateField.addEventListener("change", e => calculateEmiAmount());
loanPeriodField.addEventListener("change", e => calculateEmiAmount());
loanStartDateField.addEventListener("change", e => calculateEmiAmount());

window.addEventListener("DOMContentLoaded", event => {
  calculateEmiAmount();
});

function isNotEmpty(field) {
  return field.value != undefined && field.value != null && field.value != "";
}

function calculateEmiAmount() {
  if (
    isNotEmpty(loanAmountField) &&
    isNotEmpty(interestRateField) &&
    isNotEmpty(loanPeriodField) &&
    isNotEmpty(loanStartDateField)
  ) {
    // Do amrtization schedule calculate
    loanAmount = loanAmountField.value;
    interestRate = interestRateField.value;
    loanPeriod = loanPeriodField.value;
    loanStartDate = loanStartDateField.value;

    // Get EMI
    roi = interestRate / 12 / 100;
    nom = 12 * loanPeriod;

    rateVariable = Math.pow(1 + roi, nom);

    const emi = Math.ceil(
      loanAmount * roi * (rateVariable / (rateVariable - 1))
    );

    emiAmountField.value = AMOUNT_FORMAT.format(emi);
    numberOfPaymentsField.value = nom;
    actNumberOfPaymentsField.value = nom;
    totalEarlyPaymentsField.value = 0;
    totalInterestField.value = AMOUNT_FORMAT.format(nom * emi - loanAmount);

    let emiDate = new Date(loanStartDate);
    let beginningBalance = loanAmount;
    let principle = loanAmount;
    let interest;
    amortSchedule = [];

    for (var i = 1; i <= nom; i++) {
      emiDate = new Date(emiDate.setMonth(emiDate.getMonth() + 1));
      principle -= emi;
      interest = (beginningBalance * roi).toFixed(2);
      amortSchedule.push({
        emi_number: i,
        payment_date: DATE_FORMAT.format(emiDate),
        beginning_balance: AMOUNT_FORMAT.format(beginningBalance),
        scheduled_payment: AMOUNT_FORMAT.format(emi),
        total_payment: AMOUNT_FORMAT.format(emi),
        principle: AMOUNT_FORMAT.format(emi - interest),
        interest: AMOUNT_FORMAT.format(interest),
        ending_balance: AMOUNT_FORMAT.format(
          beginningBalance - (emi - interest)
        )
      });
      beginningBalance = (beginningBalance - (emi - interest)).toFixed(2);
    }

    if (amortSchedule.length > 0) {
      amortTable.style.display = "block";

      var tableBody = "";
      amortSchedule.forEach(schedule => {
        tableBody += "<tr>";
        tableBody += "<td class='text-center'>" + schedule.emi_number + "</td>";
        tableBody +=
          "<td class='text-center'>" + schedule.payment_date + "</td>";
        tableBody +=
          "<td class='text-right'>" + schedule.beginning_balance + "</td>";
        tableBody +=
          "<td class='text-right'>" + schedule.scheduled_payment + "</td>";
        tableBody +=
          "<td><input type='text' class='form-control extra_payments' disabled /></td>";
        tableBody +=
          "<td class='text-right'>" + schedule.total_payment + "</td>";
        tableBody += "<td class='text-right'>" + schedule.principle + "</td>";
        tableBody += "<td class='text-right'>" + schedule.interest + "</td>";
        tableBody +=
          "<td class='text-right'>" + schedule.ending_balance + "</td>";

        tableBody += "</tr>";
      });

      amortTableBody.innerHTML = tableBody;
    } else {
      amortTable.style.display = "none";
    }

    console.log(amortSchedule);
  }
}
