import { useEffect, useState } from "react";
import EntryScreen from "./components/EntryScreen";
import PetPostsPage from "./pages/PetPostsPage";

function App() {
  const [showEntry, setShowEntry] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowEntry(false), 2100);
    return () => window.clearTimeout(timer);
  }, []);

  if (showEntry) {
    return <EntryScreen onEnter={() => setShowEntry(false)} />;
  }

  return <PetPostsPage />;
}

export default App;
