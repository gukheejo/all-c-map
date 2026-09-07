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

export function buildStoreProducts(products, count, aiLimit = 3) {
  if (!products.length || count <= 0) return [];

  let aiPicks = 0;
  return Array.from({ length: count }, (_, index) => {
    const source = products[index % products.length];
    const showAiPick = source.badge === 'AI PICK' && aiPicks < aiLimit;
    if (showAiPick) aiPicks += 1;

    return {
      ...source,
      badge: showAiPick ? source.badge : undefined,
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

export function filterCrewTalkItems(items, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  if (!normalizedQuery) return items;

  return items.filter(({ product, store }) => (
    `${product.name} ${product.variant} ${store.name}`
      .toLocaleLowerCase('ko-KR')
      .includes(normalizedQuery)
  ));
}
