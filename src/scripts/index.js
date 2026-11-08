import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/cyrillic-900.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-900.css';
import '../styles/index.css';
import { getUserInfo, getCardList, setUserInfo, setUserAvatar, addCard, deleteCard, changeLikeCardStatus } from './components/api.js';
import { createCard, isCardLiked, updateCardLikes, removeCardElement, showCardError } from './components/card.js';
import { openModalWindow, closeModalWindow, enableModalClosing } from './components/modal.js';
import { enableValidation, clearValidation } from './components/validation.js';

const validationSettings = {
  formSelector: '.popup__form',
  inputSelector: '.popup__input',
  submitButtonSelector: '.popup__button',
  errorSelector: '.popup__input-error',
  serverErrorSelector: '.popup__error',
  inactiveButtonClass: 'popup__button_disabled',
  inputErrorClass: 'popup__input_type_error',
  errorClass: 'popup__input-error_active',
};

const profileTitle = document.querySelector('.profile__title');
const profileDescription = document.querySelector('.profile__description');
const profileAvatar = document.querySelector('.profile__avatar');
const list = document.querySelector('.places__list');
const status = document.querySelector('.page__status');
const retry = document.querySelector('.page__retry');
const editPopup = document.querySelector('.popup_type_edit');
const avatarPopup = document.querySelector('.popup_type_avatar');
const newCardPopup = document.querySelector('.popup_type_new-card');
const deletePopup = document.querySelector('.popup_type_remove-card');
const imagePopup = document.querySelector('.popup_type_image');
const popupImage = imagePopup.querySelector('.popup__image');
const popupCaption = imagePopup.querySelector('.popup__caption');
const infoPopup = document.querySelector('.popup_type_info');
const infoList = infoPopup.querySelector('.popup__info-list');
const infoUsers = infoPopup.querySelector('.popup__users');
const infoEmpty = infoPopup.querySelector('.popup__empty');
const profileEditButton = document.querySelector('.profile__edit-button');
const profileAvatarButton = document.querySelector('.profile__avatar-button');
const profileAddButton = document.querySelector('.profile__add-button');
const profileButtons = document.querySelectorAll('.profile button');
const profileForm = document.forms['edit-profile'];
const avatarForm = document.forms['edit-avatar'];
const cardForm = document.forms['new-place'];
const deleteForm = document.forms['remove-card'];
const deleteError = deleteForm.querySelector('.popup__error');
const definitionTemplate = document.querySelector('#popup-info-definition-template');
const userTemplate = document.querySelector('#popup-info-user-preview-template');
const cardsById = new Map();
let currentUser = null;
let pendingDelete = null;
let loading = false;
let infoRequestId = 0;

const reportError = (error) => {
  console.error(error);
  return 'Не удалось выполнить запрос. Проверьте соединение и попробуйте ещё раз.';
};

const renderUser = (user) => {
  currentUser = user;
  profileTitle.textContent = user.name;
  profileDescription.textContent = user.about;
  profileAvatar.src = user.avatar;
  profileAvatar.hidden = false;
};

const handleImageClick = (cardData) => {
  popupImage.src = cardData.link;
  popupImage.alt = cardData.name;
  popupCaption.textContent = cardData.name;
  openModalWindow(imagePopup);
};

const handleLikeClick = (cardId, element) => {
  showCardError(element, '');
  return changeLikeCardStatus(cardId, isCardLiked(cardsById.get(cardId), currentUser._id))
    .then((cardData) => {
      cardsById.set(cardId, cardData);
      updateCardLikes(element, cardData, currentUser._id);
    })
    .catch((error) => showCardError(element, reportError(error)));
};

const handleDeleteClick = (cardId, element) => {
  if (deleteForm.dataset.submitting === 'true') return;
  pendingDelete = { cardId, element };
  deleteError.textContent = '';
  openModalWindow(deletePopup);
};

const formatDate = (date) => date.toLocaleDateString('ru-RU', {
  year: 'numeric', month: 'long', day: 'numeric',
});

const createInfoString = (label, value) => {
  const item = definitionTemplate.content.firstElementChild.cloneNode(true);
  item.querySelector('.popup__term').textContent = label;
  item.querySelector('.popup__definition-value').textContent = String(value);
  return item;
};

const createUserPreview = (user) => {
  const item = userTemplate.content.firstElementChild.cloneNode(true);
  item.querySelector('.popup__user-avatar').src = user.avatar;
  item.querySelector('.popup__user-name').textContent = user.name;
  item.querySelector('.popup__user-about').textContent = user.about;
  return item;
};

