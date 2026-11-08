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
  const title = element.querySelector('.card__title');
  title.textContent = cardData.name;
  title.title = cardData.name;
  const likeButton = element.querySelector('.card__like-button');
  likeButton.addEventListener('click', () => {
    if (likeButton.disabled) return;
    likeButton.disabled = true;
    Promise.resolve()
      .then(() => onLike(cardData._id, element))
      .finally(() => { likeButton.disabled = false; });
  });
  const deleteButton = element.querySelector('.card__control-button_type_delete');
  if (cardData.owner._id === userId) {
    deleteButton.addEventListener('click', () => onDelete(cardData._id, element));
  } else {
    deleteButton.remove();
  }
  const infoButton = element.querySelector('.card__control-button_type_info');
  infoButton.addEventListener('click', () => {
    if (infoButton.disabled) return;
    infoButton.disabled = true;
    Promise.resolve()
      .then(() => onInfo(cardData._id, element))
      .finally(() => { infoButton.disabled = false; });
  });
  updateCardLikes(element, cardData, userId);
  return element;
};
