import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import EntryScreen from "./components/EntryScreen";
import MainLayout from "./components/MainLayout";
import { ToastProvider } from "./context/ToastContext";
import { getOrCreateClientId } from "./api/clientIdentity";
import { loadAuthUser } from "./api/authApi";
import { getPetPosts } from "./api/petPostsApi";
import RequireAuth from "./components/RequireAuth";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetailPage from "./pages/PostDetailPage";
import LoginPage from "./pages/LoginPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import FoundedPetsPage from "./pages/FoundedPetsPage";

function App() {
  const clientId = useMemo(() => getOrCreateClientId(), []);
  const listSeededRef = useRef(false);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const [boot, setBoot] = useState({ status: "loading" });

  const bumpHomeList = useCallback(() => {
    setHomeRefreshKey((key) => key + 1);
  }, []);

  const runBootstrap = useCallback(() => {
    setBoot({ status: "loading" });
    const user = loadAuthUser();
    getPetPosts({ status: "", postType: "", clientId }, user?.token)
      .then((posts) => setBoot({ status: "ready", posts }))
      .catch(() => {
        // Still open the app so the UI is not a blank / stuck screen if the API is down or unreachable.
        setBoot({ status: "ready", posts: [] });
      });
  }, [clientId]);

  useEffect(() => {
    runBootstrap();
  }, [runBootstrap]);

  if (boot.status !== "ready") {
    return (
      <EntryScreen
        isLoading={boot.status === "loading"}
        error={boot.status === "error"}
        onRetry={runBootstrap}
      />
    );
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<MainLayout clientId={clientId} bumpHomeList={bumpHomeList} />}>
            <Route
              index
              element={
                <HomePage
                  initialPosts={boot.posts}
                  listSeededRef={listSeededRef}
                  homeRefreshKey={homeRefreshKey}
                />
              }
            />
            <Route path="about" element={<AboutPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="post/:id" element={<PostDetailPage />} />
            <Route element={<RequireAuth />}>
              <Route path="create" element={<CreatePostPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="founded-pets" element={<FoundedPetsPage />} />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
