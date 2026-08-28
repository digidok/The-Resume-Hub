// Multi-step application form — DEMO ONLY.
// Nothing here is sent to a server: this page collects no real data,
// stores nothing, and calling "Submit" only shows a mock confirmation
// screen for demonstration purposes.
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("apply-form");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll(".form-step"));
  var stepperItems = Array.prototype.slice.call(document.querySelectorAll(".stepper-item"));
  var current = 0;

  function showStep(index) {
    steps.forEach(function (step, i) {
      step.classList.toggle("active", i === index);
    });
    stepperItems.forEach(function (item, i) {
      item.classList.toggle("active", i === index);
      item.classList.toggle("done", i < index);
    });
    window.scrollTo({ top: form.offsetTop - 90, behavior: "smooth" });
  }

  function validateStep(index) {
    var fields = steps[index].querySelectorAll("input[required], select[required], textarea[required]");
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].reportValidity()) return false;
    }
    return true;
  }

  form.querySelectorAll("[data-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!validateStep(current)) return;
      if (current < steps.length - 1) {
        current += 1;
        showStep(current);
      }
    });
  });

  form.querySelectorAll("[data-prev]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (current > 0) {
        current -= 1;
        showStep(current);
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateStep(current)) return;
    form.hidden = true;
    document.querySelector(".stepper").hidden = true;
    document.getElementById("apply-success").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  showStep(current);
});
