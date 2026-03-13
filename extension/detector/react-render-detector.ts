/**
 * ReactRenderDetector
 * 
 * 이 스크립트는 실제 페이지 컨텍스트(Main World)에 주입되어
 * React DevTools Hook을 통해 렌더링 지표를 가로챕니다.
 */

(function () {
  console.log("[ReactPerf] React Render Detector injected into page.");

  function init() {
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    if (!hook) {
      if ((window as any)._reactPerfRetryCount === undefined) {
        (window as any)._reactPerfRetryCount = 0;
      }
      
      if ((window as any)._reactPerfRetryCount < 10) {
        (window as any)._reactPerfRetryCount++;
        setTimeout(init, 500);
      } else {
        console.log("[ReactPerf] React DevTools Hook not found after retries. Static page or DevTools disabled?");
      }
      return;
    }

    console.log("[ReactPerf] React DevTools Hook found! Starting interception...");

    // 기존 onCommitFiberRoot 저장
    const oldOnCommitFiberRoot = hook.onCommitFiberRoot;

    hook.onCommitFiberRoot = function (rendererId: any, root: any, priorityLevel: any) {
      if (oldOnCommitFiberRoot) {
        oldOnCommitFiberRoot(rendererId, root, priorityLevel);
      }

      try {
        const fiber = root.current;
        traverseFiber(fiber);
      } catch (err) {
        console.error("[ReactPerf] Error during fiber traversal:", err);
      }
    };

    function traverseFiber(node: any) {
      if (!node) return;

      const componentName = getComponentName(node.type);
      
      if (componentName) {
        const renderTime = node.selfBaseDuration || 0;
        
        if (renderTime > 0) {
          console.log(`[ReactPerf] Component render detected: ${componentName} (${renderTime.toFixed(2)}ms)`);
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

    function getComponentName(type: any): string | null {
      if (!type) return null;
      if (typeof type === "string") return type;
      return type.displayName || type.name || null;
    }
  }

  console.log("[ReactPerf] React Render Detector observer set up.");
  init();
})();
