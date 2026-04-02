import Office3DClientLoader from "./Office3DClientLoader";

export const metadata = {
  title: "The Office 3D | Mission Control",
  description:
    "Visualise tes agents en 3D — données OpenClaw / gateway quand disponibles",
};

export default function OfficePage() {
  return (
    <div
      style={{
        position: "fixed",
        top: 48,
        bottom: 32,
        left: 68,
        right: 0,
        zIndex: 10,
        background: "#111827",
      }}
    >
      <Office3DClientLoader />
    </div>
  );
}
