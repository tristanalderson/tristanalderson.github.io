/**
 * Minimal resume PDF viewer — no toolbar, just the document.
 */
(function () {
  if (typeof pdfjsLib === 'undefined') return;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  var container = document.getElementById('resume-pdf-container');
  if (!container) return;

  var url = 'assets/TristanAlderson_Resume(02-19-26).pdf';

  pdfjsLib.getDocument(url).promise.then(function (pdf) {
    var scale = 1.8;
    var numPages = pdf.numPages;

    function renderPage(pageNum) {
      pdf.getPage(pageNum).then(function (page) {
        var viewport = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = 'resume-pdf-page';
        container.appendChild(canvas);
        page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise.then(function () {
          if (pageNum < numPages) renderPage(pageNum + 1);
        });
      });
    }

    renderPage(1);
  }).catch(function () {
    container.innerHTML =
      '<p class="resume-pdf-fallback">Unable to load PDF. <a href="' + url + '" target="_blank" rel="noopener">Open resume (PDF)</a>.</p>';
  });
})();
