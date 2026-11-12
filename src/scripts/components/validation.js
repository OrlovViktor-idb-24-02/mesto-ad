const getErrorElement = (form, input, settings) =>
  form.querySelector(`${settings.errorSelector}[id="${input.id}-error"]`);

const showInputError = (form, input, message, settings) => {
  const errorElement = getErrorElement(form, input, settings);
  input.classList.add(settings.inputErrorClass);
  input.setAttribute('aria-invalid', 'true');
  errorElement.textContent = message;
  errorElement.classList.add(settings.errorClass);
};

const hideInputError = (form, input, settings) => {
  const errorElement = getErrorElement(form, input, settings);
  input.classList.remove(settings.inputErrorClass);
  input.setAttribute('aria-invalid', 'false');
  errorElement.textContent = '';
  errorElement.classList.remove(settings.errorClass);
};

const checkInputValidity = (form, input, settings) => {
  if (input.validity.valid) hideInputError(form, input, settings);
  else showInputError(form, input, input.validationMessage, settings);
};

const hasInvalidInput = (inputs) => inputs.some((input) => !input.validity.valid);

const disableSubmitButton = (button, settings) => {
  button.disabled = true;
  button.classList.add(settings.inactiveButtonClass);
};

const enableSubmitButton = (button, settings) => {
  button.disabled = false;
  button.classList.remove(settings.inactiveButtonClass);
};

const toggleButtonState = (form, inputs, settings) => {
  const button = form.querySelector(settings.submitButtonSelector);
  if (hasInvalidInput(inputs)) {
    disableSubmitButton(button, settings);
  } else {
    enableSubmitButton(button, settings);
  }
};

const setEventListeners = (form, settings) => {
  const inputs = Array.from(form.querySelectorAll(settings.inputSelector));
  inputs.forEach((input) => {
    input.setAttribute('aria-describedby', `${input.id}-error`);
    input.addEventListener('input', () => {
      checkInputValidity(form, input, settings);
      form.querySelector(settings.serverErrorSelector).textContent = '';
      toggleButtonState(form, inputs, settings);
    });
  });
  toggleButtonState(form, inputs, settings);
};

export const clearValidation = (form, settings) => {
  const inputs = Array.from(form.querySelectorAll(settings.inputSelector));
  inputs.forEach((input) => {
    hideInputError(form, input, settings);
  });
  form.querySelector(settings.serverErrorSelector).textContent = '';
  disableSubmitButton(form.querySelector(settings.submitButtonSelector), settings);
};

export const enableValidation = (settings) => {
  document.querySelectorAll(settings.formSelector).forEach((form) => setEventListeners(form, settings));
};
