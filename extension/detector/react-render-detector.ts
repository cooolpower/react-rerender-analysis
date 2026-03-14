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
  
  // --- DOM 변경 감시 (삭제된 요소 청소기) ---
  const cleanupObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // 제거된 요소 내부의 모든 배지 대상들 찾기
          const targets = node.querySelectorAll("[data-react-perf-id]");
          const elementsToCheck = [node, ...Array.from(targets)];
          
          elementsToCheck.forEach((el) => {
            if (el instanceof HTMLElement) {
              const badgeId = el.getAttribute("data-react-perf-id");
              if (badgeId) {
                const badge = document.getElementById(`badge-${badgeId}`);
                if (badge) {
                  badge.remove();
                  console.log(`[ReactPerf] Cleaned up badge for removed element: ${badgeId}`);
                }
              }
            }
          });
        }
      });
    });
  });
  // document.body가 없을 경우를 대비해 document.documentElement를 감시하거나 body가 생길 때까지 대기
  const startObserving = () => {
    const target = document.body || document.documentElement;
    if (target) {
      cleanupObserver.observe(target, { childList: true, subtree: true });
    }
  };
  startObserving();

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
  }

  function setupInterception(hook: any) {
    if (hook._reactPerfIntercepted) return;
    hook._reactPerfIntercepted = true;

    console.log("[ReactPerf] Setting up DevTools Hook interception...");

    if (hook.renderers) {
      hook.renderers.forEach((renderer: any) => patchRenderer(renderer));
    }

    const oldInject = hook.inject;
    hook.inject = function (renderer: any) {
      const id = oldInject.call(this, renderer);
      patchRenderer(renderer);
      return id;
    };

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

  if (hook) {
    setupInterception(hook);
  } else {
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
      const renderTime = node.actualDuration || node.selfBaseDuration || 0;
      let wasUpdated = false;
      if (node.alternate !== null) {
        if (renderTime > 0) {
          wasUpdated = true;
        } else {
          const propsChanged = node.memoizedProps !== node.alternate.memoizedProps;
          const stateChanged = node.memoizedState !== node.alternate.memoizedState;
          if (propsChanged || stateChanged) {
            wasUpdated = true;
          }
        }
      }

      if (wasUpdated) {
        highlightElement(node);
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

  updateGlobalStyles();
  if (!document.head) {
    window.addEventListener("DOMContentLoaded", injectStyle);
  }

  window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "react-perf-content-script" && event.data.type === "CONFIG_UPDATE") {
      const oldBadgeMode = config.badgeMode;
      config = event.data.config;
      updateGlobalStyles();

      if (oldBadgeMode === "persistent" && config.badgeMode !== "persistent") {
        const duration = parseInt(config.badgeMode);
        document.querySelectorAll<HTMLElement>(".react-perf-badge-element, .react-perf-highlight-active").forEach(el => {
          resetBadgeTimer(el, duration);
        });
      }
      
      if (oldBadgeMode !== "persistent" && config.badgeMode === "persistent") {
        badgeTimers.forEach(t => clearTimeout(t));
        badgeTimers.clear();
        document.querySelectorAll(".is-expired").forEach(el => {
          el.classList.remove("is-expired");
        });
      }
    }
  });

  function getColor(count: number): string {
    if (count <= 2) return "#4ade80";
    if (count <= 5) return "#facc15";
    if (count <= 10) return "#fb923c";
    return "#f87171";
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
    const color = getColor(record.count);

    if (!domNode.getAttribute("data-react-perf-id")) {
      domNode.setAttribute("data-react-perf-id", Math.random().toString(36).substr(2, 9));
    }

    domNode.style.setProperty("--react-perf-color", color);
    domNode.classList.remove("is-expired");
    domNode.classList.add("react-perf-highlight-active");

    renderBadge(domNode, record.count, color);

    if (config.badgeMode !== "persistent") {
      setTimeout(() => {
        domNode.classList.add("is-expired");
      }, 600);
    }
    
    renderCounts.set(domNode, record);
  }

  function renderBadge(target: HTMLElement, count: number, color: string) {
    const badgeId = target.getAttribute("data-react-perf-id");
    let badge = document.getElementById(`badge-${badgeId}`) as HTMLElement;

    if (badge && document.body.contains(badge)) {
      badge.innerText = count.toString();
      badge.style.backgroundColor = color;
      
      const rect = target.getBoundingClientRect();
      Object.assign(badge.style, {
        top: `${rect.top + window.scrollY - 10}px`,
        left: `${rect.left + window.scrollX + rect.width - 10}px`
      });

      if (config.badgeMode !== "persistent") {
        resetBadgeTimer(badge, parseInt(config.badgeMode));
      }
      return;
    }

    const rect = target.getBoundingClientRect();
    badge = document.createElement("div");
    badge.id = `badge-${badgeId}`;
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

    if (config.badgeMode !== "persistent") {
      resetBadgeTimer(badge, parseInt(config.badgeMode));
    }
  }

  function resetBadgeTimer(el: HTMLElement, duration: number) {
    if (badgeTimers.has(el)) {
      clearTimeout(badgeTimers.get(el));
    }

    el.classList.remove("is-expired");

    const timer = setTimeout(() => {
      el.classList.add("is-expired");
    }, duration);

    badgeTimers.set(el, timer);
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
    if (!name && (type.$$typeof || type.render)) return "Anonymous Component";
    return name;
  }
})();
