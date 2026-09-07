export const FIXED_LOCATION = Object.freeze({
  address: '서울시 중구 필동로 26 (필동2가 101-1)',
  lat: 37.559175,
  lng: 126.995635,
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
const STORE_CREW_TALK_OPENERS = [
  (label) => `${label}에서 직접 발색과 사용감을 비교해 본 크루의 팁이에요.`,
  (label) => `${label} 고객들이 자주 물어보신 포인트를 크루가 정리했어요.`,
  (label) => `${label} 크루가 데일리로 써 보고 남긴 솔직한 사용 팁이에요.`,
  (label) => `${label}에서 이 제품을 찾는 분들께 크루가 꼭 알려드리는 팁이에요.`,
  (label) => `${label} 크루들이 추천 조합을 테스트한 뒤 남긴 코멘트예요.`,
  (label) => `${label}에서 픽업하실 때 함께 참고해 보세요. 크루가 직접 확인한 팁이에요.`,
];

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

function buildStoreCrewTalk(product, store, index) {
  if (!product.talk || !store?.name) return product.talk;

  const label = store.name.replace(/^올리브영\s*/, '');
  const openerIndex = hashStoreId(`${store.id}:${product.id}:${index}`)
    % STORE_CREW_TALK_OPENERS.length;
  return `${STORE_CREW_TALK_OPENERS[openerIndex](label)} ${product.talk}`;
}

export function buildStoreProducts(products, count, aiLimit = 3, storeContext) {
  if (!products.length || count <= 0) return [];

  const storeId = typeof storeContext === 'object' ? storeContext?.id : storeContext;
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
      talk: buildStoreCrewTalk(source, storeContext, index),
      listKey: `${source.id}-${index}`,
    };
  });
}

export function buildStoreProductsForStore(products, store, aiLimit = 3) {
  if (!store) return [];
  return buildStoreProducts(products, store.stock, store.ai ? aiLimit : 0, store);
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
