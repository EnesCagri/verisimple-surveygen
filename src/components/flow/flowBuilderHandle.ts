import type { CSSProperties } from "react";

/**
 * Gelen bağlantının bırakıldığı üst handle: geniş, merkez biraz kartın içine kayar
 * (kullanıcı çizgiyi tam kenarda değil aşağıda bırakır).
 * Boyut + transform tamamlayıcı olarak .flow-builder-handle-target-hit (index.css) ile.
 */
export const flowBuilderTargetHitStyle: CSSProperties = {
  width: "6.75rem",
  height: "4.25rem",
};

/**
 * Çıkan bağlantı (alt): merkez hafif kart içine (yukarı) kayar.
 */
export const flowBuilderSourceHitStyle: CSSProperties = {
  width: "6.75rem",
  height: "4.25rem",
};

/** className — gerçek hizayı index.css verir */
export const flowBuilderHandleTargetClass =
  "flow-builder-handle-target-hit bg-transparent! border-0! rounded-full! cursor-crosshair touch-manipulation";

export const flowBuilderHandleSourceClass =
  "flow-builder-handle-source-hit bg-transparent! border-0! rounded-full! cursor-crosshair touch-manipulation";
