function toAmount(amount) {
  return new Intl.NumberFormat("en-US").format(amount);
}

function calculateLoanSchedule(loanAmount, yearlyInterest, months, partPaymentFrequency = "off", partPayment = 0, startDate = new Date(), customPartPaymentSchedule = []) {
  const monthlyInterestRate = yearlyInterest / (12 * 100);
  const monthlyPayment = Math.round((loanAmount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -months)));
  let remainingLoanAmount = loanAmount;
  let schedule = [];
  let totalInterestPaid = 0;
  let totalPartPayment = 0;
  let installmentDate = new Date(startDate);

  for (let i = 1; i <= months; i++) {
    let monthlyInterest = Math.round(remainingLoanAmount * monthlyInterestRate);
    let principal = monthlyPayment - monthlyInterest;
    let openingBalance = remainingLoanAmount;

    let partPaymentMade = 0;
    if (partPaymentFrequency !== "off") {
      if (partPaymentFrequency === "monthly" || (partPaymentFrequency === "quarterly" && i % 3 === 0) || (partPaymentFrequency === "yearly" && i % 12 === 0)) {
        partPaymentMade = partPayment;
      }
    } else {
      let customPartPayment = customPartPaymentSchedule.find((x) => x.Installment_Number === i);
      if (customPartPayment) {
        partPaymentMade = Number(customPartPayment.Part_Payment.replace(/[^0-9.-]+/g, "")); // Remove commas and convert string to number
      }
    }

    if (partPaymentMade) {
      principal += partPaymentMade;
      remainingLoanAmount -= partPaymentMade;
      totalPartPayment += partPaymentMade;
    }

    remainingLoanAmount -= principal;

    if (remainingLoanAmount <= 0) {
      principal += remainingLoanAmount;
      totalInterestPaid += monthlyInterest;
      remainingLoanAmount = 0;
    }

    totalInterestPaid += monthlyInterest;

    let installment = {
      "Installment Number": i,
      "Installment Date": installmentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      "Opening Balance": toAmount(openingBalance),
      Principal: toAmount(principal),
      Interest: toAmount(monthlyInterest),
      "Total Payment": toAmount(monthlyPayment),
      "Part Payment": toAmount(partPaymentMade),
      "Total Payment Including Part Payment": toAmount(monthlyPayment + partPaymentMade),
      "Closing Balance": toAmount(remainingLoanAmount),
      "Loan Paid Till Today (%)": (((loanAmount - remainingLoanAmount) / loanAmount) * 100).toFixed(2) + "%",
    };
    schedule.push(installment);

    // Increment month
    installmentDate.setMonth(installmentDate.getMonth() + 1);

    if (remainingLoanAmount <= 0) {
      break;
    }
  }

  console.log(schedule);

  console.log("Total PartPayments done: " + toAmount(totalPartPayment));
  console.log("Total Interest Payable: " + toAmount(totalInterestPaid));
  console.log("Money we saved by making Part Payments: " + toAmount(monthlyPayment * months - (loanAmount + totalInterestPaid + totalPartPayment)));
  console.log("Monthly installment To be Paid: " + toAmount(monthlyPayment));
  console.log("Total Amount paid by us (Principal, Interest and Part Payments): " + toAmount(loanAmount + totalInterestPaid + totalPartPayment));
}

calculateLoanSchedule(10000, 10, 12, "off", 0, new Date(), [
  { Installment_Number: 1, Part_Payment: "1,150" },
  { Installment_Number: 6, Part_Payment: "100" },
  { Installment_Number: 7, Part_Payment: "20" },
  { Installment_Number: 9, Part_Payment: "97" },
]);

// calculateLoanSchedule(10000, 10, 12, "monthly", 500);
