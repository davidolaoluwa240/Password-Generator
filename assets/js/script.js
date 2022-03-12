'use strict';

// selector helper
const $ = function (selector, multiple = false) {
  return !multiple
    ? document.querySelector(selector)
    : document.querySelectorAll(selector);
};

// Selecting elements
const copyBtnElem = $('.password--generator__item--card__display--btn');
const saveToHistoryBtnElem = $('.save--to__history--btn');
const generatePasswordBtnElem = $('.btn--generate__password');
const moreOptionBtnElem = $('.btn--more__option');
const modalBtnsElem = $('[data-modal-open]', true);

const passwordDisplayElem = $('.password--generator__item--card__display p');
const switchTracksElem = $('.switch--track', true);
const modalElems = $('.modal', true);
const modalOverlayElem = $('.modal--overlay');

const rangeInputDisplayElem = $(
  '.password--generator__item--card__range--display'
);
const rangeInputElem = $('.password--generator__item--card__range--input');
const generatedPasswordInputElem = $('#generatedPassword');
const websiteInputElem = $('#websiteName');

// internal states
let rangeValue = 12;
let settingsState = {
  includeLetters: true,
  includeNumbers: false,
  includeSymbols: false,
};
let generatedPassword = '';

// declare a method on the settings State to check whether the settings is valid
settingsState.isValid = function () {
  return this.includeLetters || this.includeNumbers || this.includeSymbols;
};

// function to set the range value
const setRangeValue = function (e) {
  // set the rangeValue state and also update the dom state
  rangeInputDisplayElem.textContent = rangeValue = e.target.value;
};

// function to toggle switch
const toggleSwitch = function (e) {
  // get the name of the clicked switch
  const switchName = this.dataset.switch;

  switch (switchName) {
    // invert the letter state
    case 'letter':
      settingsState.includeLetters = !settingsState.includeLetters;
      break;

    // invert the number state
    case 'number':
      settingsState.includeNumbers = !settingsState.includeNumbers;
      break;

    // invert the symbol state
    case 'symbol':
      settingsState.includeSymbols = !settingsState.includeSymbols;
      break;
  }

  // update the dom switch state
  this.classList.toggle('switch--track__active');
};

// function that display the generated password to the dom
const displayGeneratedPassword = function (password) {
  passwordDisplayElem.textContent = password;
};

// message logger function
const messageLogger = function (message) {
  alert(message);
};

// function to generate password
const passwordGenerator = function () {
  // reset the generated Password state value
  generatedPassword = '';

  // check if we have at least one value true in the settings state
  if (settingsState.isValid()) {
    //   possible numbers
    const possibleNumbers = '0123456789';
    // possible symbols
    const possibleSymbols = '!@#$%^&*()_+';
    // possible letters
    const possibleLetters = 'asdfghjklzxcvbnmqwertyuiop';

    let selectedPossiblePassword = '';
    // if settings include letters then set the selectedPossiblePassword to the possible letters
    if (settingsState.includeLetters)
      selectedPossiblePassword += possibleLetters;

    // if settings include numbers then set the selectedPossiblePassword to the possible numbers
    if (settingsState.includeNumbers)
      selectedPossiblePassword += possibleNumbers;

    // if settings include symbols then set the selectedPossiblePassword to the possible symbols
    if (settingsState.includeSymbols)
      selectedPossiblePassword += possibleSymbols;

    // loop up to the range value, and select randomly in the selectedPossiblePassword, then concat the value to the generatedPassword variable
    for (let i = 1; i <= rangeValue; i++) {
      const randomPosition = Math.trunc(
        Math.random() * selectedPossiblePassword.length
      );
      generatedPassword += selectedPossiblePassword[randomPosition];
    }

    // display generated password
    displayGeneratedPassword(generatedPassword);
  } else {
    // log a message
    messageLogger('👋 please check one password settings to generate password');
  }
};

