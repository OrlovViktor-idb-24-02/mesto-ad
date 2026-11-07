const template = document.querySelector('#card-template');

export const isCardLiked = (cardData, userId) =>
  cardData.likes.some((user) => user._id === userId);

export const updateCardLikes = (element, cardData, userId) => {
  const button = element.querySelector('.card__like-button');
  const liked = isCardLiked(cardData, userId);
  button.classList.toggle('card__like-button_is-active', liked);
  button.setAttribute('aria-pressed', String(liked));
  button.setAttribute('aria-label', liked ? 'Убрать лайк' : 'Поставить лайк');
  element.querySelector('.card__like-count').textContent = String(cardData.likes.length);
};

export const removeCardElement = (element) => element.remove();

export const showCardError = (element, message) => {
  const error = element.querySelector('.card__error');
  error.textContent = message;
  error.hidden = !message;
};

// Запросы выполняются в index.js; этот модуль отвечает за разметку карточки.
export const createCard = (cardData, userId, { onImage, onLike, onDelete, onInfo }) => {
  const element = template.content.querySelector('.card').cloneNode(true);
  const image = element.querySelector('.card__image');
  image.src = cardData.link;
  image.alt = cardData.name;
  const imageButton = element.querySelector('.card__image-button');
  imageButton.setAttribute('aria-label', `Открыть фотографию: ${cardData.name}`);
  imageButton.addEventListener('click', () => onImage(cardData));
  element.querySelector('.card__title').textContent = cardData.name;
  element.querySelector('.card__title').title = cardData.name;
  element.querySelector('.card__like-button').addEventListener('click', () => onLike(cardData._id, element));
  const deleteButton = element.querySelector('.card__control-button_type_delete');
  if (cardData.owner._id === userId) {
    deleteButton.addEventListener('click', () => onDelete(cardData._id, element));
  } else {
    deleteButton.remove();
  }
  element.querySelector('.card__control-button_type_info').addEventListener('click', () => onInfo(cardData._id, element));
  updateCardLikes(element, cardData, userId);
  return element;
};
