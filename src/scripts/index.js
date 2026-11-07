import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/cyrillic-900.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-900.css';
import '../styles/index.css';
import { getUserInfo, getCardList, setUserInfo, setUserAvatar, addCard, deleteCard, changeLikeCardStatus, hasApiConfig, getApiCohort, setApiCredentials } from './components/api.js';
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
const connectButton = document.querySelector('.page__connect');
const connectPopup = document.querySelector('.popup_type_connection');
const connectForm = document.forms.connection;
const editPopup = document.querySelector('.popup_type_edit');
const avatarPopup = document.querySelector('.popup_type_avatar');
const newCardPopup = document.querySelector('.popup_type_new-card');
const deletePopup = document.querySelector('.popup_type_remove-card');
const imagePopup = document.querySelector('.popup_type_image');
const infoPopup = document.querySelector('.popup_type_info');
const profileForm = document.forms['edit-profile'];
const avatarForm = document.forms['edit-avatar'];
const cardForm = document.forms['new-place'];
const deleteForm = document.forms['remove-card'];
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
  const image = imagePopup.querySelector('.popup__image');
  image.src = cardData.link;
  image.alt = cardData.name;
  imagePopup.querySelector('.popup__caption').textContent = cardData.name;
  openModalWindow(imagePopup);
};

const handleLikeClick = (cardId, element) => {
  const button = element.querySelector('.card__like-button');
  if (button.disabled) return;
  button.disabled = true;
  showCardError(element, '');
  changeLikeCardStatus(cardId, isCardLiked(cardsById.get(cardId), currentUser._id))
    .then((cardData) => {
      cardsById.set(cardId, cardData);
      updateCardLikes(element, cardData, currentUser._id);
    })
    .catch((error) => showCardError(element, reportError(error)))
    .finally(() => { button.disabled = false; });
};

const handleDeleteClick = (cardId, element) => {
  if (deleteForm.dataset.submitting === 'true') return;
  pendingDelete = { cardId, element };
  deleteForm.querySelector('.popup__error').textContent = '';
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
  const button = element.querySelector('.card__control-button_type_info');
  if (button.disabled) return;
  button.disabled = true;
  const requestId = ++infoRequestId;
  showCardError(element, '');
  // Для статистики каждый раз запрашиваем актуальные сведения с сервера.
  getCardList()
    .then((cards) => {
      if (requestId !== infoRequestId || !element.isConnected) return;
      const cardData = cards.find((card) => card._id === cardId);
      if (!cardData) throw new Error('Карточка больше не существует.');
      cardsById.set(cardId, cardData);
      updateCardLikes(element, cardData, currentUser._id);
      infoPopup.querySelector('.popup__info-list').replaceChildren(
        createInfoString('Название:', cardData.name),
        createInfoString('Автор:', cardData.owner.name),
        createInfoString('Дата создания:', formatDate(new Date(cardData.createdAt))),
        createInfoString('Количество лайков:', cardData.likes.length),
      );
      infoPopup.querySelector('.popup__users').replaceChildren(...cardData.likes.map(createUserPreview));
      infoPopup.querySelector('.popup__empty').hidden = cardData.likes.length > 0;
      openModalWindow(infoPopup);
    })
    .catch((error) => {
      if (requestId === infoRequestId) showCardError(element, reportError(error));
    })
    .finally(() => { button.disabled = false; });
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

document.querySelector('.profile__edit-button').addEventListener('click', () => {
  if (profileForm.dataset.submitting === 'true') return;
  profileForm.elements.name.value = currentUser.name;
  profileForm.elements.about.value = currentUser.about;
  clearValidation(profileForm, validationSettings);
  openModalWindow(editPopup);
});

document.querySelector('.profile__avatar-button').addEventListener('click', () => {
  if (avatarForm.dataset.submitting === 'true') return;
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarPopup);
});

document.querySelector('.profile__add-button').addEventListener('click', () => {
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
      document.querySelectorAll('.profile button').forEach((button) => { button.disabled = false; });
      status.textContent = cards.length ? '' : 'Пока нет фотографий. Добавьте первое место.';
      status.hidden = cards.length > 0;
      connectButton.hidden = true;
    })
    .catch((error) => {
      status.textContent = reportError(error);
      retry.hidden = false;
      connectButton.hidden = false;
    })
    .finally(() => { loading = false; });
};

retry.addEventListener('click', loadPage);
connectButton.addEventListener('click', () => {
  connectForm.elements.cohort.value = getApiCohort();
  connectForm.elements.token.value = '';
  clearValidation(connectForm, validationSettings);
  openModalWindow(connectPopup);
});
connectForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!connectForm.checkValidity() || loading) return;
  setApiCredentials({
    cohort: connectForm.elements.cohort.value,
    token: connectForm.elements.token.value,
  });
  connectForm.reset();
  closeModalWindow(connectPopup);
  loadPage();
});
enableValidation(validationSettings);
enableModalClosing();
if (hasApiConfig()) {
  loadPage();
} else {
  status.textContent = 'Подключите свой аккаунт Mesto, чтобы увидеть профиль и фотографии.';
  connectButton.hidden = false;
}
