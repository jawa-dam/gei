const beginJourneyButton =
  document.getElementById("beginJourneyButton");

const startDiscoveryButton =
  document.getElementById("startDiscoveryButton");

const revealInsightButton =
  document.getElementById("revealInsightButton");

const continueButton =
  document.getElementById("continueButton");

const worldOne =
  document.getElementById("worldOne");

const firstDiscovery =
  document.getElementById("firstDiscovery");

const insight =
  document.getElementById("insight");

const journeyComplete =
  document.getElementById("journeyComplete");

const xpValue =
  document.getElementById("xpValue");

const discoveryValue =
  document.getElementById("discoveryValue");


// Load existing progress
let xp =
  Number(localStorage.getItem("gei-xp")) || 0;

let discoveries =
  Number(localStorage.getItem("gei-discoveries")) || 0;


// Display saved progress
xpValue.textContent = `${xp} XP`;

discoveryValue.textContent =
  discoveries;


// Begin Journey
beginJourneyButton.addEventListener(
  "click",
  () => {

    worldOne.hidden = false;

    worldOne.scrollIntoView({
      behavior: "smooth"
    });

  }
);


// Begin First Discovery
startDiscoveryButton.addEventListener(
  "click",
  () => {

    firstDiscovery.hidden = false;

    firstDiscovery.scrollIntoView({
      behavior: "smooth"
    });

  }
);


// Reveal Insight
revealInsightButton.addEventListener(
  "click",
  () => {

    const reward = 10;

    xp += reward;

    discoveries += 1;

    localStorage.setItem(
      "gei-xp",
      xp
    );

    localStorage.setItem(
      "gei-discoveries",
      discoveries
    );

    xpValue.textContent =
      `${xp} XP`;

    discoveryValue.textContent =
      discoveries;

    insight.hidden = false;

    insight.scrollIntoView({
      behavior: "smooth"
    });

  }
);


// Continue Journey
continueButton.addEventListener(
  "click",
  () => {

    journeyComplete.hidden = false;

    journeyComplete.scrollIntoView({
      behavior: "smooth"
    });

  }
);