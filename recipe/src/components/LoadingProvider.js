import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import Loading from "./Loading";

const LoadingContext = createContext({
  show: () => {},
  hide: () => {},
});

export const useGlobalLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children, delay = 3000 }) {
  const [visible, setVisible] = useState(false);
  const pendingCountRef = useRef(0);     // 진행 중 비동기 개수
  const timerRef = useRef(null);
  const armedRef = useRef(false);        // 타이머 가동 여부

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    armedRef.current = false;
  };

  const show = () => {
    pendingCountRef.current += 1;

    // 이미 표시 중이면 그대로 유지
    if (visible) return;

    // 표시 중이 아니면, 지연 타이머를 가동 (중복 가동 방지)
    if (!armedRef.current) {
      armedRef.current = true;
      timerRef.current = setTimeout(() => {
        // 아직도 대기 중인 요청이 있다면 표시
        if (pendingCountRef.current > 0) {
          setVisible(true);
        }
        clearTimer();
      }, delay);
    }
  };

  const hide = () => {
    pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);

    // 더 이상 대기 중이 없고 아직 표시 전이라면 타이머 해제
    if (pendingCountRef.current === 0 && !visible) {
      clearTimer();
    }

    // 이미 보이는 상태라면, 모든 요청이 끝났을 때 숨김
    if (visible && pendingCountRef.current === 0) {
      setVisible(false);
    }
  };

  const value = useMemo(() => ({ show, hide }), [visible]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {visible && <Loading />} {/* 전역 오버레이로 렌더 */}
    </LoadingContext.Provider>
  );
}