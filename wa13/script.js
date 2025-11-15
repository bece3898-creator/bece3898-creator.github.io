// REAL Wikipedia API data, minimal beginner code

var pages = {
  en: { project: "en.wikipedia.org", title: "Environmentalism" },
  es: { project: "es.wikipedia.org", title: "Ecologismo" },
  de: { project: "de.wikipedia.org", title: "Umweltbewegung" }
};

var languageSelect = document.getElementById("languageSelect");

var articleTitle = document.getElementById("articleTitle");
var summaryText = document.getElementById("summaryText");

var bannerMessage = document.getElementById("bannerMessage");

var academicBar = document.getElementById("academicBar");
var newsBar = document.getElementById("newsBar");
var otherBar = document.getElementById("otherBar");

var academicText = document.getElementById("academicText");
var newsText = document.getElementById("newsText");
var otherText = document.getElementById("otherText");


// Switch languages
languageSelect.addEventListener("change", function () {
  loadEverything(languageSelect.value);
});


// Load Wikipedia summary
function loadSummary(project, title) {
  var url = "https://" + project + "/api/rest_v1/page/summary/" + encodeURIComponent(title);

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.title) {
        articleTitle.textContent = data.title;
      }

      if (data.extract) {
        summaryText.textContent = data.extract;
      } else {
        summaryText.textContent = "No summary found.";
      }
    })
    .catch(function() {
      summaryText.textContent = "Error loading summary.";
    });
}


// Load external links and compute Source Mix
function loadLinks(project, title) {
  var url =
    "https://" + project +
    "/w/api.php?action=parse&page=" +
    encodeURIComponent(title) +
    "&prop=externallinks&format=json&origin=*";

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {

      var links = [];
      if (data.parse && data.parse.externallinks) {
        links = data.parse.externallinks;
      }

      var academicCount = 0;
      var newsCount = 0;
      var otherCount = 0;

      for (var i = 0; i < links.length; i++) {
        var L = links[i].toLowerCase();

        if (L.includes(".edu") || L.includes("jstor") || L.includes("nature.com")) {
          academicCount++;
        } else if (L.includes("news") || L.includes("bbc") || L.includes("nytimes")) {
          newsCount++;
        } else {
          otherCount++;
        }
      }

      var total = academicCount + newsCount + otherCount;

      var aPct = total > 0 ? Math.round((academicCount / total) * 100) : 0;
      var nPct = total > 0 ? Math.round((newsCount / total) * 100) : 0;
      var oPct = total > 0 ? 100 - aPct - nPct : 0;

      // Update bar widths (with animation)
      academicBar.style.width = aPct + "%";
      newsBar.style.width = nPct + "%";
      otherBar.style.width = oPct + "%";

      academicText.textContent = aPct + "%";
      newsText.textContent = nPct + "%";
      otherText.textContent = oPct + "%";

      if (total === 0) {
        bannerMessage.textContent =
          "This article has almost no external links, so coverage may be incomplete.";
      } else if (oPct < 20) {
        bannerMessage.textContent =
          "Most citations come from major academic or news outlets. Local sources are limited.";
      } else {
        bannerMessage.textContent =
          "This article has a more mixed set of sources.";
      }
    })
    .catch(function() {
      bannerMessage.textContent = "Error loading external links.";
    });
}


function loadEverything(langCode) {
  var p = pages[langCode];

  summaryText.textContent = "Loading summary...";
  bannerMessage.textContent = "Loading...";

  academicBar.style.width = "0%";
  newsBar.style.width = "0%";
  otherBar.style.width = "0%";

  loadSummary(p.project, p.title);
  loadLinks(p.project, p.title);
}

loadEverything("en");
