const pageContent = document.querySelector('.page__content');
const popups = document.querySelectorAll('.popup');

function closeOnEscape(event) {
  if (event.key !== 'Escape') return;
  const popup = document.querySelector('.popup_is-opened');
  if (popup) closeModalWindow(popup);
}

export const openModalWindow = (popup) => {
  popup.classList.add('popup_is-opened');
  popup.setAttribute('aria-hidden', 'false');
  document.body.classList.add('page_locked');
  pageContent.inert = true;
  const focusTarget = popup.querySelector('input:not(:disabled), button[type="submit"]:not(:disabled)')
    || popup.querySelector('[role="dialog"]');
  focusTarget.focus();
  document.addEventListener('keydown', closeOnEscape);
};

export const closeModalWindow = (popup) => {
  if (!popup.classList.contains('popup_is-opened')) return;
  popup.classList.remove('popup_is-opened');
  popup.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('page_locked');
  pageContent.inert = false;
  document.removeEventListener('keydown', closeOnEscape);
};

export const enableModalClosing = () => {
  popups.forEach((popup) => {
    popup.querySelector('.popup__close').addEventListener('click', () => closeModalWindow(popup));
    popup.addEventListener('mousedown', (event) => {
      if (event.target === popup) closeModalWindow(popup);
    });
  });
};
