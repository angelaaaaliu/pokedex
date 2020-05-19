/* eslint-disable require-jsdoc */
/**
 * Name: Angela Liu
 * Date: May 6, 2020
 * Section: CSE 154 AL
 *
 * This is the pokedex.js page for my HW3 assignment. It handles interactivity with users when
 * viewing their current Pokemon, executing a Pokemon battle, and winning or losing during the
 * battle.
 */
"use strict";

(function() {

  const GET_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php?";
  const ABS_PATH = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const POST_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php";
  let currShortname = "";
  let guid = "";
  let pid = "";
  let currentHP;

  window.addEventListener("load", init);

  /** Initializes all functions*/
  function init() {
    fetchNames();
  }

  /**
   * Retrieves the Pokemon sprite images dynamically using AJAX. If something goes wrong with the
   * request, will display an error message on the console.
   */
  function fetchNames() {
    fetch(GET_URL + "pokedex=all")
      .then(checkStatus)
      .then(data => data.text())
      .then(processNames)
      .catch(console.error);
  }

  /**
   * Adds all Pokemon sprite images to Pokedex. Only Charmander, Bulbasaur, and Squirtle are found
   * if user has just started playing.
   * @param {object} data - JSON object for Pokemon name data
   */
  function processNames(data) {
    let names = data.split('\n');
    for (let i = 0; i < names.length; i++) {
      let line = names[i].split(":");
      let currShortName = line[1];
      let name = line[0];
      createImg(currShortName, name);
    }
  }

  /**
   * Creates images of all Pokemon to be appended to the Pokedex. Only Charmandar, Bulbusaur, and
   * Squirtle are found if user has just started playing.
   * @param {string} shortname - shortname of the given Pokemon.
   * @param {string} name - name of the given Pokemon.
   */
  function createImg(shortname, name) {
    let newImg = gen("img");
    newImg.src = ABS_PATH + "sprites/" + shortname + ".png";
    newImg.classList.add("sprite");
    if (shortname === "bulbasaur" || shortname === "charmander" || shortname === "squirtle") {
      newImg.classList.add("found");
      newImg.addEventListener("click", function() {
        found(shortname);
      });
    }
    newImg.id = shortname;
    newImg.alt = name;
    id("pokedex-view").appendChild(newImg);
  }

  /**
   * Makes the image associated with the given Pokemon found. Retrieves the information of the
   * given Pokemon dynamically using AJAX. If something goes wrong with the request, will display
   * an error message on the console.
   * @param {string} shortname - shortname of given Pokemon.
   */
  function found(shortname) {
    currShortname = shortname;

    fetch(GET_URL + "pokemon=" + currShortname)
      .then(checkStatus)
      .then(data => data.json())
      .then(processFound)
      .catch(console.error);
  }

  /**
   * Populates the user's current card view with information of the given Pokemon.
   * @param {object} data - JSON object for Pokemon data
   */
  function processFound(data) {
    makeCard("#p1", data);
    id("start-btn").classList.remove("hidden");
    id("start-btn").addEventListener("click", fetchInitialGameData);
  }

  /**
   * Retrieves the initial game data dynamically using AJAX. If something goes wrong with the
   * request, will display an error message on the console.
   */
  function fetchInitialGameData() {
    let params = new FormData();
    params.append("startgame", "true");
    params.append("mypokemon", currShortname);

    fetch(POST_URL, {method: "POST", body: params})
      .then(checkStatus)
      .then(resp => resp.json())
      .then(initializeGame)
      .catch(console.error);
  }

  /**
   * Changes from Pokedex view to battle view. Allows user to make moves and battle.
   * @param {object} resp - JSON object for initial game data
   */
  function initializeGame(resp) {
    id("start-btn").classList.add("hidden");
    id("pokedex-view").classList.add("hidden");
    id("p2").classList.remove("hidden");
    qs("h1").textContent = "Pokemon Battle Mode!";
    let hpBars = qsa(".hp-info");

    for (let i = 0; i < hpBars.length; i++) {
      hpBars[i].classList.remove("hidden");
    }

    id("results-container").classList.remove("hidden");
    id("flee-btn").classList.remove("hidden");
    id("flee-btn").addEventListener("click", function fleeFunc() {
      fetchMove("flee");
    });
    let moveBtns = qsa("#p1 .moves button");
    let moveSpans = qsa(".moves button .move");

    for (let i = 0; i < moveBtns.length; i++) {
      moveBtns[i].disabled = false;
      let moveName = moveSpans[i].textContent.toLowerCase().replace(/\s/g, "");
      moveBtns[i].addEventListener("click", function moveFunc() {
        fetchMove(moveName);
      });
    }

    guid = resp["guid"];
    pid = resp["pid"];

    let p2CardData = resp["p2"];
    makeCard("#p2", p2CardData);
  }

  /**
   * Populates the given card container with the given Pokemon data.
   * @param {string} container - name of theHTML element containing the Pokemon information.
   * @param {object} data - JSON object for given Pokemon data
   */
  function makeCard(container, data) {
    qs(container + " .name").textContent = data["name"];
    qs(container + " .pokepic").src = ABS_PATH + data["images"]["photo"];
    qs(container + " .type").src = ABS_PATH + data["images"]["typeIcon"];
    qs(container + " .weakness").src = ABS_PATH + data["images"]["weaknessIcon"];
    qs(container + " .hp").textContent = data["hp"] + "HP";
    qs(container + " .info").textContent = data["info"]["description"];

    let moveButtons = qsa(container + " .card button");
    let moveSpans = qsa(container + " .move");
    let moveImgs = qsa(container + " .moves img");

    for (let i = 0; i < moveButtons.length; i++) {
      moveButtons[i].classList.remove("hidden");
      moveSpans[i].nextElementSibling.innerHTML = "";
    }
    let moves = data["moves"];
    for (let i = 0; i < moves.length; i++) {
      moveSpans[i].textContent = moves[i]["name"];
      moveImgs[i].src = ABS_PATH + "icons/" + moves[i]["type"] + ".jpg";
      if (Object.prototype.hasOwnProperty.call(moves[i], "dp")) {
        moveSpans[i].nextElementSibling.textContent = moves[i]["dp"] + " DP";
      }
    }

    if (moves.length < moveButtons.length) {
      for (let i = moves.length; i < moveButtons.length; i++) {
        moveButtons[i].classList.add("hidden");
      }
    }
  }

  /**
   * Retrieves the move data dynamically using AJAX. If something goes wrong with the
   * request, will display an error message on the console.
   * @param {string} moveName - name of given move
   */
  function fetchMove(moveName) {
    id("loading").classList.remove("hidden");
    let params = new FormData();
    params.append("guid", guid);
    params.append("pid", pid);

    if (moveName === "flee") {
      params.append("movename", "flee");
    } else {
      params.append("movename", moveName);
    }

    fetch(POST_URL, {method: "POST", body: params})
      .then(checkStatus)
      .then(resp => resp.json())
      .then(move)
      .catch(console.error);
  }

  /**
   * Handles a move chosen by the user. Displays both Pokemon's current moves in results container.
   * Changes HP of each Pokemon depending on move. Handles wins/losses/flees. Makes the enemy
   * Pokemon found if user wins.
   * @param {object} resp - JSON object for given move data
   */
  function move(resp) {
    id("loading").classList.add("hidden");
    id("p1-turn-results").classList.remove("hidden");
    id("p1-turn-results").textContent = "Player 1 played " + resp["results"]["p1-move"] + " and " +
      resp["results"]["p1-result"] + "!";
    id("p2-turn-results").classList.remove("hidden");
    id("p2-turn-results").textContent = "Player 2 played " + resp["results"]["p2-move"] + " and " +
      resp["results"]["p2-result"] + "!";
    updateHP(resp["p1"]["current-hp"], resp["p1"]["hp"], "#p1");
    updateHP(resp["p2"]["current-hp"], resp["p2"]["hp"], "#p2");
    currentHP = resp["p1"]["hp"];

    if (resp["p1"]["current-hp"] <= 0) {
      if (resp["results"]["p1-move"] === "flee") {
        endGame("p1", true);
      } else {
        endGame("p1", false);
      }
    } else if (resp["p2"]["current-hp"] <= 0) {
      endGame("p2", false);
      let p2Shortname = resp["p2"]["shortname"];
      id(p2Shortname).classList.add("found");
      id(p2Shortname).addEventListener("click", function() {
        found(p2Shortname);
      });
    }
  }

  /**
   * Updates the HP of the given Pokemon. Decreases width of HP bar. Changes HP bar to red if
   * HP is below 20%.
   * @param {string} currHP - current HP of given Pokemon.
   * @param {string} hp  - maximum possible HP of given Pokemon.
   * @param {string} container - HTML element container of given Pokemon.
   */
  function updateHP(currHP, hp, container) {
    qs(container + " .hp").textContent = currHP + "HP";
    let hpWidth = (currHP / hp) * 100;
    let hpBar = qs(container + " .health-bar");
    hpBar.style.width = hpWidth + "%";
    if (hpWidth < 20) {
      hpBar.classList.add("low-health");
    }
  }

  /**
   * Ends the game. If HP of user's Pokemon, displays "You won!" in heading. If computer generate
   * Pokemon's HP reaches 0 or if user flees, displays "You lost!".
   * @param {string} player - Player that lost.
   * @param {boolean} flee - True if player has clicked the flee. False otherwise.
   */
  function endGame(player, flee) {
    let moveBtns = qsa("#p1 .moves button");
    for (let i = 0; i < moveBtns.length; i++) {
      moveBtns[i].disabled = true;
      let clone = moveBtns[i].cloneNode(true);
      moveBtns[i].parentNode.replaceChild(clone, moveBtns[i]);
    }

    if (player === "p1") {
      if (flee === true) {
        id("p2-turn-results").classList.add("hidden");
      }
      qs("h1").textContent = "You lost!";
    } else {
      qs("h1").textContent = "You won!";
      id("p2-turn-results").classList.add("hidden");
    }

    id("endgame").classList.remove("hidden");
    id("endgame").addEventListener("click", backToPokedex);
    id("flee-btn").classList.add("hidden");
  }

  /**
   * Switches view back to Pokedex. Resets HP bars.
   */
  function backToPokedex() {
    id("endgame").classList.add("hidden");
    id("results-container").classList.add("hidden");
    id("p2").classList.add("hidden");
    qs("#p1 .hp-info").classList.add("hidden");
    id("start-btn").classList.remove("hidden");
    qs("h1").textContent = "Your Pokedex";
    qs("#p1 .hp").textContent = currentHP + "HP";
    id("pokedex-view").classList.remove("hidden");
    let hpBars = qsa(".health-bar");
    for (let i = 0; i < hpBars.length; i++) {
      hpBars[i].style.width = "100%";
      hpBars[i].classList.remove("low-health");
    }
    id("p1-turn-results").classList.add("hidden");
    id("p2-turn-results").classList.add("hidden");
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} response - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  function checkStatus(response) {
    if (response.ok) {
      return response;
    } else {
      throw Error("Error in request: " + response.statusText);
    }
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Creates and returns a new empty DOM node of a type that matches the given element type.
   * @param {string} elType - node type
   * @return {Node} New empty DOM node that matches the given type.
   */
  function gen(elType) {
    return document.createElement(elType);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} selector - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

})();