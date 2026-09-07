import { useEffect, useRef, useState } from 'react';
import { CREW_TALKS, STORES, PRODUCTS, won } from '../data.js';
import {
  FIXED_LOCATION,
  buildStoreProducts,
  filterCrewTalkItems,
  resolveSheetSnap,
  selectNearestStores,
  toggleExpandedId,
} from '../store-utils.js';
import BottomNav from './BottomNav.jsx';
import { loadKakaoMaps } from '../kakao-map.js';

export { selectNearestStores } from '../store-utils.js';
export { loadKakaoMaps } from '../kakao-map.js';

const CENTER = FIXED_LOCATION;
const STORE_LIMIT = 10;
const SELECTED_MARKER_GAP = 80;
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

export function getKakaoSelectedPanOffset(mapHeight, sheetHeight) {
  const [, markerOffsetY] = getSelectedMarkerOffset(mapHeight, sheetHeight);
  return { x: 0, y: -markerOffsetY };
}

export function limitInitialZoomLevel(fittedLevel, closestAllowedLevel = 5) {
  return Math.min(fittedLevel, closestAllowedLevel);
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

export function StoreSheet({ store, sheetState, onToggle, onOpenProduct, onOpenStore, sheetRef }) {
  const storeProducts = buildStoreProducts(PRODUCTS, store.stock);
  const dragRef = useRef(null);
  const mouseCleanupRef = useRef(() => {});
  const [dragHeight, setDragHeight] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => mouseCleanupRef.current(), []);

  function toggleSheet() {
    onToggle(sheetState === 'collapsed' ? 'expanded' : 'collapsed');
  }

  function beginDrag(clientY) {
    const sheet = sheetRef?.current;
    if (!sheet) return;
    const stageHeight = sheet.parentElement?.clientHeight ?? window.innerHeight;
    dragRef.current = {
      startY: clientY,
      startTime: performance.now(),
      startHeight: sheet.getBoundingClientRect().height,
      minHeight: Math.min(400, Math.max(300, stageHeight * 0.5)),
      maxHeight: Math.max(300, stageHeight - 57),
    };
    setDragging(true);
  }

  function moveDrag(clientY) {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaY = clientY - drag.startY;
    setDragHeight(Math.min(drag.maxHeight, Math.max(drag.minHeight, drag.startHeight - deltaY)));
  }

  function finishDrag(clientY) {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaY = clientY - drag.startY;
    const elapsed = Math.max(1, performance.now() - drag.startTime);
    const velocityY = deltaY / elapsed;
    const wasTap = Math.abs(deltaY) < 6;
    dragRef.current = null;
    setDragging(false);
    setDragHeight(null);
    if (wasTap) toggleSheet();
    else onToggle(resolveSheetSnap(sheetState, deltaY, velocityY));
  }

  function handleMouseDown(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    beginDrag(event.clientY);
    const handleMouseMove = (moveEvent) => moveDrag(moveEvent.clientY);
    const handleMouseUp = (upEvent) => {
      finishDrag(upEvent.clientY);
      mouseCleanupRef.current();
    };
    mouseCleanupRef.current = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      mouseCleanupRef.current = () => {};
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function handleTouchStart(event) {
    const touch = event.touches[0];
    if (touch) beginDrag(touch.clientY);
  }

  function handleTouchMove(event) {
    const touch = event.touches[0];
    if (touch) moveDrag(touch.clientY);
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    if (touch) finishDrag(touch.clientY);
  }

  return (
    <div
      className={'sheet show ' + sheetState + (dragging ? ' dragging' : '')}
      ref={sheetRef}
      style={dragHeight == null ? undefined : { height: `${dragHeight}px` }}
    >
      <div className="sheet-head">
        <button
          type="button"
          className="sheet-toggle"
          data-sheet-drag-region="true"
          aria-label={sheetState === 'collapsed' ? '매장 상품 목록 펼치기' : '매장 상품 목록 접기'}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleSheet();
            }
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <span className="sheet-handle" />
        </button>
        <button
          type="button"
          className="store-title"
          aria-label={`${store.name} 상세 보기`}
          onClick={() => onOpenStore(store)}
        >
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

export default function MapScreen({ onNav, onOpenProduct, onOpenStore, initialSelectedStoreId = null }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const sheetRef = useRef(null);
  const selectStoreRef = useRef(() => {});
  const closeSelectedStoreRef = useRef(() => {});
  const [visibleStores, setVisibleStores] = useState(() => selectNearestStores(STORES, CENTER));
  const [showAiBanner, setShowAiBanner] = useState(true);
  const [showSearchButton, setShowSearchButton] = useState(true);
  const [selectedId, setSelectedId] = useState(initialSelectedStoreId);
  const [sheetState, setSheetState] = useState(initialSelectedStoreId ? 'collapsed' : 'closed');
  const [crewTalkOpen, setCrewTalkOpen] = useState(false);
  const [crewTalkQuery, setCrewTalkQuery] = useState('');
  const [expandedTalkIds, setExpandedTalkIds] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    let disposed = false;
    let resizeObserver;
    let map;
    let maps;

    const onMoveStart = () => setShowSearchButton(true);
    const onMapClick = () => closeSelectedStoreRef.current();

    loadKakaoMaps(import.meta.env.VITE_KAKAO_MAP_KEY)
      .then((loadedMaps) => {
        if (disposed || !mapDivRef.current) return;
        maps = loadedMaps;
        const fixedCenter = new maps.LatLng(CENTER.lat, CENTER.lng);
        map = new maps.Map(mapDivRef.current, {
          center: fixedCenter,
          level: 5,
        });
        map.setMinLevel(1);
        map.setMaxLevel(9);

        maps.event.addListener(map, 'dragstart', onMoveStart);
        maps.event.addListener(map, 'zoom_start', onMoveStart);
        maps.event.addListener(map, 'click', onMapClick);

        const bounds = new maps.LatLngBounds();
        bounds.extend(fixedCenter);
        selectNearestStores(STORES, CENTER).forEach((store) => {
          bounds.extend(new maps.LatLng(store.lat, store.lng));
        });
        map.setBounds(bounds, 140, 24, 90, 24);
        map.setLevel(limitInitialZoomLevel(map.getLevel()));
        map.setCenter(fixedCenter);

        mapRef.current = map;
        setMapReady(true);
        setMapError('');

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => map.relayout());
          resizeObserver.observe(mapDivRef.current);
        }
      })
      .catch((error) => {
        if (!disposed) setMapError(error.message);
      });

    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      resizeObserver?.disconnect();
      if (map && maps) {
        maps.event.removeListener(map, 'dragstart', onMoveStart);
        maps.event.removeListener(map, 'zoom_start', onMoveStart);
        maps.event.removeListener(map, 'click', onMapClick);
      }
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
    const maps = window.kakao.maps;

    const renderMarkers = () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = visibleStores.map((store) => {
        const element = makePinElement(store, store.id === selectedId, (id) => selectStoreRef.current(id));
        return new maps.CustomOverlay({
          map,
          position: new maps.LatLng(store.lat, store.lng),
          content: element,
          xAnchor: 0.5,
          yAnchor: 1,
          clickable: true,
          zIndex: store.id === selectedId ? 20 : 3,
        });
      });
    };

    renderMarkers();

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [visibleStores, selectedId, mapReady]);

  const selectedStore = STORES.find((store) => store.id === selectedId);

  useEffect(() => {
    if (!selectedStore || !mapRef.current) return undefined;

    const animationFrame = requestAnimationFrame(() => {
      const map = mapRef.current;
      if (!map) return;
      const mapHeight = mapDivRef.current?.clientHeight ?? window.innerHeight;
      const sheetHeight = sheetRef.current?.offsetHeight ?? 400;
      const maps = window.kakao.maps;
      const offset = getKakaoSelectedPanOffset(mapHeight, sheetHeight);
      map.setLevel(4, { anchor: new maps.LatLng(selectedStore.lat, selectedStore.lng) });
      map.setCenter(new maps.LatLng(selectedStore.lat, selectedStore.lng));
      map.panBy(offset.x, offset.y);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [selectedStore, sheetState]);

  function searchThisArea() {
    const center = mapRef.current?.getCenter();
    if (center) {
      setVisibleStores(selectNearestStores(STORES, { lat: center.getLat(), lng: center.getLng() }));
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
          <div id="kakao-map" ref={mapDivRef} aria-label="충무로 주변 올리브영 실제 지도" />
          {!mapReady && <div className="map-load-state" role="status">{mapError || '지도를 불러오는 중이에요.'}</div>}
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
          onToggle={setSheetState}
          onOpenProduct={onOpenProduct}
          onOpenStore={onOpenStore}
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
