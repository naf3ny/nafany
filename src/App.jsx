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
      
        <Route path="/nafany/login" element={<Login />} />
        <Route path="/nafany/register" element={<Register />} />
        <Route path="/nafany/register_user" element={<RegisterUser />} />
        <Route path="/nafany/services_jobs/:serviceType/:professionType" element={<ServicesJobs />} />
        <Route path="/nafany/servicer_page" element={<ServicerPage />} />
        <Route path="/nafany/book_page/:providerId" element={<BookPage />} />
        <Route path="/nafany/" element={<Home />} />
        <Route path="/nafany/chat/:providerId" element={<ChatPage />} />
      
        <Route path="/nafany/settings" element={<SettingsPage />} />
        <Route path="/nafany/contact" element={<Contact />} />
        <Route path="/nafany/complaints" element={<ComplaintsPage />} />
        <Route path="/nafany/admin" element={<Admin />} />
        <Route path="/nafany/service_categories/:serviceType" element={<ServiceCategoriesPage />} />
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