import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import Login from "./components/login";
import Register from "./components/register";
import RegisterUser from "./components/registerUser";
import Home from "./components/homePage";
import ServicesJobs from "./components/servicesJobs";
import ServicerPage from "./components/servicerPage";
import BookPage from "./components/bookPage";
import ChatPage from "./components/chat";
import SettingsPage from "./components/SettingsPage";
import Contact from "./components/contact";
import ComplaintsPage  from "./components/ComplaintsPage";
import Admin  from "./components/adminDashBoard";
import ServiceCategoriesPage from "./components/serviceCategories";


const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
      
        <Route path="/naf3ny/login" element={<Login />} />
        <Route path="/naf3ny/register" element={<Register />} />
        <Route path="/naf3ny/register_user" element={<RegisterUser />} />
        <Route path="/naf3ny/services_jobs/:serviceType/:professionType" element={<ServicesJobs />} />
        <Route path="/naf3ny/servicer_page" element={<ServicerPage />} />
        <Route path="/naf3ny/book_page/:providerId" element={<BookPage />} />
        <Route path="/naf3ny/" element={<Home />} />
        <Route path="/naf3ny/chat/:providerId" element={<ChatPage />} />
      
        <Route path="/naf3ny/settings" element={<SettingsPage />} />
        <Route path="/naf3ny/contact" element={<Contact />} />
        <Route path="/naf3ny/complaints" element={<ComplaintsPage />} />
        <Route path="/naf3ny/admin" element={<Admin />} />
        <Route path="/naf3ny/service_categories/:serviceType" element={<ServiceCategoriesPage />} />
      </>
    )
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App