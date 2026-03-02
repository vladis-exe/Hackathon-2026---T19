import { useNavigate } from "react-router-dom";
import { useCameras } from "@/hooks/useCameras";
import { Header } from "@/components/Header";
import { CameraCard } from "@/components/CameraCard";

import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { cameras, toggleSmartFocus, totalBandwidthKbps, onlineCount, dataSource } = useCameras();

  const handleToggle = (id: string) => {
    const cam = cameras.find((c) => c.id === id);
    if (!cam) return;
    toggleSmartFocus(id);
    toast(
      cam.smartFocusEnabled
        ? `Smart Focus disabled for ${cam.name}`
        : `Smart Focus enabled for ${cam.name}`,
      { duration: 2000 }
    );
  };

  return (
    <div className="min-h-screen gradient-mesh">
      <Header
        totalBandwidthKbps={totalBandwidthKbps}
        onlineCount={onlineCount}
        totalCount={cameras.length}
        dataSource={dataSource}
      />

      <main className="container mx-auto px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onToggleSmartFocus={handleToggle}
              onSelect={(cam) => navigate(`/camera/${cam.id}`)}
            />
          ))}
        </div>
      </main>

      
    </div>
  );
};

export default Index;
