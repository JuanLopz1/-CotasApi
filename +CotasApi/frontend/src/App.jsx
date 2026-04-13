import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import EntryScreen from "./components/EntryScreen";
import MainLayout from "./components/MainLayout";
import { ToastProvider } from "./context/ToastContext";
import { getOrCreateClientId } from "./api/clientIdentity";
import { loadAuthUser } from "./api/authApi";
import { getPetPosts } from "./api/petPostsApi";
import HomePage from "./pages/HomePage";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetailPage from "./pages/PostDetailPage";
import MessagesPage from "./pages/MessagesPage";

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
      .catch(() => setBoot({ status: "error" }));
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
            <Route path="create" element={<CreatePostPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="post/:id" element={<PostDetailPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