// function that copy generated password to the clipboard
const copyGeneratedPassword = async function (_, value = generatedPassword) {
  try {
    // using the browser navigator object to copy the generated password to the clipboard
    await navigator.clipboard.writeText(value);
    // log a success message when the password is copied
    messageLogger('✅ password copied');
  } catch (error) {
    // if any error occur like user browser not supporting clipboard api then log the error
    messageLogger(
      '👋 We are sorry your browser does not support clipboard api'
    );
  }
};

// function that toggle modals
const toggleModal = function (e) {
  // if the button is inside a form make sure to prevent browser default
  e.preventDefault();

  if (this.dataset.modalOpen !== 'close') {
    // remove the hidden class on the modal overlay
    modalOverlayElem.classList.remove('hidden');

    // add hidden class to all the remaining modals
    modalElems.forEach(elem => elem.classList.add('hidden'));

    // get the name of the modal we want to open
    const modalName = this.dataset.modalOpen;

    // if the modalName is equal to the "newHistory" and and formMode is equal to "edit" then reset the websiteInput value and the generatedPasswordInput value
    if (modalName === 'newHistory' && this.dataset.formMode !== 'edit') {
      websiteInputElem.value = '';
      websiteInputElem.removeAttribute('readonly');
      generatedPasswordInputElem.value = generatedPassword;
      saveToHistoryBtnElem.classList.remove('hidden');
    }

    // open the modal based on the modalName
    Array.from(modalElems)
      .find(elem => elem.dataset.modalName === modalName)
      ?.classList.remove('hidden');
  } else {
    // add the hidden class on the modal overlay
    modalOverlayElem.classList.add('hidden');

    // add hidden class to all the modals
    modalElems.forEach(elem => elem.classList.add('hidden'));
  }
};

// get data from localstorage
const getFromLocalStorage = function (key) {
  const data = localStorage.getItem(key) || JSON.stringify([]);
  return JSON.parse(data);
};

// save data to localstorage
const saveToLocalStorage = function (newSnapshot) {
  localStorage.setItem('userPasswordHistories', JSON.stringify(newSnapshot));
};

// function that create a new password history and store it in a storage
const createNewHistory = function (e) {
  // extracting the websiteInput element value
  const websiteInputValue = websiteInputElem.value;
  // extracting the generatedPasswordInput element value
  const generatedPasswordInputValue = generatedPasswordInputElem.value;

  // add new history to the history list
  const previousHistories = getFromLocalStorage('userPasswordHistories');
  let lastID = previousHistories.length
    ? previousHistories[previousHistories.length - 1].id
    : 0;
  const newHistory = [
    ...previousHistories,
    {
      id: ++lastID,
      website: websiteInputValue,
      password: generatedPasswordInputValue,
    },
  ];

  // store the newHistory object  to the localstorage
  saveToLocalStorage(newHistory);

  // render the password history data
  displayHistory(newHistory);

  // on creating new history open the saved history modal
  toggleModal.call(this, e);

  // reset the input value
  websiteInputElem.value = '';
};

// get a specific DOM saved history list
const getHistoryPasswordId = function () {
  return Number(this.parentNode.dataset.historyId);
};

// get saved password history object
const getHistoryData = function (id) {
  return getFromLocalStorage('userPasswordHistories').find(
    history => history.id === id
  );
};

// copy a particular saved history password list
const copySavedHistoryPassword = function () {
  // get id
  const getID = getHistoryPasswordId.call(this);
  // find the password in the saved password history list
  const foundHistoryDataPassword = getHistoryData(getID)?.password;
  // copy the password to the clipboard
  copyGeneratedPassword(undefined, foundHistoryDataPassword);
};

