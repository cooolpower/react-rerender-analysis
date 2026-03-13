/**
 * ReactRenderDetector
 * 
 * 이 스크립트는 실제 페이지 컨텍스트(Main World)에 주입되어
 * React DevTools Hook을 통해 렌더링 지표를 가로챕니다.
 */

(function () {
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (!hook) {
    console.log("[ReactPerf] React DevTools Hook not found.");
    return;
  }

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

    // 컴포넌트 이름 추출
    const componentName = getComponentName(node.type);
    
    // 실제 렌더링이 일어난 노드인지 확인 (wasUpdated)
    // React 버전에 따라 체크 방식이 다를 수 있으나, 보통 alternate 존재 여부 및 변경점으로 판단
    if (componentName && node.alternate) {
      // 렌더링 시간 (selfBaseDuration 등 활용 가능)
      const renderTime = node.selfBaseDuration || 0;
      
      if (renderTime > 0) {
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

  console.log("[ReactPerf] React Render Detector injected and active.");
})();
