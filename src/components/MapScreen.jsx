import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CREW_TALKS, STORES, PRODUCTS, won } from '../data.js';
import { FIXED_LOCATION, buildStoreProducts, filterCrewTalkItems, selectNearestStores, toggleExpandedId } from '../store-utils.js';
import BottomNav from './BottomNav.jsx';

export { selectNearestStores } from '../store-utils.js';

const CENTER = FIXED_LOCATION;
const STORE_LIMIT = 10;
const SELECTED_MARKER_GAP = 80;
const MAP_BOUNDS = [[126.965, 37.545], [127.02, 37.58]];
const MAP_STYLE = {
  version: 8,
  sources: {
    chungmuro: {
      type: 'raster',
      tiles: ['/map-tiles/{z}/{x}/{y}.png'],
      tileSize: 256,
      minzoom: 12,
      maxzoom: 16,
      bounds: [126.965, 37.545, 127.02, 37.58],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles by <a href="https://www.hotosm.org/">HOT</a>',
    },
  },
  layers: [
    {
      id: 'chungmuro-map',
      type: 'raster',
      source: 'chungmuro',
      paint: {
        'raster-saturation': -0.3,
        'raster-contrast': -0.05,
        'raster-brightness-min': 0.04,
        'raster-brightness-max': 1,
      },
    },
  ],
};

export function getStoreBounds(stores) {
  return stores.reduce(
    (bounds, store) => [
      [Math.min(bounds[0][0], store.lng), Math.min(bounds[0][1], store.lat)],
      [Math.max(bounds[1][0], store.lng), Math.max(bounds[1][1], store.lat)],
    ],
    [[Infinity, Infinity], [-Infinity, -Infinity]],
  );
}

export function getSelectedMarkerOffset(mapHeight, sheetHeight) {
  const desiredMarkerY = mapHeight - sheetHeight - SELECTED_MARKER_GAP;
  return [0, Math.round(desiredMarkerY - mapHeight / 2)];
}

export function getSelectedCameraOptions(store, mapHeight, sheetHeight) {
  return {
    center: [store.lng, store.lat],
    offset: getSelectedMarkerOffset(mapHeight, sheetHeight),
    zoom: 15.5,
    duration: 450,
  };
}

function makePinElement(store, selected, onClick) {
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = 'map-marker' + (store.ai ? ' ai' : '') + (selected ? ' selected' : '');
  marker.setAttribute('aria-label', `${store.name}, 재고 ${store.stock}개`);

  const label = document.createElement('span');
  label.className = 'map-marker-label';
  label.textContent = store.name;

  const badge = document.createElement('span');
  badge.className = 'map-marker-badge';
  badge.textContent = String(store.stock);

  marker.append(label, badge);
  marker.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick(store.id);
  });
  return marker;
}

