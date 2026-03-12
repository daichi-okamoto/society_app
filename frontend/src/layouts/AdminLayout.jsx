import AnimatedOutlet from "../components/AnimatedOutlet";
import FlashMessage from "../components/FlashMessage";

export default function AdminLayout() {
  return (
    <>
      <FlashMessage />
      <div className="route-slide-host">
        <AnimatedOutlet />
      </div>
    </>
  );
}
