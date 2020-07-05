const AMOUNT_FORMAT = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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

loanAmountField.addEventListener("change", (e) => calculateEmiAmount());
interestRateField.addEventListener("change", (e) => calculateEmiAmount());
loanPeriodField.addEventListener("change", (e) => calculateEmiAmount());
loanStartDateField.addEventListener("change", (e) => calculateEmiAmount());

window.addEventListener("DOMContentLoaded", (event) => {
  calculateEmiAmount();
});

function isNotEmpty(field) {
  return field.value != undefined && field.value != null && field.value != "";
}

function calculateEmiAmount() {
  const extraPaymentScheule = new Map();

  if (
    isNotEmpty(loanAmountField) &&
    isNotEmpty(interestRateField) &&
    isNotEmpty(loanPeriodField) &&
    isNotEmpty(loanStartDateField)
  ) {
    // ### Do amrtization schedule calculate #### //

    // Gets values from fields
    loanAmount = loanAmountField.value;
    interestRate = interestRateField.value;
    loanPeriod = loanPeriodField.value;
    loanStartDate = loanStartDateField.value;

    // Calculating EMI
    roi = interestRate / 12 / 100;
    nom = 12 * loanPeriod;

    rateVariable = Math.pow(1 + roi, nom);

    const emi = Math.ceil(
      loanAmount * roi * (rateVariable / (rateVariable - 1))
    );

    // Preserving extra payments added before a change
    const extraPaymentsList = document.querySelectorAll(".extra_payments");

    extraPaymentsList.forEach((payment) => {
      if (isNotEmpty(payment)) {
        extraPaymentScheule.set(
          eval(payment.getAttribute("data-index")) + 1,
          eval(payment.value.replace(/,/g, ""))
        );
      }
    });

    // Write EMI field
    emiAmountField.value = AMOUNT_FORMAT.format(emi);
    numberOfPaymentsField.value = nom;

    let emiDate = new Date(loanStartDate);
    let beginningBalance = loanAmount;
    let principle = loanAmount;
    let interest;
    amortSchedule = [];
    var totalEarlyPayments = 0;
    var totalInterest = 0;

    for (var i = 1; i <= nom; i++) {
      // This is to make sure the exact amount to be taken for last EMI
      let emiForThisInstallment =
        beginningBalance < emi ? beginningBalance : emi;

      emiDate = new Date(emiDate.setMonth(emiDate.getMonth() + 1));
      principle -= emiForThisInstallment;
      interest = (beginningBalance * roi).toFixed(2);
      totalInterest += beginningBalance * roi;
      extraPaymentForThisInstallment =
        extraPaymentScheule.get(i) != null ? extraPaymentScheule.get(i) : 0;
      totalPayment = emiForThisInstallment + extraPaymentForThisInstallment;
      totalEarlyPayments += extraPaymentForThisInstallment;
      amortSchedule.push({
        emi_number: i,
        payment_date: DATE_FORMAT.format(emiDate),
        beginning_balance: AMOUNT_FORMAT.format(beginningBalance),
        scheduled_payment: AMOUNT_FORMAT.format(emiForThisInstallment),
        total_payment: AMOUNT_FORMAT.format(totalPayment),
        principle: AMOUNT_FORMAT.format(emiForThisInstallment - interest),
        interest: AMOUNT_FORMAT.format(interest),
        extra_payment:
          extraPaymentScheule.get(i) != null
            ? AMOUNT_FORMAT.format(extraPaymentScheule.get(i))
            : "",
        ending_balance: AMOUNT_FORMAT.format(
          beginningBalance -
            (emiForThisInstallment - interest + extraPaymentForThisInstallment)
        ),
      });

      if (beginningBalance < emi) {
        break;
      }

      beginningBalance = (
        beginningBalance -
        (emiForThisInstallment - interest) -
        extraPaymentForThisInstallment
      ).toFixed(2);

      if (beginningBalance <= 0) break;
    }

    renderChart(loanAmount, totalInterest);

    if (amortSchedule.length > 0) {
      amortTable.style.display = "block";

      var tableBody = "";
      amortSchedule.forEach((schedule, index) => {
        tableBody += "<tr>";
        tableBody += "<td class='text-center'>" + schedule.emi_number + "</td>";
        tableBody +=
          "<td class='text-center'>" + schedule.payment_date + "</td>";
        tableBody +=
          "<td class='text-right'>" + schedule.beginning_balance + "</td>";
        tableBody +=
          "<td class='text-right'>" + schedule.scheduled_payment + "</td>";
        tableBody +=
          "<td><input value='" +
          schedule.extra_payment +
          "' type='text' data-index='" +
          index +
          "' class='form-control form-control-sm extra_payments numeric' /></td>";
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

    actNumberOfPaymentsField.value = amortSchedule.length;
    totalEarlyPaymentsField.value = AMOUNT_FORMAT.format(totalEarlyPayments);
    totalInterestField.value = AMOUNT_FORMAT.format(Math.round(totalInterest));

    document
      .querySelectorAll(".extra_payments")
      .forEach((e) =>
        e.addEventListener("change", (e) => calculateEmiAmount())
      );
  }
}

window.chartColors = {
  red: "rgb(255, 99, 132)",
  orange: "rgb(255, 159, 64)",
  yellow: "rgb(255, 205, 86)",
  green: "rgb(75, 192, 192)",
  blue: "rgb(54, 162, 235)",
  purple: "rgb(153, 102, 255)",
  grey: "rgb(201, 203, 207)",
};

function renderChart(principle, interest) {
  var config = {
    type: "pie",
    data: {
      datasets: [
        {
          data: [Math.round(principle), Math.round(interest)],
          backgroundColor: [window.chartColors.blue, window.chartColors.red],
          label: "Amortization Schedule",
        },
      ],
      labels: ["Principle", "Interest"],
    },
    options: {
      responsive: true,
      legend: {
        position: "bottom",
      },
    },
  };

  var ctx = document.getElementById("chart-area").getContext("2d");
  window.myPie = new Chart(ctx, config);

  // var chart = new CanvasJS.Chart("chart-container", {
  //   // title: {
  //   //   text: "Your Loan Repayment",
  //   // },
  //   legend: {
  //     maxWidth: 350,
  //     itemWidth: 120,
  //   },
  //   data: [
  //     {
  //       type: "pie",
  //       showInLegend: false,
  //       legendText: "{indexLabel}",
  //       dataPoints: [
  //         { y: Math.round(principle), indexLabel: "Principle" },
  //         { y: Math.round(interest), indexLabel: "Interest" },
  //       ],
  //     },
  //   ],
  // });
  // chart.render();
}
