import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { STORES, PRODUCTS, won } from '../data.js';
import BottomNav from './BottomNav.jsx';

const CENTER = { lat: 37.5605, lng: 126.9948 }; // 충무로 필동로 26 기준
const STORE_LIMIT = 10;
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

function squaredDistance(a, b) {
  const lat = a.lat - b.lat;
  const lng = a.lng - b.lng;
  return lat * lat + lng * lng;
}

export function selectNearestStores(stores, center, limit = STORE_LIMIT) {
  return [...stores]
    .sort((a, b) => squaredDistance(a, center) - squaredDistance(b, center))
    .slice(0, limit);
}

export function getStoreBounds(stores) {
  return stores.reduce(
    (bounds, store) => [
      [Math.min(bounds[0][0], store.lng), Math.min(bounds[0][1], store.lat)],
      [Math.max(bounds[1][0], store.lng), Math.max(bounds[1][1], store.lat)],
    ],
    [[Infinity, Infinity], [-Infinity, -Infinity]],
  );
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

export default function MapScreen({ onNav, onOpenProduct }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const selectStoreRef = useRef(() => {});
  const [visibleStores, setVisibleStores] = useState(() => selectNearestStores(STORES, CENTER));
  const [showAiBanner, setShowAiBanner] = useState(true);
  const [showSearchButton, setShowSearchButton] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [sheetState, setSheetState] = useState('closed');

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
    setSelectedId(id);
    setShowAiBanner(false);
    setSheetState('collapsed');

    const store = STORES.find((item) => item.id === id);
    if (store && mapRef.current) {
      mapRef.current.easeTo({ center: [store.lng, store.lat], duration: 450 });
    }
  }
  selectStoreRef.current = selectStore;

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

  function searchThisArea() {
    const center = mapRef.current?.getCenter();
    if (center) {
      setVisibleStores(selectNearestStores(STORES, { lat: center.lat, lng: center.lng }));
    }
    setSelectedId(null);
    setSheetState('closed');
    setShowSearchButton(false);
  }

  const selectedStore = STORES.find((store) => store.id === selectedId);

  return (
    <section className="screen active" id="screen-3b">
      <div className="map-wrap">
        <div className="map-canvas">
          <div id="maplibre-map" ref={mapDivRef} aria-label="충무로 주변 올리브영 실제 지도" />
          {showAiBanner && <img className="map-dim-art" src="/icons/map-dim-screen.svg" alt="" />}
        </div>

        <div className="map-topbar">
          <button type="button" className="back" onClick={() => onNav('2')} aria-label="올영매장으로 돌아가기">
            <img src="/icons/map-back.svg" alt="" />
          </button>
          <h1>올클맵</h1>
        </div>

        {!showAiBanner && (
          <div className="map-filters">
            <button type="button"><img src="/icons/map-clock.svg" alt="" />영업중</button>
            <button type="button"><img src="/icons/map-chat.svg" alt="" />크루톡</button>
          </div>
        )}

        {showAiBanner && (
          <div className="ai-banner" role="status">
            AI가 <strong className="ai-name">정열창</strong>님의 관심상품과 할인 혜택을 바탕으로<br />추천하는 매장이에요.
            <button type="button" className="x" onClick={() => setShowAiBanner(false)} aria-label="AI 추천 안내 닫기">
              <img src="/icons/map-close.svg" alt="" />
            </button>
          </div>
        )}

        {showSearchButton && (
          <button type="button" className="search-here" onClick={searchThisArea}>
            <img src="/icons/map-search-here.svg" alt="" />이 지역 매장 검색
          </button>
        )}

        {selectedStore && (
          <div className={'sheet show ' + sheetState}>
            <button
              type="button"
              className="sheet-head"
              onClick={() => setSheetState(sheetState === 'collapsed' ? 'expanded' : 'collapsed')}
            >
              <span className="sheet-handle" />
              <span className="store-title">
                {selectedStore.name} <img src="/icons/map-link.svg" alt="" />
              </span>
            </button>
            <div className="sheet-notice">
              <img src="/icons/notice-bell.svg" alt="" style={{ width: 13, height: 11 }} />
              [입고알림] 라스트픽 온라인 입고 완료되었습니다.
              <span style={{ opacity: 0.4, marginLeft: 'auto' }}>12분 전 ›</span>
            </div>
            <div className="sheet-body">
              {PRODUCTS.map((product) => (
                <div className="crew-item" key={product.id}>
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
        )}
      </div>
      <BottomNav active="store" onNav={onNav} />
    </section>
  );
}
