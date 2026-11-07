let activePopup = null;
let previousFocus = null;
const pageContent = document.querySelector('.page__content');

export const openModalWindow = (popup) => {
  if (activePopup) closeModalWindow(activePopup);
  previousFocus = document.activeElement;
  activePopup = popup;
  popup.classList.add('popup_is-opened');
  popup.setAttribute('aria-hidden', 'false');
  document.body.classList.add('page_locked');
  pageContent.inert = true;
  const focusTarget = popup.querySelector('input:not(:disabled), button[type="submit"]:not(:disabled)')
    || popup.querySelector('[role="dialog"]');
  focusTarget.focus();
  document.addEventListener('keydown', handleKeydown);
};

export const closeModalWindow = (popup) => {
  if (popup !== activePopup) return;
  popup.classList.remove('popup_is-opened');
  popup.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('page_locked');
  pageContent.inert = false;
  document.removeEventListener('keydown', handleKeydown);
  activePopup = null;
  if (previousFocus?.isConnected) previousFocus.focus();
};

function handleKeydown(event) {
  if (event.key === 'Escape') closeModalWindow(activePopup);
  if (event.key !== 'Tab' || !activePopup) return;
  const elements = Array.from(activePopup.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]'));
  const first = elements[0];
  const last = elements.at(-1);
  if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement))) {
    event.preventDefault(); last?.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !elements.includes(document.activeElement))) {
    event.preventDefault(); first?.focus();
  }
}

export const enableModalClosing = () => {
  document.querySelectorAll('.popup').forEach((popup) => {
    popup.querySelector('.popup__close').addEventListener('click', () => closeModalWindow(popup));
    popup.addEventListener('mousedown', (event) => {
      if (event.target === popup) closeModalWindow(popup);
    });
  });
};
