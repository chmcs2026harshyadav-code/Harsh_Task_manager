import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Dashboard, Login, TaskDetail, Tasks, Team, Trash } from "./pages";

// Pages only for logged-in users. Admin-only pages use `adminOnly`.
function Layout({ adminOnly = false }) {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!user) {
    return <Navigate to='/log-in' state={{ from: location }} replace />;
  }
  if (adminOnly && !user.isAdmin) {
    return <Navigate to='/dashboard' replace />;
  }

  return (
    <div className='min-h-screen'>
      <Sidebar />
      <div className='md:pl-64'>
        <Navbar />
        <main className='mx-auto max-w-7xl p-4 md:p-8'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const App = () => {
  const { theme } = useSelector((s) => s.auth);

  // dark theme = "dark" class on <html>  (Tailwind darkMode: "class")
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to='/dashboard' replace />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/tasks/:stage?' element={<Tasks />} />
          <Route path='/trashed' element={<Trash />} />
          <Route path='/task/:id' element={<TaskDetail />} />
        </Route>

        <Route element={<Layout adminOnly />}>
          <Route path='/team' element={<Team />} />
        </Route>

        <Route path='/log-in' element={<Login />} />
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Routes>

      <Toaster richColors position='top-center' theme={theme} />
    </>
  );
};

export default App;
