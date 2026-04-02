"use client";

import dynamic from "next/dynamic";

const Office3D = dynamic(() => import("@/components/Office3D/Office3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full min-h-[200px] items-center justify-center bg-gray-900 text-gray-400 text-sm">
      Chargement du bureau 3D...
    </div>
  ),
});

export default function Office3DClientLoader() {
  return <Office3D />;
}
