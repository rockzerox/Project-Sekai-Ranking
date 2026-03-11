import { useState, useEffect } from 'react';
import { CardsMap } from '../types';

const CARDS_JSON_URL = 'https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking/cards.json';

// Simple in-memory cache
let cardsCache: CardsMap | null = null;
let fetchPromise: Promise<CardsMap> | null = null;

export const fetchCardData = async (): Promise<CardsMap> => {
  if (cardsCache) return cardsCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(CARDS_JSON_URL)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch cards data');
      return res.json();
    })
    .then(data => {
      cardsCache = data;
      fetchPromise = null;
      return data;
    })
    .catch(err => {
      console.error('Error fetching cards data:', err);
      fetchPromise = null;
      return {};
    });

  return fetchPromise;
};

export const getCharacterIdByCardId = (cards: CardsMap, cardId: number): number | null => {
  const card = cards[cardId.toString()];
  return card ? card.characterId : null;
};

export const useCardData = () => {
  const [cards, setCards] = useState<CardsMap | null>(cardsCache);
  const [isLoading, setIsLoading] = useState(!cardsCache);

  useEffect(() => {
    if (!cardsCache) {
      fetchCardData().then(data => {
        setCards(data);
        setIsLoading(false);
      });
    } else {
      setTimeout(() => setIsLoading(false), 0);
    }
  }, []);

  return { cards, isLoading };
};
