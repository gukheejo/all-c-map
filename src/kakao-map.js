const KAKAO_SDK_ID = 'kakao-maps-sdk';
let kakaoMapsPromise;

export function loadKakaoMaps(appKey, runtime = globalThis) {
  if (!appKey) {
    return Promise.reject(new Error('VITE_KAKAO_MAP_KEY가 설정되지 않았습니다.'));
  }
  if (runtime.kakao?.maps?.Map) return Promise.resolve(runtime.kakao.maps);
  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const document = runtime.document;
    if (!document) {
      reject(new Error('카카오 지도를 불러올 브라우저 환경이 아닙니다.'));
      return;
    }

    const finishLoading = () => {
      if (!runtime.kakao?.maps) {
        reject(new Error('카카오 지도 SDK를 초기화하지 못했습니다.'));
        return;
      }
      runtime.kakao.maps.load(() => resolve(runtime.kakao.maps));
    };

    const existingScript = document.getElementById(KAKAO_SDK_ID);
    if (existingScript) {
      if (runtime.kakao?.maps) {
        finishLoading();
        return;
      }
      existingScript.addEventListener('load', finishLoading, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_SDK_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.addEventListener('load', finishLoading, { once: true });
    script.addEventListener('error', () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.')), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    kakaoMapsPromise = undefined;
    throw error;
  });

  return kakaoMapsPromise;
}