const handleInfoClick = (cardId, element) => {
  const requestId = ++infoRequestId;
  showCardError(element, '');
  infoList.textContent = 'Загрузка...';
  infoUsers.replaceChildren();
  infoEmpty.hidden = true;
  openModalWindow(infoPopup);
  // Для статистики каждый раз запрашиваем актуальные сведения с сервера.
  return getCardList()
    .then((cards) => {
      if (requestId !== infoRequestId || !element.isConnected || !infoPopup.classList.contains('popup_is-opened')) return;
      const cardData = cards.find((card) => card._id === cardId);
      if (!cardData) throw new Error('Карточка больше не существует.');
      infoList.replaceChildren(
        createInfoString('Название:', cardData.name),
        createInfoString('Автор:', cardData.owner.name),
        createInfoString('Дата создания:', formatDate(new Date(cardData.createdAt))),
        createInfoString('Количество лайков:', cardData.likes.length),
      );
      infoUsers.replaceChildren(...cardData.likes.map(createUserPreview));
      infoEmpty.hidden = cardData.likes.length > 0;
    })
    .catch((error) => {
      if (requestId === infoRequestId) {
        closeModalWindow(infoPopup);
        showCardError(element, reportError(error));
      }
    });
};

const renderCard = (cardData) => {
  cardsById.set(cardData._id, cardData);
  return createCard(cardData, currentUser._id, {
    onImage: handleImageClick,
    onLike: handleLikeClick,
    onDelete: handleDeleteClick,
    onInfo: handleInfoClick,
  });
};

// Значение фиксируется до отправки, поля не сбрасываются при ошибке.
const submitForm = (form, popup, loadingText, action) => {
  if (form.dataset.submitting === 'true' || !form.checkValidity()) return;
  const button = form.querySelector('[type="submit"]');
  const defaultText = button.textContent;
  form.dataset.submitting = 'true';
  form.querySelector('.popup__error').textContent = '';
  button.textContent = loadingText;
  button.disabled = true;
  button.classList.add(validationSettings.inactiveButtonClass);
  form.querySelectorAll('input').forEach((input) => { input.disabled = true; });
  Promise.resolve().then(action)
    .then(() => closeModalWindow(popup))
    .catch((error) => { form.querySelector('.popup__error').textContent = reportError(error); })
    .finally(() => {
      form.dataset.submitting = 'false';
      form.querySelectorAll('input').forEach((input) => { input.disabled = false; });
      button.textContent = defaultText;
      button.disabled = !form.checkValidity();
      button.classList.toggle(validationSettings.inactiveButtonClass, button.disabled);
    });
};

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = { name: profileForm.elements.name.value.trim(), about: profileForm.elements.about.value.trim() };
  submitForm(profileForm, editPopup, 'Сохранение...', () => setUserInfo(data).then(renderUser));
});

avatarForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = { avatar: avatarForm.elements.avatar.value.trim() };
  submitForm(avatarForm, avatarPopup, 'Сохранение...', () => setUserAvatar(data).then(renderUser));
});

cardForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = { name: cardForm.elements.name.value.trim(), link: cardForm.elements.link.value.trim() };
  submitForm(cardForm, newCardPopup, 'Создание...', () => addCard(data).then((cardData) => {
    list.prepend(renderCard(cardData));
    status.textContent = '';
    status.hidden = true;
    cardForm.reset();
  }));
});

deleteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!pendingDelete) return;
  const target = pendingDelete;
  submitForm(deleteForm, deletePopup, 'Удаление...', () => deleteCard(target.cardId).then(() => {
    removeCardElement(target.element);
    cardsById.delete(target.cardId);
    pendingDelete = null;
    if (!cardsById.size) {
      status.textContent = 'Пока нет фотографий. Добавьте первое место.';
      status.hidden = false;
    }
  }));
});

profileEditButton.addEventListener('click', () => {
  if (profileForm.dataset.submitting === 'true') return;
  profileForm.elements.name.value = currentUser.name;
  profileForm.elements.about.value = currentUser.about;
  clearValidation(profileForm, validationSettings);
  openModalWindow(editPopup);
});

profileAvatarButton.addEventListener('click', () => {
  if (avatarForm.dataset.submitting === 'true') return;
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarPopup);
});

profileAddButton.addEventListener('click', () => {
  if (cardForm.dataset.submitting === 'true') return;
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(newCardPopup);
});

const loadPage = () => {
  if (loading) return;
  loading = true;
  status.hidden = false;
  status.textContent = 'Загрузка...';
  retry.hidden = true;
  Promise.all([getCardList(), getUserInfo()])
    .then(([cards, user]) => {
      renderUser(user);
      cardsById.clear();
      list.replaceChildren(...cards.map(renderCard));
      profileButtons.forEach((button) => { button.disabled = false; });
      status.textContent = cards.length ? '' : 'Пока нет фотографий. Добавьте первое место.';
      status.hidden = cards.length > 0;
    })
    .catch((error) => {
      status.textContent = reportError(error);
      retry.hidden = false;
    })
    .finally(() => { loading = false; });
};

retry.addEventListener('click', loadPage);
enableValidation(validationSettings);
enableModalClosing();
loadPage();
