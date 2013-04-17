window.addEventListener('load', function () {
  window.perf = function () {
    var perfData = localStorage.getItem('perf-data');
    console.log(perfData);
  };

  setTimeout(function () {
    var perfData = localStorage.getItem('perf-data');
    if (!perfData) {
      perfData = [];
    }
    else {
      perfData = JSON.parse(perfData);
    }

    perfData.push(performance.timing);
    localStorage.setItem('perf-data', JSON.stringify(perfData));
  }, 2000);
});
