// Loan calculator — DEMO ONLY.
//
// PLACEHOLDER PRICING: the figures below are illustrative examples used
// purely to demonstrate the calculator UI. They are NOT approved interest
// rates, initiation fees or service fees, and must be replaced with the
// company's compliance-approved, NCA-compliant pricing structure before
// this calculator is used with real customers.
var PLACEHOLDER_PRICING = {
  termDays: 30,
  monthlyInterestRate: 0.05, // 5% per month — illustrative only
  initiationFee: {
    // simplified illustrative tiers
    tiers: [
      { max: 1000, fee: 150 },
      { max: 2000, fee: 250 }
    ]
  },
  monthlyServiceFee: 60 // illustrative only
};

function getInitiationFee(amount) {
  var tiers = PLACEHOLDER_PRICING.initiationFee.tiers;
  for (var i = 0; i < tiers.length; i++) {
    if (amount <= tiers[i].max) return tiers[i].fee;
  }
  return tiers[tiers.length - 1].fee;
}

function calculateLoan(amount) {
  var interest = Math.round(amount * PLACEHOLDER_PRICING.monthlyInterestRate * 100) / 100;
  var initiationFee = getInitiationFee(amount);
  var serviceFee = PLACEHOLDER_PRICING.monthlyServiceFee;
  var totalRepayment = amount + interest + initiationFee + serviceFee;
  var costOfCredit = totalRepayment - amount;

  var today = new Date();
  var repaymentDate = new Date(today);
  repaymentDate.setDate(repaymentDate.getDate() + PLACEHOLDER_PRICING.termDays);

  return {
    amount: amount,
    termDays: PLACEHOLDER_PRICING.termDays,
    interest: interest,
    initiationFee: initiationFee,
    serviceFee: serviceFee,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    costOfCredit: Math.round(costOfCredit * 100) / 100,
    repaymentDate: repaymentDate
  };
}

function formatZAR(value) {
  return "R" + value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date) {
  return date.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
}

document.addEventListener("DOMContentLoaded", function () {
  var chips = document.querySelectorAll(".amount-chip");
  var resultBox = document.getElementById("calc-result");
  if (!chips.length || !resultBox) return;

  function render(amount) {
    var r = calculateLoan(amount);
    document.getElementById("res-amount").textContent = formatZAR(r.amount);
    document.getElementById("res-term").textContent = r.termDays + " days";
    document.getElementById("res-interest").textContent = formatZAR(r.interest);
    document.getElementById("res-fees").textContent = formatZAR(r.initiationFee + r.serviceFee);
    document.getElementById("res-total").textContent = formatZAR(r.totalRepayment);
    document.getElementById("res-date").textContent = formatDate(r.repaymentDate);
    document.getElementById("res-cost").textContent = formatZAR(r.costOfCredit);
    resultBox.hidden = false;
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      render(parseInt(chip.dataset.amount, 10));
    });
  });

  // Default selection
  var defaultChip = chips[0];
  defaultChip.classList.add("active");
  render(parseInt(defaultChip.dataset.amount, 10));
});