// function to view a particular saved password history data
const viewSavedHistoryPassword = function (e) {
  // get id
  const getID = getHistoryPasswordId.call(this);
  // found history object
  const foundHistoryObj = getHistoryData(getID);

  // set the website input value
  websiteInputElem.value = foundHistoryObj.website;
  // set the generated password input value
  generatedPasswordInputElem.value = foundHistoryObj.password;
  // set readonly on the website input value
  websiteInputElem.setAttribute('readonly', 'readonly');

  // hide the save to history button in the new history modal
  saveToHistoryBtnElem.classList.add('hidden');

  // toggle the new history modal
  toggleModal.call(this, e);
};

// function to delete a particular saved password history data
const deleteSavedHistoryPassword = function () {
  // get id
  const getID = getHistoryPasswordId.call(this);
  // remove the foundHistoryObj from the rest of the history
  const newSavedHistory = getFromLocalStorage('userPasswordHistories').filter(
    history => history.id !== getID
  );

  // save the new saved history snapshot to the localstorage
  saveToLocalStorage(newSavedHistory);

  // re-render the displayHistory
  displayHistory(newSavedHistory);
};

// function that display all the history data
const displayHistory = function (passwordHistories) {
  // select the history modal content
  const savedHistoryContent = $('.saved--history__modal--content');

  const renderHtml = function ({ website, id }, hasContent = true) {
    return hasContent
      ? `
      <div
          class="password--generator__item--card password--generator__item--card__settings"
        >
          <div class="password--generator__item--card__left">
            <p class="website--name">${website}</p>
          </div>
          <div class="password--generator__item--card__right" data-history-id="${id}">
            <button class="saved--password__action--btn" title="copy password">
              <i class="fa-regular fa-copy"></i>
            </button>
            <button class="saved--password__action--btn" title="view password" data-modal-open="newHistory" data-form-mode='edit'>
              <i class="fa-regular fa-eye" ></i>
            </button>
            <button class="saved--password__action--btn" title="delete password">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
  `
      : ` <h2 class="is--centered">👋 You don't have a password history</h2>
      <button class="btn btn--primary btn more--options__btn go--to__new--history" data-modal-open="newHistory">
        New History
      </button>`;
  };

  // reset the inner html of the savedHistory container
  savedHistoryContent.innerHTML = '';

  // if the password histories is not empty then render the hasContent value, else render the has no content value in the render html function
  if (passwordHistories.length) {
    // for each password history data, the render Html should be called
    passwordHistories.forEach(history =>
      savedHistoryContent.insertAdjacentHTML('afterBegin', renderHtml(history))
    );

    // attach event listener to the saved history content buttons
    const historyCopyBtn = $('.fa-copy', true);
    const historyViewBtn = $('.fa-eye', true);
    const historyTrashBtn = $('.fa-trash-can', true);
    historyCopyBtn.forEach(elem =>
      elem.parentNode.addEventListener('click', copySavedHistoryPassword)
    );
    historyTrashBtn.forEach(elem =>
      elem.parentNode.addEventListener('click', deleteSavedHistoryPassword)
    );
    historyViewBtn.forEach(elem =>
      elem.parentNode.addEventListener('click', viewSavedHistoryPassword)
    );
  } else {
    savedHistoryContent.insertAdjacentHTML('afterBegin', renderHtml({}, false));
    const goToHistoryBtn = $('.go--to__new--history');
    // add event listener on the go to history btn
    goToHistoryBtn.addEventListener('click', toggleModal);
  }
};

// event listeners
rangeInputElem.addEventListener('input', setRangeValue);
switchTracksElem.forEach(elem => {
  elem.addEventListener('click', toggleSwitch);
});
generatePasswordBtnElem.addEventListener('click', passwordGenerator);
copyBtnElem.addEventListener('click', copyGeneratedPassword);
modalBtnsElem.forEach(elem => elem.addEventListener('click', toggleModal));
saveToHistoryBtnElem.addEventListener('click', createNewHistory);
document.addEventListener('DOMContentLoaded', () => {
  // when the page loads call the password generator to generate a new password
  passwordGenerator();

  // on page load display the history
  const passwordHistories = getFromLocalStorage('userPasswordHistories');
  displayHistory(passwordHistories);
});