export function StoreSheet({ store, sheetState, onToggle, onOpenStore, onOpenProduct, sheetRef }) {
  const storeProducts = buildStoreProducts(PRODUCTS, store.stock);

  return (
    <div className={'sheet show ' + sheetState} ref={sheetRef}>
      <div className="sheet-head">
        <button
          type="button"
          className="sheet-toggle"
          onClick={onToggle}
          aria-expanded={sheetState === 'expanded'}
          aria-label={sheetState === 'expanded' ? '바텀시트 접기' : '바텀시트 펼치기'}
        >
          <span className="sheet-handle" />
        </button>
        <button type="button" className="store-title" onClick={() => onOpenStore(store)} aria-label={`${store.name} 상세 보기`}>
          {store.name} <img src="/icons/map-link.svg" alt="" />
        </button>
      </div>
      <div className="sheet-notice">
        <div className="sheet-notice-card">
          <img className="notice-icon" src="/icons/notice-bell.svg" alt="" />
          <span className="notice-copy">[입고알림] 라스트픽 온라인 입고 완료되었습니다.</span>
          <span className="notice-time">12분 전</span>
          <img className="notice-link" src="/icons/map-link.svg" alt="" />
        </div>
      </div>
      <div className="sheet-body">
        {storeProducts.map((product) => (
          <div className="crew-item" key={product.listKey}>
            <div className="row">
              <button type="button" className="product-thumb" onClick={() => onOpenProduct(product.id)}>
                <img className="prod" src={product.img} alt="" />
              </button>
              <div className="info">
                <button type="button" className="nm" onClick={() => onOpenProduct(product.id)}>{product.name}</button>
                <div className="subrow">
                  <span className="variant">{product.variant}</span>
                  {product.badge && <span className="badge-ai">{product.badge}</span>}
                  {product.badge2 && <span className="badge-gray">{product.badge2}</span>}
                </div>
                <div className="price-row">
                  <span className="stock">잔여 재고 | {product.stock}개</span>
                  <span className="now"><span className="pct">{product.pct}%</span>{won(product.price)}</span>
                </div>
              </div>
            </div>
            {product.talk && <div className="talk"><b>크루TALK</b><span>{product.talk}</span></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CrewTalkFilters({ crewTalkOpen, onCrewTalkToggle }) {
  return (
    <div className="map-filters">
      <button type="button"><img src="/icons/map-clock.svg" alt="" />영업중</button>
      <button
        type="button"
        className={`crew-talk-filter${crewTalkOpen ? ' active' : ''}`}
        aria-pressed={crewTalkOpen}
        onClick={onCrewTalkToggle}
      >
        <img src="/icons/map-chat.svg" alt="" />크루톡
      </button>
    </div>
  );
}

export function CrewTalkSheet({ items, query, expandedTalkIds, onQueryChange, onToggleTalk, onClose }) {
  return (
    <div className="sheet show expanded crew-talk-sheet">
      <button type="button" className="sheet-head" onClick={onClose} aria-label="크루톡 바텀시트 닫기">
        <span className="sheet-handle" />
        <span className="store-title">크루톡<img src="/icons/map-link.svg" alt="" /></span>
      </button>
      <div className="crew-talk-search-row">
        <label className="crew-talk-search">
          <span className="sr-only">크루톡 상품 검색</span>
          <input
            type="search"
            value={query}
            placeholder="궁금한 상품명을 검색해보세요"
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <img src="/icons/store-search.svg" alt="" />
        </label>
        <span className="crew-talk-sort">최신순<img src="/icons/map-link.svg" alt="" /></span>
      </div>
      <div className="crew-talk-feed">
        {items.map((item) => {
          const expanded = expandedTalkIds.includes(item.id);
          return (
            <article className="crew-talk-feed-item" key={item.id}>
              <div className="crew-talk-product-row">
                <img className="crew-talk-product-image" src={item.product.img} alt="" />
                <div className="crew-talk-product-info">
                  <strong>{item.product.name}</strong>
                  <div><span>{item.product.variant}</span><span className="crew-talk-stock">잔여 재고 {item.product.stock}개</span></div>
                </div>
                <time>{item.date}</time>
              </div>
              <button
                type="button"
                className={`crew-talk-message${expanded ? ' expanded' : ''}`}
                aria-expanded={expanded}
                onClick={() => onToggleTalk(item.id)}
              >
                <b>{item.store.name}</b>
                <span>{item.message}</span>
              </button>
            </article>
          );
        })}
        {!items.length && <p className="crew-talk-empty">검색 결과가 없습니다.</p>}
      </div>
    </div>
  );
}

export default function MapScreen({ onNav, onOpenProduct, onOpenStore }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const sheetRef = useRef(null);
  const selectStoreRef = useRef(() => {});
  const closeSelectedStoreRef = useRef(() => {});
  const [visibleStores, setVisibleStores] = useState(() => selectNearestStores(STORES, CENTER));
  const [showAiBanner, setShowAiBanner] = useState(true);
  const [showSearchButton, setShowSearchButton] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [sheetState, setSheetState] = useState('closed');
  const [crewTalkOpen, setCrewTalkOpen] = useState(false);
  const [crewTalkQuery, setCrewTalkQuery] = useState('');
  const [expandedTalkIds, setExpandedTalkIds] = useState([]);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const map = new maplibregl.Map({
      container: mapDivRef.current,
      style: MAP_STYLE,
      center: [CENTER.lng, CENTER.lat],
      zoom: 14.25,
      minZoom: 12,
      maxZoom: 19,
      maxBounds: MAP_BOUNDS,
      attributionControl: false,
      localIdeographFontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    });

    map.on('dragstart', () => setShowSearchButton(true));
    map.on('zoomstart', () => setShowSearchButton(true));
    map.on('click', () => closeSelectedStoreRef.current());
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.fitBounds(getStoreBounds(selectNearestStores(STORES, CENTER)), {
      padding: { top: 140, right: 24, bottom: 90, left: 24 },
      maxZoom: 14.25,
      duration: 0,
    });
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function selectStore(id) {
    setCrewTalkOpen(false);
    setSelectedId(id);
    setShowAiBanner(false);
    setSheetState('collapsed');
  }
  selectStoreRef.current = selectStore;

  function closeSelectedStore() {
    setSelectedId(null);
    setSheetState('closed');
  }
  closeSelectedStoreRef.current = closeSelectedStore;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderMarkers = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = visibleStores.map((store) => {
        const element = makePinElement(store, store.id === selectedId, (id) => selectStoreRef.current(id));
        return new maplibregl.Marker({ element, anchor: 'bottom' })
          .setLngLat([store.lng, store.lat])
          .addTo(map);
      });
    };

    renderMarkers();

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [visibleStores, selectedId]);

  const selectedStore = STORES.find((store) => store.id === selectedId);

  useEffect(() => {
    if (!selectedStore || !mapRef.current) return undefined;

    const animationFrame = requestAnimationFrame(() => {
      const map = mapRef.current;
      if (!map) return;
      const mapHeight = map.getContainer().clientHeight;
      const sheetHeight = sheetRef.current?.offsetHeight ?? 400;
      map.easeTo(getSelectedCameraOptions(selectedStore, mapHeight, sheetHeight));
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [selectedStore]);

  function searchThisArea() {
    const center = mapRef.current?.getCenter();
    if (center) {
      setVisibleStores(selectNearestStores(STORES, { lat: center.lat, lng: center.lng }));
    }
    setSelectedId(null);
    setSheetState('closed');
    setShowSearchButton(false);
  }

  function toggleCrewTalk() {
    if (!crewTalkOpen) {
      setSelectedId(null);
      setSheetState('closed');
    }
    setCrewTalkOpen(!crewTalkOpen);
  }

  const visibleCrewTalks = filterCrewTalkItems(CREW_TALKS, crewTalkQuery);

  return (
    <section className="screen active" id="screen-3b">
      <div className="map-wrap">
        <div className="map-canvas">
          <div id="maplibre-map" ref={mapDivRef} aria-label="충무로 주변 올리브영 실제 지도" />
          {(showAiBanner || selectedStore || crewTalkOpen) && <img className="map-dim-art" src="/icons/map-dim-screen.svg" alt="" />}
        </div>

        <div className="map-topbar">
          <button type="button" className="back" onClick={() => onNav('2')} aria-label="올영매장으로 돌아가기">
            <img src="/icons/map-back.svg" alt="" />
          </button>
          <h1>올클맵</h1>
        </div>

        {!showAiBanner && <CrewTalkFilters crewTalkOpen={crewTalkOpen} onCrewTalkToggle={toggleCrewTalk} />}

        {showAiBanner && (
          <div className="ai-banner" role="status">
            AI가 <strong className="ai-name">정열창</strong>님의 관심상품과 할인 혜택을 바탕으로<br />추천하는 매장이에요.
            <button type="button" className="x" onClick={() => setShowAiBanner(false)} aria-label="AI 추천 안내 닫기">
              <img src="/icons/map-close.svg" alt="" />
            </button>
          </div>
        )}

        {showSearchButton && !crewTalkOpen && (
          <button type="button" className="search-here" onClick={searchThisArea}>
            <img src="/icons/map-search-here.svg" alt="" />이 지역 매장 검색
          </button>
        )}

        {selectedStore && <StoreSheet
          store={selectedStore}
          sheetState={sheetState}
          sheetRef={sheetRef}
          onToggle={() => setSheetState(sheetState === 'collapsed' ? 'expanded' : 'collapsed')}
          onOpenStore={onOpenStore}
          onOpenProduct={onOpenProduct}
        />}
        {crewTalkOpen && (
          <CrewTalkSheet
            items={visibleCrewTalks}
            query={crewTalkQuery}
            expandedTalkIds={expandedTalkIds}
            onQueryChange={setCrewTalkQuery}
            onToggleTalk={(id) => setExpandedTalkIds((current) => toggleExpandedId(current, id))}
            onClose={() => setCrewTalkOpen(false)}
          />
        )}
      </div>
      <BottomNav active="store" onNav={onNav} />
    </section>
  );
}
