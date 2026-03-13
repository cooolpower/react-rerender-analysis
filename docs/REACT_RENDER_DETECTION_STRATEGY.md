# REACT RENDER DETECTION STRATEGY

This document defines how the extension detects React component renders.

---

# Goal

Detect:

- component render count
- render duration
- frequently re-rendered components

---

# Strategy Overview

Three possible approaches exist.

1. React DevTools Hook
2. React Profiler API
3. Monkey patching React internals

The recommended approach is:

React DevTools Hook.

---

# React DevTools Hook

React exposes an internal hook used by React DevTools.

Global variable:

window.**REACT_DEVTOOLS_GLOBAL_HOOK**

This hook allows tracking:

- component mount
- component update
- component unmount

---

# Hooking Strategy

Steps:

1. detect React DevTools hook
2. override commit lifecycle
3. extract component render data

Example pseudocode:

const hook = window.**REACT_DEVTOOLS_GLOBAL_HOOK**

hook.onCommitFiberRoot = function(rendererId, root) {
analyzeFiberTree(root.current)
}

---

# Fiber Tree Traversal

React internally represents components as Fiber nodes.

Each fiber contains:

- component type
- props
- render duration
- child nodes

Traversal example:

function traverseFiber(node) {

const name = node.type?.name

if (name) {
recordRender(name)
}

if (node.child) traverseFiber(node.child)
if (node.sibling) traverseFiber(node.sibling)

}

---

# Render Metrics

Metrics collected per component:

componentName

renderCount

renderDuration

Example:

{
component: "ProductCard",
renderCount: 14,
renderDuration: 3.1
}

---

# Heatmap Algorithm

Components are colored based on render frequency.

Rules:

renderCount < 5

green

renderCount < 15

yellow

renderCount > 15

red

---

# API Request Interception

Intercept:

fetch

XMLHttpRequest

Example:

const originalFetch = window.fetch

window.fetch = async (...args) => {

const start = performance.now()

const res = await originalFetch(...args)

const end = performance.now()

recordApiMetric(args[0], end - start)

return res
}

---

# Performance Constraints

Instrumentation must:

- avoid excessive CPU usage
- minimize memory usage
- run only in development mode

---

# Limitations

This method may not work if:

- React DevTools hook is disabled
- application uses non-standard renderers

---

# Future Improvements

Possible future enhancements:

- memory leak detection
- render diff visualization
- state change tracking
