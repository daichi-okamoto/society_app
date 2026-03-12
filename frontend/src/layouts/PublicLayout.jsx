import AnimatedOutlet from "../components/AnimatedOutlet";
import FlashMessage from "../components/FlashMessage";

export default function PublicLayout() {
  return (
    <div className="route-slide-host">
      <FlashMessage />
      <AnimatedOutlet />
    </div>
  );
}
