import BuildingDashboard from "./src/routes/BuildingDashboard.svelte";
import RenterPortal from "./src/routes/RenterPortal.svelte";
import MovingServices from "./src/routes/MovingServices.svelte";
import PaymentPage from "./src/routes/PaymentPage.svelte";
import LeasingDashboard from "./src/routes/LeasingDashboard.svelte";
import SearchPage from "./src/routes/SearchPage.svelte";
import ComparePage from "./src/routes/ComparePage.svelte";
import Home from "./src/routes/Home.svelte";



const routes = {
  "/building-dashboard": BuildingDashboard,
  "/moving-services": MovingServices,
  "/renter-portal": RenterPortal,
  "/payment-page": PaymentPage,
  "/leasing-dashboard":LeasingDashboard,
  "/": SearchPage,
  "/compare": ComparePage,
};

export default routes;