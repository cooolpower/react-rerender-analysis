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
        // selfBaseDuration뿐만 아니라 actualDuration도 참고 (버전에 따른 차이 보정)
        const renderTime = node.selfBaseDuration || node.actualDuration || 0;
        
        // 렌더링이 발생했는지 확인하는 더 확실한 방법: alternate가 존재하고 실제 측정 시간이 있는 경우
        const wasUpdated = node.alternate !== null && renderTime > 0;

        if (wasUpdated) {
          console.log(`[ReactPerf] Component render detected: ${componentName} (${renderTime.toFixed(2)}ms)`);
          
          // Visual highlighting
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

    function highlightElement(node: any) {
      const domNode = findFirstDOMNode(node);
      if (!domNode || !(domNode instanceof HTMLElement)) return;

      const originalOutline = domNode.style.outline;
      const originalBoxShadow = domNode.style.boxShadow;
      const originalTransition = domNode.style.transition;

      // 더 눈에 띄는 스타일 적용 (Outline + BoxShadow)
      domNode.style.outline = "2px solid #ff4444";
      domNode.style.outlineOffset = "-2px";
      domNode.style.boxShadow = "0 0 8px #ff4444, inset 0 0 8px #ff4444";
      domNode.style.transition = "all 0.1s ease-in-out";
      domNode.style.zIndex = "999999";

      setTimeout(() => {
        domNode.style.outline = originalOutline;
        domNode.style.boxShadow = originalBoxShadow;
        domNode.style.transition = originalTransition;
        // z-index는 원래대로 돌리기 힘들 수 있으므로 일단 둠 (또는 저장 후 복구)
      }, 600);
    }

    function findFirstDOMNode(fiber: any): HTMLElement | null {
      if (!fiber) return null;
      
      // 1. 현재 노드가 직접 DOM 노드를 가지고 있는지 확인
      if (fiber.stateNode instanceof HTMLElement) return fiber.stateNode;
      
      // 2. Fragment나 HOC인 경우 자식들을 재귀적으로 탐색
      let child = fiber.child;
      while (child) {
        // host component (DOM element)를 찾을 때까지 깊게 탐색
        const dom = findFirstDOMNode(child);
        if (dom) return dom;
        child = child.sibling;
      }
      return null;
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
