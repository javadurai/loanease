/**
 * Function to calculate the detailed loan schedule with support for part payments.
 *
 * @param {number} loanAmount - The initial amount of the loan. This is the principal amount that the loan was issued for.
 * @param {number} yearlyInterest - The yearly interest rate as a percentage (e.g., for 5%, pass 5).
 * @param {number} months - The total number of months for which the loan was issued.
 * @param {string} [partPaymentFrequency="off"] - The frequency of part payments. This can be 'off', 'monthly', 'quarterly', 'yearly', or 'custom'.
 *                                              If 'off', part payments will not be considered in the calculations.
 *                                              If 'monthly', 'quarterly', or 'yearly', part payments will be made every month, every 3 months, or every 12 months respectively, using the value of the partPayment parameter.
 *                                              If 'custom', the function will expect a customPartPaymentSchedule array, with each object in the array specifying the installment number and part payment amount.
 * @param {number} [partPayment=0] - The amount of part payment. This will be used if the partPaymentFrequency is set to 'monthly', 'quarterly', or 'yearly'.
 * @param {Date} [startDate=new Date()] - The date of the first installment. The function will calculate the dates of subsequent installments by adding a month to this date for each installment.
 * @param {Object[]} [customPartPaymentSchedule=[]] - Array of custom part payment objects, each containing the installment number and part payment amount.
 *                                                   This will be used if partPaymentFrequency is set to 'custom'.
 *                                                   Each object in the array should be in the following format: { "installmentNumber": x, "partPayment": y }, where x is the installment number and y is the part payment amount for that installment.
 *
 * @returns {Object} An object containing the loan schedule as an array of objects and the total amounts of part payments made, interest paid, money saved by making part payments, monthly installment to be paid, and total amount paid.
 *                   Each object in the schedule array contains detailed information about each installment, including the installment number and date, opening balance, principal, interest, total payment, part payment, total payment including part payment, closing balance, and loan paid till today as a percentage.
 *
 * Note: All monetary amounts in the output are formatted as strings in the 'en-US' locale and 'USD' currency.
 *       To change the locale or currency, modify the 'toAmount' helper function inside this function.
 */
function calculateLoanSchedule(loanAmount, yearlyInterest, months, partPaymentFrequency = "off", partPayment = 0, startDate = new Date(), customPartPaymentSchedule = []) {
  // calculate the monthly interest rate
  const monthlyInterestRate = yearlyInterest / (12 * 100);
  // calculate the monthly payment using the loan payment formula
  const monthlyPayment = Math.round((loanAmount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -months)));

  // remaining loan amount, starting with the initial full loan amount
  let remainingLoanAmount = loanAmount;
  // total interest paid, starting at 0
  let totalInterestPaid = 0;
  // total part payment, starting at 0
  let totalPartPayment = 0;
  // the date of the first installment
  let installmentDate = new Date(startDate);

  // array to hold the schedule
  let schedule = [];

  // loop through each month
  for (let installmentNumber = 1; installmentNumber <= months; installmentNumber++) {
    // calculate the interest for the current month
    let monthlyInterest = Math.round(remainingLoanAmount * monthlyInterestRate);
    // calculate the principal for the current month
    let principal = monthlyPayment - monthlyInterest;
    // opening balance for the current month
    let openingBalance = remainingLoanAmount;
    // initialize part payment made in the current month
    let partPaymentMade = 0;

    // check the part payment frequency
    if (partPaymentFrequency !== "off") {
      if (partPaymentFrequency === "monthly" || (partPaymentFrequency === "quarterly" && installmentNumber % 3 === 0) || (partPaymentFrequency === "yearly" && installmentNumber % 12 === 0)) {
        partPaymentMade = partPayment;
      } else if(partPaymentFrequency === "custom") {
        // find if there is a custom part payment for the current installment
        let customPartPayment = customPartPaymentSchedule.find((x) => x.installmentNumber === installmentNumber);
        if (customPartPayment) {
          // convert the part payment amount to number
          partPaymentMade = Number(customPartPayment.partPayment.replace(/[^0-9.-]+/g, ""));
        }
      }
    }

    // check if a part payment was made in the current month
    if (partPaymentMade) {
      // increase the principal by the part payment
      principal += partPaymentMade;
      // reduce the remaining loan amount by the part payment
      remainingLoanAmount -= partPaymentMade;
      // increase the total part payment by the part payment
      totalPartPayment += partPaymentMade;
    }
    console.log("----");
    console.log(remainingLoanAmount);
    console.log(principal );

    // reduce the remaining loan amount by the principal
    remainingLoanAmount -= principal;
    console.log(remainingLoanAmount);

    // if the remaining loan amount is less than or equal to 0, make adjustments
    if (remainingLoanAmount <= 0) {
      // adjust the principal by adding the negative remaining loan amount
      principal += remainingLoanAmount;
      // increase the total interest paid by the monthly interest
      totalInterestPaid += monthlyInterest;
      // set the remaining loan amount to 0
      remainingLoanAmount = 0;
    }

    console.log(principal);
    console.log(monthlyPayment);
    console.log(monthlyInterest);

    // increase the total interest paid by the monthly interest
    totalInterestPaid += monthlyInterest;

    // create an object for the current installment
    let installment = {
      installmentNumber: installmentNumber,
      installmentDate: installmentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      openingBalance: toAmount(openingBalance),
      principal: toAmount(principal),
      monthlyInterest: toAmount(monthlyInterest),
      monthlyPayment: toAmount(monthlyPayment),
      partPaymentMade: toAmount(partPaymentMade),
      monthlyPaymentWithPartPayment: toAmount(monthlyPayment + partPaymentMade),
      remainingLoanAmount: toAmount(remainingLoanAmount),
      loanPaid: (((loanAmount - remainingLoanAmount) / loanAmount) * 100).toFixed(2),
    };

    // add the current installment to the schedule
    schedule.push(installment);
    // move the installment date to the next month
    installmentDate.setMonth(installmentDate.getMonth() + 1);

    // if the remaining loan amount is 0 or less, break the loop
    if (remainingLoanAmount <= 0) {
      break;
    }
  }

  // return the schedule and calculated totals
  return {
    schedule: schedule,
    totalPartPayment: toAmount(totalPartPayment),
    totalInterestPaid: totalInterestPaid,
    moneySaved: toAmount(monthlyPayment * months - (loanAmount + totalInterestPaid + totalPartPayment)),
    monthlyPayment: toAmount(monthlyPayment),
    totalAmount: toAmount(loanAmount + totalInterestPaid + totalPartPayment),
  };
}

function toAmount(amount) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
