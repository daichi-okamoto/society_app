import { Outlet, useLocation, useNavigationType } from "react-router-dom";

export default function AnimatedOutlet() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const direction = navigationType === "POP" ? "back" : "forward";

  return (
    <div
      key={`${location.pathname}${location.search}`}
      className={`route-slide route-slide-${direction}`}
    >
      <Outlet />
    </div>
  );
}

