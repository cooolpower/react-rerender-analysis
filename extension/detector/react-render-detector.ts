/**
 * ReactRenderDetector
 * 
 * 이 스크립트는 실제 페이지 컨텍스트(Main World)에 주입되어
 * React DevTools Hook을 통해 렌더링 지표를 가로챕니다.
 */

(function () {
  if ((window as any)._reactPerfDetectorInjected) {
    return;
  }

  // Dashboard 사이트에서는 하이라이트를 표시하지 않음
  const isDashboard = window.location.hostname === "localhost" && window.location.port === "3000" || 
                     window.location.hostname.includes("react-rerender-analysis.vercel.app");
                     
  if (isDashboard) {
    return;
  }

  (window as any)._reactPerfDetectorInjected = true;

  console.log("[ReactPerf] Advanced React Render Detector initialized.");

  // --- 변수 선언 (초기화 오류 방지를 위해 최상단 배치) ---
  let config = {
    showHighlight: false, // 초기 플래시 방지를 위해 기본값 false
    showBadge: false,
    badgeMode: "1000"
  };

  const renderCounts = new WeakMap<HTMLElement, { count: number; lastTime: number; badge?: HTMLElement }>();
  const badgeTimers = new Map<HTMLElement, any>();
  
  // 글로벌 스타일 태그 생성
  const styleTag = document.createElement("style");
  styleTag.id = "react-perf-global-styles";
  
  // document.head가 없을 경우(document_start)를 대비한 안전한 주입
  const injectStyle = () => {
    const target = document.head || document.documentElement;
    if (target && !document.getElementById(styleTag.id)) {
      target.appendChild(styleTag);
    }
  };
  injectStyle();

  function updateGlobalStyles() {
    // 스타일 태그가 문서에서 사라졌을 경우를 대비해 매번 확인 및 재주입
    const target = document.head || document.documentElement;
    if (target && !document.getElementById(styleTag.id)) {
      target.appendChild(styleTag);
    }

    const highlightCSS = config.showHighlight 
      ? `outline: 2px solid var(--react-perf-color, #ff4444) !important;
         outline-offset: -2px !important;
         box-shadow: 0 0 10px var(--react-perf-color, #ff4444), inset 0 0 5px var(--react-perf-color, #ff4444) !important;`
      : `outline: none !important; box-shadow: none !important;`;

    styleTag.innerHTML = `
      .react-perf-highlight-active {
        outline: ${config.showHighlight ? "2px solid var(--react-perf-color, #ff4444) !important" : "none !important"};
        outline-offset: -2px !important;
        box-shadow: ${config.showHighlight ? "0 0 10px var(--react-perf-color, #ff4444), inset 0 0 5px var(--react-perf-color, #ff4444) !important" : "none !important"};
        transition: all 0.1s ease-in-out !important;
        z-index: 999999 !important;
        /* 실제 요소의 클릭을 방해하지 않도록 pointer-events 설정 제거 */
      }
      
      /* 만료된 하이라이트: Persistent 모드일 때만 보이고 그 외에는 테두리 제거 */
      .react-perf-highlight-active.is-expired {
        outline: ${(config.showHighlight && config.badgeMode === "persistent") ? "2px solid var(--react-perf-color, #ff4444) !important" : "none !important"};
        box-shadow: ${(config.showHighlight && config.badgeMode === "persistent") ? "0 0 10px var(--react-perf-color, #ff4444), inset 0 0 5px var(--react-perf-color, #ff4444) !important" : "none !important"};
      }

      .react-perf-badge-element {
        display: ${config.showBadge ? "block" : "none"} !important;
        opacity: 1 !important;
        z-index: 1000000 !important;
        pointer-events: none !important; /* 배지는 클릭을 방해하지 않아야 함 */
      }
      
      .react-perf-badge-element.is-expired {
        display: ${(config.showBadge && config.badgeMode === "persistent") ? "block" : "none"} !important;
        opacity: 0.6 !important;
      }
    `;
    console.log("[ReactPerf] Global Styles Updated. Mode:", config.badgeMode);
  }

  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

  function patchRenderer(renderer: any) {
    console.log("[ReactPerf] Patching React Renderer...");
    // 렌더러 레벨에서의 가로채기는 필요 시 추가 (현재는 hook level에서 충분)
  }

  function setupInterception(hook: any) {
    if (hook._reactPerfIntercepted) return;
    hook._reactPerfIntercepted = true;

    console.log("[ReactPerf] Setting up DevTools Hook interception...");

    // 1. 기존에 등록된 렌더러들 처리
    if (hook.renderers) {
      hook.renderers.forEach((renderer: any) => patchRenderer(renderer));
    }

    // 2. 새로운 렌더러 등록 가로채기
    const oldInject = hook.inject;
    hook.inject = function (renderer: any) {
      const id = oldInject.call(this, renderer);
      patchRenderer(renderer);
      return id;
    };

    // 3. 커밋 가로채기 (핵심)
    const oldOnCommitFiberRoot = hook.onCommitFiberRoot;
    hook.onCommitFiberRoot = function (rendererId: any, root: any, priorityLevel: any) {
      if (oldOnCommitFiberRoot) {
        try {
          oldOnCommitFiberRoot(rendererId, root, priorityLevel);
        } catch (e) {
          console.error("[ReactPerf] Error in original onCommitFiberRoot:", e);
        }
      }

      try {
        const fiber = root.current;
        traverseFiber(fiber);
      } catch (err) {
        console.error("[ReactPerf] Error during fiber traversal:", err);
      }
    };
  }

  // Hook이 이미 존재하는 경우 (React DevTools 익스텐션이 먼저 정의한 경우)
  if (hook) {
    setupInterception(hook);
  } else {
    // Hook이 없는 경우 스텁 생성 (React가 로드되기 전에 실행되어야 함)
    console.log("[ReactPerf] Creating DevTools Hook stub...");
    const stub = {
      renderers: new Map(),
      supportsFiber: true,
      inject: function (renderer: any) {
        const id = Math.random().toString(16).slice(2);
        this.renderers.set(id, renderer);
        patchRenderer(renderer);
        return id;
      },
      onCommitFiberRoot: function () {},
      onCommitFiberUnmount: function () {},
      _reactPerfIntercepted: false
    };
    
    Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
      value: stub,
      configurable: true,
      enumerable: false,
      writable: true
    });
    
    setupInterception(stub);
  }

  function traverseFiber(node: any) {
    if (!node) return;

    const componentName = getComponentName(node.type);
    
    if (componentName) {
      // 1. 프로덕션 빌드에서는 actualDuration이 0이거나 없을 수 있음
      const renderTime = node.actualDuration || node.selfBaseDuration || 0;
      
      // 2. 렌더링 발생 여부 판단 (프로덕션 대응)
      // alternate가 있다는 것은 업데이트가 발생했다는 것. 
      // 추가로 props나 state가 변했는지 또는 lanes가 활성 상태인지 체크 (lane은 버전마다 다를 수 있어 옵셔널하게 처리)
      let wasUpdated = false;
      if (node.alternate !== null) {
        if (renderTime > 0) {
          wasUpdated = true;
        } else {
          // 프로덕션 빌드용 heuristic: props나 state의 참조가 바뀌었는지 확인
          const propsChanged = node.memoizedProps !== node.alternate.memoizedProps;
          const stateChanged = node.memoizedState !== node.alternate.memoizedState;
          const lanesChanged = node.lanes !== undefined && node.lanes !== 0;
          
          if (propsChanged || stateChanged || lanesChanged) {
            wasUpdated = true;
          }
        }
      }

      if (wasUpdated) {
        console.log(`[ReactPerf] Render detected: ${componentName} (${renderTime.toFixed(2)}ms, flags: ${node.flags})`);
        // 하이라이트 표시
        highlightElement(node);

        // 결과 전송
        window.postMessage({
          source: "react-perf-detector",
          type: "component_render",
          componentName,
          renderTime,
          timestamp: Date.now()
        }, "*");
      }
    }

    if (node.child) traverseFiber(node.child);
    if (node.sibling) traverseFiber(node.sibling);
  }

  // 초기 스타일 설정
  updateGlobalStyles();
  // 문서 로드 중 head가 생성될 때를 대비해 다시 시도
  if (!document.head) {
    window.addEventListener("DOMContentLoaded", injectStyle);
  }

  // 콘텐츠 스크립트로부터 설정 변경 메시지 수신
  window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "react-perf-content-script" && event.data.type === "CONFIG_UPDATE") {
      const oldBadgeMode = config.badgeMode;
      config = event.data.config;
      console.log("[ReactPerf] Live config updated:", config);
      updateGlobalStyles();

      // --- 모드 전환 시 시각적 요소 강제 업데이트 ---
      
      // 1. Persistent -> Timed (정리 모드)
      if (oldBadgeMode === "persistent" && config.badgeMode !== "persistent") {
        const duration = parseInt(config.badgeMode);
        document.querySelectorAll<HTMLElement>(".react-perf-badge-element, .react-perf-highlight-active").forEach(el => {
          resetBadgeTimer(el, duration);
        });
      }
      
      // 2. Timed -> Persistent (복구 모드) - 사용자님 요청 사항
      if (oldBadgeMode !== "persistent" && config.badgeMode === "persistent") {
        // 모든 타이머 중지
        badgeTimers.forEach(t => clearTimeout(t));
        badgeTimers.clear();
        
        // 모든 '만료' 딱지 제거하여 즉시 화면에 복구
        document.querySelectorAll(".is-expired").forEach(el => {
          el.classList.remove("is-expired");
        });
      }
    }
  });

  function getColor(count: number): string {
    if (count <= 2) return "#4ade80"; // Green
    if (count <= 5) return "#facc15"; // Yellow
    if (count <= 10) return "#fb923c"; // Orange
    return "#f87171"; // Red
  }

  function highlightElement(node: any) {
    const domNode = findFirstDOMNode(node);
    if (!domNode || !(domNode instanceof HTMLElement)) return;

    const now = Date.now();
    const record = renderCounts.get(domNode) || { count: 0, lastTime: 0 };
    
    if (now - record.lastTime < 3000) {
      record.count++;
    } else {
      record.count = 1;
    }
    record.lastTime = now;
    renderCounts.set(domNode, record);

    const color = getColor(record.count);
    
    // CSS 변수로 색상 전달 및 클래스 활성화
    domNode.style.setProperty("--react-perf-color", color);
    domNode.classList.add("react-perf-highlight-active");

    // 숫자 배지 표시
    renderBadge(domNode, record.count, color);

    // 하이라이트 활성화
    domNode.classList.remove("is-expired");
    domNode.classList.add("react-perf-highlight-active");

    // 계속 유지 모드일 경우 만료 클래스 추가 방지
    if (config.badgeMode !== "persistent") {
      setTimeout(() => {
        domNode.classList.add("is-expired");
      }, 600);
    }
  }

  function renderBadge(target: HTMLElement, count: number, color: string) {
    const record = renderCounts.get(target);
    if (!record) return;

    let badge = record.badge;

    if (badge && document.body.contains(badge)) {
      badge.innerText = count.toString();
      badge.style.backgroundColor = color;
      if (config.badgeMode !== "persistent") {
        resetBadgeTimer(badge, parseInt(config.badgeMode));
      }
      return;
    }

    const rect = target.getBoundingClientRect();
    badge = document.createElement("div");
    badge.className = "react-perf-badge-element";
    badge.innerText = count.toString();
    
    Object.assign(badge.style, {
      position: "fixed",
      top: `${rect.top + window.scrollY - 10}px`,
      left: `${rect.left + window.scrollX + rect.width - 10}px`,
      backgroundColor: color,
      color: "#000",
      fontSize: "10px",
      fontWeight: "bold",
      padding: "2px 6px",
      borderRadius: "10px",
      zIndex: "1000000",
      pointerEvents: "none",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      fontFamily: "sans-serif"
    });

    document.body.appendChild(badge);
    record.badge = badge;

    if (config.badgeMode !== "persistent") {
      resetBadgeTimer(badge, parseInt(config.badgeMode));
    }
  }

  function resetBadgeTimer(badge: HTMLElement, duration: number) {
    if (badgeTimers.has(badge)) {
      clearTimeout(badgeTimers.get(badge));
    }

    badge.classList.remove("is-expired");

    const timer = setTimeout(() => {
      badge.classList.add("is-expired");
    }, duration);

    badgeTimers.set(badge, timer);
  }

  function findFirstDOMNode(fiber: any): HTMLElement | null {
    if (!fiber) return null;
    if (fiber.stateNode instanceof HTMLElement) return fiber.stateNode;
    if (fiber.stateNode && (fiber.stateNode as Node).nodeType === 1) return fiber.stateNode as HTMLElement;

    let child = fiber.child;
    while (child) {
      const dom = findFirstDOMNode(child);
      if (dom) return dom;
      child = child.sibling;
    }
    return null;
  }

  function getComponentName(type: any): string | null {
    if (!type) return null;
    if (typeof type === "string") return type;
    const name = type.displayName || type.name || null;
    
    // Production 빌드에서 익명 컴포넌트 처리
    if (!name && (type.$$typeof || type.render)) return "Anonymous Component";
    return name;
  }
})();
