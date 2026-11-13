---
name: shadergradient
description: Create and configure 3D animated WebGL shader gradients using @shadergradient/react in React and Next.js. Use when creating animated background meshes, fluid gradient fields, or dynamic hero canvas effects.
---

# ShaderGradient: 3D WebGL Gradients

This skill encodes best practices for integrating and configuring 3D animated WebGL shader gradients via `@shadergradient/react` (and `three` / `@react-three/fiber`).

## Core Concepts

`@shadergradient/react` provides WebGL-powered 3D moving gradients rendered inside an HTML canvas. It runs shaders directly on the GPU, avoiding heavy video assets or fragile CSS animations.

### Essential Components

- **`<ShaderGradientCanvas>`**: Provides the WebGL rendering context (via Three.js canvas). Always render as a Client Component (`"use client"`).
- **`<ShaderGradient>`**: The shader mesh that defines the colors, 3D wireframe/mesh geometry, camera distance, and motion dynamics.

## Basic Setup in Next.js (App Router)

Always mark the containing file as `"use client"`.

```tsx
"use client";

import React from "react";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

export function HeroGradientBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: -1, overflow: "hidden" }}>
      <ShaderGradientCanvas
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        pixelDensity={1.2}
        fov={45}
      >
        <ShaderGradient
          control="props"
          animate="on"
          type="plane"
          cDistance={32}
          cPolarAngle={125}
          cAzimuthAngle={180}
          cameraZoom={1}
          color1="#0d6346"
          color2="#084c35"
          color3="#111622"
          grain="off"
          brightness={1}
          wireframe={false}
          uSpeed={0.25}
          uStrength={1.5}
          uDensity={1.2}
          uFrequency={5.5}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
```

## Props Reference

### Colors & Lighting
- `color1`, `color2`, `color3`: Hex color codes (`#0d6346`, `#084c35`, `#053324`).
- `brightness`: Multiplier for shader intensity (default `1.0`).
- `grain`: `"on"` | `"off"`. Adds subtle film grain to the gradient.

### Geometry & Deformation
- `type`: `"plane"` | `"sphere"` | `"waterPlane"`.
- `uSpeed`: Speed of the moving wave oscillation (e.g. `0.2` - `0.4` for subtle luxury feel, `1.0` for dynamic).
- `uStrength`: Amplitude of 3D displacement waves.
- `uDensity`: Number of wave subdivisions across the surface.
- `uFrequency`: Frequency of the wave noise.
- `wireframe`: `true` | `false`. Toggle isometric wireframe mesh.

### Camera & Viewport
- `cDistance`: Distance of the camera from the gradient plane (default `32`).
- `cPolarAngle`: Vertical angle of the camera (`0` to `180`).
- `cAzimuthAngle`: Horizontal rotation around the gradient.
- `cameraZoom`: Zoom factor.
- `pixelDensity`: Control resolution/DPI (e.g. `1.0` - `1.5` for high performance).

## Emil Kowalski Motion & Performance Rules

1. **Accessibility**: When `prefers-reduced-motion` is detected, set `animate="off"` or set `uSpeed={0}` so sensitive users are not disoriented.
2. **Pointer Events**: Always add `pointerEvents: "none"` to the background canvas so buttons and links underneath/above remain interactive.
3. **Restraint**: Keep `uSpeed` low (`0.15` to `0.3`) for professional SaaS & fintech apps. Gradients should support the UI, not distract from it.
