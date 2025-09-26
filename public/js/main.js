document.addEventListener("DOMContentLoaded", function () {
  console.log("Main layout JS loaded.");

  const pills = document.querySelectorAll("main section:first-of-type button");
  const rows = document.querySelectorAll("main > section");

  pills.forEach((pill, index) => {
    pill.addEventListener("click", () => {
      rows.forEach((row, rIndex) => {
        if (rIndex > 0) {
          row.style.display = index === rIndex - 1 ? "block" : "none";
        }
      });

      pills.forEach(p => p.classList.remove("bg-red-700"));
      pill.classList.add("bg-red-700");
    });
  });

  // Default: Show all rows
  rows.forEach(row => row.style.display = "block");
});
