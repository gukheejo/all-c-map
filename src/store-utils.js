export const FIXED_LOCATION = Object.freeze({
  address: '서울시 중구 필동로 26 (필동2가 101-1)',
  lat: 37.5605,
  lng: 126.9948,
});

const EARTH_RADIUS_KM = 6371;
const WALKING_KM_PER_MINUTE = 0.08;

function toRadians(value) {
  return value * (Math.PI / 180);
}

export function distanceKm(a, b) {
  const latitudeDelta = toRadians(b.lat - a.lat);
  const longitudeDelta = toRadians(b.lng - a.lng);
  const latitudeA = toRadians(a.lat);
  const latitudeB = toRadians(b.lat);
  const haversine = (
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2
  );

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

export function selectNearestStores(stores, center = FIXED_LOCATION, limit = 10) {
  return [...stores]
    .sort((a, b) => distanceKm(a, center) - distanceKm(b, center))
    .slice(0, limit);
}

export function formatDistance(kilometers) {
  return `${kilometers.toFixed(1)}km`;
}

export function walkingMinutes(kilometers) {
  return Math.max(1, Math.ceil(kilometers / WALKING_KM_PER_MINUTE));
}

const CONDITION_BADGES = [undefined, '유통기한', '패키지 파손'];

function hashStoreId(storeId) {
  return [...String(storeId ?? '')].reduce(
    (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
}

function buildStoreConditions(count, storeId) {
  const conditions = Array.from(
    { length: count },
    (_, index) => CONDITION_BADGES[index % CONDITION_BADGES.length],
  );
  let randomState = hashStoreId(storeId);

  for (let index = conditions.length - 1; index > 0; index -= 1) {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    const swapIndex = randomState % (index + 1);
    [conditions[index], conditions[swapIndex]] = [conditions[swapIndex], conditions[index]];
  }

  return conditions;
}

export function buildStoreProducts(products, count, aiLimit = 3, storeId) {
  if (!products.length || count <= 0) return [];

  let aiPicks = 0;
  const storeProducts = products.slice(0, count);
  const conditions = buildStoreConditions(storeProducts.length, storeId);
  return storeProducts.map((source, index) => {
    const showAiPick = source.badge === 'AI PICK' && aiPicks < aiLimit;
    if (showAiPick) aiPicks += 1;

    return {
      ...source,
      badge: showAiPick ? source.badge : undefined,
      badge2: conditions[index],
      listKey: `${source.id}-${index}`,
    };
  });
}

export function toggleExpandedId(expandedIds, id) {
  return expandedIds.includes(id)
    ? expandedIds.filter((expandedId) => expandedId !== id)
    : [...expandedIds, id];
}

export function resolveSheetSnap(currentState, deltaY, velocityY) {
  const distanceThreshold = 48;
  const velocityThreshold = 0.45;

  if (deltaY <= -distanceThreshold || velocityY <= -velocityThreshold) return 'expanded';
  if (deltaY >= distanceThreshold || velocityY >= velocityThreshold) return 'collapsed';
  return currentState;
}

function matchesSearchText(text, query) {
  const terms = query
    .trim()
    .toLocaleLowerCase('ko-KR')
    .split(/\s+/)
    .filter(Boolean);
  if (!terms.length) return true;

  const haystack = text.toLocaleLowerCase('ko-KR');
  return terms.every((term) => haystack.includes(term));
}

export function filterCrewTalkItems(items, query) {
  return items.filter(({ product, store, message }) => (
    matchesSearchText(`${product.name} ${product.variant} ${store.name} ${message}`, query)
  ));
}

export function filterStoreNotices(items, store, query) {
  return items.filter((notice) => matchesSearchText(`${store.name} ${notice.message}`, query));
}

export function filterStoreCrewTalks(items, store, query) {
  return items.filter(({ product, message }) => (
    matchesSearchText(`${product.name} ${product.variant} ${store.name} ${message}`, query)
  ));
}

export function sortDatedItems(items, order = 'latest') {
  const direction = order === 'registered' ? 1 : -1;
  return [...items].sort((a, b) => direction * a.date.localeCompare(b.date));
}
